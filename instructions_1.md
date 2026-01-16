Technical Implementation Report: Architecting Role-Based Access Control and Operational Security in the ResQ Modular Monolith1. Executive Summary and Architectural VisionThe modernization of the ResQ application requires a fundamental shift from rudimentary authentication to a comprehensive, multi-layered security architecture. As the application scales, the necessity for granular access control becomes paramount, not merely for compliance, but to ensure the structural integrity of the Modular Monolith architecture. This report details the technical implementation strategy for embedding a robust Role-Based Access Control (RBAC) system into the existing Full Stack MERN (MongoDB, Express, React, Node.js) environment, leveraging the strict type contracts of Tsoa and the state management capabilities of TanStack Query. Furthermore, it addresses "Advanced Enhancements," specifically focusing on the security of operational dashboards (Bull-Board) and real-time communication channels (Socket.IO), ensuring that the application’s observability and interactivity do not become attack vectors.The proposed architecture is predicated on the "Defense in Depth" principle. Security is not treated as a peripheral gateway but is woven into the fabric of the data model, the API definition, the transport layer, and the client-side state machine. By utilizing Tsoa’s decorator-based metadata, we establish a "Security as Code" paradigm where access requirements are explicitly defined alongside business logic, generating open-standard documentation (Swagger/OpenAPI) that accurately reflects the security posture. Simultaneously, the integration of TanStack Query v5 and Axios interceptors on the frontend creates a resilient user experience that handles complex authentication lifecycles—such as silent token refreshing and concurrency management—transparently to the end-user.This document serves as the definitive technical guide for engineering teams, detailing schema designs, middleware logic, concurrency patterns, and deployment configurations required to execute this transformation.2. Theoretical Framework: RBAC in a Modular MonolithTo understand the implementation details, one must first appreciate the constraints and opportunities presented by the Modular Monolith architecture. Unlike a distributed microservices architecture where identity might be federated across disparate services, a modular monolith offers the advantage of shared memory and database access, yet demands strict discipline to prevent the "Big Ball of Mud" anti-pattern.2.1 The Shared Kernel of IdentityIn the ResQ modular monolith, the concepts of User, Role, and Permission constitute the "Shared Kernel." They are the ubiquitous language spoken by all modules—whether it is the Inventory Module checking if a user can write:stock or the Reporting Module verifying read:analytics capabilities.2The critical architectural challenge is data isolation. While modules should ideally encapsulate their own data, the Identity Module (Auth) must expose the authorization contract to others. The implementation strategy avoids direct cross-module database queries (e.g., the Inventory module querying the roles collection directly). Instead, it relies on a unified AuthorizationService exposed via the public API of the Auth module. This preserves the autonomy of the modules while centralizing the logic for permission resolution.32.2 Role-Based vs. Attribute-Based Access ControlThe proposed system implements a hybrid model. At its core, it is RBAC: Users are assigned Roles, and Roles act as containers for Permissions. However, the system is designed to support future evolution toward Attribute-Based Access Control (ABAC). By structuring the Mongoose schemas to support embedded permission arrays and dynamic references, the system can eventually support policies based on resource attributes (e.g., "User can edit their own profile") without requiring a database migration.The hierarchy of authority is defined as follows:Permissions: The atomic units of authority (e.g., create:user, delete:ticket). These are immutable strings defined in the code and stored in the database for assignment.Roles: Semantic groupings of permissions (e.g., Admin, Manager, Auditor). These are mutable; an administrator can add the delete:ticket permission to the Manager role, effectively upgrading all managers instantly.Users: The entities holding one or more roles. The implementation supports multi-role assignment, allowing for additive permissions.53. Data Layer Implementation: Mongoose Schema DesignThe foundation of the RBAC system is the database schema. MongoDB’s document-oriented nature allows for flexibility, but efficient authorization checks require a schema optimized for "Read-Heavy" operations. Every API request will trigger an authorization check, necessitating a data model that minimizes expensive $lookup (join) operations during the hot path of request processing.3.1 The Role and Permission SchemasWe introduce distinct collections for Roles and Permissions to maintain normalization where it matters—updates to a role's permissions should propagate immediately.3.1.1 The Permission SchemaWhile permissions can often be simple strings, wrapping them in a document allows for metadata such as descriptions and grouping (e.g., creating a UI that groups all "User Management" permissions).TypeScript// models/Permission.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IPermission extends Document {
  scope: string; // e.g., 'user:create'
  description: string;
  module: string; // For grouping in UI, e.g., 'Auth', 'Inventory'
}

