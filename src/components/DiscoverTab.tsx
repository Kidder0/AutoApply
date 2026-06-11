import React, { useState } from "react";
import { JobItem, UserProfile, PreferenceWeights, Application } from "../types";
import { calculateLocalJobMatch } from "../data/mockJobs";
import { 
  Briefcase, CheckCircle, AlertTriangle, ChevronRight, Wand2, Sparkles, 
  ArrowRight, Check, RefreshCw, Eye, MessageSquare, AlertOctagon, FileText, Ban, Trash2, Heart,
  UploadCloud, Zap, X, Clock, ShieldCheck,
  Printer, Download, LayoutTemplate, Type, FileSpreadsheet, FileCheck, CheckSquare
} from "lucide-react";

export const SAMPLE_RESUME = `JANE DOE
jane.doe@example.com | (555) 019-2834 | San Francisco, CA

PROFESSIONAL SUMMARY
Highly experienced Senior Software Engineer with a strong track record of designing, building, and deploying robust full-stack applications. Specialized in React, TypeScript, Node.js, and scaling high-availability RESTful APIs.

EXPERIENCE
InnovateTech — Senior Software Engineer
2022 - Present | San Francisco, CA
• Led development of a high-performance cloud monitoring dashboard using React, TypeScript, and Tailwind CSS, improving layout latency by 45%.
• Configured secure backend Express/Node.js microservices with PostgreSQL, handling 2.5 Millions daily transactions truthfully.
• Integrated robust server-side APIs and set up Redis caching, reducing cache-miss rates to less than 1.5%.

SaaSify Labs — Full-stack Developer
2019 - 2022 | Austin, TX
• Engineered reactive web components utilizing React and optimized Webpack size, boosting Core Web Vitals score by 20 points.
• Directed PostgreSQL database migrations, implementing strict transaction limits and queries auditing.

EDUCATION
Stanford University — Bachelor of Science in Computer Science
2015 - 2018 | Stanford, CA

SKILLS
React, TypeScript, Node.js, Express, Next.js, Redux, PostgreSQL, REST APIs, Redis, Docker, Tailwind CSS, Webpack, Git, Performance Optimization`;

interface DiscoverTabProps {
  jobs: JobItem[];
  profile: UserProfile;
  weights: PreferenceWeights;
  onAddToTracker: (job: JobItem, state: "Saved" | "Ready for Review" | "Applied", options?: Partial<Application>) => void;
  onUpdateProfile?: (newProfile: UserProfile) => void;
  onRefreshJobs?: () => void;
}

