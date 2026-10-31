"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, GitBranch } from "lucide-react";
import { api, type TraceResponse } from "@/lib/api";

export function HomeTracePreview() {
  const [trace, setTrace] = useState<TraceResponse | null>(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api<TraceResponse>("/api/visualize", { method: "POST", body: JSON.stringify({ costs: [5, 5, 10, 3, 7, 10], target: 10, detail_level: "detailed" }) })
      .then(value => { if (active) setTrace(value); })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : "Trace unavailable"); });
    return () => { active = false; };
  }, []);
  const event = trace?.events[Math.min(step, (trace?.events.length ?? 1) - 1)];
  return <div className="trace-preview">
    <div className="trace-mini-window">
      <div className="trace-window-top"><span><i/> LIVE BACKEND TRACE</span><span className="mono">SAMPLE INPUT · T=10</span></div>
      {error ? <div className="empty-state">Trace could not be loaded: {error}</div> : !event ? <div className="empty-state">Loading genuine include/exclude events…</div> : <>
        <div className="trace-mini-tree">
          {trace?.events.slice(Math.max(0, step - 1), Math.min(trace.events.length, step + 4)).map((item) => <div key={item.id} className={`trace-row ${item.status}`}>
            <span className="trace-indicator">{item.status === "optimal" ? "◆" : item.status === "pruned" ? "×" : item.status === "valid" ? "✓" : "·"}</span>
            <span className="mono">{item.decision}</span><span className="mono">Σ {item.current_sum}</span>
            <small>depth {item.depth}{item.request_index ? ` · #${item.request_index}` : " · leaf"}</small>
          </div>)}
        </div>
        <div className="trace-mini-footer"><span className="mono">STEP {step + 1} / {trace?.events.length} <i>·</i> {event.status.toUpperCase()}</span>
          <div className="inline-tools"><button className="icon-btn" aria-label="Previous trace step" disabled={step<=0} onClick={()=>setStep(s=>Math.max(0,s-1))}><ArrowLeft size={14}/></button><button className="icon-btn" aria-label="Next trace step" disabled={!trace || step>=trace.events.length-1} onClick={()=>setStep(s=>Math.min((trace?.events.length ?? 1)-1,s+1))}><ArrowRight size={14}/></button></div>
        </div>
      </>}
    </div>
    <div className="trace-preview-aside"><GitBranch size={19} color="var(--lime)"/><strong>One trace. One source of truth.</strong><p>This preview fetches real execution events from the Python backtracking solver.</p><Link className="text-link" href="/visualizer">Explore every branch <ArrowRight size={13}/></Link></div>
  </div>;
}
