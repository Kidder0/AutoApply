import { JobItem, UserProfile, PreferenceWeights, JobMatchCalculation } from "../types";

export const mockJobs: JobItem[] = [
  {
    id: "job-1",
    title: "Senior Full-Stack Engineer (React & Node.js)",
    company: "Stripe",
    location: "San Francisco, CA",
    salary: "$160,000 - $210,000",
    numericSalaryMin: 160000,
    numericSalaryMax: 210000,
    workType: "Remote",
    source: "Greenhouse API (Official Partner)",
    skills: ["React", "TypeScript", "Node.js", "Express", "RESTful APIs", "PostgreSQL", "Tailwind CSS"],
    visaSponsorship: true,
    url: "https://boards.greenhouse.io/stripe/jobs/4210984",
    postedDate: "2026-06-10",
    credibilityScore: 98,
    description: "Build robust, secure, and developer-friendly online payment platforms. You will work on designing scalable backend REST APIs or GraphQL services with Node.js and Express, configuring highly dynamic customer dashboard pages using React and TypeScript, and securing transaction flows to achieve 99.999% up-time statistics.",
  },
  {
    id: "job-2",
    title: "Staff Frontend Developer",
    company: "Lever Inc.",
    location: "New York, NY",
    salary: "$180,000 - $230,000",
    numericSalaryMin: 180000,
    numericSalaryMax: 230000,
    workType: "Hybrid",
    source: "Lever Board Integration",
    skills: ["React", "TypeScript", "CSS Modules", "Webpack", "Performance Optimization", "Next.js"],
    visaSponsorship: true,
    url: "https://jobs.lever.co/lever/98716-frontend",
    postedDate: "2026-06-09",
    credibilityScore: 96,
    description: "Drive frontend architectures that enable high quality candidate screening and collaborative management within Lever ATS. The role requires mastery over React and Next.js, experience with Webpack to optimize production compilation size, and performance tuning for slow dashboards that compile massive analytical profiles.",
  },
  {
    id: "job-3",
    title: "Software Engineer II - Backend",
    company: "Vercel",
    location: "Remote (USA)",
    salary: "$140,000 - $180,000",
    numericSalaryMin: 140000,
    numericSalaryMax: 180000,
    workType: "Remote",
    source: "Ashby Integration",
    skills: ["Node.js", "Rust", "Next.js", "Serverless", "Edge Computing", "Redis"],
    visaSponsorship: false,
    url: "https://jobs.ashbyhq.com/vercel/55431",
    postedDate: "2026-06-08",
    credibilityScore: 100,
    description: "Help build the future of Web hosting and Serverless computations. Work directly on edge-routing nodes, caching networks run using Redis and key-value datastores, and develop core TS tools that enable developers to launch scalable, low-latency microservices with Next.js and Rust elements.",
  },
  {
    id: "job-4",
    title: "Full-Stack Web Developer",
    company: "Unknown Recruitment Ltd.",
    location: "Austin, TX (On-site)",
    salary: "$90,000 - $110,000",
    numericSalaryMin: 90000,
    numericSalaryMax: 110000,
    workType: "On-site",
    source: "User Submitted URL",
    skills: ["React", "PHP", "Laravel", "MySQL", "jQuery"],
    visaSponsorship: false,
    url: "https://vaguerecruitingboard.com/jobs/9924-unknown",
    postedDate: "2026-06-05",
    credibilityScore: 35, // Flagged: low credibility
    isScam: true,
    description: "URGENT hiring for generic developer roles. High earnings promised immediately. Candidates must have react or PHP knowledge, have personal laptops, and send bank info inside the screening questionnaire so our recruiters can speed up payouts.",
  },
  {
    id: "job-5",
    title: "Junior React Engineer",
    company: "OutsourceCorp",
    location: "Los Angeles, CA",
    salary: "$70,000 - $90,000",
    numericSalaryMin: 70000,
    numericSalaryMax: 90000,
    workType: "Remote",
    source: "Greenhouse API (Unofficial RSS)",
    skills: ["React", "JavaScript", "HTML", "CSS"],
    visaSponsorship: false,
    url: "https://boards.greenhouse.io/outsourcecorp/jobs/55321",
    postedDate: "2026-06-02",
    credibilityScore: 65,
    isExcluded: true, // Belongs to an excluded agency or blocklisted company
    description: "Support diverse client contract works using simple React and HTML assemblies. Suitable for contractors who do not seek active mentorship or structure.",
  },
  {
    id: "job-6",
    title: "AI Automation Engineer",
    company: "Anthropic",
    location: "San Francisco, CA",
    salary: "$200,000 - $280,000",
    numericSalaryMin: 200000,
    numericSalaryMax: 280000,
    workType: "Hybrid",
    source: "Greenhouse API (Official Partner)",
    skills: ["Python", "PyTorch", "TypeScript", "LLM APIs", "FastAPI", "Vector Search", "LangChain"],
    visaSponsorship: true,
    url: "https://boards.greenhouse.io/anthropic/jobs/110992",
    postedDate: "2026-06-11",
    credibilityScore: 99,
    description: "Design compliant, scaling AI safety agent flows and auto-reconciliation systems. Evaluate large scale LLM APIs outputs truthfully, configure custom Vector search models, and deploy reliable microservices backends using Python PyTorch alongside robust TypeScript interface handlers.",
  },
  {
    id: "job-7",
    title: "Senior Full-Stack Engineer (Duplicate)",
    company: "Stripe",
    location: "San Francisco, CA",
    salary: "$165,000 - $205,000",
    numericSalaryMin: 165000,
    numericSalaryMax: 205000,
    workType: "Remote",
    source: "Indeed External Aggregator",
    skills: ["React", "TypeScript", "Node.js", "Express", "PostgreSQL"],
    visaSponsorship: true,
    url: "https://indeed.com/viewjob?jk=stripe-duplicate",
    postedDate: "2026-06-11",
    credibilityScore: 70,
    duplicateOfId: "job-1", // Flagged as a duplicate of Stripe greenhouse job
    description: "Ingested via second-hand job aggregate sources. Seeking a Senior Engineer to construct secure Stripe card interfaces, configure databases in Node and React, and refine transactional components.",
  }
];

