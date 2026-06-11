// Shared serverless helper functions
import fs from 'fs';
import path from 'path';

export const sampleJobs = [
  {
    id: 'job-1',
    title: 'Senior Full-Stack Engineer (React & Node.js)',
    company: 'Stripe',
    location: 'San Francisco, CA',
    salary: { min: 160000, max: 210000, currency: 'USD' },
    employmentType: 'Full-time',
    remoteType: 'hybrid',
    description: 'We\'re looking for an experienced full-stack engineer to join our Payment Platform team. You\'ll work on systems that process billions of dollars globally.',
    postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: 'https://stripe.com/jobs',
    source: 'Company Career Page',
    isNew: false,
  },
  {
    id: 'job-2',
    title: 'Staff Software Engineer - Infrastructure',
    company: 'Google',
    location: 'Mountain View, CA',
    salary: { min: 200000, max: 280000, currency: 'USD' },
    employmentType: 'Full-time',
    remoteType: 'onsite',
    description: 'Help us build the infrastructure that powers Google. Work on distributed systems, cloud technologies, and cutting-edge platforms.',
    postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: 'https://google.com/careers',
    source: 'Company Career Page',
    isNew: false,
  },
];

export function createErrorResponse(status: number, message: string, details?: any) {
  return {
    status,
    body: JSON.stringify({ error: message, ...(details && { details }) }),
    headers: { 'Content-Type': 'application/json' },
  };
}

export function createSuccessResponse(data: any) {
  return {
    status: 200,
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  };
}

// Simulated database operations (in production, use real DB)
let jobs = [...sampleJobs];
let metrics: any[] = [];

export function getAllJobs() {
  return jobs;
}

export function getNewJobs() {
  return jobs.filter(j => j.isNew);
}

export function addJob(job: any) {
  if (!jobs.find(j => j.id === job.id)) {
    jobs.push(job);
    return true;
  }
  return false;
}

export function addMetric(metric: any) {
  metrics.unshift(metric);
}

export function getMetrics() {
  return metrics;
}
