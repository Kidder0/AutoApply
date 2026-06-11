import React, { useState } from "react";
import { Application, JobItem, ApplicationStatus } from "../types";
import { 
  Clipboard, Calendar, ArrowRight, Eye, RefreshCw, CheckCircle, 
  AlertTriangle, FileText, XCircle, Plus, Trash2, CalendarCheck, Clock, Check
} from "lucide-react";

interface TrackerTabProps {
  applications: Application[];
  jobs: JobItem[];
  onUpdateStatus: (id: string, status: ApplicationStatus) => void;
  onAddNote: (id: string, note: string) => void;
  onAddReminder: (id: string, title: string, date: string) => void;
}

export const TrackerTab: React.FC<TrackerTabProps> = ({
  applications,
  jobs,
  onUpdateStatus,
  onAddNote,
  onAddReminder,
}) => {
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderDate, setReminderDate] = useState("");

  const selectedApp = applications.find(a => a.id === selectedAppId);
  const selectedJob = selectedApp ? jobs.find(j => j.id === selectedApp.jobId) : null;

  const columns: { label: string; status: ApplicationStatus; color: string }[] = [
    { label: "Bookmarked Drafts", status: "Saved", color: "border-slate-800 bg-slate-950/20 text-slate-400" },
    { label: "Awaiting Manual Review", status: "Ready for Review", color: "border-indigo-900/40 bg-indigo-950/10 text-indigo-400" },
    { label: "Pending API Submission", status: "Pending Approval", color: "border-amber-900/40 bg-amber-950/10 text-amber-500" },
    { label: "Submitted / Applied", status: "Applied", color: "border-emerald-900/40 bg-emerald-950/10 text-emerald-400" },
    { label: "Interviews Scheduled", status: "Interview Scheduled", color: "border-purple-900/40 bg-purple-950/10 text-purple-400" },
  ];

  const handleUpdateStatusLocal = (status: ApplicationStatus) => {
    if (selectedApp) {
      onUpdateStatus(selectedApp.id, status);
    }
  };

  return (
    <div className="space-y-6" id="job-tracker-workspace">
      {/* Search and Columns Layout */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h2 className="text-lg font-semibold text-slate-100 font-sans">Visual Application Pipeline</h2>
        <span className="text-xs font-mono text-slate-400">
          Double-click cards or tap "Dossier" to view personalization packages
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {columns.map(col => {
          const filteredApps = applications.filter(a => a.status === col.status);
          return (
            <div key={col.status} className="flex flex-col min-w-[200px] bg-slate-950/60 border border-slate-900 rounded-xl p-4 min-h-[500px]">
              <div className={`p-2.5 border rounded-lg text-xs font-semibold uppercase tracking-wider font-mono text-center mb-4 ${col.color}`}>
                {col.label} ({filteredApps.length})
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto max-h-[480px] pr-1">
                {filteredApps.map(app => {
                  const job = jobs.find(j => j.id === app.jobId);
                  if (!job) return null;

                  return (
                    <div 
                      key={app.id}
                      onClick={() => setSelectedAppId(app.id)}
                      className={`p-3 bg-slate-900 hover:bg-slate-900/80 border p-3 border-slate-850 rounded-lg cursor-pointer transition-all ${
                        selectedAppId === app.id ? "border-indigo-500/80 ring-1 ring-indigo-500/10" : "border-slate-800"
                      }`}
                    >
                      <h4 className="font-semibold text-slate-200 text-xs truncate leading-snug">{job.title}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{job.company}</p>
                      
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-3 pt-2 border-t border-slate-850">
                        <span>Source: {job.source.split(" ")[0]}</span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Eye className="w-3 h-3 text-indigo-400" /> Dossier
                        </span>
                      </div>
                    </div>
                  );
                })}

                {filteredApps.length === 0 && (
                  <div className="text-center py-12 text-xs text-slate-600 italic border border-dashed border-slate-900 rounded-lg">
                    Empty column
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Campaign Dossier (Human-in-the-loop review panel) */}
      {selectedApp && selectedJob && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm grid grid-cols-1 xl:grid-cols-12 gap-8 mt-6">
          {/* Col 1: Job Spec & Action status details (4 cols) */}
          <div className="xl:col-span-4 space-y-6">
            <div className="pb-3 border-b border-slate-800">
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block mb-1">Active Dossier details</span>
              <h3 className="text-lg font-bold text-slate-100 font-sans leading-snug">{selectedJob.title}</h3>
              <p className="text-xs text-slate-400 mt-1 font-mono">{selectedJob.company} — {selectedJob.location}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono text-slate-400">PROMOTE APPLICATION STATUS</label>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {(["Saved", "Ready for Review", "Pending Approval", "Applied", "Interview Scheduled"] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => onUpdateStatus(selectedApp.id, st)}
                    className={`px-2.5 py-1.5 border rounded-md text-left transition-colors truncate ${
                      selectedApp.status === st
                        ? "bg-indigo-600 border-indigo-500 text-white font-semibold"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Campaign Logs and Milestones */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-300 font-mono tracking-wider uppercase">Compliance History Track</div>
              <div className="space-y-2 bg-slate-950 p-3.5 rounded-lg border border-slate-800 max-h-[140px] overflow-y-auto">
                {selectedApp.logs.map((log, idx) => (
                  <div key={idx} className="text-[10px] font-mono leading-relaxed pb-2 border-b border-slate-900/50 last:border-0 last:pb-0">
                    <span className="text-indigo-400">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{" "}
                    <span className="text-slate-300">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Follow-up Reminders */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 font-mono uppercase">Follow-up Reminders</span>
                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-indigo-400" /> Active</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
                {selectedApp.followUpReminders.map(rem => (
                  <div key={rem.id} className="text-xs bg-slate-900 p-2 rounded border border-slate-800 flex justify-between items-center font-sans text-slate-300">
                    <div>
                      <div className="font-semibold text-xs">{rem.title}</div>
                      <div className="text-[9px] font-mono text-slate-500">{rem.date}</div>
                    </div>
                    {rem.completed ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <span className="text-[9px] font-mono bg-indigo-950 text-indigo-300 rounded px-1.5 py-0.5">Active</span>
                    )}
                  </div>
                ))}

                {/* Add new reminder form */}
                <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-900">
                  <input
                    type="text"
                    placeholder="Reminder title..."
                    value={reminderTitle}
                    onChange={e => setReminderTitle(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200"
                  />
                  <input
                    type="date"
                    value={reminderDate}
                    onChange={e => setReminderDate(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200 font-mono"
                  />
                  <button
                    onClick={() => {
                      if (reminderTitle && reminderDate) {
                        onAddReminder(selectedApp.id, reminderTitle, reminderDate);
                        setReminderTitle("");
                        setReminderDate("");
                      }
                    }}
                    className="col-span-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-mono"
                  >
                    + Add New Timeline Reminder
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Col 2: AI Personalization artifacts (8 cols) */}
          <div className="xl:col-span-8 space-y-6">
            <h3 className="text-sm font-semibold text-slate-300 font-mono uppercase pb-2 border-b border-slate-800 flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-indigo-400" /> Application Package Dossier
            </h3>

            {/* Resume optimization status */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400 font-mono">1. TAILORED EXPERIENCE DRAFT BULLETS</div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                {selectedApp.tailoredBullets && selectedApp.tailoredBullets.length > 0 ? (
                  <ul className="space-y-2 text-xs list-disc list-inside text-slate-300 font-sans leading-relaxed">
                    {selectedApp.tailoredBullets.map((bullet, i) => (
                      <li key={i} className="pl-1">
                        <span className="text-indigo-400 font-bold mr-1">•</span>{bullet}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 italic block py-4 text-center">
                    No custom tailored resume bullets designed for this campaign. Original general biography resume selected.
                  </p>
                )}
              </div>
            </div>

            {/* Custom Cover letter */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400 font-mono">2. COMPILATION COVER LETTER</div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                {selectedApp.coverLetterText ? (
                  <pre className="whitespace-pre-wrap font-sans text-slate-300 leading-relaxed max-h-[220px] overflow-y-auto">
                    {selectedApp.coverLetterText}
                  </pre>
                ) : (
                  <p className="text-xs text-slate-500 italic block py-4 text-center">
                    No custom cover letter drafted. Standard referral rules apply.
                  </p>
                )}
              </div>
            </div>

            {/* screening custom answer matches */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400 font-mono">3. ATS SCREENING QUESTIONS RESPONSES</div>
              <div className="space-y-3">
                {selectedApp.answers && selectedApp.answers.length > 0 ? (
                  selectedApp.answers.map((item, idx) => (
                    <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <div className="font-semibold text-xs text-slate-300">Q: {item.question}</div>
                      <p className="text-xs text-slate-400 mt-1.5 pl-3 border-l border-indigo-500/40">{item.answer}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic block py-2 text-center bg-slate-950 rounded-xl border border-slate-800">
                    No screening questions configured for this application workspace.
                  </p>
                )}
              </div>
            </div>

            {/* Candidate Logs and Notes */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400 font-mono">4. CAMPAIGN NOTES</div>
              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[120px] overflow-y-auto">
                  {selectedApp.notes || "No notes committed yet. Type below to document recruiter emails, follow-ups, or notes."}
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-900">
                  <input
                    type="text"
                    placeholder="Document call notes, key contacts, or interview schedules..."
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && noteText) {
                        onAddNote(selectedApp.id, noteText);
                        setNoteText("");
                      }
                    }}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (noteText) {
                        onAddNote(selectedApp.id, noteText);
                        setNoteText("");
                      }
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded px-4 py-1.5 text-xs font-mono font-medium"
                  >
                    Commit Note
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
