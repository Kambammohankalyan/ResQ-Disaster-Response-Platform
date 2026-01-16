import { Body, Controller, Get, Post, Put, Route, SuccessResponse, Tags, Security, Request, Path, Delete } from 'tsoa';
import { IIncident } from '@repo/types';
import { IncidentService } from '../services/IncidentService';

interface IncidentCreationParams extends Omit<IIncident, 'id' | 'createdAt' | 'status' | 'reporterId' | 'assignedToId' | 'verified'> {}

@Route('incidents')
@Tags('Incidents')
export class IncidentController extends Controller {
  private service: IncidentService;

  constructor() {
    super();
    this.service = new IncidentService();
  }

  /**
   * Get all incidents (Public/Volunteer/Dispatcher)
   */
  @Get()
  @Security('jwt', ['incident:read:all'])
  public async getIncidents(): Promise<IIncident[]> {
    return this.service.getIncidents();
  }

  /**
   * Get public incidents (Guest role - anonymized/limited if needed)
   * For now, returns same structure but unauthenticated for Guest View
   */
  @Get('public')
  public async getPublicIncidents(): Promise<IIncident[]> {
      return this.service.getIncidents();
  }

  /**
   * Get reports submitted by the logged-in user
   */
  @Get('me')
  @Security('jwt', ['incident:read:own'])
  public async getMyIncidents(@Request() req: any): Promise<IIncident[]> {
    const userId = req.user.id;
    return this.service.getMyIncidents(userId);
  }

  /**
   * Report a new incident (Civilian/Anyone)
   */
  @SuccessResponse('201', 'Created')
  @Post()
  @Security('jwt', ['incident:create'])
  public async createIncident(@Body() requestBody: IncidentCreationParams, @Request() req: any): Promise<IIncident> {
    this.setStatus(201);
    const userId = req.user.id;
    return this.service.createIncident(requestBody, userId);
  }

  /**
   * Claim an incident (Volunteer)
   */
  @Post('{id}/claim')
  @Security('jwt', ['task:accept'])
  public async claimIncident(@Path() id: string, @Request() req: any): Promise<IIncident | null> {
      const userId = req.user.id;
      return this.service.assignIncident(id, userId, false);
  }

  /**
   * Assign an incident to a responder (Dispatcher)
   */
  @Post('{id}/assign/{responderId}')
  @Security('jwt', ['incident:update'])
  public async assignIncident(@Path() id: string, @Path() responderId: string): Promise<IIncident | null> {
      return this.service.assignIncident(id, responderId, true);
  }

  /**
   * Verify an incident (Dispatcher)
   */
  @Put('{id}/verify')
  @Security('jwt', ['incident:verify'])
  public async verifyIncident(@Path() id: string): Promise<IIncident | null> {
      return this.service.verifyIncident(id);
  }

  /**
   * Update Status (Volunteer/Dispatcher)
   */
  @Put('{id}/status')
  @Security('jwt', ['task:update'])
  public async updateStatus(@Path() id: string, @Body() body: { status: 'IN_PROGRESS' | 'RESOLVED' }): Promise<IIncident | null> {
      return this.service.updateStatus(id, body.status);
  }
}
