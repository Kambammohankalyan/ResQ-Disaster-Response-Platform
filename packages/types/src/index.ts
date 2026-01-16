export interface IIncident {
  id: string;
  title: string;
  description?: string;
  type: 'FLOOD' | 'FIRE' | 'MEDICAL' | 'EARTHQUAKE' | 'OTHER';
  location: { lat: number, lng: number };
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: Date;
  reporterId?: string;
  assignedToId?: string;
  verified?: boolean;
}

export type PermissionScope = 
  | 'incident:create' 
  | 'incident:read' 
  | 'incident:read:own' 
  | 'incident:read:all'
  | 'incident:update' 
  | 'incident:delete' 
  | 'incident:verify'
  | 'task:accept' 
  | 'task:update' 
  | 'user:read' 
  | 'user:verify'
  | 'admin:access'
  | 'system:monitor'
  | 'role:manage'
  | 'alert:broadcast';

export interface IResource {
  id: string;
  type: string;
  quantity: number;
  location: { lat: number, lng: number };
}

export interface IPermission {
  id: string;
  scope: string; // e.g., 'user:read'
  description: string;
  module: string;
}

export interface IRole {
  id: string;
  name: string;
  description: string;
  permissions: string[] | IPermission[]; // Depending on if we hydrate or not
  isSystem: boolean;
}

export interface IUser {
  id: string;
  email: string;
  password?: string; // Optional because we don't always select it
  firstName: string;
  lastName: string;
  role?: string; // For backward compatibility or simpler logic if needed
  roles: string[] | IRole[];
  isActive: boolean;
  phone?: string;
  preferences?: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
}