export const defaultUserProfile: UserProfile = {
  fullName: "Jane Doe",
  email: "jane.doe@example.com",
  phone: "+1 (555) 019-2834",
  location: "San Francisco, CA",
  workAuthorization: "US Citizen",
  requiresSponsorship: false,
  desiredTitles: ["Senior Full-Stack Engineer", "Full-Stack Engineer", "Senior Software Engineer", "AI Automation Engineer"],
  targetLocations: ["San Francisco, CA", "Remote", "New York, NY"],
  workTypePreference: "Remote",
  willingToRelocate: false,
  salaryMin: 130000,
  salaryMax: 200000,
  experienceLevel: "Senior",
  employmentType: "Full-time",
  preferredCompanies: ["Stripe", "Vercel", "Anthropic", "GitHub", "Linear"],
  excludedCompanies: ["OutsourceCorp", "Unknown Recruitment Ltd.", "CryptoSpam"],
  skills: ["React", "TypeScript", "Node.js", "Express", "Next.js", "PostgreSQL", "Tailwind CSS", "Python", "RESTful APIs", "Git", "Docker"],
  education: [
    {
      degree: "Bachelor of Science",
      field: "Computer Science",
      school: "Stanford University",
      year: "2018",
    }
  ],
  experience: [
    {
      title: "Senior Software Engineer",
      company: "InnovateTech",
      location: "San Francisco, CA",
      duration: "2022 - Present",
      description: "Led development of a high-performance analytics web dashboard using React, TypeScript, and Node.js. Enhanced API query latency by 40% through redis caching. Mentored 4 junior engineers on clean code practices."
    },
    {
      title: "Full-Stack Engineer",
      company: "SaaSify Inc.",
      location: "Remote",
      duration: "2019 - 2022",
      description: "Designed responsive user interfaces using Tailwind CSS and React. Built robust backend services using Express, PostgreSQL, and Docker. Architected and deployed microservices that process 10k+ requests per minute."
    }
  ],
  projects: [
    {
      name: "JobLinker AI Dashboard",
      description: "A secure personal job tracker and profile manager that extracts resume skills and matches them with live APIs.",
      technologies: ["React", "TypeScript", "FastAPI", "PostgreSQL", "Tailwind"],
      link: "https://github.com/janedoe/joblinker"
    }
  ],
  links: {
    github: "https://github.com/janedoe",
    linkedin: "https://linkedin.com/in/janedoe",
    portfolio: "https://janedoe.dev",
  },
  answerBank: [
    {
      question: "Why do you want to join our company?",
      answer: "I am deeply inspired by your engineering culture and focus on developer tools. My experiences building high-availability REST APIs and fluid UI applications align perfectly with your technical vision.",
      category: "Motivation"
    },
    {
      question: "What is your experience with React and TypeScript?",
      answer: "I have used React and TypeScript as my primary stacks for over 5 years, developing large-scale single-page apps, implementing state managers like Zustand, crafting modular responsive layouts using Tailwind, and improving build processes using Vite.",
      category: "Technical Stack"
    },
    {
      question: "What are your salary expectations?",
      answer: "My target salary range is between $140,000 and $180,000, depending on the overall benefits, equity package, and opportunities for growth.",
      category: "Compensation"
    }
  ]
};

export const defaultPreferenceWeights: PreferenceWeights = {
  titleWeight: 30,
  skillsWeight: 25,
  locationWeight: 15,
  salaryWeight: 15,
  visaWeight: 10,
  companyWeight: 5,
};

