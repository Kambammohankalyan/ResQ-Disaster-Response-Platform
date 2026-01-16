import * as express from 'express';
import * as jwt from 'jsonwebtoken';
import { ApiError } from './utils/ApiError';

export async function expressAuthentication(
  request: express.Request,
  securityName: string,
  scopes?: string[]
): Promise<any> {
  
  if (securityName === 'jwt') {
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Promise.reject(new ApiError('No token provided', 401));
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return Promise.reject(new ApiError('Invalid token format', 401));
    }

    return new Promise((resolve, reject) => {
      jwt.verify(token, (process.env.JWT_SECRET || 'secret') as string, (err: any, decoded: any) => {
        if (err) {
          if (err.name === 'TokenExpiredError') {
             return reject(new ApiError('Token expired', 401)); 
          }
          return reject(new ApiError('Invalid token', 401));
        }

        // Scope Verification (RBAC)
        if (scopes && scopes.length > 0) {
          const userScopes = decoded.scopes || [];
          const hasPermission = scopes.every(requiredScope => 
            userScopes.includes(requiredScope)
          );

          if (!hasPermission) {
            return reject(new ApiError('Insufficient permissions', 403));
          }
        }

        resolve(decoded);
      });
    });
  }
  
  return Promise.reject(new ApiError('Unknown security scheme', 400));
}
