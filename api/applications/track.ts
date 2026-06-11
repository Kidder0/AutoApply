// Vercel Serverless Function: GET /api/applications/track
// Track all applications with status

import { VercelRequest, VercelResponse } from '@vercel/node';

interface TrackedApplication {
  id: string;
  jobId: string;
  company: string;
  position: string;
  appliedAt: string;
  status: 'submitted' | 'reviewing' | 'rejected' | 'offer' | 'withdrawn';
  matchScore: number;
  daysAgo: number;
}

// Simulated application tracking database
const mockApplications: TrackedApplication[] = [
  {
    id: 'app_1',
    jobId: 'job_1',
    company: 'Stripe',
    position: 'Senior Full-Stack Engineer',
    appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'reviewing',
    matchScore: 92,
    daysAgo: 2,
  },
  {
    id: 'app_2',
    jobId: 'job_2',
    company: 'Google',
    position: 'Staff Software Engineer',
    appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'submitted',
    matchScore: 78,
    daysAgo: 5,
  },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, status, sortBy = 'recent' } = req.query;

    // Filter applications
    let filtered = [...mockApplications];

    if (status) {
      filtered = filtered.filter((app) => app.status === status);
    }

    // Sort
    if (sortBy === 'score') {
      filtered.sort((a, b) => b.matchScore - a.matchScore);
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime());
    } else {
      // recent (default)
      filtered.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
    }

    // Calculate statistics
    const stats = {
      total: filtered.length,
      submitted: filtered.filter((a) => a.status === 'submitted').length,
      reviewing: filtered.filter((a) => a.status === 'reviewing').length,
      rejected: filtered.filter((a) => a.status === 'rejected').length,
      offers: filtered.filter((a) => a.status === 'offer').length,
      avgMatchScore: Math.round(
        filtered.reduce((sum, a) => sum + a.matchScore, 0) / Math.max(filtered.length, 1)
      ),
    };

    // Calculate success rate
    const successRate = filtered.length > 0
      ? Math.round((stats.offers + stats.reviewing) / filtered.length * 100)
      : 0;

    return res.status(200).json({
      applications: filtered,
      statistics: {
        ...stats,
        successRate: `${successRate}%`,
        totalApplied: filtered.length,
      },
      recommendations: this.getRecommendations(stats),
    });
  } catch (error: any) {
    console.error('❌ Failed to track applications:', error);
    return res.status(500).json({
      error: 'Failed to fetch application tracking',
      details: error.message,
    });
  }
}

function getRecommendations(stats: any): string[] {
  const recommendations = [];

  if (stats.total === 0) {
    recommendations.push('🚀 Get started! Click "Apply Now" to start applying to jobs.');
  }

  if (stats.avgMatchScore < 60) {
    recommendations.push(
      '📚 Consider improving your resume to match more job requirements.'
    );
  }

  if (stats.rejected > stats.offers && stats.total > 5) {
    recommendations.push(
      '🎯 Try focusing on jobs with higher match scores (75%+).'
    );
  }

  if (stats.offers > 0) {
    recommendations.push('🎉 Congratulations on your offer(s)! Good luck with negotiations.');
  }

  if (stats.reviewing > 3) {
    recommendations.push(
      '⏳ You have several applications under review. Expect responses within 2-7 days.'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('✨ Keep applying! The more you apply, the better your chances.');
  }

  return recommendations;
}
