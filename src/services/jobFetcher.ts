import fetch from 'node-fetch';
import { RawJob } from './normalization.js';

export interface JobFetcher {
  name: string;
  fetch(): Promise<RawJob[]>;
}

/**
 * Workday ATS fetcher
 * Fetches jobs from Workday career pages
 */
export class WorkdayFetcher implements JobFetcher {
  name = 'workday';
  private workdayDomain: string;

  constructor(workdayDomain: string) {
    this.workdayDomain = workdayDomain;
  }

  async fetch(): Promise<RawJob[]> {
    try {
      const jobs: RawJob[] = [];
      // Workday API endpoint pattern
      const url = `https://${this.workdayDomain}/wday/cxs/customServiceRoot`;
      
      console.log(`📢 Fetching Workday jobs from ${this.workdayDomain}`);
      // Note: Workday requires authentication and specific API knowledge per company
      // This is a template - actual implementation would need company-specific configuration
      
      return jobs;
    } catch (err) {
      console.error(`❌ Workday fetch error: ${err}`);
      return [];
    }
  }
}

/**
 * Greenhouse ATS fetcher
 * Fetches jobs from Greenhouse job boards
 */
export class GreenhouseFetcher implements JobFetcher {
  name = 'greenhouse';
  private boardToken: string;

  constructor(boardToken: string) {
    this.boardToken = boardToken;
  }

  async fetch(): Promise<RawJob[]> {
    try {
      const jobs: RawJob[] = [];
      const url = `https://boards-api.greenhouse.io/v1/boards/${this.boardToken}/jobs?content=true`;
      
      console.log(`📢 Fetching Greenhouse jobs`);
      const response = await fetch(url);
      const data: any = await response.json();

      if (data.jobs) {
        for (const job of data.jobs) {
          jobs.push({
            title: job.title,
            company: job.company_name || 'Unknown',
            location: job.location?.name || '',
            description: this.extractText(job.content),
            employmentType: job.employment_type || undefined,
            remoteType: this.mapRemoteType(job.location?.name),
            postedDate: new Date(job.published_at),
            applyUrl: job.absolute_url,
            source: this.name,
            sourceUrl: job.absolute_url,
            externalId: `gh_${job.id}`,
          });
        }
      }

      return jobs;
    } catch (err) {
      console.error(`❌ Greenhouse fetch error: ${err}`);
      return [];
    }
  }

  private extractText(content: string): string {
    return content.replace(/<[^>]*>/g, '').substring(0, 5000);
  }

  private mapRemoteType(location?: string): string | undefined {
    if (!location) return undefined;
    if (location.toLowerCase().includes('remote')) return 'remote';
    if (location.toLowerCase().includes('hybrid')) return 'hybrid';
    return 'onsite';
  }
}

/**
 * Lever ATS fetcher
 */
export class LeverFetcher implements JobFetcher {
  name = 'lever';
  private company: string;

  constructor(company: string) {
    this.company = company;
  }

  async fetch(): Promise<RawJob[]> {
    try {
      const jobs: RawJob[] = [];
      const url = `https://api.lever.co/v0/postings/company/${this.company}?mode=posting`;
      
      console.log(`📢 Fetching Lever jobs for ${this.company}`);
      const response = await fetch(url);
      const data: any = await response.json();

      if (data.data) {
        for (const job of data.data) {
          jobs.push({
            title: job.text,
            company: job.department_parent?.text || 'Unknown',
            location: job.locations.map((l: any) => l.name).join(', ') || '',
            description: job.descriptionPlain?.substring(0, 5000) || '',
            employmentType: this.extractEmploymentType(job.text),
            remoteType: this.mapRemoteType(job.locations),
            postedDate: new Date(job.createdAt),
            applyUrl: job.hostedUrl,
            source: this.name,
            sourceUrl: job.hostedUrl,
            externalId: `lever_${job.id}`,
          });
        }
      }

      return jobs;
    } catch (err) {
      console.error(`❌ Lever fetch error: ${err}`);
      return [];
    }
  }

  private mapRemoteType(locations: any[]): string | undefined {
    if (!locations || locations.length === 0) return undefined;
    const locText = locations.map((l: any) => l.name).join(' ').toLowerCase();
    if (locText.includes('remote')) return 'remote';
    if (locText.includes('hybrid')) return 'hybrid';
    return 'onsite';
  }

