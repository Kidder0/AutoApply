// Vercel Serverless Function: GET /api/ingestion-metrics
// Returns metrics from job discovery runs

import { VercelRequest, VercelResponse } from '@vercel/node';
import { getMetrics } from '../serverless-helpers';

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
    const metrics = getMetrics();
    console.log(`✅ Retrieved ${metrics.length} metric records`);
    return res.status(200).json({ metrics });
  } catch (error: any) {
    console.error('❌ Failed to fetch metrics:', error);
    return res.status(500).json({
      error: 'Failed to fetch ingestion metrics.',
      details: error.message,
    });
  }
}