const PermissionSchema: Schema = new Schema({
  scope: { type: String, required: true, unique: true, index: true },
  description: { type: String, required: true },
  module: { type: String, required: true }
});

export default mongoose.model<IPermission>('Permission', PermissionSchema);
3.1.2 The Role SchemaThe Role schema acts as the aggregator. A critical design decision is the use of referencing for permissions rather than embedding. While embedding offers faster reads (no join needed), referencing ensures that if a Permission definition changes (rare) or if we need to query "Which roles have this permission?", the operation is straightforward.5However, to optimize the "Hot Path" (checking if a user has a permission), we will utilize a caching strategy or population at the login/token generation phase, which will be discussed in the API section.TypeScript// models/Role.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IRole extends Document {
  name: string;
  description: string;
  permissions: mongoose.Types.ObjectId; // Reference to Permission
  isSystem: boolean; // Prevent deletion of core roles (Admin, Guest)
}

const RoleSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true, index: true },
  description: { type: String },
  permissions:,
  isSystem: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<IRole>('Role', RoleSchema);
Analysis of Indexing Strategy:The name field is indexed to ensure that role lookups during user assignment are O(1). The permissions array, while a reference, does not strictly need an index for the authorization flow unless we are performing reverse lookups (finding roles by permission).83.2 The User Schema EnhancementThe existing User schema in the ResQ application must be upgraded to support the new RBAC structure. Instead of a legacy string field (e.g., role: "admin"), we migrate to an array of references. This allows a user to be both a "Driver" and a "Safety Officer" simultaneously, inheriting permissions from both.TypeScript// models/User.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  //... existing fields...
  roles: mongoose.Types.ObjectId; // Reference to Role
}

const UserSchema: Schema = new Schema({
  //... existing fields...
  roles:
});

// Optimization: Pre-populate or Virtuals?
// In a high-read environment, we might verify permissions via the JWT payload 
// rather than querying the DB on every request.
export default mongoose.model<IUser>('User', UserSchema);
Data Migration Strategy:A critical step in deployment is the migration of existing data. A script must be executed prior to the application rollout that:Creates the default Role documents (Admin, User).Iterates through all User documents.Maps the legacy role string field to the corresponding Role ObjectId.Pushes the ID into the new roles array and unsets the old field.54. API Layer Security: Tsoa and Express MiddlewareThe server-side implementation utilizes Tsoa (TypeScript OpenAPI) to drive security from the interface definition. This ensures that the documentation (Swagger UI) and the runtime behavior are strictly synchronized.4.1 The @Security Decorator and OpenAPI DefinitionsTsoa provides a declarative mechanism to enforce security. By applying the @Security decorator to controllers, we instruct the Tsoa route generator to invoke a specific authentication handler.4.1.1 Defining the Security ContractFirst, the tsoa.json configuration must be updated to define the security schemes. We define two primary schemes: jwt for standard user access and api_key for potential machine-to-machine integrations or legacy support.JSON// tsoa.json
{
  "spec": {
    "securityDefinitions": {
      "jwt": {
        "type": "apiKey",
        "name": "Authorization",
        "in": "header",
        "description": "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\""
      }
    }
  },
  "routes": {
    "authenticationModule": "./src/authentication.ts"
  }
}
This configuration links the abstract concept of "jwt" security to a concrete implementation file src/authentication.ts.104.1.2 Controller ImplementationIn the controllers, we replace any ad-hoc middleware calls with the @Security decorator. The powerful feature here is the ability to pass Scopes. These scopes map directly to the permissions defined in our database.TypeScript// controllers/UsersController.ts
import { Controller, Get, Route, Security, Request } from 'tsoa';
import { IUserResponse } from '../interfaces/user';

@Route('users')
export class UsersController extends Controller {

  @Security('jwt', ['user:read']) // Requires valid token AND 'user:read' scope
  @Get()
  public async getAllUsers(@Request() request: any): Promise<IUserResponse> {
    // The request.user is already hydrated by the middleware
    const currentUser = request.user;
    return new UserService().getAll(currentUser);
  }

