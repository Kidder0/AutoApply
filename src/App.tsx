import React, { useState, useEffect } from "react";
import { UserProfile, PreferenceWeights, JobItem, Application, AutomationRule, NotificationItem, AuditEvent, ApplicationStatus } from "./types";
import { mockJobs, defaultUserProfile, defaultPreferenceWeights } from "./data/mockJobs";
import { ProfileTab } from "./components/ProfileTab";
import { DiscoverTab } from "./components/DiscoverTab";
import { TrackerTab } from "./components/TrackerTab";
import { RulesTab } from "./components/RulesTab";
import { AdminTab } from "./components/AdminTab";

import { 
  Briefcase, Sliders, Settings2, BarChart2, ShieldAlert,
  Bell, User, List, Clock, Zap, Target, BookOpen, AlertOctagon, HelpCircle
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"profile" | "discover" | "tracker" | "rules" | "admin">("discover");
  
  // Application Data States
  const [profile, setProfile] = useState<UserProfile>(defaultUserProfile);
  const [weights, setWeights] = useState<PreferenceWeights>(defaultPreferenceWeights);
  const [jobs, setJobs] = useState<JobItem[]>(mockJobs);
  const [rules, setRules] = useState<AutomationRule>({
    maxDailyApplications: 10,
    maxWeeklyApplications: 50,
    minimumMatchScore: 85,
    applyOnlyToRemote: true,
    maxDaysAgoPosted: 7,
    requireApprovalForWrittenQuestions: true,
    pauseOnCaptcha: true,
    pauseOnConsecutiveFailures: 3,
    monthlyPerCompanyCap: 2,
    isAutomationEnabled: true
  });

  const [applications, setApplications] = useState<Application[]>([
    {
      id: "app-2",
      jobId: "job-2",
      status: "Saved",
      resumeVersion: "Creative Core v1",
      notes: "Saved to review if commute is viable. Will request more detail on benefits package.",
      answers: [],
      tailoredBullets: [],
      logs: [{ timestamp: new Date().toISOString(), status: "Saved", message: "Job bookmark manually saved by candidate." }],
      followUpReminders: [{ id: "rem-1", date: "2026-06-18", title: "Schedule commuter review", completed: false }]
    },
    {
      id: "app-3",
      jobId: "job-3",
      status: "Ready for Review",
      resumeVersion: "ATS Backend v2",
      coverLetterText: "Dear Hiring Team at Vercel,\n\nI am thrilled to express my target alignment for the Backend Developer position...",
      notes: "AI tailored bullet points completed. Ready for review. Questions answered with 95% confidence.",
      answers: [
        { question: "Explain your experience with Webpack vs Vite.", answer: "I have transitioned 3 critical corporate sites from legacy setups to clean modular Vite pools, improving hot reloads.", confidence: 95 }
      ],
      tailoredBullets: ["Configured highly reliable relational schemas, implementing robust caching filters to reduce data overhead."],
      logs: [
        { timestamp: new Date(Date.now() - 3600000).toISOString(), status: "Discovered", message: "Vercel Ashby feed parsed." },
        { timestamp: new Date().toISOString(), status: "Ready for Review", message: "AI personalize outputs finalized truthfully." }
      ],
      followUpReminders: []
    }
  ]);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "not-1",
      title: "Excellent Match Detected!",
      message: "Stripe Senior Full-Stack role calculated as 92% match against your active weights.",
      date: "Just now",
      read: false,
      type: "high-match"
    },
    {
      id: "not-2",
      title: "Manual Approval Requested",
      message: "Your application package for Anthropic is ready for human confirmation.",
      date: "5 mins ago",
      read: false,
      type: "approval-needed"
    }
  ]);

  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Sync logs with server on mount and during events
  const fetchLogs = async () => {
    try {
      const response = await fetch("/api/logs/compliance");
      const data = await response.json();
      if (data.logs) {
        setAuditLogs(data.logs);
      }
    } catch (err) {
      console.warn("Express server unavailable. Operating in local-mode simulation.", err);
    }
  };

  const triggerEventLog = async (action: string, details: string, status: "success" | "warning" | "error") => {
    try {
      const response = await fetch("/api/logs/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, details, status }),
      });
      const data = await response.json();
      fetchLogs();
    } catch (err) {
      // Fallback local memory log
      const newEvt: AuditEvent = {
        id: `evt-local-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        action,
        userId: "usr-default",
        details,
        status
      };
      setAuditLogs(prev => [newEvt, ...prev]);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs");
      const data = await response.json();
      if (data.jobs && data.jobs.length > 0) {
        setJobs(data.jobs);
      }
    } catch (err) {
      console.warn("Failed to load jobs from database, operating with defaults: ", err);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchJobs();
  }, []);

  // Action: Add a job to the Tracker Board (manual user review triggers)
  const handleAddToTracker = (job: JobItem, state: ApplicationStatus, options?: Partial<Application>) => {
    const exists = applications.find(a => a.jobId === job.id);
    if (exists) {
      // Move to next column
      setApplications(prev => prev.map(a => {
        if (a.jobId === job.id) {
          const updatedLogs = [...a.logs, { timestamp: new Date().toISOString(), status: state, message: `Status updated to: ${state}` }];
          return { ...a, status: state, logs: updatedLogs, ...options };
        }
        return a;
      }));
      triggerEventLog("CAMPAIGN_STATUS_PROMOTED", `Promoted application status for ${job.company} to: ${state}`, "success");
    } else {
      const newApp: Application = {
        id: `app-${Math.random().toString(36).substr(2, 9)}`,
        jobId: job.id,
        status: state,
        resumeVersion: "Default Master v1",
        notes: "Drafted via match workspaces.",
        answers: [],
        tailoredBullets: [],
        logs: [{ timestamp: new Date().toISOString(), status: state, message: `Application initialized as: ${state}` }],
        followUpReminders: [],
        ...options
      };
      setApplications(prev => [newApp, ...prev]);
      triggerEventLog("CAMPAIGN_SAVED", `Saved new application campaign to tracking board for ${job.company}`, "success");
    }

    // Insert alert notification
    const newNotif: NotificationItem = {
      id: `not-${Math.random().toString(36).substr(2, 9)}`,
      title: "Campaign Saved Successfully",
      message: `Your custom dossier for ${job.company} has been added to the tracker.`,
      date: "Just now",
      read: false,
      type: "success"
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Action: Update Campaign pipeline column status directly
  const handleUpdateStatus = (id: string, status: ApplicationStatus) => {
    setApplications(prev => prev.map(a => {
      if (a.id === id) {
        return {
          ...a,
          status: status,
          logs: [...a.logs, { timestamp: new Date().toISOString(), status: status, message: `Candidate promoted pipeline status to [${status}]` }]
        };
      }
      return a;
    }));
    triggerEventLog("CAMPAIGN_COL_MODIFIED", `Pipeline updated: App ID ${id} set to ${status}`, "success");
  };

  // Action: Commit custom narrative notes to detailed card
  const handleAddNote = (id: string, note: string) => {
    setApplications(prev => prev.map(a => {
      if (a.id === id) {
        return {
          ...a,
          notes: a.notes ? `${a.notes}\n• ${note}` : note
        };
      }
      return a;
    }));
  };

  // Action: Add Reminder timeline checks
  const handleAddReminder = (id: string, title: string, date: string) => {
    setApplications(prev => prev.map(a => {
      if (a.id === id) {
        return {
          ...a,
          followUpReminders: [
            ...a.followUpReminders,
            { id: `rem-${Math.random().toString(36).substr(2, 9)}`, date, title, completed: false }
          ]
        };
      }
      return a;
    }));
  };

  // Action: simulation response applied triggers
  const handleSimulationSubmission = (
    jobId: string, 
    status: "Pending Approval" | "Applied" | "Failed Submission", 
    logMsg: string,
    details?: Partial<Application>
  ) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    setApplications(prev => {
      const exists = prev.find(a => a.jobId === jobId);
      if (exists) {
        return prev.map(a => {
          if (a.jobId === jobId) {
            return {
              ...a,
              status: status,
              logs: [...a.logs, { timestamp: new Date().toISOString(), status: status, message: logMsg }],
              ...details
            };
          }
          return a;
        });
      } else {
        const newApp: Application = {
          id: `app-sim-${Math.random().toString(36).substr(2, 9)}`,
          jobId: jobId,
          status: status,
          resumeVersion: "Automated core-TS Profile v2",
          notes: "Derived via smart loops simulation assessment.",
          answers: [],
          tailoredBullets: [],
          logs: [{ timestamp: new Date().toISOString(), status: status, message: logMsg }],
          followUpReminders: [{ id: "rem-99", date: "2026-06-25", title: "Automated 7-day API check-in", completed: false }],
          ...details
        };
        return [newApp, ...prev];
      }
    });

    // Notify user
    const newNotif: NotificationItem = {
      id: `not-sim-${Math.random().toString(36).substr(2, 9)}`,
      title: `Automation Event: ${job.company}`,
      message: `The system completed assessment. Pipeline state is now: ${status}`,
      date: "Just now",
      read: false,
      type: status === "Applied" ? "success" : "approval-needed"
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Analytics Metrics calculations
  const totalSubmitted = applications.filter(a => a.status === "Applied").length;
  const totalDiscovered = jobs.length;
  const awaitingApproval = applications.filter(a => a.status === "Ready for Review").length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-500/20">
      
      {/* Premium Dashboard Header Grid */}
      <header className="border-b border-slate-200 bg-white px-6 py-3 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xs z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shadow-sm">
            <div className="w-4 h-4 bg-white rotate-45"></div>
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight text-slate-800 uppercase">
              Path<span className="text-indigo-600">finder</span>
            </span>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">AI Job discovery & compliance Engine</p>
          </div>
        </div>

        {/* Real-Time Context indicators */}
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-2.5 text-xs font-mono text-slate-500 border-r border-slate-200 pr-6">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>UTC: 2026-06-11 15:30</span>
            <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-bold uppercase tracking-wider">Assisted Mode</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications panel dropdown trigger */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-800 relative border border-slate-200"
              >
                <Bell className="w-4.5 h-4.5" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-600 rounded-full animate-ping"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-40 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">Recent System Logs</h4>
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
                    {notifications.map(not => (
                      <div key={not.id} className="text-xs pb-2 border-b border-slate-100 last:border-0 last:pb-0 space-y-1">
                        <div className="font-semibold text-slate-800 flex justify-between">
                          <span>{not.title}</span>
                          <span className="text-[9px] text-slate-400 font-mono">{not.date}</span>
                        </div>
                        <p className="text-slate-500 text-[11px] leading-relaxed">{not.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* active user details context block */}
            <div className="flex items-center gap-2.5 pl-4 border-l border-slate-200 text-xs">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-indigo-600 font-bold font-mono shadow-inner">
                J
              </div>
              <div className="hidden sm:block">
                <div className="font-semibold text-slate-700 font-sans">{profile.fullName}</div>
                <div className="text-[9px] font-mono text-slate-400">rrjammuladinne@gmail.com</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Framework Grid */}
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* Navigation Sidebar (3 cols relative size) */}
        <nav className="lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-4 shrink-0 flex flex-row lg:flex-col justify-between lg:justify-start gap-2">
          
          <div className="flex flex-row lg:flex-col gap-1 w-full lg:mb-8">
            <button
              onClick={() => setActiveTab("discover")}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-mono font-medium flex items-center gap-3 transition-all ${
                activeTab === "discover" ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/10" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Briefcase className="w-4 h-4 shrink-0" />
              <span>Discovery Feed</span>
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-mono font-medium flex items-center gap-3 transition-all ${
                activeTab === "profile" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              <span>Bio & Weights</span>
            </button>

            <button
              onClick={() => setActiveTab("tracker")}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-mono font-medium flex items-center gap-3 transition-all relative ${
                activeTab === "tracker" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <List className="w-4 h-4 shrink-0" />
              <span>Visual Pipeline</span>
              {awaitingApproval > 0 && (
                <span className="absolute right-3.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-bold font-mono">
                  {awaitingApproval}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("rules")}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-mono font-medium flex items-center gap-3 transition-all ${
                activeTab === "rules" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Settings2 className="w-4 h-4 shrink-0" />
              <span>Guardrail Rules</span>
            </button>

            <button
              onClick={() => setActiveTab("admin")}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-mono font-medium flex items-center gap-3 transition-all ${
                activeTab === "admin" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Admin Console</span>
            </button>
          </div>

          {/* Mini Sidebar Statistics */}
          <div className="hidden lg:block mt-auto p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs w-full">
            <h4 className="font-semibold text-slate-400 uppercase tracking-widest text-[9px] font-mono">My Campaign Metrics</h4>
            
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500">Discovered</span>
              <span className="font-semibold font-mono text-slate-800">{totalDiscovered} roles</span>
            </div>

            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500">Awaiting review</span>
              <span className="font-semibold font-mono text-indigo-600">{awaitingApproval} pkgs</span>
            </div>

            <div className="flex justify-between pb-1.5">
              <span className="text-slate-500">Successfully Applied</span>
              <span className="font-semibold font-mono text-emerald-600">{totalSubmitted} submitted</span>
            </div>
          </div>
        </nav>

        {/* Dynamic Viewport Container */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-50">
          {activeTab === "profile" && (
            <ProfileTab 
              profile={profile} 
              setProfile={setProfile} 
              weights={weights} 
              setWeights={setWeights} 
            />
          )}

          {activeTab === "discover" && (
            <DiscoverTab 
              jobs={jobs} 
              profile={profile} 
              weights={weights} 
              onAddToTracker={handleAddToTracker} 
              onUpdateProfile={setProfile}
              onRefreshJobs={fetchJobs}
            />
          )}

          {activeTab === "tracker" && (
            <TrackerTab 
              applications={applications} 
              jobs={jobs} 
              onUpdateStatus={handleUpdateStatus} 
              onAddNote={handleAddNote} 
              onAddReminder={handleAddReminder} 
            />
          )}

          {activeTab === "rules" && (
            <RulesTab 
              rules={rules} 
              setRules={setRules} 
              jobs={jobs} 
              profile={profile} 
              onSubmitSimulationApplied={handleSimulationSubmission} 
              triggerEventLog={triggerEventLog} 
            />
          )}

          {activeTab === "admin" && (
            <AdminTab 
              logs={auditLogs} 
              onRefreshLogs={fetchLogs} 
              triggerEventLog={triggerEventLog} 
            />
          )}
        </main>
      </div>
    </div>
  );
}
