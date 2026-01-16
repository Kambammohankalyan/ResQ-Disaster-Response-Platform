import mongoose, { Schema } from 'mongoose';
import { IResource } from '@repo/types';

const ResourceSchema = new Schema<IResource>({
  type: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  }
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

export const Resource = mongoose.model<IResource>('Resource', ResourceSchema);