  @Security('jwt', ['user:delete']) // Higher privilege requirement
  @Delete('{userId}')
  public async deleteUser(userId: string): Promise<void> {
    await new UserService().delete(userId);
  }
}
This declarative style makes the code self-documenting. A developer reading the controller immediately understands the security requirements without diving into middleware chains.104.2 The expressAuthentication Middleware LogicThe core logic resides in expressAuthentication, exported from authentication.ts. This function is invoked by the Tsoa-generated routes before the controller method. It is responsible for token validation, scope verification, and context hydration.4.2.1 Token Verification and Context HydrationThe middleware must handle the Authorization header, parse the Bearer token, and verify it using jsonwebtoken. Crucially, upon successful verification, it must decide how to validate scopes.Optimization: The JWT Payload StrategyTo avoid a database hit on every API request (the "N+1 query" problem of auth), the ResQ architecture will embed the user's permissions directly into the JWT payload during the login process.Login Flow: User authenticates -> Server fetches Roles -> Server fetches Permissions for Roles -> Server flattens distinct permission scopes -> Server signs JWT with scopes: ['user:read', 'user:delete',...].Request Flow: Middleware verifies JWT -> Middleware reads scopes from payload -> Middleware compares against @Security requirements.This makes the API stateless and extremely fast. The trade-off is that permission revocation requires a short token expiration time (e.g., 15 minutes) or a blacklist mechanism.134.2.2 The Middleware Code StructureThe implementation below demonstrates the handling of the JWT and the scope check.TypeScript// src/authentication.ts
import * as express from 'express';
import * as jwt from 'jsonwebtoken';
import { ApiError } from './utils/ApiError';

export async function expressAuthentication(
  request: express.Request,
  securityName: string,
  scopes?: string
): Promise<any> {
  
  if (securityName === 'jwt') {
    const authHeader = request.headers['authorization'];
    if (!authHeader ||!authHeader.startsWith('Bearer ')) {
      return Promise.reject(new ApiError('No token provided', 401));
    }

    const token = authHeader.split(' ')[1];

    return new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SECRET as string, (err: any, decoded: any) => {
        if (err) {
          if (err.name === 'TokenExpiredError') {
             // Specific error for frontend to trigger refresh
             return reject(new ApiError('Token expired', 401)); 
          }
          return reject(new ApiError('Invalid token', 401));
        }

        // Scope Verification (RBAC)
        if (scopes && scopes.length > 0) {
          const userScopes = decoded.scopes ||;
          // Check if user has ALL required scopes. 
          // Use 'some' for ANY scope, 'every' for ALL scopes.
          // Tsoa implies strict adherence, so usually we check if the user 
          // possesses the specific capability requested.
          const hasPermission = scopes.every(requiredScope => 
            userScopes.includes(requiredScope)
          );

          if (!hasPermission) {
            return reject(new ApiError('Insufficient permissions', 403));
          }
        }

        // Context Hydration
        // We resolve the promise with the user object, which Tsoa attaches to request.user
        resolve(decoded);
      });
    });
  }
  
  return Promise.reject(new ApiError('Unknown security scheme', 400));
}
Insight on Error Codes: The distinction between 401 (Unauthorized) and 403 (Forbidden) is architecturally significant. A 401 tells the client "Your credentials are bad/expired, try refreshing." A 403 tells the client "Your credentials are valid, but you are not allowed here; do not retry." Mixing these up leads to infinite refresh loops on the frontend.165. Client-Side Architecture: TanStack Query and AxiosThe frontend implementation must handle the complexity of the JWT lifecycle. In a secure system, Access Tokens are short-lived (e.g., 15 minutes) and Refresh Tokens are long-lived (e.g., 7 days). When the Access Token expires, the frontend must silently refresh it without disrupting the user's workflow or losing the state of ongoing queries.5.1 The "Failed Queue" Pattern for ConcurrencyA major challenge in MERN apps is concurrency. If a user loads a dashboard, the app might fire 5 parallel requests (Profile, Stats, Notifications, Feed, Settings). If the token is expired, all 5 requests will fail with a 401. A naive implementation would trigger 5 separate refresh token API calls, leading to race conditions and potential server blocks.The solution is the Failed Queue Pattern implemented via Axios interceptors.Request Interceptor: Injects the current Access Token.Response Interceptor: Traps 401 errors.If isRefreshing is false: Set it to true, pause the request, and call the Refresh API.If isRefreshing is true: Do not call the API. Instead, push the failed request's resolve/reject callbacks into a failedQueue array.On Success: The Refresh API returns a new token. The interceptor processes the failedQueue, re-sending all queued requests with the new token.On Failure: If the refresh fails (refresh token expired), reject the queue and redirect to login.This pattern makes the token refresh completely transparent to TanStack Query and the React Components.175.1.1 Axios Interceptor ImplementationTypeScript// lib/axios.ts
import axios from 'axios';

