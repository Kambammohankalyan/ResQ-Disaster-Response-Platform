import mongoose, { Schema, Document } from 'mongoose';
import { IPermission } from '@repo/types';

export interface IPermissionDocument extends Omit<IPermission, 'id'>, Document {}

const PermissionSchema: Schema = new Schema({
  scope: { type: String, required: true, unique: true, index: true },
  description: { type: String, required: true },
  module: { type: String, required: true }
});

export const Permission = mongoose.model<IPermissionDocument>('Permission', PermissionSchema);
