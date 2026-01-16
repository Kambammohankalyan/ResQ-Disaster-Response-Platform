import mongoose, { Schema, Document } from 'mongoose';
import { IRole } from '@repo/types';

export interface IRoleDocument extends Omit<IRole, 'id'>, Document {}

const RoleSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true, index: true },
  description: { type: String },
  permissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
  isSystem: { type: Boolean, default: false }
}, { timestamps: true });

export const Role = mongoose.model<IRoleDocument>('Role', RoleSchema);
