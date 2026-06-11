// Vercel Serverless Function: GET /api/jobs/new
// Retrieves newly discovered jobs

import { VercelRequest, VercelResponse } from '@vercel/node';
import { getNewJobs } from '../serverless-helpers';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  try {
    const jobs = getNewJobs();
    console.log(`✅ Retrieved ${jobs.length} new jobs`);
    return res.status(200).json({ jobs });
  } catch (error: any) {
    console.error('❌ Failed to fetch new jobs:', error);
    return res.status(500).json({
      error: 'Failed to fetch new jobs.',
      details: error.message,
    });
  }
}
