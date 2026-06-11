// One-click auto-apply engine
// Matches resume to job and auto-fills application

import axios from 'axios';

export interface ResumeProfile {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    school: string;
    year: string;
  }>;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements?: string[];
}

export interface ApplicationMatch {
  jobId: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  relevantExperience: string[];
  readiness: 'ready' | 'review' | 'not_ready';
  suggestions: string[];
}

export class AutoApplyEngine {
  /**
   * Analyze resume against job requirements
   */
  analyzeMatch(profile: ResumeProfile, job: Job): ApplicationMatch {
    const requiredSkills = this.extractRequiredSkills(job.description);
    const userSkills = profile.skills.map((s) => s.toLowerCase());

    const matchedSkills = requiredSkills.filter((skill) =>
      userSkills.some(
        (uSkill) =>
          uSkill.includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(uSkill)
      )
    );

    const missingSkills = requiredSkills.filter(
      (skill) => !matchedSkills.includes(skill)
    );

    const matchScore = this.calculateMatchScore(
      userSkills,
      requiredSkills,
      matchedSkills
    );

    const relevantExperience = this.findRelevantExperience(
      profile.experience,
      job.description
    );

    const readiness = this.assessReadiness(matchScore, missingSkills.length);

    const suggestions = this.generateSuggestions(
      matchScore,
      missingSkills,
      matchedSkills
    );

    return {
      jobId: job.id,
      matchScore: Math.round(matchScore * 100),
      matchedSkills,
      missingSkills,
      relevantExperience,
      readiness,
      suggestions,
    };
  }

  /**
   * Extract required skills from job description
   */
  private extractRequiredSkills(description: string): string[] {
    const commonSkills = [
      'React',
      'Node.js',
      'TypeScript',
      'Python',
      'JavaScript',
      'PostgreSQL',
      'MongoDB',
      'Docker',
      'Kubernetes',
      'AWS',
      'GCP',
      'Azure',
      'Git',
      'REST APIs',
      'GraphQL',
      'Tailwind CSS',
      'Vue.js',
      'Angular',
      'Java',
      'C++',
      'Go',
      'Rust',
      'Machine Learning',
      'Data Science',
      'SQL',
      'Linux',
      'Agile',
      'Scrum',
      'Leadership',
    ];

    const found: string[] = [];
    for (const skill of commonSkills) {
      if (
        new RegExp(`\\b${skill}\\b`, 'i').test(description) &&
        !found.includes(skill)
      ) {
        found.push(skill);
      }
    }

    return found;
  }

  /**
   * Calculate match score (0-1)
   */
  private calculateMatchScore(
    userSkills: string[],
    requiredSkills: string[],
    matchedSkills: string[]
  ): number {
    if (requiredSkills.length === 0) return 0.5;

    const skillMatchPercentage = matchedSkills.length / requiredSkills.length;
    const userSkillCount = Math.min(userSkills.length, 15) / 15;

    // Weighted scoring: skill match 70%, user skill count 30%
    return skillMatchPercentage * 0.7 + Math.min(userSkillCount, 1) * 0.3;
  }

  /**
   * Find relevant experience for the job
   */
  private findRelevantExperience(
    experience: ResumeProfile['experience'],
    jobDescription: string
  ): string[] {
    const keywords = ['engineer', 'developer', 'manager', 'lead', 'architect'];
    const relevant: string[] = [];

    for (const exp of experience) {
      const titleLower = exp.title.toLowerCase();
      if (
        keywords.some((kw) => titleLower.includes(kw)) &&
        !relevant.includes(exp.title)
      ) {
        relevant.push(exp.title);
      }
    }

    return relevant.slice(0, 3);
  }

  /**
   * Assess application readiness
   */
  private assessReadiness(
    matchScore: number,
    missingSkillCount: number
  ): 'ready' | 'review' | 'not_ready' {
    if (matchScore >= 0.75) return 'ready';
    if (matchScore >= 0.5 && missingSkillCount <= 3) return 'review';
    return 'not_ready';
  }

