// Vercel Serverless Function: GET /api/health
// Simple health check endpoint

import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  return res.status(200).json({
    status: 'ok',
    message: 'AutoApply API is running on Vercel',
    timestamp: new Date().toISOString(),
    endpoints: {
      'GET /api/jobs': 'Get all jobs',
      'GET /api/jobs/new': 'Get newly discovered jobs',
      'POST /api/jobs/discover': 'Trigger job discovery',
      'GET /api/ingestion-metrics': 'Get discovery metrics',
      'POST /api/resumes/extract-text': 'Extract text from resume files',
      'POST /api/resumes/parse': 'Parse resume text',
    }
  });
}
