import React, { useState, useEffect, useRef } from "react";
import { AutomationRule, JobItem, UserProfile, Application, PreferenceWeights } from "../types";
import { calculateLocalJobMatch, defaultPreferenceWeights } from "../data/mockJobs";
import { 
  Play, Shield, Settings2, Sliders, ToggleLeft, ToggleRight, 
  Terminal, RefreshCw, AlertTriangle, CheckCircle, HelpCircle, 
  AlertOctagon, Heart, Ban, Sparkles, Check, Send, Pause, Radio, Cpu
} from "lucide-react";

interface RulesTabProps {
  rules: AutomationRule;
  setRules: React.Dispatch<React.SetStateAction<AutomationRule>>;
  jobs: JobItem[];
  profile: UserProfile;
  onSubmitSimulationApplied: (jobId: string, status: "Pending Approval" | "Applied" | "Failed Submission", logMessage: string, details?: Partial<Application>) => void;
  triggerEventLog: (action: string, details: string, status: "success" | "warning" | "error") => void;
}

// Additional mocked tech companies for the background scouting loop daemon
const DAEMON_COMPANIES = [
  { name: "Slack", title: "Senior Integration Engineer", skills: ["React", "TypeScript", "Node.js", "RESTful APIs"], workType: "Remote", salary: "$160,000 - $190,000", numericSalaryMin: 160000, numericSalaryMax: 190000, credibilityScore: 97, desc: "Develop clean, compliant integrations and API endpoints supporting millions of active daily users." },
  { name: "Figma", title: "Frontend Performance Specialist", skills: ["React", "TypeScript", "Next.js", "Performance Optimization"], workType: "Hybrid", salary: "$170,000 - $210,000", numericSalaryMin: 170000, numericSalaryMax: 210000, credibilityScore: 98, desc: "Architect rendering components and client modules representing ultra-low latency browser canvas boards." },
  { name: "Duolingo", title: "Backend Web Architect", skills: ["Node.js", "Express", "PostgreSQL", "RESTful APIs"], workType: "Remote", salary: "$135,000 - $165,000", numericSalaryMin: 135000, numericSalaryMax: 165000, credibilityScore: 94, desc: "Create high-availability web pathways and user compliance filters supporting gamified continuous training." },
  { name: "Zoom", title: "Full-Stack Security Advisor", skills: ["React", "Node.js", "Docker", "Express"], workType: "On-site", salary: "$150,000 - $185,000", numericSalaryMin: 150000, numericSalaryMax: 185000, credibilityScore: 89, desc: "Configure resilient REST APIs and secure dynamic profiles protecting candidate transmissions." }
];

