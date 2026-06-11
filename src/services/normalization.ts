import crypto from 'crypto';

export interface RawJob {
  title: string;
  company: string;
  location?: string;
  description?: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  employmentType?: string;
  remoteType?: string;
  postedDate?: Date;
  applyUrl: string;
  source: string;
  sourceUrl?: string;
  externalId?: string;
}

export interface NormalizedJob {
  externalId: string;
  title: string;
  company: string;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  employmentType: string | null;
  remoteType: string | null;
  description: string | null;
  applyUrl: string;
  postedDate: Date | null;
  source: string;
  sourceUrl: string | null;
  hash: string;
}

export function normalizeJob(raw: RawJob): NormalizedJob {
  const externalId = raw.externalId || generateJobId(raw);

  const location = (raw.location || '').trim() || null;
  const employmentType = normalizeEmploymentType(raw.employmentType);
  const remoteType = normalizeRemoteType(raw.remoteType);
  const salaryMin = raw.salary?.min ? Math.round(raw.salary.min) : null;
  const salaryMax = raw.salary?.max ? Math.round(raw.salary.max) : null;
  const salaryCurrency = (raw.salary?.currency || 'USD').toUpperCase();
  const description = (raw.description || '').trim().substring(0, 50000) || null;
  const postedDate = raw.postedDate || new Date();

  const hash = generateJobHash({
    title: raw.title,
    company: raw.company,
    location: raw.location || '',
    description: raw.description || '',
  });

  return {
    externalId,
    title: raw.title.trim(),
    company: raw.company.trim(),
    location,
    salaryMin,
    salaryMax,
    salaryCurrency,
    employmentType,
    remoteType,
    description,
    applyUrl: raw.applyUrl.trim(),
    postedDate,
    source: raw.source.toLowerCase(),
    sourceUrl: raw.sourceUrl?.trim() || null,
    hash,
  };
}

function normalizeEmploymentType(type?: string): string | null {
  if (!type) return null;
  
  const normalized = type.toLowerCase();
  const types: { [key: string]: string } = {
    'full-time': 'fulltime',
    'fulltime': 'fulltime',
    'full time': 'fulltime',
    'part-time': 'parttime',
    'parttime': 'parttime',
    'part time': 'parttime',
    'contract': 'contract',
    'temp': 'temporary',
    'temporary': 'temporary',
    'internship': 'internship',
    'freelance': 'freelance',
  };
  
  return types[normalized] || type;
}

function normalizeRemoteType(type?: string): string | null {
  if (!type) return null;
  
  const normalized = type.toLowerCase();
  const types: { [key: string]: string } = {
    'remote': 'remote',
    'fully remote': 'remote',
    'work from home': 'remote',
    'hybrid': 'hybrid',
    'hybrid remote': 'hybrid',
    'on-site': 'onsite',
    'onsite': 'onsite',
    'on site': 'onsite',
    'in-office': 'onsite',
    'in office': 'onsite',
  };
  
  return types[normalized] || type;
}

function generateJobId(job: RawJob): string {
  return `${job.source.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

export function generateJobHash(content: {
  title: string;
  company: string;
  location: string;
  description: string;
}): string {
  const normalized = `${content.title.toLowerCase().trim()}|${content.company.toLowerCase().trim()}|${content.location.toLowerCase().trim()}`;
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export function calculateJobSimilarity(job1: NormalizedJob, job2: NormalizedJob): number {
  if (job1.hash === job2.hash) return 1.0;

  let score = 0;
  let weight = 0;

  if (job1.title.toLowerCase() === job2.title.toLowerCase()) {
    score += 40;
  } else if (job1.title.toLowerCase().includes(job2.title.toLowerCase().split(' ')[0])) {
    score += 20;
  }
  weight += 40;

  if (job1.company.toLowerCase() === job2.company.toLowerCase()) {
    score += 30;
  }
  weight += 30;

  if (job1.location && job2.location && job1.location.toLowerCase() === job2.location.toLowerCase()) {
    score += 20;
  }
  weight += 20;

  if (job1.description && job2.description) {
    const words1 = job1.description.toLowerCase().split(/\s+/);
    const words2 = job2.description.toLowerCase().split(/\s+/);
    const common = words1.filter(w => words2.includes(w)).length;
    const ratio = common / Math.max(words1.length, words2.length);
    score += (ratio * 10);
  }
  weight += 10;

  return Math.round((score / weight) * 100) / 100;
}
