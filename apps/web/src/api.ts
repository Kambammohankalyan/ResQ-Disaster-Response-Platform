import type { IIncident, IResource } from '@repo/types';
import { axiosInstance } from './lib/axios';

export async function fetchIncidents(): Promise<IIncident[]> {
  const { data } = await axiosInstance.get('/incidents');
  return data;
}

export async function fetchMyIncidents(): Promise<IIncident[]> {
  const { data } = await axiosInstance.get('/incidents/me');
  return data;
}

export async function createIncident(incidentData: Omit<IIncident, 'id' | 'createdAt' | 'status' | 'reporterId' | 'assignedToId' | 'verified'>): Promise<IIncident> {
  const { data } = await axiosInstance.post('/incidents', incidentData);
  return data;
}

export async function claimIncident(id: string): Promise<IIncident> {
  const { data } = await axiosInstance.post(`/incidents/${id}/claim`);
  return data;
}

export async function verifyIncident(id: string): Promise<IIncident> {
  // Assuming the PUT endpoint
  const { data } = await axiosInstance.put(`/incidents/${id}/verify`);
  return data;
}

export async function updateIncidentStatus(id: string, status: 'IN_PROGRESS' | 'RESOLVED'): Promise<IIncident> {
  const { data } = await axiosInstance.put(`/incidents/${id}/status`, { status });
  return data;
}

export async function fetchResources(): Promise<IResource[]> {
  const { data } = await axiosInstance.get('/resources');
  return data;
}

export async function createResource(resourceData: Omit<IResource, 'id'>): Promise<IResource> {
  const { data } = await axiosInstance.post('/resources', resourceData);
  return data;
}

export async function fetchStats() {
  const { data } = await axiosInstance.get('/stats');
  return data;
}
