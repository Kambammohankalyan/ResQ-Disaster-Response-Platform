import { Controller, Get, Post, Route, Body, Tags, Security, Put, Path, Delete } from 'tsoa';
import { ResourceService } from '../services/resource.service';
import { IResource } from '@repo/types';

interface ResourceCreationParams extends Omit<IResource, 'id'> {}

@Route('resources')
@Tags('Resources')
export class ResourceController extends Controller {
  private service = new ResourceService();

  /**
   * Retrieves all available resources.
   */
  @Get('/')
  @Security('jwt', ['incident:read']) // Assuming same scope for now, or new 'resource:read'
  public async getAllResources(): Promise<IResource[]> {
    return this.service.getResources();
  }

  /**
   * Create a new resource (e.g., Ambulance, Supply Kit).
   */
  @Post('/')
  @Security('jwt', ['incident:write']) // Or 'resource:write'
  public async createResource(@Body() requestBody: ResourceCreationParams): Promise<IResource> {
    this.setStatus(201);
    return this.service.createResource(requestBody);
  }

  /**
   * Update resource location.
   */
  @Put('{id}/location')
  @Security('jwt', ['incident:write'])
  public async updateLocation(
    @Path() id: string,
    @Body() location: { lat: number; lng: number }
  ): Promise<IResource | null> {
    const updated = await this.service.updateLocation(id, location.lat, location.lng);
    if (!updated) {
        this.setStatus(404);
        return null;
    }
    return updated;
  }

  @Delete('{id}')
  @Security('jwt', ['admin:access'])
  public async deleteResource(@Path() id: string): Promise<void> {
    const success = await this.service.deleteResource(id);
    if (!success) {
      this.setStatus(404);
    }
  }
}