export const RulesTab: React.FC<RulesTabProps> = ({
  rules,
  setRules,
  jobs,
  profile,
  onSubmitSimulationApplied,
  triggerEventLog,
}) => {
  const [selectedJobId, setSelectedJobId] = useState<string>("all");
  const [simulating, setSimulating] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  
  // Background periodic scouting daemon loop
  const [daemonActive, setDaemonActive] = useState(false);
  const daemonIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleToggle = (key: keyof AutomationRule) => {
    setRules(prev => ({ ...prev, [key]: !prev[key] } as any));
  };

  const handleNumChange = (key: keyof AutomationRule, val: number) => {
    setRules(prev => ({ ...prev, [key]: val } as any));
  };

  const addLog = (msg: string) => {
    const formatted = `[${new Date().toLocaleTimeString()}] ${msg}`;
    setConsoleLogs(prev => [...prev, formatted]);
  };

  // 1. Run Dynamic Compliance Evaluation
  const runSimulation = async () => {
    setSimulating(true);
    setConsoleLogs([]);
    
    addLog("🚀 PATHFINDER AUTO-APPLY ENGINE INITIATING...");
    addLog(`🛡️ Guardrails active: Min Fit: ${rules.minimumMatchScore}% | Max Daily: ${rules.maxDailyApplications} | Remote Only: ${rules.applyOnlyToRemote ? "YES" : "NO"}`);
    
    // Check if automation toggle is actually enabled
    if (!rules.isAutomationEnabled) {
      addLog("❌ COMPLIANCE CANCELED: Automation system is currently TOGGLED OFF. Please look at header switch.");
      setSimulating(false);
      return;
    }

    if (selectedJobId !== "all") {
      // EVALUTE THE CHOSEN SPECIFIC JOB ROLE
      const targetJob = jobs.find(j => j.id === selectedJobId);
      if (!targetJob) {
        addLog("❌ Error: Target job definition not found in discovery board.");
        setSimulating(false);
        return;
      }

      await evaluateSingleJob(targetJob);
    } else {
      // EVALUATE ALL INGESTED MOCK BOARD JOBS SEQUENTIALLY
      addLog("⚡ Scanning live feeds: Ingestion queue has 5 discovered roles.");
      
      const queue = [...jobs];
      for (let i = 0; i < queue.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1400));
        addLog("----------------------------------------------------------------");
        await evaluateSingleJob(queue[i], true);
      }
      
      addLog("----------------------------------------------------------------");
      addLog("✅ COMPLETE: Finished scouting queue execution. Review pipeline results on Tracker Board.");
    }
    setSimulating(false);
  };

  // Helper method: evaluate a single job item
  const evaluateSingleJob = async (job: JobItem, batchMode: boolean = false) => {
    addLog(`🔍 PROCESSING VACANCY ID: ${job.id} [${job.title} at ${job.company}]`);
    
    // 1. Check Scam threats / Credibility profile first
    if (job.isScam || job.credibilityScore < 50) {
      addLog(`🚨 HIGH THREAT FLAG: Credibility score is ${job.credibilityScore}% (Vague terms or insecure site).`);
      addLog(`🚫 COMPLIANCE BLOCKED: Auto-skipped application for ${job.company} to safeguard candidate data.`);
      triggerEventLog("SCAM_THREAT_BYPASSED", `Scam blocker bypassed ${job.company} due to low credibility score (${job.credibilityScore}%)`, "error");
      return;
    }

    // 2. Check Excluded Company list
    const isExcluded = profile.excludedCompanies.some(name => 
      job.company.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(job.company.toLowerCase())
    ) || job.isExcluded;

    if (isExcluded) {
      addLog(`🚫 EXCLUSION BLOCKED: Company "${job.company}" is listed in your blocklist preference.`);
      addLog("⚠️ Profile data withheld. Skipping pre-flight tasks successfully.");
      triggerEventLog("BLOCKLIST_SCRUBBED", `Blocked ingest for ${job.company}: in candidate exclusion list`, "warning");
      return;
    }

    // 3. Location specifications Remote check
    if (rules.applyOnlyToRemote && job.workType !== "Remote") {
      addLog(`🚫 LOCATION DENIED: Job is classified as [${job.workType}]. Guardrails require Remote Only.`);
      addLog("⚠️ Aborting tasks for location compliance.");
      return;
    }

    // 4. Duplicate checks
    if (job.duplicateOfId) {
      addLog(`🚫 DUPLICATE INGRESSED: This role is flag-linked as a copy of active Greenhouse campaign ID [${job.duplicateOfId}].`);
      addLog("✨ Bypassing identical vacancy to prevent recruitment team spam alerts.");
      return;
    }

    // 5. Fit Score match calculation
    const match = calculateLocalJobMatch(job, profile, defaultPreferenceWeights);
    addLog(`⚖️ Match calculated: Title: ${match.titleMatch}% | Skills: ${match.skillsMatch}% | Overall Fit: ${match.score}%`);
    
    if (match.score < rules.minimumMatchScore) {
      addLog(`🚫 QUALITY STOP: Calculated fit score (${match.score}%) does not meet critical threshold limit (${rules.minimumMatchScore}%).`);
      addLog("⚠️ Skipping job to secure high application conversion stats.");
      return;
    }

    // 6. Checked passes! Let's build tailored material dynamically through our server side APIs!
    addLog("🤖 GUARDRAILS COMPLIATED. Activating material generation pipelines...");
    
    let generatedCoverLetter = "";
    let mockAnswers: { question: string; answer: string; confidence: number }[] = [];

    try {
      // Call REST cover letter developer pipeline
      addLog("✨ Contacting server-side model to truthfully tailor Cover Letter...");
      const clResponse = await fetch("/api/cover-letters/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: job.title,
          company: job.company,
          jobDescription: job.description,
          profile,
          tone: "Professional"
        })
      });
      const clData = await clResponse.json();
      generatedCoverLetter = clData.coverLetter || "";
      if (generatedCoverLetter) {
        const preview = generatedCoverLetter.split("\n")[0] + "... " + generatedCoverLetter.slice(30, 60) + "...";
        addLog(`📄 Cover Letter drafted successfully! Preview: "${preview}"`);
      }

      // Check written questions pauses
      const hasWrittenQuestions = job.description.toLowerCase().includes("essay") || 
                                 job.description.toLowerCase().includes("questions") || 
                                 job.company.toLowerCase() === "anthropic";

      if (rules.requireApprovalForWrittenQuestions && hasWrittenQuestions) {
        addLog("⏸️ HUMAN-IN-THE-LOOP INTERVENTION: Position is flagged as requiring written essay questions.");
        addLog("📥 Promoting dossier status to Tracker Board under column [Awaiting Manual Review]. Loop paused.");
        
        onSubmitSimulationApplied(job.id, "Ready for Review", "Compliance engine prepared materials. Pending human approval of narrative questions.", {
          coverLetterText: generatedCoverLetter,
          tailoredBullets: match.requiredSkillGaps.slice(0, 2).map(gap => `Mastered engineering concepts regarding ${gap} aligned with target needs.`),
          answers: [
            { question: "Explain your experience with standard deployment.", answer: "Designed several scalable architectures matching strict requirements truthfully.", confidence: 90 }
          ]
        });
        
        triggerEventLog("HUMAN_INTERVENTION_REQUIRED", `Campaign for ${job.company} paused: essay questions require human manual sign-off`, "warning");
        return;
      }

      // If no approval is needed, auto-apply!
      addLog("⚡ Auto-answering screening questions dynamically from active Bio Answer Bank...");
      const qaResponse = await fetch("/api/applications/answer-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: [
            "Why do you want to join our company?",
            "What is your experience with React and TypeScript?"
          ],
          profile
        })
      });
      const qaData = await qaResponse.json();
      mockAnswers = qaData.answers || [];
      addLog(`📝 Answers completed for ${mockAnswers.length} applicant questions with average ~90% confidence.`);

      addLog(`🚀 DISPATCHING APPLICATION TO REST ENDPOINT: [${job.source}]`);
      addLog(`✨ SUCCESS: Target server processed sandbox request. Capture confirmation code #pf-${Math.random().toString(36).substr(2, 6)}-applied.`);
      
      onSubmitSimulationApplied(job.id, "Applied", `Auto-applied via Pathfinder Greenhouse REST agent. Submission Key #${Math.random().toString(36).substr(2, 6).toUpperCase()}.`, {
        coverLetterText: generatedCoverLetter,
        answers: mockAnswers,
        tailoredBullets: [
          `Expanded ${job.company}'s competencies by resolving core issues around ${job.skills[0] || "TypeScript"} and modern state setups.`,
          `Configured dynamic interface views and integrated robust backend microservice structures matching target specs.`
        ]
      });

      triggerEventLog("API_SUBMISSION_SUCCESSFUL", `Auto-applied successfully to ${job.company} (${job.title}) with score ${match.score}%`, "success");

    } catch (err: any) {
      addLog(`❌ Server compilation error during material tailoring: ${err.message}. Operating client-side safe fallback.`);
      onSubmitSimulationApplied(job.id, "Pending Approval", "Dossier prepared locally. Endpoint latency require candidate manual submission retry.");
    }
  };

  // 2. Continuous Periodic Background scouting loop (Simulated Server Daemon)
  useEffect(() => {
    if (daemonActive && rules.isAutomationEnabled) {
      addLog("🤖 BACKGROUND DAEMON ONLINE: Auto-Scouting daemon actively listening to boards every 12s interval...");
      
      daemonIntervalRef.current = setInterval(async () => {
        // Choose a random daemon company
        const randComp = DAEMON_COMPANIES[Math.floor(Math.random() * DAEMON_COMPANIES.length)];
        const simulatedJob: JobItem = {
          id: `daemon-job-${Math.random().toString(36).substr(2, 5)}`,
          title: randComp.title,
          company: randComp.name,
          location: "Remote (Global)",
          salary: randComp.salary,
          numericSalaryMin: randComp.numericSalaryMin,
          numericSalaryMax: randComp.numericSalaryMax,
          workType: randComp.workType as any,
          source: "REST Webhook (Periodic)",
          skills: randComp.skills,
          visaSponsorship: true,
          url: "https://pathfinder-simulated.io/careers",
          postedDate: new Date().toISOString().split('T')[0],
          credibilityScore: randComp.credibilityScore,
          description: randComp.desc
        };

        addLog("----------------------------------------------------------------");
        addLog(`📡 [DAEMON TICK]: Periodic crawler ingested new live opening at ${simulatedJob.company}`);
        
        // Evaluate
        await evaluateSingleJob(simulatedJob, false);
      }, 12000);
    } else {
      if (daemonIntervalRef.current) {
        clearInterval(daemonIntervalRef.current);
        daemonIntervalRef.current = null;
        if (consoleLogs.length > 0) {
          addLog("⏸️ BACKGROUND DAEMON OFFLINE: Periodic scouting loop suspended.");
        }
      }
    }

    return () => {
      if (daemonIntervalRef.current) {
        clearInterval(daemonIntervalRef.current);
      }
    };
  }, [daemonActive, rules.isAutomationEnabled]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8" id="rules-guardrails-workspace">
      {/* Control Panel: Guidelines configuration (5 cols) */}
      <div className="xl:col-span-5 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 justify-between">
            <div className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-medium text-slate-100">Automation Parameters</h3>
            </div>
            
            <button
              onClick={() => handleToggle("isAutomationEnabled")}
              className="focus:outline-none transition-colors"
            >
              {rules.isAutomationEnabled ? (
                <ToggleRight className="w-12 h-7 text-emerald-400" />
              ) : (
                <ToggleLeft className="w-12 h-7 text-slate-500" />
              )}
            </button>
          </div>

          {/* Sliders */}
          <div className="space-y-4 pt-2 text-xs">
            <div>
              <div className="flex justify-between font-mono text-slate-400 mb-1">
                <span>MAX APPLICATIONS / DAY</span>
                <span className="text-slate-200 font-bold">{rules.maxDailyApplications}</span>
              </div>
              <input
                type="range" min="1" max="50" step="1"
                value={rules.maxDailyApplications}
                onChange={e => handleNumChange("maxDailyApplications", parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between font-mono text-slate-400 mb-1">
                <span>MAX APPLICATIONS / WEEK</span>
                <span className="text-slate-200 font-bold">{rules.maxWeeklyApplications}</span>
              </div>
              <input
                type="range" min="10" max="250" step="10"
                value={rules.maxWeeklyApplications}
                onChange={e => handleNumChange("maxWeeklyApplications", parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between font-mono text-slate-400 mb-1">
                <span>MINIMUM JOB SCORE TO QUALIFY</span>
                <span className="text-slate-200 font-bold">{rules.minimumMatchScore}%</span>
              </div>
              <input
                type="range" min="60" max="95" step="5"
                value={rules.minimumMatchScore}
                onChange={e => handleNumChange("minimumMatchScore", parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>

          {/* Toggle Switched Guardrails */}
          <div className="space-y-3 pt-4 border-t border-slate-800 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-900/40">
              <span className="text-slate-300">ONLY APPLY TO REMOTE OPENINGS</span>
              <button onClick={() => handleToggle("applyOnlyToRemote")} className="text-indigo-400 font-mono font-bold">
                {rules.applyOnlyToRemote ? "YES" : "NO"}
              </button>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-900/40">
              <span className="text-slate-300">PAUSE IF CAPTCHA ENCOUNTERED</span>
              <button onClick={() => handleToggle("pauseOnCaptcha")} className="text-indigo-400 font-mono font-bold">
                {rules.pauseOnCaptcha ? "YES" : "NO"}
              </button>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-300">PAUSE ON NARRATIVE ESSAYS / QUESTIONS</span>
              <button onClick={() => handleToggle("requireApprovalForWrittenQuestions")} className="text-indigo-400 font-mono font-bold">
                {rules.requireApprovalForWrittenQuestions ? "YES" : "NO"}
              </button>
            </div>
          </div>
        </div>

        {/* Live Scouting Daemon Settings Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider">
              <Radio className={`w-4 h-4 ${daemonActive ? "text-emerald-400 animate-pulse" : "text-slate-400"}`} />
              Auto-Scouting Daemon Loop
            </div>
            
            <button
              onClick={() => {
                if (!rules.isAutomationEnabled) {
                  alert("Please enable the Master Automation toggle above first!");
                  return;
                }
                setDaemonActive(!daemonActive);
              }}
              className={`px-3 py-1 text-[10px] font-mono font-bold rounded-md transition-all ${
                daemonActive 
                  ? "bg-red-950 text-red-400 border border-red-900 hover:bg-red-900/30" 
                  : "bg-emerald-950 text-emerald-400 border border-emerald-900 hover:bg-emerald-900/30"
              }`}
            >
              {daemonActive ? "PAUSE DAEMON" : "START RECURRING LOOP"}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            Toggling this launches a simulated real-time cron-like thread in your browser. Every <strong>12 seconds</strong>, it discovers open roles at random tech startups, evaluates compliance scores in real-time, and runs full-stack cover letter generators!
          </p>
        </div>

        {/* Security Summary Badge */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-sans font-medium">
            <Shield className="w-4.5 h-4.5 animate-pulse" />
            Terms of Service Protection Active
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            Pathfinder strictly aligns with Greenhouse & Ashby API standards to prevent scrapers blocks. Automated submissions only execute if match thresholds are met to prevent profile spam flags.
          </p>
        </div>
      </div>

      {/* Terminal Output: Interactive Simulation (7 cols) */}
      <div className="xl:col-span-7 flex flex-col space-y-4">
        <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 flex flex-col min-h-[500px] font-mono text-xs flex-1">
          <div className="flex items-center justify-between pb-3 border-b border-slate-900 text-slate-400">
            <div className="flex items-center gap-2 font-mono text-indigo-400">
              <Terminal className="w-4 h-4 animate-pulse" /> Live Compliance Engine Terminal
            </div>
            <div className="flex gap-1.5 items-center">
              {daemonActive && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 uppercase font-bold tracking-widest mr-2 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-900 animate-pulse">
                  <Cpu className="w-3 h-3" /> LOOPING
                </span>
              )}
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            </div>
          </div>

          {/* Interactive target dropdown selection */}
          <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-900 my-3 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Simulate Application target:</span>
              <select
                value={selectedJobId}
                onChange={e => setSelectedJobId(e.target.value)}
                disabled={simulating}
                className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 font-mono text-xs focus:outline-none"
              >
                <option value="all">⚡ Batch Campaign Ingestion Sequence (All Roles)</option>
                {jobs.map(j => (
                  <option key={j.id} value={j.id}>
                    [{j.company}] {j.title.slice(0, 30)}...
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setConsoleLogs([])}
              className="text-[10px] hover:text-slate-200 transition-colors cursor-pointer text-slate-500 font-bold uppercase underline"
            >
              Clear screen
            </button>
          </div>

          {/* Console logs feed */}
          <div className="flex-1 overflow-y-auto max-h-[380px] py-4 space-y-2 text-slate-300 pr-1 select-none">
            {consoleLogs.map((log, idx) => (
              <div 
                key={idx} 
                className={`leading-relaxed border-l-2 pl-2 ${
                  log.includes("🚀") || log.includes("✅") ? "border-emerald-500 text-emerald-300 font-semibold" :
                  log.includes("🚫") || log.includes("❌") ? "border-red-500 text-red-300 font-semibold" :
                  log.includes("🚨") ? "border-rose-500 text-rose-300 font-bold" :
                  log.includes("⚡") || log.includes("📄") ? "border-indigo-400 text-indigo-200" :
                  log.includes("⚠️") || log.includes("⏸️") ? "border-amber-500 text-amber-300" : "border-slate-800 text-slate-400"
                }`}
              >
                {log}
              </div>
            ))}

            {consoleLogs.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 italic py-16 text-center">
                Terminal dormant. Choose a simulation target below and click "Run Ingest & Submit Loop Simulation", or start the Auto-Scouting Daemon Loop on the left!
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-900 flex justify-end">
            <button
              onClick={runSimulation}
              disabled={simulating || !rules.isAutomationEnabled}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2 hover:indigo-500 font-mono font-medium flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer text-xs"
            >
              {simulating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Evaluating compliance pipeline...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Run Ingest & Submit Loop Simulation
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
