// Real job fetchers for major ATS platforms
import axios from 'axios';
import crypto from 'crypto';

export interface RawJob {
  title: string;
  company: string;
  location: string;
  description: string;
  employmentType?: string;
  remoteType?: 'remote' | 'hybrid' | 'onsite';
  salary?: { min?: number; max?: number };
  postedDate: Date;
  applyUrl: string;
  source: string;
  sourceUrl: string;
  externalId: string;
}

export class GreenhouseFetcher {
  async fetch(boardToken: string): Promise<RawJob[]> {
    try {
      const jobs: RawJob[] = [];
      const url = `https://api.greenhouse.io/v1/boards/${boardToken}/jobs?status=published`;

      console.log(`📢 Fetching from Greenhouse: ${boardToken}`);
      const response = await axios.get(url);

      for (const job of response.data.jobs || []) {
        jobs.push({
          title: job.title,
          company: job.company?.name || 'Unknown',
          location: job.location?.name || '',
          description: this.extractText(job.content),
          employmentType: job.type,
          remoteType: this.mapRemoteType(job),
          postedDate: new Date(job.published_at),
          applyUrl: job.absolute_url,
          source: 'Greenhouse',
          sourceUrl: job.absolute_url,
          externalId: `greenhouse_${job.id}`,
        });
      }

      console.log(`✅ Greenhouse: ${jobs.length} jobs found`);
      return jobs;
    } catch (err: any) {
      console.error(`❌ Greenhouse fetch failed: ${err.message}`);
      return [];
    }
  }

  private extractText(html?: string): string {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .substring(0, 5000);
  }

  private mapRemoteType(job: any): 'remote' | 'hybrid' | 'onsite' {
    const location = job.location?.name?.toLowerCase() || '';
    if (location.includes('remote')) return 'remote';
    if (location.includes('hybrid')) return 'hybrid';
    return 'onsite';
  }
}

export class LeverFetcher {
  async fetch(company: string): Promise<RawJob[]> {
    try {
      const jobs: RawJob[] = [];
      const url = `https://api.lever.co/v0/postings/company/${company}?mode=posting`;

      console.log(`📢 Fetching from Lever: ${company}`);
      const response = await axios.get(url);

      for (const job of response.data.data || []) {
        jobs.push({
          title: job.text,
          company: job.department_parent?.text || 'Unknown',
          location: job.locations?.map((l: any) => l.name).join(', ') || '',
          description: job.descriptionPlain?.substring(0, 5000) || '',
          employmentType: undefined,
          remoteType: this.mapRemoteType(job.locations),
          postedDate: new Date(job.createdAt),
          applyUrl: job.hostedUrl,
          source: 'Lever',
          sourceUrl: job.hostedUrl,
          externalId: `lever_${job.id}`,
        });
      }

      console.log(`✅ Lever: ${jobs.length} jobs found`);
      return jobs;
    } catch (err: any) {
      console.error(`❌ Lever fetch failed: ${err.message}`);
      return [];
    }
  }

  private mapRemoteType(locations: any[]): 'remote' | 'hybrid' | 'onsite' {
    if (!locations || locations.length === 0) return 'onsite';
    const names = locations.map((l: any) => l.name?.toLowerCase() || '');
    if (names.some((n) => n.includes('remote'))) return 'remote';
    if (names.some((n) => n.includes('hybrid'))) return 'hybrid';
    return 'onsite';
  }
}

export class LinkedInJobsAPI {
  async fetch(searchTerms: string): Promise<RawJob[]> {
    // Note: LinkedIn official API requires corporate access
    // This is a placeholder for when API access is available
    console.log('⚠️  LinkedIn API access requires corporate tier subscription');
    return [];
  }
}

export class CareerPageFetcher {
  async fetch(url: string): Promise<RawJob[]> {
    // Generic career page scraper
    try {
      console.log(`📢 Fetching from career page: ${url}`);
      // This would require web scraping or site-specific parsing
      // Placeholder for future implementation
      return [];
    } catch (err: any) {
      console.error(`❌ Career page fetch failed: ${err.message}`);
      return [];
    }
  }
}

export class JobAggregator {
  private greenhouse = new GreenhouseFetcher();
  private lever = new LeverFetcher();
  private linkedin = new LinkedInJobsAPI();
  private careerPage = new CareerPageFetcher();

  async fetchAll(config: {
    greenhouse?: { boards: string[] };
    lever?: { companies: string[] };
    careerPages?: string[];
  }): Promise<RawJob[]> {
    const allJobs: RawJob[] = [];

    // Fetch from Greenhouse
    if (config.greenhouse) {
      for (const board of config.greenhouse.boards) {
        const jobs = await this.greenhouse.fetch(board);
        allJobs.push(...jobs);
      }
    }

    // Fetch from Lever
    if (config.lever) {
      for (const company of config.lever.companies) {
        const jobs = await this.lever.fetch(company);
        allJobs.push(...jobs);
      }
    }

    // Fetch from LinkedIn
    if (config.linkedin) {
      const jobs = await this.linkedin.fetch('software engineer');
      allJobs.push(...jobs);
    }

    // Fetch from career pages
    if (config.careerPages) {
      for (const page of config.careerPages) {
        const jobs = await this.careerPage.fetch(page);
        allJobs.push(...jobs);
      }
    }

    return allJobs;
  }

  generateHash(job: RawJob): string {
    const content = `${job.title}|${job.company}|${job.location}|${job.description}`;
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}
