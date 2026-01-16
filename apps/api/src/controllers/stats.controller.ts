import { Controller, Get, Route, Tags, Security } from 'tsoa';
import { IncidentModel as Incident } from '../models/Incident';
import { Resource } from '../models/Resource';
import { User } from '../models/User';

interface DashboardStats {
  activeIncidents: number;
  availableResources: number;
  activeResponders: number;
  systemStatus: string;
}

@Route('stats')
@Tags('Stats')
export class StatsController extends Controller {

  @Get('/')
  @Security('jwt')
  public async getDashboardStats(): Promise<DashboardStats> {
    const activeIncidents = await Incident.countDocuments({ status: { $in: ['OPEN', 'IN_PROGRESS'] } });
    const availableResources = await Resource.countDocuments({ quantity: { $gt: 0 } });
    const activeResponders = await User.countDocuments({ isActive: true }); 
    // Ideally check if they are "online" or "on duty", but simple count for now.

    // Check DB connection for system status
    const dbStatus = Incident.db.readyState === 1 ? 'Operational' : 'Degraded';

    return {
      activeIncidents,
      availableResources,
      activeResponders,
      systemStatus: dbStatus
    };
  }
}
