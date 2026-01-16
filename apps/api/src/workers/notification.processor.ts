import { Job } from 'bullmq';

export default async function (job: Job) {
  console.log(`Processing notification for incident ${job.data.incidentId}`);
  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { sent: true };
}
