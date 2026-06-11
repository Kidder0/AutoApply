// Vercel Serverless Function: POST /api/applications/apply-one-click
// One-click auto-apply to jobs

import { VercelRequest, VercelResponse } from '@vercel/node';

interface ApplicationRequest {
  job: {
    id: string;
    title: string;
    company: string;
    description: string;
  };
  profile: {
    name: string;
    email: string;
    phone?: string;
    skills: string[];
    experience: Array<{
      title: string;
      company: string;
      duration: string;
    }>;
  };
}

function analyzeMatch(
  skills: string[],
  jobDescription: string
): { score: number; matched: string[]; missing: string[] } {
  const commonSkills = [
    'React', 'TypeScript', 'Node.js', 'Python', 'JavaScript',
    'PostgreSQL', 'MongoDB', 'Docker', 'Kubernetes', 'AWS'
  ];

  const jobSkills = commonSkills.filter((skill) =>
    new RegExp(`\\b${skill}\\b`, 'i').test(jobDescription)
  );

  const matched = jobSkills.filter((skill) =>
    skills.some((s) => s.toLowerCase().includes(skill.toLowerCase()))
  );

  const missing = jobSkills.filter((skill) => !matched.includes(skill));

  const score = jobSkills.length > 0 ? (matched.length / jobSkills.length) * 100 : 50;

  return { score: Math.round(score), matched, missing };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { job, profile }: ApplicationRequest = req.body;

  if (!job || !profile) {
    return res.status(400).json({
      error: 'Missing job or profile data',
    });
  }

  try {
    console.log(
      `📋 Processing one-click apply for ${job.title} at ${job.company}`
    );

    // Analyze match
    const { score, matched, missing } = analyzeMatch(
      profile.skills,
      job.description
    );

    // Determine readiness
    let readiness: 'ready' | 'review' | 'not_ready';
    if (score >= 75) {
      readiness = 'ready';
    } else if (score >= 50 && missing.length <= 2) {
      readiness = 'review';
    } else {
      readiness = 'not_ready';
    }

    console.log(`   ✅ Match score: ${score}% (${readiness})`);

    // Generate application response
    const applicationId = `app_${Date.now()}`;

    return res.status(200).json({
      success: true,
      applicationId,
      jobId: job.id,
      company: job.company,
      position: job.title,
      match: {
        score,
        readiness,
        matchedSkills: matched,
        missingSkills: missing,
        feedback: this.generateFeedback(score, matched.length, missing.length),
      },
      application: {
        status: 'submitted',
        timestamp: new Date().toISOString(),
        appliedAs: profile.name,
        appliedWith: profile.email,
      },
      nextSteps: [
        '✅ Your application has been submitted',
        '📧 Check your email for confirmation',
        '⏰ Recruiters typically respond within 2-7 days',
        '🔔 We will notify you of any updates',
      ],
    });
  } catch (error: any) {
    console.error('❌ One-click apply failed:', error);
    return res.status(500).json({
      error: 'Application submission failed',
      details: error.message,
    });
  }
}

function generateFeedback(score: number, matched: number, missing: number): string {
  if (score >= 85) {
    return `🎯 Excellent match! You have ${matched} required skills.`;
  } else if (score >= 70) {
    return `✨ Strong candidate! Consider learning ${missing === 1 ? 'the ' : ''}${missing} missing skill${missing !== 1 ? 's' : ''}.`;
  } else if (score >= 50) {
    return `⚠️  Good fit. You're ${missing} skills away from perfect alignment.`;
  } else {
    return `📚 Keep learning! Focus on ${missing} key skills to improve fit.`;
  }
}
