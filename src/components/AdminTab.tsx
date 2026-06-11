import React, { useState, useEffect } from "react";
import { AuditEvent } from "../types";
import { 
  ShieldAlert, RefreshCw, Activity, CheckCircle, Flame, 
  Trash2, Database, Key, Server, ToggleLeft, ToggleRight, Radio, Link2
} from "lucide-react";

interface AdminTabProps {
  logs: AuditEvent[];
  onRefreshLogs: () => void;
  triggerEventLog: (action: string, details: string, status: "success" | "warning" | "error") => void;
}

export const AdminTab: React.FC<AdminTabProps> = ({ logs, onRefreshLogs, triggerEventLog }) => {
  const [sources, setSources] = useState([
    { id: "src-1", name: "Greenhouse API Connector (Official)", type: "API", enabled: true, rate: "30 req / min" },
    { id: "src-2", name: "Lever Board Integration (Official Partner)", type: "REST Webhook", enabled: true, rate: "20 req / min" },
    { id: "src-3", name: "Ashby API Client", type: "API", enabled: true, rate: "15 req / min" },
    { id: "src-4", name: "Indeed/LinkedIn Non-API Scraping (Custom Crawler)", type: "Scrape/RISK", enabled: false, rate: "Risk of block / ToS Violation" }
  ]);

  const [loading, setLoading] = useState(false);

  const toggleSource = (id: string, name: string) => {
    setSources(prev => prev.map(s => {
      if (s.id === id) {
        const nextState = !s.enabled;
        triggerEventLog(
          "CONNECTOR_STATUS_MODIFIED",
          `Admin toggled connector "${name}" to ${nextState ? "ENABLED" : "DISABLED"} for ToS or compliance policy alignment.`,
          nextState ? "success" : "warning"
        );
        return { ...s, enabled: nextState };
      }
      return s;
    }));
  };

  const handleRefresh = async () => {
    setLoading(true);
    setTimeout(() => {
      onRefreshLogs();
      setLoading(false);
    }, 600);
  };

  return (
    <div className="space-y-8" id="admin-observability-workspace">
      {/* Metric Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono">ENCRYPTION ENGINE</span>
            <Activity className="w-4.5 h-4.5 text-indigo-400 animate-pulse" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">AES-256 GCM</div>
          <p className="text-[10px] text-slate-500 font-sans">Profile data, credentials, and answers encrypted at rest.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono">INTEGRATION HEALTH</span>
            <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">3 / 4 ONLINE</div>
          <p className="text-[10px] text-slate-500 font-sans">LinkedIn direct crawler disabled automatically to prevent ToS risk.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono">DEDUPLICATION RATE</span>
            <Database className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">14.3% BLOCKED</div>
          <p className="text-[10px] text-slate-500 font-sans">Ingestion filters comparing title + raw descriptions for overlaps.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono">AI CONTEXT CLOCK</span>
            <Key className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">0.02s LATENCY</div>
          <p className="text-[10px] text-slate-500 font-sans">Server-side cache responding to API profile requests.</p>
        </div>
      </div>

      {/* Main interactive area: job connectors and live logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Source connectors controls (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Server className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-medium text-slate-100">Job Board Integrations</h3>
          </div>
          <p className="text-xs text-slate-400 mb-2">
            Admins have total authority to shut down crawler vectors that trigger CAPTCHAs, bot trackers or violate platform guidelines.
          </p>

          <div className="space-y-3 pt-2">
            {sources.map(src => (
              <div key={src.id} className="p-3 bg-slate-950 border border-slate-900 rounded-lg flex justify-between items-center text-xs">
                <div>
                  <div className="font-semibold text-slate-200">{src.name}</div>
                  <div className="text-[10px] font-mono text-slate-500">{src.type} | Rate Limit: {src.rate}</div>
                </div>
                <button
                  onClick={() => toggleSource(src.id, src.name)}
                  className="focus:outline-none"
                >
                  {src.enabled ? (
                    <ToggleRight className="w-10 h-6 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-10 h-6 text-slate-600" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Live log stream (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-medium text-slate-100">Active Compliance Log (Security Trail)</h3>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-1.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {logs.map(log => {
              let tagColor = "border-emerald-950/40 bg-emerald-950/20 text-emerald-400";
              if (log.status === "warning") tagColor = "border-amber-950/40 bg-amber-950/20 text-amber-500";
              else if (log.status === "error") tagColor = "border-red-950/40 bg-red-950/20 text-red-500";

              return (
                <div key={log.id} className="p-3 bg-slate-950 border border-slate-900 rounded-lg space-y-1.5 font-mono text-[11px] leading-relaxed">
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-0.5 border rounded font-mono uppercase tracking-widest text-[9px] ${tagColor}`}>
                      {log.action}
                    </span>
                    <span className="text-slate-500 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-slate-300 font-sans">{log.details}</div>
                  <div className="text-[10px] text-slate-500">USER: {log.userId} | ID: {log.id}</div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
