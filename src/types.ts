export interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  workAuthorization: string;
  requiresSponsorship: boolean;
  desiredTitles: string[];
  targetLocations: string[];
  workTypePreference: "Remote" | "Hybrid" | "On-site" | "Any";
  willingToRelocate: boolean;
  salaryMin: number;
  salaryMax: number;
  experienceLevel: "Entry" | "Mid" | "Senior" | "Executive" | "Lead";
  employmentType: "Full-time" | "Part-time" | "Contract" | "Internship" | "Freelance";
  preferredCompanies: string[];
  excludedCompanies: string[];
  skills: string[];
  education: {
    degree: string;
    field: string;
    school: string;
    year: string;
  }[];
  experience: {
    title: string;
    company: string;
    location: string;
    duration: string;
    description: string;
  }[];
  projects: {
    name: string;
    description: string;
    technologies: string[];
    link?: string;
  }[];
  links: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
    website?: string;
  };
  answerBank: {
    question: string;
    answer: string;
    category: string;
  }[];
}

export interface PreferenceWeights {
  titleWeight: number;       // e.g., 30
  skillsWeight: number;      // e.g., 25
  locationWeight: number;    // e.g., 15
  salaryWeight: number;      // e.g., 15
  visaWeight: number;        // e.g., 10
  companyWeight: number;     // e.g., 5
}

export interface JobItem {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  salary: string; // e.g., "$120,000 - $150,000"
  numericSalaryMin: number;
  numericSalaryMax: number;
  workType: "Remote" | "Hybrid" | "On-site";
  source: string; // Greenhouse, Lever, Ashby, Standard API, Careers Page
  skills: string[];
  visaSponsorship: boolean;
  url: string;
  postedDate: string; // YYYY-MM-DD
  isExcluded?: boolean;
  isScam?: boolean;
  credibilityScore: number; // 0-100
  duplicateOfId?: string;
}

export interface JobMatchCalculation {
  jobId: string;
  score: number;
  titleMatch: number;
  skillsMatch: number;
  locationMatch: number;
  salaryMatch: number;
  visaMatch: number;
  companyMatch: number;
  requiredSkillGaps: string[];
  matchingDetails: { [key: string]: string };
}

export type ApplicationStatus =
  | "Discovered"
  | "Saved"
  | "Ready for Review"
  | "Pending Approval"
  | "Applied"
  | "Failed Submission"
  | "Needs User Action"
  | "Rejected"
  | "Interview Scheduled"
  | "Offer Received"
  | "Withdrawn";

export interface Application {
  id: string;
  jobId: string;
  status: ApplicationStatus;
  appliedDate?: string;
  resumeVersion: string;
  coverLetterVersion?: string;
  notes: string;
  answers: { question: string; answer: string; confidence: number }[];
  tailoredBullets: string[];
  coverLetterText?: string;
  logs: { timestamp: string; status: ApplicationStatus; message: string }[];
  followUpReminders: { id: string; date: string; title: string; completed: boolean }[];
}

export interface AutomationRule {
  maxDailyApplications: number;
  maxWeeklyApplications: number;
  minimumMatchScore: number;
  applyOnlyToRemote: boolean;
  maxDaysAgoPosted: number;
  requireApprovalForWrittenQuestions: boolean;
  pauseOnCaptcha: boolean;
  pauseOnConsecutiveFailures: number;
  monthlyPerCompanyCap: number;
  isAutomationEnabled: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: "high-match" | "approval-needed" | "success" | "failed" | "reminder" | "suggestion";
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  action: string;
  userId: string;
  details: string;
  status: "success" | "warning" | "error";
  clientIp?: string;
}