// Pure, deterministic matching algorithm representation for local display
export function calculateLocalJobMatch(
  job: JobItem,
  profile: UserProfile,
  weights: PreferenceWeights
): JobMatchCalculation {
  const totalWeight = weights.titleWeight + weights.skillsWeight + weights.locationWeight + weights.salaryWeight + weights.visaWeight + weights.companyWeight;

  // 1. Title match (0 to 100)
  // Check if desiredTitles or parts of titles overlap
  let titleScore = 0;
  const isTitleMatch = profile.desiredTitles.some(dt => 
    job.title.toLowerCase().includes(dt.toLowerCase()) || dt.toLowerCase().includes(job.title.toLowerCase())
  );
  if (isTitleMatch) titleScore = 100;
  else if (profile.desiredTitles.some(dt => {
    const dtWords = dt.toLowerCase().split(" ");
    return dtWords.some(word => word.length > 3 && job.title.toLowerCase().includes(word));
  })) {
    titleScore = 60;
  }

  // 2. Skills Match (% of job skills matching profile skills)
  let skillsScore = 0;
  const matchedSkills: string[] = [];
  const requiredSkillGaps: string[] = [];

  job.skills.forEach(skill => {
    if (profile.skills.some(ps => ps.toLowerCase() === skill.toLowerCase())) {
      matchedSkills.push(skill);
    } else {
      requiredSkillGaps.push(skill);
    }
  });

  if (job.skills.length === 0) {
    skillsScore = 100;
  } else {
    skillsScore = Math.round((matchedSkills.length / job.skills.length) * 100);
  }

  // 3. Location match
  let locationScore = 0;
  const targetWorkType = profile.workTypePreference.toLowerCase();
  const jobWorkType = job.workType.toLowerCase();

  const isRemotePref = targetWorkType === "remote" || targetWorkType === "any";
  if (jobWorkType === "remote" && isRemotePref) {
    locationScore = 100;
  } else if (jobWorkType === "hybrid" && (targetWorkType === "hybrid" || targetWorkType === "any")) {
    locationScore = 100;
  } else {
    // Exact location string match
    const locationMatches = profile.targetLocations.some(tl => {
      return job.location.toLowerCase().includes(tl.toLowerCase()) || tl.toLowerCase().includes(job.location.toLowerCase());
    });
    if (locationMatches) {
      locationScore = 90;
    } else if (profile.willingToRelocate) {
      locationScore = 60;
    } else {
      locationScore = 20;
    }
  }

  // 4. Salary match
  let salaryScore = 0;
  const jobMin = job.numericSalaryMin;
  const jobMax = job.numericSalaryMax;
  const userMin = profile.salaryMin;

  if (jobMax >= userMin) {
    salaryScore = 100;
    if (jobMin < userMin) {
      // Partially covers but target overlaps
      salaryScore = 80;
    }
  } else {
    // Below user expectation
    const deficit = userMin - jobMax;
    salaryScore = Math.max(0, Math.round(100 - (deficit / userMin) * 100));
  }

  // 5. Visa Sponsorship match
  let visaScore = 0;
  if (!job.visaSponsorship) {
    // Job doesn't offer sponsorship
    if (!profile.requiresSponsorship) {
      visaScore = 100; // User doesn't need it anyway
    } else {
      visaScore = 0; // Hard fail on sponsorship match
    }
  } else {
    // Job offes sponsorship
    visaScore = 100;
  }

  // 6. Company Match
  let companyScore = 50;
  if (profile.preferredCompanies.some(pc => pc.toLowerCase() === job.company.toLowerCase())) {
    companyScore = 100;
  } else if (profile.excludedCompanies.some(ec => ec.toLowerCase() === job.company.toLowerCase())) {
    companyScore = 0;
  }

  // Grand Weighted Score calculation
  const calculatedScore = Math.round(
    ((titleScore * weights.titleWeight) +
    (skillsScore * weights.skillsWeight) +
    (locationScore * weights.locationWeight) +
    (salaryScore * weights.salaryWeight) +
    (visaScore * weights.visaWeight) +
    (companyScore * weights.companyWeight)) / totalWeight
  );

  const matchingDetails: { [key: string]: string } = {
    title: `Title Match: ${titleScore}% (${job.title} vs Desired list)`,
    skills: `Skills Match: ${skillsScore}% (${matchedSkills.length} matches, ${requiredSkillGaps.length} gaps)`,
    location: `Location/Type Match: ${locationScore}% (${job.location} | ${job.workType})`,
    salary: `Salary Match: ${salaryScore}% (Range: ${job.salary} vs Min Goal: $${profile.salaryMin.toLocaleString()})`,
    visa: `Visa Match: ${visaScore}% (Job Sponsorship: ${job.visaSponsorship ? "Yes" : "No"} | Required: ${profile.requiresSponsorship ? "Yes" : "No"})`,
    company: `Company Match: ${companyScore}%`,
  };

  return {
    jobId: job.id,
    score: calculatedScore,
    titleMatch: titleScore,
    skillsMatch: skillsScore,
    locationMatch: locationScore,
    salaryMatch: salaryScore,
    visaMatch: visaScore,
    companyMatch: companyScore,
    requiredSkillGaps,
    matchingDetails,
  };
}
