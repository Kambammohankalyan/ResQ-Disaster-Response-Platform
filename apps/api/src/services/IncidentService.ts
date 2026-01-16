import { IIncident } from '@repo/types';
import { IncidentModel } from '../models/Incident';
import { notificationQueue } from '../queues/notification.queue';
import { ApiError } from '../utils/ApiError';

export class IncidentService {
  public async createIncident(data: Partial<IIncident>, reporterId: string): Promise<IIncident> {
    const incident = await IncidentModel.create({
      ...data,
      reporterId,
      status: 'OPEN',
      verified: false,
      createdAt: new Date()
    });

    // Offload notification
    await notificationQueue.add('alert', { incidentId: incident.id });

    return incident;
  }

  public async getIncidents(): Promise<IIncident[]> {
    return IncidentModel.find();
  }

  public async getMyIncidents(userId: string): Promise<IIncident[]> {
    return IncidentModel.find({ reporterId: userId });
  }

  public async getUnassignedIncidents(): Promise<IIncident[]> {
      return IncidentModel.find({ assignedToId: { $exists: false }, status: 'OPEN' });
  }

  public async assignIncident(incidentId: string, responderId: string, allowOverride: boolean = false): Promise<IIncident | null> {
      // Prevent overwriting existing assignment unless allowed
      const incident = await IncidentModel.findOne({ _id: incidentId });
      if (!incident) throw new ApiError('Incident not found', 404);
      
      if (incident.assignedToId && !allowOverride) {
          throw new ApiError('Incident already assigned', 409);
      }

      return IncidentModel.findByIdAndUpdate(
          incidentId, 
          { assignedToId: responderId, status: 'IN_PROGRESS' },
          { new: true }
      );
  }

  public async verifyIncident(incidentId: string): Promise<IIncident | null> {
      return IncidentModel.findByIdAndUpdate(
          incidentId,
          { verified: true },
          { new: true }
      );
  }

  public async updateStatus(incidentId: string, status: 'IN_PROGRESS' | 'RESOLVED'): Promise<IIncident | null> {
      return IncidentModel.findByIdAndUpdate(
          incidentId,
          { status },
          { new: true }
      );
  }
}