let isRefreshing = false;
let failedQueue: any =;

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue =;
};

export const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true, // For HttpOnly Cookie transmission of Refresh Token
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 &&!originalRequest._retry) {
      
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return axiosInstance(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post('/auth/refresh-token'); // Uses HttpOnly cookie
        const newToken = data.accessToken;
        
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        processQueue(null, newToken);
        
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
5.2 TanStack Query v5 IntegrationIn TanStack Query v5, the global onSuccess and onError callbacks were removed from the useQuery hook to prevent unpredictable behavior. However, for Global Authorization Handling (e.g., catching a terminal 401/403 and redirecting to login), we need a centralized handler.The correct architectural pattern in v5 is to utilize the QueryCache and MutationCache global callbacks when creating the QueryClient.TypeScript// lib/queryClient.ts
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any) => {
      // This catches errors from ALL queries
      if (error?.response?.status === 401 |

| error?.response?.status === 403) {
         // This typically happens if the Refresh Logic in Axios also failed
         // Perform Logout / Redirect
         window.location.href = '/login';
      }
      toast.error(`Error: ${error.message}`);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: any) => {
      // Handle mutation errors specifically
      toast.error('Action failed. Please try again.');
    },
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 403 (Forbidden) or 404 (Not Found)
        if (error.response?.status === 403 |

| error.response?.status === 404) return false;
        return failureCount < 2;
      },
    },
  },
});
This setup ensures that while Axios handles the network retry/refresh logic, TanStack Query handles the UI state implications of a final failure.206. Real-Time Security: Socket.IO ImplementationSecuring WebSockets in ResQ requires a shift in thinking from "Request/Response" to "Connection/Event." A socket connection is persistent. If a user's role is revoked, their REST API calls will fail immediately (on the next request), but a WebSocket connection could theoretically remain open and receiving data.6.1 Phase 1: Handshake AuthenticationThe first line of defense is the Handshake. We reject the connection entirely if the user is not authenticated. We utilize the io.use() middleware on the server, which runs once when a client attempts to connect.TypeScript// sockets/middleware.ts
import { Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';

export const socketAuthMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded: any) => {
    if (err) return next(new Error('Authentication error: Invalid token'));
    
    // Hydrate the socket instance with user data
    // This data persists for the life of the connection
    socket.data.user = decoded; 
    next();
  });
};
On the client side, the socket connection must be initialized with the token:const socket = io({ auth: { token: accessToken } });.226.2 Phase 2: Room Guards and Event AuthorizationAuthentication allows connection, but Authorization controls access. In Socket.IO, Rooms are the primary mechanism for scoping data. A common vulnerability is allowing clients to emit a "join" event for any room ID.ResQ must implement a Server-Side Guard for joining rooms. Clients should not use the socket protocol to join rooms directly; they should emit an intent event (e.g., request_join_room), and the server decides whether to execute the join.TypeScript// sockets/handlers.ts
io.on('connection', (socket) => {
  
  socket.on('join_secure_room', (roomName: string) => {
    const user = socket.data.user; // Hydrated from handshake

    // RBAC Check for Room Access
    if (roomName.startsWith('admin_') &&!user.scopes.includes('admin:access')) {
      socket.emit('error', 'Unauthorized access to admin room');
      return;
    }

    // Tenant/Project Check
    if (roomName.startsWith('project_')) {
      const projectId = roomName.split('_')[1];
      // perform logic to check if user belongs to project
    }

    // Only if authorized, we join the socket
    socket.join(roomName);
    socket.emit('joined_room', roomName);
  });
});
This creates a secure gateway. Even if a malicious user manipulates the client code to emit join_secure_room, the server validates their authority before granting access to the data stream.256.3 Namespace IsolationFor "Advanced Enhancements," we utilize Namespaces to physically separate traffic types. Administrative dashboards (like the Bull-Board equivalent or real-time analytics) should operate on a separate namespace (e.g., /admin-io).Namespaces allow for their own middleware. We can attach a stricter middleware to /admin-io that requires the admin role specifically. This prevents standard users from even establishing a connection handshake with the administrative subsystems, reducing the attack surface significantly.287. Advanced Enhancements: Operational Security (Bull-Board)The prompt requests "Advanced Enhancements." In the context of the ResQ stack (MERN + background jobs), a critical enhancement is the observability of message queues. Bull-Board is the standard tool for visualizing Redis/BullMQ jobs. However, standard tutorials often leave these dashboards publicly exposed.7.1 Securing the Bull-Board RouteBull-Board operates as an Express adapter. To secure it, we must inject a middleware into the specific route path where the board is mounted. We recommend using express-basic-auth for this specific internal tool, as it decouples the monitoring security from the application's complex JWT logic (useful if the auth service itself is down).TypeScript// app.ts
import { createBullBoard } from '@bull-board/api';
import { ExpressAdapter } from '@bull-board/express';
import basicAuth from 'express-basic-auth';