  private extractEmploymentType(title: string): string | undefined {
    const title_lower = title.toLowerCase();
    if (title_lower.includes('contract')) return 'contract';
    if (title_lower.includes('intern')) return 'internship';
    if (title_lower.includes('part-time')) return 'parttime';
    return 'fulltime';
  }
}

/**
 * Ashby ATS fetcher
 */
export class AshbyFetcher implements JobFetcher {
  name = 'ashby';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async fetch(): Promise<RawJob[]> {
    try {
      const jobs: RawJob[] = [];
      const url = `https://api.ashby.io/posting.listPostings`;
      
      console.log(`📢 Fetching Ashby jobs`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data: any = await response.json();

      if (data.results) {
        for (const job of data.results) {
          jobs.push({
            title: job.title,
            company: job.companyName || 'Unknown',
            location: job.locationName || '',
            description: job.descriptionPlain?.substring(0, 5000) || '',
            employmentType: job.employmentType || undefined,
            remoteType: this.mapRemoteType(job.locationName),
            postedDate: new Date(job.createdAt),
            applyUrl: job.applyUrl,
            source: this.name,
            sourceUrl: job.applyUrl,
            externalId: `ashby_${job.id}`,
          });
        }
      }

      return jobs;
    } catch (err) {
      console.error(`❌ Ashby fetch error: ${err}`);
      return [];
    }
  }

  private mapRemoteType(location?: string): string | undefined {
    if (!location) return undefined;
    if (location.toLowerCase().includes('remote')) return 'remote';
    if (location.toLowerCase().includes('hybrid')) return 'hybrid';
    return 'onsite';
  }
}

/**
 * SmartRecruiters ATS fetcher
 */
export class SmartRecruitersFetcher implements JobFetcher {
  name = 'smartrecruiters';
  private companyId: string;

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  async fetch(): Promise<RawJob[]> {
    try {
      const jobs: RawJob[] = [];
      const url = `https://api.smartrecruiters.com/v1/companies/${this.companyId}/postings?limit=100`;
      
      console.log(`📢 Fetching SmartRecruiters jobs`);
      const response = await fetch(url);
      const data: any = await response.json();

      if (data.content) {
        for (const job of data.content) {
          jobs.push({
            title: job.name,
            company: 'Unknown',
            location: job.location?.city || '',
            description: job.description?.substring(0, 5000) || '',
            employmentType: job.employmentType || undefined,
            remoteType: job.remote ? 'remote' : 'onsite',
            postedDate: new Date(job.publishedDate),
            applyUrl: job.careerPageUrl,
            source: this.name,
            sourceUrl: job.careerPageUrl,
            externalId: `sr_${job.id}`,
          });
        }
      }

      return jobs;
    } catch (err) {
      console.error(`❌ SmartRecruiters fetch error: ${err}`);
      return [];
    }
  }
}

/**
 * Generic company career page fetcher (web scraping)
 */
export class CareerPageFetcher implements JobFetcher {
  name = 'company_site';
  private company: string;
  private careerPageUrl: string;

  constructor(company: string, careerPageUrl: string) {
    this.company = company;
    this.careerPageUrl = careerPageUrl;
  }

  async fetch(): Promise<RawJob[]> {
    try {
      console.log(`📢 Fetching jobs from ${this.company} career page`);
      
      // This would typically use a headless browser or HTML parsing library
      // For now, returning empty as actual scraping depends on page structure
      return [];
    } catch (err) {
      console.error(`❌ Career page fetch error: ${err}`);
      return [];
    }
  }
}

/**
 * Job feed aggregator - combines multiple sources
 */
export class JobAggregator {
  private fetchers: JobFetcher[] = [];

  addFetcher(fetcher: JobFetcher): void {
    this.fetchers.push(fetcher);
  }

  async fetchAll(): Promise<RawJob[]> {
    const results = await Promise.allSettled(
      this.fetchers.map(f => f.fetch())
    );

    const jobs: RawJob[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        jobs.push(...result.value);
      } else {
        console.error('Job fetch failed:', result.reason);
      }
    }

    return jobs;
  }
}
