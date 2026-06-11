import { JobAggregator } from './jobFetcher.js';
import { normalizeJob } from './normalization.js';
import { JobRepository } from './jobRepository.js';
import { MetricsService } from './metricsService.js';

export class JobIngestionService {
  private aggregator: JobAggregator;
  private repository: JobRepository;
  private metrics: MetricsService;

  constructor(
    aggregator: JobAggregator,
    repository: JobRepository,
    metrics: MetricsService
  ) {
    this.aggregator = aggregator;
    this.repository = repository;
    this.metrics = metrics;
  }

  /**
   * Main ingestion pipeline:
   * 1. Fetch jobs from all sources
   * 2. Normalize job data
   * 3. Check for duplicates
   * 4. Store in database
   * 5. Log metrics
   */
  async ingestJobs(sourceName: string): Promise<{
    success: boolean;
    jobsDiscovered: number;
    newJobsAdded: number;
    duplicatesRemoved: number;
    duplicatesMerged: number;
  }> {
    const logId = await this.metrics.startCrawl(sourceName);

    let jobsDiscovered = 0;
    let newJobsAdded = 0;
    let duplicatesRemoved = 0;
    let duplicatesMerged = 0;
    let error: string | undefined;

    try {
      console.log(`🔄 Starting job ingestion for: ${sourceName}`);

      // Step 1: Fetch all jobs from aggregator
      const rawJobs = await this.aggregator.fetchAll();
      jobsDiscovered = rawJobs.length;
      console.log(`📊 Discovered ${jobsDiscovered} jobs`);

      // Step 2: Process each job
      for (const rawJob of rawJobs) {
        try {
          // Normalize
          const normalized = normalizeJob(rawJob);

          // Check if already exists
          const existing = await this.repository.findByExternalId(normalized.externalId);
          if (existing) {
            console.log(`⏭️  Job already exists: ${normalized.externalId}`);
            continue;
          }

          // Insert the job
          const insertedJob = await this.repository.insertJob(normalized);
          newJobsAdded++;
          console.log(`✅ Added job: ${insertedJob.title} at ${insertedJob.company}`);

          // Step 3: Check for duplicates
          const duplicates = await this.repository.findPotentialDuplicates(
            normalized,
            0.85 // 85% similarity threshold
          );

          for (const dup of duplicates) {
            if (dup.similarity >= 0.85) {
              // Mark as duplicate, keep the older one as canonical
              const isInserteNewer = insertedJob.createdAt > dup.job.createdAt;
              const [primaryId, duplicateId] = isInserteNewer
                ? [dup.job.id, insertedJob.id]
                : [insertedJob.id, dup.job.id];

              await this.repository.markAsDuplicate(duplicateId, primaryId, dup.similarity);
              
              if (isInserteNewer) {
                duplicatesMerged++;
              } else {
                duplicatesRemoved++;
              }

              console.log(
                `🔗 Marked as duplicate (${dup.similarity.toFixed(2)}): ${insertedJob.id} -> ${dup.job.id}`
              );
            }
          }
        } catch (jobError) {
          console.error(`❌ Error processing job:`, jobError);
        }
      }

      console.log(`✅ Job ingestion completed`);
      console.log(`  - Discovered: ${jobsDiscovered}`);
      console.log(`  - New: ${newJobsAdded}`);
      console.log(`  - Duplicates: ${duplicatesRemoved + duplicatesMerged}`);
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      console.error(`❌ Ingestion failed: ${error}`);
    } finally {
      // Log metrics
      await this.metrics.endCrawl(logId, {
        jobsDiscovered,
        newJobsAdded,
        duplicatesRemoved,
        duplicatesMerged,
        error,
      });

      // Record metrics
      await this.metrics.recordMetric('jobs_discovered', jobsDiscovered);
      await this.metrics.recordMetric('new_jobs_added', newJobsAdded);
      await this.metrics.recordMetric('duplicates_detected', duplicatesRemoved + duplicatesMerged);
    }

    return {
      success: !error,
      jobsDiscovered,
      newJobsAdded,
      duplicatesRemoved,
      duplicatesMerged,
    };
  }

  /**
   * Generate embeddings for jobs (requires OpenAI API key)
   */
  async generateEmbeddings(openaiApiKey: string, limit = 100): Promise<number> {
    const newJobs = await this.repository.getNewJobs(limit);
    let embeddingCount = 0;

    for (const job of newJobs) {
      try {
        // Create embedding text from job data
        const embeddingText = `
${job.title}
${job.company}
${job.location || ''}
${job.employmentType || ''}
${job.remoteType || ''}
${job.description?.substring(0, 2000) || ''}
`.trim();

        // Call OpenAI embedding API
        const embedding = await this.getEmbedding(embeddingText, openaiApiKey);

        // Store in database
        await this.repository.updateJobEmbedding(job.id, embedding);
        embeddingCount++;

        // Rate limit to avoid API throttling
        if (embeddingCount % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (err) {
        console.error(`Failed to embed job ${job.id}:`, err);
      }
    }

    return embeddingCount;
  }

  /**
   * Call OpenAI API to generate embedding
   */
  private async getEmbedding(text: string, apiKey: string): Promise<number[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-small',
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data: any = await response.json();
    return data.data[0].embedding;
  }
}