// 1. Setup Adapter
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

// 2. Setup Board
createBullBoard({
  queues:,
  serverAdapter,
});

// 3. Mount with Security Middleware
// This applies Basic Auth ONLY to the /admin/queues route
app.use(
  '/admin/queues',
  basicAuth({
    users: {: process.env.ADMIN_PASS },
    challenge: true,
  }),
  serverAdapter.getRouter()
);
7.2 Implementation NuancesUsing challenge: true causes the browser to pop up the native username/password dialog. This is highly secure against CSRF because the browser does not automatically send these credentials with cross-origin requests in the same way it might mishandle cookies without SameSite attributes. It provides a robust, isolated "Break Glass" access point for administrators to monitor the system status.308. Deployment and Scalability Considerations8.1 Redis StrategyThe introduction of Socket.IO and Bull-Board makes Redis a critical dependency.Session Management: If using the Redis Adapter for Socket.IO (to support multiple server instances), ensure the Redis instance is secured with a password and ideally isolated in a VPC.RBAC Caching: To improve performance, user permissions can be cached in Redis with a short TTL (e.g., 60 seconds). The expressAuthentication middleware checks Redis first, then the JWT/DB. This allows for near-instant revocation of rights (by deleting the Redis key) without waiting for the JWT to expire.8.2 Testing the Security LayerTesting RBAC requires a distinct strategy from functional testing.Negative Testing: The test suite must explicitly assert that users without permission receive 403s.Integration Testing: Tests should simulate the full flow: Login -> Receive Token -> Request Protected Endpoint -> Assert Success/Failure.Socket Testing: socket.io-client should be used in test scripts to attempt to join unauthorized rooms and assert that the server refuses the connection or the join request.9. ConclusionThe implementation of Role-Based Access Control in ResQ is not merely a feature addition but a re-platforming of the application's trust model. By referencing Roles in the Database, enforcing Permissions via Tsoa Decorators, managing Concurrency via Axios Interceptors, and Guarding Real-time Events with Server-Side logic, ResQ transforms into an enterprise-grade Modular Monolith.This architecture balances strict security with developer ergonomics. Tsoa ensures that the security is documented and visible. TanStack Query ensures that the client handles the friction of authentication gracefully. The addition of secured operational dashboards (Bull-Board) provides the "Advanced Enhancements" necessary for professional monitoring. This plan provides the blueprint for a secure, scalable, and maintainable future for ResQ.Table 1: Summary of Security Layers & MechanismsLayerMechanismImplementation TechnologyResponsibilityDataReferenced SchemasMongoose ObjectIdNormalization of Identity & RolesAPI@Security DecoratorTsoa / OpenAPIDefinition of Access ContractsTransportJWT Bearer Tokenjsonwebtoken / ExpressStateless Identity VerificationFrontendInterceptor QueueAxiosConcurrency & Silent RefreshStateGlobal Cache CallbacksTanStack Query v5UI State Sync & RedirectsReal-TimeHandshake AuthSocket.IO MiddlewareConnection Access ControlReal-TimeEvent GuardsSocket.IO Event HandlersData Scope AuthorizationOpsBasic Authexpress-basic-authSecuring Background Job UI