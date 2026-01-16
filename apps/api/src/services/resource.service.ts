import { IResource } from '@repo/types';
import { Resource } from '../models/Resource';

export class ResourceService {
  public async getResources(): Promise<IResource[]> {
    return Resource.find({});
  }

  public async createResource(resourceCreationParams: Omit<IResource, 'id'>): Promise<IResource> {
    const resource = new Resource(resourceCreationParams);
    return resource.save();
  }

  public async updateLocation(id: string, lat: number, lng: number): Promise<IResource | null> {
    return Resource.findByIdAndUpdate(
      id,
      { location: { lat, lng } },
      { new: true }
    );
  }

  public async deleteResource(id: string): Promise<boolean> {
    const result = await Resource.findByIdAndDelete(id);
    return !!result;
  }
}