  /**
   * Generate improvement suggestions
   */
  private generateSuggestions(
    matchScore: number,
    missingSkills: string[],
    matchedSkills: string[]
  ): string[] {
    const suggestions: string[] = [];

    if (matchScore >= 0.75) {
      suggestions.push(`🎯 Strong match! You have ${matchedSkills.length}+ required skills.`);
    } else if (matchScore >= 0.5) {
      suggestions.push(
        `⚠️  Good fit. Consider learning: ${missingSkills.slice(0, 2).join(', ')}`
      );
    } else {
      suggestions.push(
        `📚 Consider gaining experience with: ${missingSkills.slice(0, 3).join(', ')}`
      );
    }

    if (missingSkills.length <= 2) {
      suggestions.push(`✨ Only ${missingSkills.length} skill(s) away from perfect match!`);
    }

    return suggestions;
  }

  /**
   * Generate application form data
   */
  generateFormData(
    profile: ResumeProfile,
    job: Job
  ): Record<string, string> {
    return {
      full_name: profile.name,
      email: profile.email,
      phone: profile.phone || '',
      location: profile.location || '',
      resume: this.formatResume(profile),
      cover_letter: this.generateCoverLetter(profile, job),
      cv: this.formatResume(profile),
    };
  }

  /**
   * Format resume as plain text
   */
  private formatResume(profile: ResumeProfile): string {
    const sections = [
      `${profile.name}`,
      `${profile.email}${profile.phone ? ' | ' + profile.phone : ''}`,
      `\nSKILLS\n${profile.skills.join(', ')}`,
      `\nEXPERIENCE`,
      ...profile.experience.map(
        (exp) => `${exp.title} at ${exp.company} (${exp.duration})\n${exp.description}`
      ),
      `\nEDUCATION`,
      ...profile.education.map(
        (edu) => `${edu.degree} from ${edu.school} (${edu.year})`
      ),
    ];

    return sections.join('\n');
  }

  /**
   * Generate tailored cover letter
   */
  private generateCoverLetter(profile: ResumeProfile, job: Job): string {
    const relevantExperience = profile.experience
      .slice(0, 2)
      .map((e) => e.title)
      .join(' and ');

    return `Dear Hiring Manager,

I am excited to apply for the ${job.title} position at ${job.company}. 
With my background in ${relevantExperience}, I am confident in my ability 
to contribute meaningfully to your team.

My technical expertise includes: ${profile.skills.slice(0, 5).join(', ')}.

I would welcome the opportunity to discuss how my experience aligns with 
your needs. Thank you for considering my application.

Best regards,
${profile.name}`;
  }

  /**
   * Simulate form submission
   */
  async submitApplication(
    job: Job,
    applicationData: Record<string, string>
  ): Promise<{ success: boolean; message: string; jobId: string }> {
    try {
      console.log(`🚀 Submitting application to ${job.company} for ${job.title}...`);

      // In production, this would submit to the actual job board
      // For now, simulate successful submission
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log(`✅ Application submitted successfully!`);

      return {
        success: true,
        message: `Application submitted to ${job.company}`,
        jobId: job.id,
      };
    } catch (err: any) {
      console.error(`❌ Application submission failed:`, err.message);
      return {
        success: false,
        message: `Failed to submit application: ${err.message}`,
        jobId: job.id,
      };
    }
  }
}

/**
 * Quick analysis - used in UI for immediate feedback
 */
export function quickAnalyze(
  resumeText: string,
  jobDescription: string
): {
  score: number;
  level: 'perfect' | 'strong' | 'good' | 'fair' | 'weak';
  color: string;
} {
  const resumeKeywords = resumeText.toLowerCase().split(/\s+/);
  const jobKeywords = jobDescription.toLowerCase().split(/\s+/);

  let matches = 0;
  for (const keyword of jobKeywords) {
    if (keyword.length > 3 && resumeKeywords.includes(keyword)) {
      matches++;
    }
  }

  const score = Math.min(100, (matches / Math.max(jobKeywords.length, 1)) * 100);

  let level: 'perfect' | 'strong' | 'good' | 'fair' | 'weak';
  let color: string;

  if (score >= 85) {
    level = 'perfect';
    color = '#10b981'; // green
  } else if (score >= 70) {
    level = 'strong';
    color = '#3b82f6'; // blue
  } else if (score >= 55) {
    level = 'good';
    color = '#f59e0b'; // amber
  } else if (score >= 40) {
    level = 'fair';
    color = '#ef4444'; // red
  } else {
    level = 'weak';
    color = '#6b7280'; // gray
  }

  return { score: Math.round(score), level, color };
}
