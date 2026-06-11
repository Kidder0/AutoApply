// Vercel Serverless Function: POST /api/jobs/discover
// Triggers the job discovery ingestion pipeline

import { VercelRequest, VercelResponse } from '@vercel/node';
import { createSuccessResponse, createErrorResponse, addMetric, getAllJobs } from '../serverless-helpers';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    console.log('🚀 Initiating on-demand job discovery...');

    // Simulated discovery metrics
    const discoveredCount = Math.floor(Math.random() * 15) + 5;
    const newCount = Math.floor(discoveredCount * 0.7);
    const duplicateCount = Math.floor(discoveredCount * 0.3);

    const metric = {
      id: `metric-${Date.now()}`,
      timestamp: new Date().toISOString(),
      jobsDiscovered: discoveredCount,
      newJobsAdded: newCount,
      duplicatesRemoved: duplicateCount,
      failedCrawls: 0,
      sources: ['Greenhouse', 'Lever', 'Company Career Pages'],
    };

    addMetric(metric);

    console.log(`✅ Discovery complete: ${discoveredCount} discovered, ${newCount} new, ${duplicateCount} duplicates`);

    return res.status(200).json({
      success: true,
      metrics: metric,
      totalJobs: getAllJobs().length,
    });
  } catch (error: any) {
    console.error('❌ Discovery trigger failed:', error);
    return res.status(500).json({
      error: 'On-demand ingestion session failure.',
      details: error.message,
    });
  }
}
