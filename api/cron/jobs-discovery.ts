// Vercel Cron Job: Automatic Job Discovery - Runs every 2 hours
// Path: /api/cron/jobs-discovery

import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import crypto from 'crypto';

// Sample configuration - in production, load from environment
const JOB_SOURCES = {
  greenhouse: {
    boards: process.env.GREENHOUSE_BOARDS?.split(',') || ['anthropic', 'databricks'],
  },
  lever: {
    companies: process.env.LEVER_COMPANIES?.split(',') || ['anthropic', 'openai'],
  },
};

interface FetchedJob {
  title: string;
  company: string;
  location: string;
  description: string;
  employmentType?: string;
  remoteType?: string;
  postedDate: string;
  applyUrl: string;
  source: string;
  externalId: string;
}

async function fetchGreenhouseJobs(board: string): Promise<FetchedJob[]> {
  try {
    const url = `https://api.greenhouse.io/v1/boards/${board}/jobs?status=published`;
    const response = await axios.get(url);

    return (response.data.jobs || []).map((job: any) => ({
      title: job.title,
      company: job.company?.name || 'Unknown',
      location: job.location?.name || '',
      description: job.content?.replace(/<[^>]*>/g, '').substring(0, 5000) || '',
      employmentType: job.type,
      remoteType: job.location?.name?.toLowerCase().includes('remote') ? 'remote' : 'onsite',
      postedDate: new Date(job.published_at).toISOString(),
      applyUrl: job.absolute_url,
      source: `Greenhouse (${board})`,
      externalId: `greenhouse_${job.id}`,
    }));
  } catch (err: any) {
    console.error(`❌ Greenhouse fetch failed for ${board}:`, err.message);
    return [];
  }
}

async function fetchLeverJobs(company: string): Promise<FetchedJob[]> {
  try {
    const url = `https://api.lever.co/v0/postings/company/${company}?mode=posting`;
    const response = await axios.get(url);

    return (response.data.data || []).map((job: any) => ({
      title: job.text,
      company: job.department_parent?.text || company,
      location: job.locations?.map((l: any) => l.name).join(', ') || '',
      description: job.descriptionPlain?.substring(0, 5000) || '',
      employmentType: undefined,
      remoteType: 'onsite',
      postedDate: new Date(job.createdAt).toISOString(),
      applyUrl: job.hostedUrl,
      source: `Lever (${company})`,
      externalId: `lever_${job.id}`,
    }));
  } catch (err: any) {
    console.error(`❌ Lever fetch failed for ${company}:`, err.message);
    return [];
  }
}

function generateHash(job: FetchedJob): string {
  const content = `${job.title}|${job.company}|${job.location}|${job.description}`;
  return crypto.createHash('sha256').update(content).digest('hex');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron secret for security
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('⚠️ Unauthorized cron access attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.setHeader('Content-Type', 'application/json');

  try {
    console.log('🚀 Starting scheduled job discovery...');
    const startTime = Date.now();

    let totalDiscovered = 0;
    let totalNew = 0;
    let totalDuplicates = 0;
    const jobsByHash: Map<string, FetchedJob> = new Map();
    const allJobs: FetchedJob[] = [];

    // Fetch from Greenhouse boards
    for (const board of JOB_SOURCES.greenhouse.boards) {
      const jobs = await fetchGreenhouseJobs(board);
      allJobs.push(...jobs);
    }

    // Fetch from Lever companies
    for (const company of JOB_SOURCES.lever.companies) {
      const jobs = await fetchLeverJobs(company);
      allJobs.push(...jobs);
    }

    totalDiscovered = allJobs.length;
    console.log(`📊 Discovered ${totalDiscovered} total jobs`);

    // Deduplication: Group by similarity hash
    for (const job of allJobs) {
      const hash = generateHash(job);

      if (!jobsByHash.has(hash)) {
        jobsByHash.set(hash, job);
        totalNew++;
      } else {
        totalDuplicates++;
      }
    }

    const uniqueJobs = Array.from(jobsByHash.values());
    const duration = Math.round((Date.now() - startTime) / 1000);

    const metrics = {
      timestamp: new Date().toISOString(),
      jobsDiscovered: totalDiscovered,
      newJobsAdded: totalNew,
      duplicatesRemoved: totalDuplicates,
      failedCrawls: 0,
      sources: [
        `Greenhouse (${JOB_SOURCES.greenhouse.boards.length} boards)`,
        `Lever (${JOB_SOURCES.lever.companies.length} companies)`,
      ],
      duration: `${duration}s`,
    };

    console.log(`✅ Discovery complete:`, metrics);

    return res.status(200).json({
      success: true,
      metrics,
      jobsAdded: totalNew,
      sampleJobs: uniqueJobs.slice(0, 3),
    });
  } catch (error: any) {
    console.error('❌ Cron job failed:', error);
    return res.status(500).json({
      error: 'Job discovery failed',
      details: error.message,
    });
  }
}
