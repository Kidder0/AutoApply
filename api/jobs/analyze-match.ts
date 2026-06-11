// Vercel Serverless Function: POST /api/jobs/analyze-match
// Analyzes resume-to-job matching score

import { VercelRequest, VercelResponse } from '@vercel/node';

const SKILL_KEYWORDS = [
  'React', 'Vue', 'Angular', 'TypeScript', 'JavaScript', 'Python', 'Java',
  'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel', 'Ruby',
  'PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Elasticsearch',
  'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Vercel',
  'Git', 'CI/CD', 'Agile', 'Scrum', 'REST', 'GraphQL',
  'Machine Learning', 'Data Science', 'Analytics', 'Pandas', 'NumPy',
  'Leadership', 'Communication', 'Problem Solving', 'Design Patterns'
];

function extractSkills(text: string): string[] {
  const found: string[] = [];
  const lowerText = text.toLowerCase();

  for (const skill of SKILL_KEYWORDS) {
    if (new RegExp(`\\b${skill}\\b`, 'i').test(lowerText) && !found.includes(skill)) {
      found.push(skill);
    }
  }

  return found;
}

function calculateMatchScore(resumeSkills: string[], jobSkills: string[]): number {
  if (jobSkills.length === 0) return 50;

  const matched = resumeSkills.filter((skill) =>
    jobSkills.some((jSkill) => jSkill.toLowerCase() === skill.toLowerCase())
  );

  return Math.round((matched.length / jobSkills.length) * 100);
}

function getReadiness(
  score: number,
  matchedCount: number,
  missingCount: number
): 'ready' | 'review' | 'not_ready' {
  if (score >= 75 && missingCount <= 1) return 'ready';
  if (score >= 50 && missingCount <= 3) return 'review';
  return 'not_ready';
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

  const { resume, jobDescription } = req.body;

  if (!resume || !jobDescription) {
    return res.status(400).json({
      error: 'Missing resume or job description',
    });
  }

  try {
    // Extract skills from both
    const resumeSkills = extractSkills(resume);
    const jobSkills = extractSkills(jobDescription);

    // Calculate match
    const score = calculateMatchScore(resumeSkills, jobSkills);
    const matched = resumeSkills.filter((skill) => jobSkills.includes(skill));
    const missing = jobSkills.filter((skill) => !matched.includes(skill));

    const readiness = getReadiness(score, matched.length, missing.length);

    // Generate color-coded feedback
    let color: string;
    let emoji: string;

    if (score >= 85) {
      color = '#10b981'; // green
      emoji = '🎯';
    } else if (score >= 70) {
      color = '#3b82f6'; // blue
      emoji = '✨';
    } else if (score >= 55) {
      color = '#f59e0b'; // amber
      emoji = '⚠️';
    } else if (score >= 40) {
      color = '#ef4444'; // red
      emoji = '📚';
    } else {
      color = '#6b7280'; // gray
      emoji = '❌';
    }

    return res.status(200).json({
      score,
      readiness,
      color,
      emoji,
      matched: {
        skills: matched,
        count: matched.length,
      },
      missing: {
        skills: missing,
        count: missing.length,
      },
      summary: `${emoji} ${score}% Match - ${readiness === 'ready' ? 'Ready to apply!' : readiness === 'review' ? 'Good candidate, review first' : 'Consider gaining more experience'}`,
      recommendation: this.getRecommendation(score, missing.length),
    });
  } catch (error: any) {
    console.error('❌ Match analysis failed:', error);
    return res.status(500).json({
      error: 'Match analysis failed',
      details: error.message,
    });
  }
}

function getRecommendation(score: number, missingCount: number): string {
  if (score >= 85) {
    return 'You are a strong candidate! Apply immediately.';
  } else if (score >= 70) {
    return 'You have most required skills. Apply with confidence!';
  } else if (score >= 55) {
    return `You match ${100 - score}% of requirements. Consider gaining ${missingCount} more skills.`;
  } else if (score >= 40) {
    return 'You have foundational skills. Consider learning key job requirements first.';
  } else {
    return 'Consider gaining more relevant experience before applying.';
  }
}
