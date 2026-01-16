import mongoose, { Schema } from 'mongoose';
import { IIncident } from '@repo/types';

const IncidentSchema = new Schema<IIncident>({
  // Mongoose automatically adds _id, which maps to id in the interface if configured or we can use a getter.
  // Using string id for simplicity as per interface.
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['FLOOD', 'FIRE', 'MEDICAL', 'EARTHQUAKE', 'OTHER'], default: 'OTHER' },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  severity: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'], 
    default: 'OPEN' 
  },
  createdAt: { type: Date, default: Date.now },
  reporterId: { type: String },
  assignedToId: { type: String },
  verified: { type: Boolean, default: false }
}, {
  toJSON: {
    virtuals: true,
    transform: function (doc, ret: any) {
      if (ret._id) ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
    }
  },
  toObject: { virtuals: true }
});

export const IncidentModel = mongoose.model<IIncident>('Incident', IncidentSchema);