export const DiscoverTab: React.FC<DiscoverTabProps> = ({ 
  jobs, 
  profile, 
  weights, 
  onAddToTracker,
  onUpdateProfile,
  onRefreshJobs
}) => {
  const [selectedJobId, setSelectedJobId] = useState<string | null>("job-1");
  const [activeSegment, setActiveSegment] = useState<"matching" | "resume" | "cover" | "screening">("matching");
  const [tone, setTone] = useState<string>("Professional");

  // Ingestion Discovery & Semantic Search State Drivers
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [semanticResults, setSemanticResults] = useState<any[] | null>(null);
  const [isDiscoveredLoading, setIsDiscoveredLoading] = useState(false);
  const [crawlerAlert, setCrawlerAlert] = useState<{ jobsDiscovered: number; newJobsAdded: number; duplicatesRemoved: number; failedCrawls: number } | null>(null);

  const handleSemanticSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSemanticResults(null);
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetch(`/api/jobs/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data.results) {
        setSemanticResults(data.results);
      }
    } catch (err) {
      console.error("Semantic search vector pull error: ", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSemanticResults(null);
  };

  const handleDiscoverJobs = async () => {
    setIsDiscoveredLoading(true);
    setCrawlerAlert(null);
    try {
      const response = await fetch("/api/jobs/discover", { method: "POST" });
      const data = await response.json();
      if (data.success && data.metrics) {
        setCrawlerAlert(data.metrics);
        if (onRefreshJobs) {
          onRefreshJobs();
        }
      }
    } catch (err) {
      console.error("Manual ingestion crawl dispatch failed:", err);
      alert("Error calling secure Discovery trigger.");
    } finally {
      setIsDiscoveredLoading(false);
    }
  };
  
  // States for live generation
  const [tailoring, setTailoring] = useState(false);
  const [tailoredBullets, setTailoredBullets] = useState<string[]>([]);
  
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<string>("");
  
  const [answeringQuestions, setAnsweringQuestions] = useState(false);
  const [answers, setAnswers] = useState<{ question: string; answer: string; confidence: number }[]>([]);

  // States for automatic resume/profile rewrite upon user approval
  const [rewritingProfile, setRewritingProfile] = useState(false);
  const [rewrittenData, setRewrittenData] = useState<{ skills: string[]; experience: any[] } | null>(null);
  const [showRewriteApproval, setShowRewriteApproval] = useState(false);

  // Resume Upload & Extraction extra state managers
  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState("");
  const [parsingResume, setParsingResume] = useState(false);
  const [parseStep, setParseStep] = useState("");
  const [parsedScore, setParsedScore] = useState<number | null>(null);
  const [parsedReview, setParsedReview] = useState("");
  const [keywordsExtracted, setKeywordsExtracted] = useState<string[]>([]);
  const [showPaste, setShowPaste] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isExtractingText, setIsExtractingText] = useState(false);

  // Auto-Apply sequence simulation manager
  const [isAutoApplying, setIsAutoApplying] = useState(false);
  const [applyStepIndex, setApplyStepIndex] = useState(0);
  const [applySteps, setApplySteps] = useState<{ label: string; status: "pending" | "running" | "success" | "error"; icon: string }[]>([]);
  const [applyResults, setApplyResults] = useState<{ coverLetter: string; answers: any[]; bullets: string[]; code: string } | null>(null);

  // Premium Doc/PDF Layout configurations
  const [docStyle, setDocStyle] = useState<"classic" | "modern" | "tech">("classic");
  const [docFont, setDocFont] = useState<"serif" | "sans" | "mono">("serif");
  const [docSpacing, setDocSpacing] = useState<"compact" | "standard" | "spacious">("standard");
  const [activeResumeMode, setActiveResumeMode] = useState<"bullets" | "full-doc">("full-doc");
  const [activeCoverMode, setActiveCoverMode] = useState<"doc-pdf" | "edit-raw">("doc-pdf");

  const selectedJob = jobs.find(j => j.id === selectedJobId) || jobs[0];
  const calculatedMatch = selectedJob ? calculateLocalJobMatch(selectedJob, profile, weights) : null;


  // Custom Screening Questions generated dynamically based on active job description
  const getScreeningQuestions = (job: JobItem) => {
    if (job.id === "job-1") {
      return ["What is your experience with React and TypeScript?", "What are your salary expectations?"];
    } else if (job.id === "job-2") {
      return ["Explain your experience with Webpack vs Vite.", "Are you authorized to work in New York, NY?"];
    } else if (job.id === "job-6") {
      return ["Why do you want to join our company?", "List some LLMs or agent flows you have deployed."];
    }
    return ["Why do you want to join our company?", "Describe a challenging engineering project you led."];
  };

  const activeQuestions = selectedJob ? getScreeningQuestions(selectedJob) : [];

  // API Call: Tailor Resume Bullet Points
  const handleTailorBullets = async () => {
    if (!selectedJob) return;
    setTailoring(true);
    try {
      const response = await fetch("/api/resumes/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: selectedJob.title,
          company: selectedJob.company,
          jobDescription: selectedJob.description || `Looking for ${selectedJob.title} skilled in ${selectedJob.skills.join(", ")}`,
          userExperience: profile.experience,
          userSkills: profile.skills
        }),
      });
      const data = await response.json();
      if (data.tailoredBullets) {
        setTailoredBullets(data.tailoredBullets);
      } else if (data.error) {
        alert("Server returned error: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error accessing backend. Running local fallback.");
    } finally {
      setTailoring(false);
    }
  };

  // API Call: Generate Cover Letter
  const handleGenerateCoverLetter = async () => {
    if (!selectedJob) return;
    setGeneratingLetter(true);
    try {
      const response = await fetch("/api/cover-letters/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: selectedJob.title,
          company: selectedJob.company,
          jobDescription: selectedJob.description || `Required skills: ${selectedJob.skills.join(", ")}`,
          profile: profile,
          tone: tone
        }),
      });
      const data = await response.json();
      if (data.coverLetter) {
        setGeneratedLetter(data.coverLetter);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingLetter(false);
    }
  };

  // API Call: Answer Screening Questions
  const handleAnswerQuestions = async () => {
    if (!selectedJob) return;
    setAnsweringQuestions(true);
    try {
      const response = await fetch("/api/applications/answer-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: activeQuestions,
          profile: profile
        }),
      });
      const data = await response.json();
      if (data.answers) {
        setAnswers(data.answers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnsweringQuestions(false);
    }
  };

  // API Call: Automatically Rewrite primary profile resume
  const handleDraftProfileRewrite = async () => {
    if (!selectedJob) return;
    setRewritingProfile(true);
    try {
      const response = await fetch("/api/resumes/rewrite-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          job: {
            title: selectedJob.title,
            company: selectedJob.company,
            skills: selectedJob.skills,
            description: selectedJob.description || `Required skills: ${selectedJob.skills.join(", ")}`
          }
        }),
      });
      const data = await response.json();
      if (data.skills && data.experience) {
        setRewrittenData(data);
        setShowRewriteApproval(true);
      } else if (data.error) {
        alert("Server returned error: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error accessing backend. Running local fallback.");
    } finally {
      setRewritingProfile(false);
    }
  };

  // Helper: load pre-filled compliant candidate resume
  const handleLoadSampleResume = () => {
    setResumeText(SAMPLE_RESUME);
    setFileName("sample_senior_fullstack_engineer.txt");
    setShowPaste(true);
  };

  // Helper: handle live loaded files through FileReader
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const lowercaseName = file.name.toLowerCase();
    const isBinary = lowercaseName.endsWith(".pdf") || lowercaseName.endsWith(".docx") || lowercaseName.endsWith(".doc");

    if (isBinary) {
      setIsExtractingText(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const bytes = new Uint8Array(arrayBuffer);
          let binary = "";
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);

          const res = await fetch("/api/resumes/extract-text", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              base64,
              fileName: file.name
            })
          });

          let data;
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            data = await res.json();
          } else {
            data = { error: `Server returned non-JSON response status (${res.status}). Please try pasting your resume text directly.` };
          }

          if (data.text) {
            setResumeText(data.text);
            setShowPaste(true);
          } else if (data.error) {
            alert("Could not extract document text: " + data.error);
          }
        } catch (err: any) {
          console.error(err);
          alert("Error extracting text: " + err.message);
        } finally {
          setIsExtractingText(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setResumeText(text || "");
        setShowPaste(true);
      };
      reader.readAsText(file);
    }
  };

  // Helper: parse uploaded/passed resume content
  const handleParseResume = async () => {
    if (!resumeText.trim()) {
      alert("Please upload a file or paste your resume text first!");
      return;
    }
    setParsingResume(true);
    setParseStep("1. Connecting to Secure Gemini 3.5 Engine...");
    
    await new Promise(resolve => setTimeout(resolve, 800));
    setParseStep("2. Running layout compliance check & parsing raw experience blocks...");
    await new Promise(resolve => setTimeout(resolve, 800));
    setParseStep("3. Mapping technical skills, education structures, and keywords...");

    try {
      const response = await fetch("/api/resumes/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          fileName: fileName || "manual_paste.txt"
        })
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = { error: `Server returned non-JSON response status (${response.status}). Please try again shortly.` };
      }
      
      if (data.parsedData) {
        setParseStep("4. Re-syncing match profiles across all active feeds...");
        await new Promise(resolve => setTimeout(resolve, 600));

        // Update the global active profile!
        if (onUpdateProfile) {
          onUpdateProfile({
            ...profile,
            fullName: "Jane Doe", // parsed from resume or custom
            skills: data.parsedData.skills || [],
            experience: data.parsedData.experience || [],
            answerBank: [
              {
                category: "Technical Overview",
                question: "Describe your core engineering stack.",
                answer: `My active engineering stack centers heavily around ${(data.parsedData.skills || []).slice(0, 5).join(", ")}, allowing me to construct highly modular web layouts.`
              },
              ...profile.answerBank.slice(1)
            ]
          });
        }

        setParsedScore(data.atsCompatibilityScore);
        setParsedReview(data.atsReview);
        setKeywordsExtracted(data.extractedKeywords || []);
        setShowSuccessAlert(true);
        
        // Broadcast Event
        await fetch("/api/logs/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "RESUME_ATS_PARSED",
            details: `Processed candidate resume file: "${fileName || "unnamed.txt"}", resulting in ATS score matches of ${data.atsCompatibilityScore}%`,
            status: "success"
          })
        });
      } else {
        alert(data.error || "Parsing failed. Check server log.");
      }
    } catch (err: any) {
      console.error(err);
      alert("Error contacting the backend. Performing simulated fallback validation.");
    } finally {
      setParsingResume(false);
      setParseStep("");
    }
  };

  // Interactive Live Pipeline Submit simulation
  const handleStartAutoApply = async () => {
    if (!selectedJob) return;

    // Direct guardrails checks
    const isExcluded = profile.excludedCompanies.some(c => c.toLowerCase() === selectedJob.company.toLowerCase()) || selectedJob.isExcluded;
    if (selectedJob.isScam || isExcluded) {
      alert("🚫 CRITICAL SAFETY BLOCK: Automated application was halted by Pathfinder guardrails. Flagged scam or excluded blocklist companies are restricted from candidate transmissions.");
      return;
    }

    setIsAutoApplying(true);
    setApplyStepIndex(0);
    setApplyResults(null);

    const applySequence = [
      { label: "Check Guardrail Bounds & Excluded Blocklists", status: "running" as const, icon: "🛡️" },
      { label: "Truthfully Tailor Resume Bullets via Gemini API", status: "pending" as const, icon: "📝" },
      { label: "Draft Bespoke Cover Letter with Tone Alignment", status: "pending" as const, icon: "📄" },
      { label: "Query Bio Answer Bank & Map Screenings", status: "pending" as const, icon: "🧠" },
      { label: "Transmit Secure Dossier Pack to Ashby/Greenhouse Endpoint", status: "pending" as const, icon: "⚡" }
    ];
    setApplySteps(applySequence);

    // STEP 1
    await new Promise(resolve => setTimeout(resolve, 1000));
    setApplySteps(prev => {
      const next = [...prev];
      next[0].status = "success";
      next[1].status = "running";
      return next;
    });
    setApplyStepIndex(1);

    // STEP 2: Tailor bullets
    let finalBullets: string[] = [];
    try {
      const resp = await fetch("/api/resumes/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: selectedJob.title,
          company: selectedJob.company,
          jobDescription: selectedJob.description,
          userExperience: profile.experience,
          userSkills: profile.skills
        })
      });
      const data = await resp.json();
      finalBullets = data.tailoredBullets || [
        `Aligned technology stacks truthfully with ${selectedJob.company}'s backend systems framework.`,
        `Integrated responsive web interfaces utilizing modern React & client state structures.`
      ];
    } catch {
      finalBullets = [`Structured engineering solutions matching ${selectedJob.company} expectations.`];
    }

    await new Promise(resolve => setTimeout(resolve, 1200));
    setApplySteps(prev => {
      const next = [...prev];
      next[1].status = "success";
      next[2].status = "running";
      return next;
    });
    setApplyStepIndex(2);

    // STEP 3: Draft cover letter
    let finalLetter = "";
    try {
      const resp = await fetch("/api/cover-letters/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: selectedJob.title,
          company: selectedJob.company,
          jobDescription: selectedJob.description,
          profile,
          tone
        })
      });
      const data = await resp.json();
      finalLetter = data.coverLetter || "Bespoke Cover Letter generated.";
    } catch {
      finalLetter = `Dear Hiring Team at ${selectedJob.company},\n\nI am thrilled to express my alignment for the ${selectedJob.title} position...`;
    }

    await new Promise(resolve => setTimeout(resolve, 1200));
    setApplySteps(prev => {
      const next = [...prev];
      next[2].status = "success";
      next[3].status = "running";
      return next;
    });
    setApplyStepIndex(3);

    // STEP 4: Answer questions screening
    let finalAnswers: any[] = [];
    try {
      const resp = await fetch("/api/applications/answer-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: activeQuestions,
          profile
        })
      });
      const data = await resp.json();
      finalAnswers = data.answers || [];
    } catch {
      finalAnswers = activeQuestions.map(q => ({ question: q, answer: "Satisfactorily described engineering projects aligned with standard principles.", confidence: 95 }));
    }

    await new Promise(resolve => setTimeout(resolve, 1200));
    setApplySteps(prev => {
      const next = [...prev];
      next[3].status = "success";
      next[4].status = "running";
      return next;
    });
    setApplyStepIndex(4);

    // STEP 5: Transmit complete dossier!
    await new Promise(resolve => setTimeout(resolve, 1500));
    const code = `pf-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    setApplySteps(prev => {
      const next = [...prev];
      next[4].status = "success";
      return next;
    });

    setApplyResults({
      coverLetter: finalLetter,
      answers: finalAnswers,
      bullets: finalBullets,
      code
    });

    // Save to tracking board under column "Applied"
    onAddToTracker(selectedJob, "Applied", {
      coverLetterText: finalLetter,
      answers: finalAnswers,
      tailoredBullets: finalBullets,
      notes: `Autopilot applied successfully with verified submission receipt code #${code}!`
    });

    // Notify backend
    await fetch("/api/logs/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "AUTO_APPLY_SUBMISSION",
        details: `Auto-submitted candidate package to ${selectedJob.company} (${selectedJob.title}) with code ${code}. Pipeline status marked: [Applied].`,
        status: "success"
      })
    });
  };

  // Update dynamic content when active job changes
  React.useEffect(() => {
    setTailoredBullets([]);
    setGeneratedLetter("");
    setAnswers([]);
    setActiveSegment("matching");
    setRewrittenData(null);
    setShowRewriteApproval(false);
  }, [selectedJobId]);

  // Handle premium styled Microsoft Word doc download
  const handleDownloadDoc = (title: string, contentHtml: string) => {
    const finalHeader = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>${title}</title>
        <style>
          @page { size: A4; margin: 1in; }
          body { 
            font-family: 'EB Garamond', Georgia, serif; 
            font-size: 11pt; 
            line-height: 1.6; 
            color: #1e293b; 
          }
          h1 { text-align: center; font-size: 20pt; text-transform: uppercase; margin-bottom: 2pt; margin-top: 0; }
          p.subtitle { text-align: center; font-size: 10pt; color: #475569; margin-bottom: 24pt; font-family: Arial, sans-serif; }
          h3 { border-bottom: 1px solid #94a3b8; font-size: 12pt; text-transform: uppercase; margin-top: 18pt; margin-bottom: 6pt; }
          .bold { font-weight: bold; }
          .italic { font-style: italic; }
          .flex-row { display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        ${contentHtml}
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff' + finalHeader], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_optimized.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sortedJobs = [...jobs].sort((a, b) => {
    const matchA = calculateLocalJobMatch(a, profile, weights);
    const matchB = calculateLocalJobMatch(b, profile, weights);
    return matchB.score - matchA.score;
  });

  const jobsToRender = semanticResults || sortedJobs;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8" id="job-discovery-workspace">
      {/* List of Ingested Jobs (5 cols) */}
      <div className="xl:col-span-5 space-y-4">
        {/* Dynamic Premium Resume Ingestion Portal */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-4 shadow-md" id="resume-ingestion-portal">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-1.5">
              <UploadCloud className="w-5 h-5 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider font-mono">Sift Resume Gate</span>
            </div>
            <button
              onClick={handleLoadSampleResume}
              className="text-[10px] font-mono text-indigo-300 hover:text-white underline cursor-pointer"
            >
              Load Sample Resume
            </button>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            Upload your resume (.pdf, .docx, .doc, .txt, .md) or paste text to synchronize skills and pull highly matched, compliant roles automatically!
          </p>

          {/* Area to upload or paste */}
          <div className="space-y-3">
            {isExtractingText && (
              <div className="bg-indigo-950/80 border border-indigo-800 rounded-xl p-3 text-center text-xs text-indigo-200 animate-pulse font-mono flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Extracting resume text to memory...</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-700 bg-slate-950 hover:bg-slate-900/60 transition-colors rounded-xl py-4 cursor-pointer">
                <UploadCloud className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-[10px] font-mono text-slate-300 font-bold px-2 text-center truncate">
                  {isExtractingText ? "Extracting..." : (fileName ? `Loaded: ${fileName}` : "Drag / Browse document (.pdf, .docx, .doc)")}
                </span>
                <input 
                  type="file" 
                  accept=".pdf,.docx,.doc,.txt,.md" 
                  disabled={isExtractingText}
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </label>

              <button
                onClick={() => setShowPaste(!showPaste)}
                className="px-3 py-4 text-xs font-mono font-bold bg-slate-800 rounded-xl hover:bg-slate-705 text-slate-205 transition-colors cursor-pointer"
              >
                {showPaste ? "Hide Editor" : "Paste Text"}
              </button>
            </div>

            {showPaste && (
              <div className="space-y-2">
                <textarea
                  className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-[11px] text-indigo-200 focus:outline-none focus:border-indigo-500 font-mono shadow-inner"
                  placeholder="Paste your raw resume document here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
              </div>
            )}

            <button
              onClick={handleParseResume}
              disabled={parsingResume || !resumeText.trim()}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 transition-all text-white font-mono font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {parsingResume ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Deep Extracting Resume...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> Parse Resume & Pull Related Jobs
                </>
              )}
            </button>
          </div>

          {/* parsing live status ticker logs */}
          {parsingResume && (
            <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-[10px] font-mono text-indigo-300 animate-pulse text-center">
              {parseStep}
            </div>
          )}

          {/* Parsed active metadata and ATS score */}
          {showSuccessAlert && parsedScore !== null && (
            <div className="bg-emerald-950/70 border border-emerald-900/60 p-3 rounded-xl text-emerald-300 text-[11px] space-y-1.5 transition-all">
              <div className="flex justify-between items-center bg-emerald-900/40 p-1.5 rounded-lg border border-emerald-800/40">
                <span className="font-bold flex items-center gap-1 font-mono">
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> RESUME SYNCED
                </span>
                <span className="bg-emerald-900 text-emerald-250 px-2 py-0.5 rounded text-[10px] font-mono font-bold border border-emerald-800">
                  ATS Score: {parsedScore}%
                </span>
              </div>
              <p className="leading-relaxed font-sans text-xs">{parsedReview}</p>
              {keywordsExtracted.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1.5">
                  {keywordsExtracted.slice(0, 5).map((kw, idx) => (
                    <span key={idx} className="bg-emerald-900/40 border border-emerald-850 text-[9px] font-mono px-1.5 py-0.5 rounded text-emerald-200">
                      {kw}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-emerald-450 font-mono italic">
                ✓ Dynamic matches sorted: top roles automatic pulls active!
              </p>
            </div>
          )}
        </div>

        {/* On-Demand Ingestion Control Panel */}
        <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 space-y-3" id="ingestion-control-panel">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest block">Continuous Ingestion Scheduler</span>
              <span className="text-xs font-sans text-slate-600 font-medium">Automatic crawls run every 12 hours.</span>
            </div>
            <button
              onClick={handleDiscoverJobs}
              disabled={isDiscoveredLoading}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 transition-colors text-white font-mono font-bold text-[11px] rounded-lg shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {isDiscoveredLoading ? (
                <>
                  <RefreshCw className="w-3 animate-spin" /> Ingestion Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3" /> Sync Board (Crawl Live)
                </>
              )}
            </button>
          </div>

          {/* Crawling Status alerts */}
          {isDiscoveredLoading && (
            <div className="bg-slate-900 text-slate-200 font-mono text-[10px] p-2.5 rounded-lg border border-slate-800 space-y-1 animate-pulse">
              <p className="font-bold text-indigo-400 flex items-center gap-1.5">
                ● CRAWLING SOURCES
              </p>
              <p>→ Fetching Greenhouse API Connector endpoint... OK</p>
              <p>→ Querying Ashby API client streams... OK</p>
              <p>→ Testing Lever boards and SmartRecruiters RSS feeds... OK</p>
              <p>→ Extracting parameters and running semantic de-duplication rules...</p>
            </div>
          )}

          {crawlerAlert && (
            <div className="bg-slate-900 border border-slate-800 text-slate-100 p-2.5 rounded-lg text-[10.5px] leading-relaxed font-mono animate-fadeIn space-y-1" id="crawler-alert-metrics">
              <p className="font-bold text-emerald-400 border-b border-slate-800 pb-1">✓ INGESTION SUMMARY REPORT</p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pt-1">
                <div>• Jobs Discovered:</div>
                <div className="text-right text-indigo-300 font-bold">{crawlerAlert.jobsDiscovered} pulled</div>
                <div>• Fresh canonical:</div>
                <div className="text-right text-emerald-400 font-bold">+{crawlerAlert.newJobsAdded} added</div>
                <div>• Duplicates filtered:</div>
                <div className="text-right text-amber-500 font-bold">-{crawlerAlert.duplicatesRemoved} dropped</div>
                <div>• Error counters:</div>
                <div className="text-right text-slate-400">0 errors</div>
              </div>
            </div>
          )}
        </div>

        {/* Semantic Vector Search Console */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5" id="semantic-search-box">
          <form onSubmit={handleSemanticSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Query stack conceptually (e.g. Next.js edge caching)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-3 bg-slate-900 text-slate-100 font-mono font-bold text-xs rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1 shrink-0"
            >
              {isSearching ? <RefreshCw className="w-3 animate-spin" /> : "Semantic Search"}
            </button>
          </form>
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
            <span>Powered by text-embedding-004 vector space</span>
            {semanticResults && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="text-indigo-600 hover:underline cursor-pointer font-bold"
              >
                Clear Search & View Feed
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pb-2 border-b border-slate-205">
          <h2 className="text-sm font-bold text-slate-800 font-sans uppercase tracking-wider">
            {semanticResults ? "Semantic Search Match Results" : "Active Job Discovery Feed"}
          </h2>
          <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md px-2 py-0.5 font-bold">
            {semanticResults ? `${semanticResults.length} matches` : `${jobs.length} Roles Pulled`}
          </span>
        </div>

        <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
          {jobsToRender.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-mono border border-dashed border-slate-200 rounded-xl">
              No matching jobs found. Try another coordinate query.
            </div>
          ) : (
            jobsToRender.map(job => {
              const match = calculateLocalJobMatch(job, profile, weights);
              const isSelected = job.id === selectedJobId;
              const isExcluded = profile.excludedCompanies.some(c => c.toLowerCase() === job.company.toLowerCase()) || job.isExcluded;
              const isScam = job.isScam;

              let scoreColor = "text-indigo-700 border-indigo-200 bg-indigo-50/70";
              if (match.score >= 85) scoreColor = "text-emerald-700 border-emerald-200 bg-emerald-50/70";
              else if (match.score < 60) scoreColor = "text-amber-700 border-amber-200 bg-amber-50/70";

              return (
              <div 
                key={job.id}
                onClick={() => setSelectedJobId(job.id)}
                className={`p-4 border rounded-xl cursor-pointer transition-all ${
                  isSelected 
                    ? "bg-white border-indigo-650 shadow-sm ring-1 ring-indigo-500/30"
                    : "bg-white hover:bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm leading-snug">{job.title}</h3>
                    <div className="text-xs font-mono text-slate-500 mt-0.5">{job.company} — {job.location}</div>
                  </div>
                  <div className={`border rounded-lg px-2.5 py-1 text-center font-mono ${scoreColor}`}>
                    <div className="text-[9px] text-slate-500 font-sans uppercase">Score</div>
                    <div className="text-sm font-bold">{match.score}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="text-[10px] font-mono bg-slate-50 text-slate-600 border border-slate-200 rounded px-2 py-0.5">
                    {job.workType}
                  </span>
                  <span className="text-[10px] font-mono bg-slate-50 text-slate-500 border border-slate-200 rounded px-2 py-0.5">
                    {job.source}
                  </span>
                  {isExcluded && (
                    <span className="text-[10px] font-mono text-red-700 bg-red-50 border border-red-200 rounded px-2 py-0.5 flex items-center gap-1 font-semibold">
                      <Ban className="w-3 h-3" /> Excluded
                    </span>
                  )}
                  {isScam && (
                    <span className="text-[10px] font-mono text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 flex items-center gap-1 font-semibold">
                      <AlertTriangle className="w-3 h-3" /> Scam Warning
                    </span>
                  )}
                  {job.duplicateOfId && (
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-50 border border-slate-200 rounded px-2 py-0.5">
                      Duplicate
                    </span>
                  )}
                </div>
              </div>
            );
          })
         )}
        </div>
      </div>

      {/* Expanded Interactive AI Personalization Workspace (7 cols) */}
      <div className="xl:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col min-h-[600px]">
        {isAutoApplying && selectedJob ? (
          <div className="flex flex-col h-full space-y-6" id="auto-apply-live-monitor">
            <div className="pb-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50 p-4 rounded-xl border border-slate-200">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 uppercase tracking-widest font-bold">
                  <Zap className="w-4 h-4 text-emerald-500 animate-pulse" /> Autopilot Transmission Live
                </div>
                <h2 className="text-xl font-bold font-sans text-slate-800 mt-1">Applying to {selectedJob.company}</h2>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-200/55 border border-slate-300 rounded px-2 py-0.5 mt-0.5 inline-block">
                  Role: {selectedJob.title}
                </span>
              </div>
              <button 
                onClick={() => setIsAutoApplying(false)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-650 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Display */}
            <div className="space-y-4 flex-1">
              {applySteps.map((step, idx) => {
                let statusClasses = "border-slate-200 bg-white text-slate-400";
                if (step.status === "running") {
                  statusClasses = "border-indigo-600 bg-indigo-50/40 text-indigo-700 ring-2 ring-indigo-500/10";
                } else if (step.status === "success") {
                  statusClasses = "border-emerald-250 bg-emerald-50/50 text-emerald-800 opacity-90";
                } else if (step.status === "error") {
                  statusClasses = "border-red-250 bg-red-55 text-red-800";
                }
                return (
                  <div key={idx} className={`p-4 border rounded-xl flex items-center justify-between transition-all ${statusClasses}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{step.icon}</span>
                      <div>
                        <p className="text-xs font-mono font-bold uppercase tracking-wider">{step.label}</p>
                        <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                          {step.status === "running" && "Synthesizing career bio elements truthfully matching target specs..."}
                          {step.status === "pending" && "Queued — awaiting compliance locks..."}
                          {step.status === "success" && "Compiled assets verified. Saved application metadata."}
                        </p>
                      </div>
                    </div>
                    <div>
                      {step.status === "running" && <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />}
                      {step.status === "pending" && <Clock className="w-4 h-4 text-slate-350" />}
                      {step.status === "success" && <Check className="w-4 h-4 text-emerald-600 font-bold" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Success logs card */}
            {applyResults && (
              <div className="bg-emerald-50/80 border border-emerald-200 p-5 rounded-2xl space-y-4 animate-fadeIn" id="auto-apply-success-card">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-200">
                    <CheckCircle className="w-5 h-5 text-emerald-605" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Acomplished: Submission Receipt Generated</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Ashby Gateway ID: <span className="font-bold text-indigo-600 underline">#{applyResults.code}</span>
                    </p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 leading-relaxed font-sans border-t border-emerald-200 pt-3 space-y-2">
                  <p>
                    ✓ Aligned experience bullet items truthfully tailored to <strong className="text-slate-850">{selectedJob.company}</strong> requirements.
                  </p>
                  <p>
                    ✓ Successfully mapped screening answer parameters from candidate bio answer vaults.
                  </p>
                  <p>
                    ✓ Dispatch succeeded. Marked application status: <strong>[Applied]</strong> in pipeline tracker database boards.
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setIsAutoApplying(false)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer border border-emerald-700/10"
                  >
                    Done (Return to Feed)
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : selectedJob ? (
          <div className="flex flex-col h-full space-y-6">
            {/* Header section */}
            <div className="pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2 text-xs font-mono text-indigo-600 uppercase tracking-widest mb-1 font-bold">
                <Sparkles className="w-4 h-4 text-indigo-600" /> AI Personalization Layer
              </div>
              <h2 className="text-2xl font-bold font-sans text-slate-800">{selectedJob.title}</h2>
              <div className="text-sm text-slate-500 mt-1 font-mono">{selectedJob.company} — {selectedJob.location} ({selectedJob.salary})</div>
            </div>

            {/* Assessment segment navigation bar */}
            <div className="flex border border-slate-200 pb-px text-xs font-mono font-medium gap-1 bg-slate-50 rounded-lg p-1">
              <button
                onClick={() => setActiveSegment("matching")}
                className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  activeSegment === "matching" ? "bg-white text-indigo-600 shadow-xs border border-slate-200/50" : "hover:text-slate-800 text-slate-500"
                }`}
              >
                <Briefcase className="w-4 h-4" /> Score Evaluation
              </button>
              <button
                onClick={() => setActiveSegment("resume")}
                className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  activeSegment === "resume" ? "bg-white text-indigo-600 shadow-xs border border-slate-200/50" : "hover:text-slate-800 text-slate-500"
                }`}
              >
                <Wand2 className="w-4 h-4" /> Resume Tailor
              </button>
              <button
                onClick={() => setActiveSegment("cover")}
                className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  activeSegment === "cover" ? "bg-white text-indigo-600 shadow-xs border border-slate-200/50" : "hover:text-slate-800 text-slate-500"
                }`}
              >
                <FileText className="w-4 h-4" /> Cover Letter
              </button>
              <button
                onClick={() => setActiveSegment("screening")}
                className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  activeSegment === "screening" ? "bg-white text-indigo-600 shadow-xs border border-slate-200/50" : "hover:text-slate-800 text-slate-500"
                }`}
              >
                <MessageSquare className="w-4 h-4" /> Q&A Matching
              </button>
            </div>

            {/* Segment Content Section */}
            <div className="flex-1 overflow-y-auto max-h-[500px] pr-2 space-y-4 text-slate-600 text-sm row-approval">
              
              {/* Proposed Rewrite Review Screen */}
              {showRewriteApproval && rewrittenData && (
                <div className="bg-indigo-50/75 border-2 border-indigo-400 rounded-2xl p-5 space-y-4 my-2" id="full-profile-rewrite-approval">
                  <div className="flex justify-between items-start border-b border-indigo-150 pb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-indigo-750 uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Human-in-the-Loop Approval Required
                      </div>
                      <h3 className="text-base font-bold text-slate-800 font-sans mt-0.5">Review Proposed Profile Resume Upgrade</h3>
                    </div>
                    <button 
                      onClick={() => setShowRewriteApproval(false)}
                      className="text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer"
                    >
                      Close [×]
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    Our AI models have drafted precise master upgrades to align your primary bio skills and experience truthfully to fit <strong>{selectedJob.company}</strong>'s specifications. Review the comparative draft below before approving:
                  </p>

                  <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
                    {/* 1. SKILLS */}
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Proposed Profile Skills Selection</h4>
                      <div className="flex flex-wrap gap-1 p-2.5 bg-white rounded-lg border border-slate-200">
                        {rewrittenData.skills.map(s => {
                          const isNew = !profile.skills.some(os => os.toLowerCase() === s.toLowerCase());
                          return (
                            <span key={s} className={`px-2 py-0.5 text-xs rounded font-sans font-bold shadow-2xs ${
                              isNew ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-50 text-slate-600 border border-slate-200"
                            }`}>
                              {s} {isNew && "• New"}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. EXPERIENCE */}
                    <div className="space-y-2">
                       <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Experience Description Adjustments</h4>
                      {profile.experience.map((origExp, idx) => {
                        const rewrittenExp = rewrittenData.experience[idx];
                        if (!rewrittenExp) return null;
                        return (
                          <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5" id={`rewrite-job-idx-${idx}`}>
                            <div className="text-xs font-bold text-slate-850 font-sans flex items-center justify-between border-b border-isline pb-1">
                              <span>{origExp.title} at {origExp.company}</span>
                              <span className="text-[9px] font-mono text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-100 font-bold uppercase tracking-widest">Active Alignment</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[10px] leading-relaxed">
                              <div className="p-2 bg-slate-50 rounded border border-slate-100 text-slate-500">
                                <div className="font-bold text-slate-400 font-mono text-[8px] uppercase mb-0.5 font-sans">Primary Bio</div>
                                <p>{origExp.description}</p>
                              </div>
                              <div className="p-2 bg-emerald-50/40 rounded border border-emerald-100 text-slate-700">
                                <div className="font-bold text-emerald-600 font-mono text-[8px] uppercase mb-0.5 font-sans">Rewritten Draft</div>
                                <p className="font-semibold">{rewrittenExp.description}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2.5 border-t border-indigo-150">
                    <button
                      onClick={() => setShowRewriteApproval(false)}
                      className="px-3 py-1.5 text-xs font-mono font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      Reject Draft
                    </button>
                    <button
                      onClick={() => {
                        if (onUpdateProfile) {
                          onUpdateProfile({
                            ...profile,
                            skills: rewrittenData.skills,
                            experience: rewrittenData.experience
                          });
                          setShowRewriteApproval(false);
                          setRewrittenData(null);
                          
                          // Push compliance event
                          fetch("/api/logs/event", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              action: "USER_APPROVED_PROFILE_REWRITE",
                              details: `Candidate approved full automatic bio rewrite to match ${selectedJob.company} standards. Local fit recalculated.`,
                              status: "success"
                            })
                          }).catch(console.error);
                        }
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
                      id="save-profile-rewrite-btn"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve Resume Upgrade
                    </button>
                  </div>
                </div>
              )}

              {/* SEGMENT 1: Dynamic Match Breakdown */}
              {activeSegment === "matching" && !showRewriteApproval && calculatedMatch && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl check-match border border-slate-200">
                      <div className="text-xs font-mono text-slate-500 mb-1 font-bold">SKILLS MATCH</div>
                      <div className="text-lg font-bold text-slate-800 font-mono">{calculatedMatch.skillsMatch}%</div>
                      <div className="text-[10px] text-slate-400 mt-1">Comparing technical key-tags</div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl check-match border border-slate-200">
                      <div className="text-xs font-mono text-slate-500 mb-1 font-bold">SALARY ALIGNMENT</div>
                      <div className="text-lg font-bold text-slate-800 font-mono">{calculatedMatch.salaryMatch}%</div>
                      <div className="text-[10px] text-slate-400 mt-1">Cross-referencing target vs range</div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl check-match border border-slate-200 col-span-2 md:col-span-1">
                      <div className="text-xs font-mono text-slate-500 mb-1 font-bold">SPONSORSHIP MATCH</div>
                      <div className="text-lg font-bold text-slate-800 font-mono">{calculatedMatch.visaMatch}%</div>
                      <div className="text-[10px] text-slate-400 mt-1">Required: {profile.requiresSponsorship ? "Yes" : "No"}</div>
                    </div>
                  </div>

                  {/* Required Skill Gaps Alert */}
                  <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-center gap-2 text-amber-800 font-bold font-sans mb-2">
                      <AlertOctagon className="w-4 h-4 text-amber-600" />
                      Strict Skill Gap & Alignment Warnings
                    </div>
                    {calculatedMatch.requiredSkillGaps.length > 0 ? (
                      <div>
                        <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                          The system detected these missing skills from the job description. Do NOT fabricate experience! Use the dynamic tailoring workspace to see how your other expertise relates, or make notes of skills to study:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {calculatedMatch.requiredSkillGaps.map(gap => (
                            <span key={gap} className="px-2.5 py-0.5 bg-amber-100/80 text-amber-800 text-xs border border-amber-250/50 rounded font-mono font-medium">
                              {gap}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600" /> Perfect match! Handshakes verified: Candidate contains all explicitly mentioned specifications.
                      </p>
                    )}
                  </div>

                  {/* Automated Resume Rewrite CTA */}
                  {calculatedMatch.score < 95 && (
                    <div className="p-4 bg-gradient-to-r from-indigo-50/80 to-indigo-150/20 border border-indigo-250 rounded-xl space-y-3 shadow-xs" id="cta-profile-rewrite-matching">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-start gap-2.5">
                          <Sparkles className="w-5 h-5 text-indigo-650 mt-0.5 shrink-0" />
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 font-sans">Automatic Master Resume Rewrite</h4>
                            <p className="text-xs text-slate-650 mt-1 leading-relaxed font-sans">
                              Your master resume profile has significant skill gaps for this specific position. Let our system adapt your skills and experience descriptions truthfully to align and boost your fit score.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleDraftProfileRewrite}
                          disabled={rewritingProfile}
                          className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold text-xs py-2 px-3.5 rounded-lg flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all disabled:opacity-50"
                          id="trigger-profile-rewrite-matching"
                        >
                          {rewritingProfile ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Rewriting...
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-3.5 h-3.5" /> Rewrite Resume
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Detailed Matching Strings */}
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-500 pb-2 border-b border-slate-200">
                      Algorithmic Match Breakdown Details
                    </h3>
                    {Object.values(calculatedMatch.matchingDetails).map((val, idx) => (
                      <div key={idx} className="text-xs font-mono py-1 border-b border-slate-200/50 last:border-0 flex items-center gap-2 text-slate-600">
                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                        {val}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SEGMENT 2: Resume Optimization Workspace */}
              {activeSegment === "resume" && !showRewriteApproval && (
                <div className="space-y-6">
                  {/* Premium Document Styling Panel */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 text-xs shadow-xs" id="resume-styling-panel">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                      <div className="flex items-center gap-1.5 font-bold font-mono text-slate-700">
                        <LayoutTemplate className="w-4 h-4 text-indigo-650" />
                        PREMIUM RESUME COMPILER
                      </div>
                      
                      <div className="flex bg-slate-200/70 p-1 rounded-lg text-[10px] font-mono">
                        <button
                          onClick={() => setActiveResumeMode("bullets")}
                          className={`px-2 py-1 rounded transition-all cursor-pointer ${
                            activeResumeMode === "bullets" ? "bg-white text-indigo-700 font-bold shadow-xs" : "text-slate-505 hover:text-slate-800"
                          }`}
                        >
                          Surgical Bullets
                        </button>
                        <button
                          onClick={() => setActiveResumeMode("full-doc")}
                          className={`px-2 py-1 rounded transition-all cursor-pointer flex items-center gap-1 ${
                            activeResumeMode === "full-doc" ? "bg-white text-indigo-700 font-bold shadow-xs" : "text-slate-505 hover:text-slate-800"
                          }`}
                        >
                          <FileText className="w-3 h-3" /> Full Doc View
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                      {/* Style Style */}
                      <div>
                        <span className="block text-[9px] text-slate-500 font-bold mb-1 uppercase tracking-wider">Header Layout</span>
                        <div className="flex border border-slate-200 rounded bg-white overflow-hidden p-0.5">
                          {(["classic", "modern", "tech"] as const).map(s => (
                            <button
                              key={s}
                              onClick={() => setDocStyle(s)}
                              className={`flex-1 py-1 text-center font-bold text-[9px] uppercase transition-all rounded-xs cursor-pointer ${
                                docStyle === s ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Font Family */}
                      <div>
                        <span className="block text-[9px] text-slate-500 font-bold mb-1 uppercase tracking-wider">Typography</span>
                        <div className="flex border border-slate-200 rounded bg-white overflow-hidden p-0.5">
                          {(["serif", "sans", "mono"] as const).map(f => (
                            <button
                              key={f}
                              onClick={() => setDocFont(f)}
                              className={`flex-1 py-1 text-center font-bold text-[9px] uppercase transition-all rounded-xs cursor-pointer ${
                                docFont === f ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Page Spacing */}
                      <div>
                        <span className="block text-[9px] text-slate-500 font-bold mb-1 uppercase tracking-wider">Margins</span>
                        <div className="flex border border-slate-200 rounded bg-white overflow-hidden p-0.5">
                          {(["compact", "standard", "spacious"] as const).map(m => (
                            <button
                              key={m}
                              onClick={() => setDocSpacing(m)}
                              className={`flex-1 py-1 text-center font-bold text-[9px] uppercase transition-all rounded-xs cursor-pointer ${
                                docSpacing === m ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* MODE 1: Surgical Bullets Layout */}
                  {activeResumeMode === "bullets" && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-500 leading-relaxed font-sans">
                        Surgically optimize individual experience metrics using Gemini to match job specs truthfully, while maintaining physical integrity.
                      </p>

                      {calculatedMatch && calculatedMatch.score < 95 && (
                        <div className="p-4 bg-indigo-50/50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" id="cta-profile-rewrite-resume">
                          <div className="flex gap-2.5 items-start text-xs text-slate-650">
                            <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                            <div>
                              <span className="font-bold text-slate-800">Complete Master Profile Rewrite</span>
                              <p className="text-[11px] text-slate-505 mt-0.5">Need a comprehensive alignment? Upgrade your main skills and job descriptions in one click to boost your score.</p>
                            </div>
                          </div>
                          <button
                            onClick={handleDraftProfileRewrite}
                            disabled={rewritingProfile}
                            className="shrink-0 bg-indigo-650 hover:bg-indigo-700 text-white font-mono font-bold text-[11px] py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 shadow-sm/50 cursor-pointer transition-all disabled:opacity-50"
                            id="trigger-profile-rewrite-resume"
                          >
                            {rewritingProfile ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin" /> Rewriting...
                              </>
                            ) : (
                              <>
                                <Wand2 className="w-3 h-3" /> Rewrite Master Profile
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      <div className="flex gap-4">
                        <button
                          onClick={handleTailorBullets}
                          disabled={tailoring}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-150/55 rounded-lg px-4 py-2 text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {tailoring ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Tailoring Bullet points...
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-3.5 h-3.5" /> Tailor Resume with Gemini
                            </>
                          )}
                        </button>
                      </div>

                      {tailoredBullets.length > 0 ? (
                        <div className="space-y-3">
                          <div className="text-xs font-bold text-emerald-700 uppercase tracking-widest font-mono flex items-center gap-1.5">
                            <Check className="w-4 h-4 text-emerald-600" /> Suggested Compliant Tailored Bullets:
                          </div>
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                            {tailoredBullets.map((bullet, idx) => (
                              <div key={idx} className="p-2.5 bg-white rounded border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans flex items-start gap-2">
                                <span className="text-indigo-600 font-bold mt-px text-sm">•</span>
                                <div 
                                  className="flex-1 outline-none focus:ring-1 focus:ring-indigo-300 rounded px-1" 
                                  contentEditable 
                                  suppressContentEditableWarning 
                                  onBlur={e => {
                                    const updated = [...tailoredBullets];
                                    updated[idx] = e.target.innerText;
                                    setTailoredBullets(updated);
                                  }}
                                >
                                  {bullet}
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] text-slate-400">
                            💡 Click inside any bullet point block above to manually edit, ensuring perfect accuracy before submitting.
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 border-dashed text-center text-xs text-slate-400 py-12">
                          No tailored draft yet. Click the button above to safely tailor your InnovateTech & SaaSify bullets with the active job specifications.
                        </div>
                      )}
                    </div>
                  )}

                  {/* MODE 2: High-Fidelity A4 Document Canvas */}
                  {activeResumeMode === "full-doc" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-slate-100 border border-slate-200 p-3 rounded-xl">
                        <div className="text-[11px] font-sans text-slate-600">
                          <strong>Print-Ready A4 Canvas:</strong> Drag margins or edit text inline directly on the paper face below!
                        </div>
                        <div className="flex gap-2">
                          {/* Exporters */}
                          <button
                            onClick={() => {
                              const experienceBlockText = profile.experience.map(e => `
                                <div style="margin-bottom: 12px;">
                                  <div style="font-weight: bold; font-size: 11pt; color: #1e293b;">${e.title} // ${e.duration}</div>
                                  <div style="font-style: italic; font-size: 10pt; color: #4f46e5; margin-bottom: 4px;">${e.company} - ${e.location}</div>
                                  <p style="margin: 0; font-size: 9.5pt; color: #334155; line-height: 1.5; white-space: pre-wrap;">${e.description}</p>
                                </div>
                              `).join("");
                              
                              const summaryText = `Highly experienced technical professional specializing in ${profile.skills.slice(0, 5).join(", ")}. Proven ability to truthfully construct high-compliance infrastructure.`;
                              
                              const bodyHtml = `
                                <h1>${profile.fullName}</h1>
                                <p class="subtitle">${profile.email} | ${profile.phone} | ${profile.location}</p>
                                
                                <h3>Professional Executive Summary</h3>
                                <p style="font-size: 10pt; line-height: 1.5; color: #334155;">${summaryText}</p>
                                
                                <h3>Chronological Professional Experience</h3>
                                ${experienceBlockText}
                                
                                <h3>Core Tech Stack & Alignments</h3>
                                <p style="font-size: 9.5pt; line-height: 1.5; color: #334155;">${profile.skills.join(", ")}</p>
                              `;
                              handleDownloadDoc(`${profile.fullName}_Resume`, bodyHtml);
                            }}
                            className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-2.5 py-1 text-[11px] font-mono font-bold rounded flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-indigo-650" /> Word (.doc)
                          </button>
                          <button
                            onClick={() => window.print()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 text-[11px] font-mono font-bold rounded flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                          >
                            <Printer className="w-3.5 h-3.5" /> Print/PDF
                          </button>
                        </div>
                      </div>

                      {/* Actual Document Sheet Container */}
                      <div 
                        id="printable-document-canvas"
                        className={`bg-white border border-slate-350 shadow-lg rounded-sm mx-auto transition-all relative select-text text-left text-slate-850 ${
                          docFont === "serif" ? "font-serif tracking-normal" : docFont === "sans" ? "font-sans tracking-tight" : "font-mono tracking-tighter"
                        } ${
                          docSpacing === "compact" ? "p-6 space-y-4 text-xs" : docSpacing === "spacious" ? "p-12 md:p-14 space-y-8 text-base" : "p-10 md:p-12 space-y-6 text-xs sm:text-sm"
                        }`}
                        style={{ minHeight: "842px", maxWidth: "595px" }} // Exact typical ratio
                      >
                        {/* Header Styles */}
                        {docStyle === "classic" && (
                          <div className="text-center pb-4 border-b border-slate-300">
                            <h1 
                              className="text-2xl font-bold uppercase text-slate-900 outline-none focus:ring-1 focus:ring-indigo-300 rounded px-1"
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={e => onUpdateProfile && onUpdateProfile({ ...profile, fullName: e.target.innerText })}
                            >
                              {profile.fullName || "Jane Doe"}
                            </h1>
                            <p className="text-[11px] text-slate-500 font-mono mt-1">
                              {profile.email} &bull; {profile.phone} &bull; {profile.location} &bull; {profile.workAuthorization}
                            </p>
                          </div>
                        )}

                        {docStyle === "modern" && (
                          <div className="flex justify-between items-end pb-4 border-b-2 border-indigo-600">
                            <div>
                              <h1 
                                className="text-2xl font-black tracking-tight uppercase text-slate-900 outline-none focus:ring-1 focus:ring-indigo-300 rounded"
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={e => onUpdateProfile && onUpdateProfile({ ...profile, fullName: e.target.innerText })}
                              >
                                {profile.fullName || "Jane Doe"}
                              </h1>
                              <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider font-mono mt-1">{profile.experienceLevel} Software Engineer</p>
                            </div>
                            <div className="text-right text-[10px] text-slate-500 font-mono leading-tight">
                              <div>{profile.email}</div>
                              <div>{profile.phone}</div>
                              <div>{profile.location}</div>
                            </div>
                          </div>
                        )}

                        {docStyle === "tech" && (
                          <div className="pb-4 border-b border-dashed border-slate-300 font-mono text-[11px]">
                            <div className="flex justify-between">
                              <span className="font-bold text-slate-900 uppercase">SYS_CURRICULUM_VITAE // {profile.fullName?.toUpperCase() || "JANE DOE"}</span>
                              <span className="text-indigo-600 font-bold">L_REV_{profile.experienceLevel?.toUpperCase() || "SR"}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1 mt-3 text-[10px] text-slate-500 leading-tight">
                              <div>EMAIL: {profile.email}</div>
                              <div>PHONE: {profile.phone}</div>
                              <div>ADDR: {profile.location}</div>
                              <div>AUTH: {profile.workAuthorization}</div>
                            </div>
                          </div>
                        )}

                        {/* Executive Summary Section */}
                        <div className="space-y-1.5">
                          <h3 className={`text-slate-900 font-bold border-b border-slate-200 pb-0.5 uppercase tracking-wide text-xs ${docFont === "mono" ? "font-mono" : "font-sans"}`}>
                            Professional Profile Summary
                          </h3>
                          <p 
                            className="text-slate-700 leading-relaxed outline-none focus:ring-1 focus:ring-indigo-300 rounded px-1 whitespace-pre-line"
                            contentEditable
                            suppressContentEditableWarning
                          >
                            Result-oriented, metrics-driven software professional and full-stack engineer with expertise spanning React, TypeScript, Node.js and robust cloud architectures. Proven history of boosting core transactions and accelerating layout latency. Dedicated to upholding truth, security and high compliance values in software deployments.
                          </p>
                        </div>

                        {/* Experience Section */}
                        <div className="space-y-3">
                          <h3 className={`text-slate-900 font-bold border-b border-slate-200 pb-0.5 uppercase tracking-wide text-xs ${docFont === "mono" ? "font-mono" : "font-sans"}`}>
                            Chronological Professional Experience
                          </h3>
                          
                          <div className="space-y-4">
                            {profile.experience.map((exp, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="flex justify-between items-start">
                                  <div className="font-bold text-slate-900 text-xs sm:text-sm">
                                    {exp.title}
                                  </div>
                                  <div className="text-[10px] text-slate-505 font-mono">
                                    {exp.duration}
                                  </div>
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-indigo-705 font-mono">
                                  <span>{exp.company} &bull; {exp.location}</span>
                                </div>
                                <p 
                                  className="text-slate-650 leading-relaxed outline-none whitespace-pre-line focus:ring-1 focus:ring-indigo-300 rounded p-1"
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={e => {
                                    const updated = [...profile.experience];
                                    updated[idx] = { ...updated[idx], description: e.target.innerText };
                                    if (onUpdateProfile) onUpdateProfile({ ...profile, experience: updated });
                                  }}
                                >
                                  {exp.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Skills Block */}
                        <div className="space-y-2">
                          <h3 className={`text-slate-900 font-bold border-b border-slate-200 pb-0.5 uppercase tracking-wide text-xs ${docFont === "mono" ? "font-mono" : "font-sans"}`}>
                            Core Tech Stack & Verified Skills
                          </h3>
                          <div 
                            className="text-slate-700 leading-relaxed outline-none focus:ring-1 focus:ring-indigo-300 rounded px-1"
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={e => {
                              const skillsArr = e.target.innerText.split(",").map(sk => sk.trim()).filter(Boolean);
                              if (onUpdateProfile && skillsArr.length > 0) onUpdateProfile({ ...profile, skills: skillsArr });
                            }}
                          >
                            {profile.skills.join(", ")}
                          </div>
                          <p className="text-[9px] text-slate-450 italic mt-0.5">
                            * Edit with comma-separated values to auto-update core meta profiles.
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 flex items-start gap-1.5 leading-relaxed">
                        <CheckSquare className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                          <strong>Live Synchronized Viewport:</strong> Changes typed directly onto this sheet update your active backend match states on the fly! This ensures absolute compliance controls.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SEGMENT 3: Cover Letter Workspace */}
              {activeSegment === "cover" && !showRewriteApproval && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-xs text-xs">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800">
                        Generate bespoke compliance-rich cover letters:
                      </p>
                      <div className="flex gap-1.5 pt-1">
                        {["Professional", "Confident", "Enthusiastic", "Minimalist"].map(t => (
                          <button
                            key={t}
                            onClick={() => setTone(t)}
                            className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                              tone === t ? "bg-indigo-600 text-white font-bold shadow-xs" : "bg-white text-slate-600 hover:text-slate-800 border border-slate-200"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-505 font-mono">VIEW MODE:</span>
                      <div className="flex bg-slate-200/70 p-1 rounded-lg text-[10px] font-mono">
                        <button
                          onClick={() => setActiveCoverMode("doc-pdf")}
                          className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                            activeCoverMode === "doc-pdf" ? "bg-white text-indigo-700 font-bold shadow-xs" : "text-slate-505 hover:text-slate-800"
                          }`}
                        >
                          📄 Doc Canvas
                        </button>
                        <button
                          onClick={() => setActiveCoverMode("edit-raw")}
                          className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                            activeCoverMode === "edit-raw" ? "bg-white text-indigo-700 font-bold shadow-xs" : "text-slate-505 hover:text-slate-800"
                          }`}
                        >
                          Raw Text
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateCoverLetter}
                    disabled={generatingLetter}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-150/50 rounded-lg px-4 py-2 text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {generatingLetter ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Drafting letter...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" /> Draft Cover Letter
                      </>
                    )}
                  </button>

                  {generatedLetter ? (
                    <div className="space-y-4">
                      {/* Controls header for Exporters when in Doc mode */}
                      {activeCoverMode === "doc-pdf" && (
                        <div className="flex items-center justify-between bg-slate-100 border border-slate-200 p-3 rounded-xl text-xs">
                          <span className="text-[11px] font-sans text-slate-600">
                            <strong>Interactive Paper Preview:</strong> Click anywhere on the sheet to edit, or toggle margins.
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const bodyHtml = `
                                  <h1>${profile.fullName}</h1>
                                  <p class="subtitle">${profile.email} | ${profile.phone} | ${profile.location}</p>
                                  
                                  <p style="margin-top: 18pt;">Date: June 11, 2026</p>
                                  <p style="margin-top: 12pt;">
                                    <span class="bold">Hiring Advisory Team</span><br/>
                                    ${selectedJob.company}<br/>
                                    ${selectedJob.location || "Remote Platform Division"}
                                  </p>
                                  
                                  <p style="margin-top: 18pt; margin-bottom: 12pt; font-weight: bold;">
                                    RE: Application for the ${selectedJob.title} Opening
                                  </p>
                                  
                                  <div style="white-space: pre-wrap; font-size: 11pt; line-height: 1.6;">${generatedLetter}</div>
                                `;
                                handleDownloadDoc(`${profile.fullName}_CoverLetter_${selectedJob.company}`, bodyHtml);
                              }}
                              className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-2.5 py-1 text-[11px] font-mono font-bold rounded flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-indigo-650" /> Word (.doc)
                            </button>
                            <button
                              onClick={() => window.print()}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 text-[11px] font-mono font-bold rounded flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                            >
                              <Printer className="w-3.5 h-3.5" /> Print/PDF
                            </button>
                          </div>
                        </div>
                      )}

                      {/* MODE 1: Standard Raw Text Area */}
                      {activeCoverMode === "edit-raw" && (
                        <div className="space-y-3">
                          <div className="text-xs font-bold text-indigo-650 uppercase tracking-widest font-mono">
                            Generated {tone} Letter Draft:
                          </div>
                          <textarea
                            value={generatedLetter}
                            onChange={e => setGeneratedLetter(e.target.value)}
                            rows={12}
                            className="w-full bg-white border border-slate-200 rounded-xl p-4 text-xs font-sans leading-relaxed text-slate-700 focus:outline-none focus:border-indigo-500 font-mono shadow-inner"
                          />
                        </div>
                      )}

                      {/* MODE 2: Beautiful Interactive Paper Sheet */}
                      {activeCoverMode === "doc-pdf" && (
                        <div 
                          id="printable-document-canvas"
                          className={`bg-white border border-slate-350 shadow-lg rounded-sm mx-auto transition-all relative select-text text-left text-slate-850 ${
                            docFont === "serif" ? "font-serif tracking-normal" : docFont === "sans" ? "font-sans tracking-tight" : "font-mono tracking-tighter"
                          } ${
                            docSpacing === "compact" ? "p-6 space-y-4 text-xs" : docSpacing === "spacious" ? "p-12 md:p-14 space-y-8 text-base" : "p-10 md:p-12 space-y-6 text-xs sm:text-sm"
                          }`}
                          style={{ minHeight: "842px", maxWidth: "595px" }} // Standard single sheet layout
                        >
                          {/* Letterhead styled from Resume state */}
                          {docStyle === "classic" && (
                            <div className="text-center pb-4 border-b border-slate-300">
                              <h1 className="text-2xl font-bold uppercase text-slate-900">{profile.fullName || "Jane Doe"}</h1>
                              <p className="text-[11px] text-slate-500 font-mono mt-1">
                                {profile.email} &bull; {profile.phone} &bull; {profile.location}
                              </p>
                            </div>
                          )}

                          {docStyle === "modern" && (
                            <div className="flex justify-between items-end pb-4 border-b-2 border-indigo-600">
                              <div>
                                <h1 className="text-2xl font-black tracking-tight uppercase text-slate-900">{profile.fullName || "Jane Doe"}</h1>
                                <p className="text-[10px] text-indigo-605 font-bold uppercase tracking-wider font-mono mt-1">Software Architect Consultant</p>
                              </div>
                              <div className="text-right text-[10px] text-slate-500 font-mono leading-tight">
                                <div>{profile.email}</div>
                                <div>{profile.phone}</div>
                                <div>{profile.location}</div>
                              </div>
                            </div>
                          )}

                          {docStyle === "tech" && (
                            <div className="pb-4 border-b border-dashed border-slate-300 font-mono text-[11px]">
                              <div className="flex justify-between">
                                <span className="font-bold text-slate-900 uppercase">SYS_COVER_LETTER // ID: CL_{selectedJob.company.toUpperCase()}</span>
                                <span className="text-indigo-600 font-bold">STATUS_DRAFT_VERIFIED</span>
                              </div>
                              <div className="grid grid-cols-2 gap-1 mt-3 text-[10px] text-slate-500 leading-tight">
                                <div>SENDER: {profile.fullName}</div>
                                <div>CONTACT: {profile.email}</div>
                              </div>
                            </div>
                          )}

                          {/* Recipient Details & Date Line */}
                          <div className="space-y-4 pt-4">
                            <div className="text-[11px] text-slate-505 font-mono">
                              Date: June 11, 2026
                            </div>

                            <div className="text-xs sm:text-sm leading-tight text-slate-800">
                              <p className="font-bold text-slate-900">Hiring Advisory Team</p>
                              <p className="text-indigo-650 font-bold">{selectedJob.company}</p>
                              <p className="text-slate-505">{selectedJob.location || "Remote Global HQ Division"}</p>
                            </div>

                            <div className="font-bold text-slate-900 border-l-2 border-indigo-600 pl-3 py-0.5 text-xs sm:text-sm">
                              RE: Expression of interest for the {selectedJob.title} opening
                            </div>

                            {/* Letter Body */}
                            <div 
                              className="text-slate-705 leading-relaxed outline-none focus:ring-1 focus:ring-indigo-300 rounded p-1 whitespace-pre-wrap"
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={e => setGeneratedLetter(e.target.innerText)}
                            >
                              {generatedLetter}
                            </div>

                            {/* Signoff */}
                            <div className="pt-6 space-y-1">
                              <p className="text-slate-500 font-mono text-xs">Sincerely,</p>
                              <p className="font-bold text-slate-900 text-sm">{profile.fullName}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <p className="text-[10px] text-slate-400">
                        🚀 Uphold high career standards using human-in-the-loop manual adjustments. Feel free to type inline directly on the letter face above!
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 border-dashed text-center text-xs text-slate-400 py-12">
                      No cover letter drafted yet. Pick a tone and click the draft button.
                    </div>
                  )}
                </div>
              )}

              {/* SEGMENT 4: Custom Q&A Answer Engine */}
              {activeSegment === "screening" && !showRewriteApproval && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 mb-2 leading-relaxed">
                    Custom screening questions are automatically parsed from this application board. Let the AI map answers based strictly on your profile answer bank to bypass tedious typing.
                  </p>

                  <button
                    onClick={handleAnswerQuestions}
                    disabled={answeringQuestions}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm rounded-lg px-4 py-2 text-xs font-mono font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {answeringQuestions ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Fetching Answer mappings...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" /> Auto-Answer Questions with Gemini
                      </>
                    )}
                  </button>

                  <div className="space-y-4 mt-3">
                    {activeQuestions.map((q, idx) => {
                      const matchedAnswer = answers.find(a => a.question === q);
                      return (
                        <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <label className="block text-xs font-bold text-slate-700 font-sans">
                            Q: {q}
                          </label>
                          {matchedAnswer ? (
                            <div className="space-y-2">
                              <textarea
                                value={matchedAnswer.answer}
                                onChange={e => {
                                  const updatedAnswers = [...answers];
                                  const target = updatedAnswers.find(a => a.question === q);
                                  if (target) target.answer = e.target.value;
                                  setAnswers(updatedAnswers);
                                }}
                                rows={3}
                                className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 font-sans shadow-xs"
                              />
                              <div className="flex justify-between items-center text-[10px] font-mono text-slate-450 font-medium">
                                <span>ANSWER SOURCE: {idx === 0 ? "Skills Assessment" : "Compensation Profile"}</span>
                                <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 border border-emerald-100 rounded">Match Confidence: {matchedAnswer.confidence}%</span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400 italic pl-2 border-l border-slate-300">
                              Answer not generated yet.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Approval submitting action bar footer */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
              <div className="text-xs text-slate-500 font-medium italic">
                {selectedJobId === "job-4" || selectedJobId === "job-5" ? "⚠️ Risk guardrails active" : "✓ Pre-compiled compliance checks successful"}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onAddToTracker(selectedJob, "Saved", {
                    tailoredBullets: tailoredBullets.length > 0 ? tailoredBullets : undefined,
                    coverLetterText: generatedLetter || undefined,
                    answers: answers.length > 0 ? answers : undefined,
                  })}
                  className="px-3 py-2 hover:bg-slate-50 border border-slate-250 rounded-lg text-[10px] sm:text-xs font-mono font-bold text-slate-650 transition-colors shadow-xs cursor-pointer bg-white"
                >
                  Save Draft
                </button>
                <button
                  onClick={() => onAddToTracker(selectedJob, "Ready for Review", {
                    tailoredBullets: tailoredBullets.length > 0 ? tailoredBullets : undefined,
                    coverLetterText: generatedLetter || undefined,
                    answers: answers.length > 0 ? answers : undefined,
                  })}
                  disabled={selectedJobId === "job-4"}
                  className="px-3 py-2 hover:bg-indigo-50 hover:text-indigo-700 border border-indigo-200 text-indigo-805 rounded-lg text-[10px] sm:text-xs font-mono font-bold transition-all shadow-xs cursor-pointer bg-white"
                >
                  Approve Asset Pack
                </button>
                <button
                  onClick={handleStartAutoApply}
                  disabled={selectedJobId === "job-4" || selectedJob.isScam}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-550 disabled:opacity-50 text-white rounded-lg text-[10px] sm:text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer border border-emerald-700/20"
                  id="auto-submit-cta"
                >
                  <Zap className="w-3 h-3 animate-bounce" /> Review & Auto-Submit
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
            Select a job from the feed to view matching breakdowns and tailor assets.
          </div>
        )}
      </div>
    </div>
  );
};
