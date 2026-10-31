"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { addEdge, applyEdgeChanges, applyNodeChanges, Background, Controls, MiniMap, ReactFlow, ReactFlowProvider, type Edge, type Node, type NodeProps, type OnConnect, type OnEdgesChange, type OnNodesChange } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Activity, FastForward, Pause, Play, Rewind, RotateCcw } from "lucide-react";
import { api, type TraceEvent, type TraceResponse } from "@/lib/api";
import { useProblem } from "@/lib/problem-context";

function DecisionNode({ data }: NodeProps<Node<{ title: string; requestIndex: number | null; sum: number; chosen: string; remaining: number; status: string; decision: string; depth: number }>>) {
  const status = data.status === "optimal" ? "optimal" : data.status === "valid" ? "valid" : data.status === "pruned" ? "pruned" : data.status === "dead_end" ? "dead" : "";
  return <div className={`rf-node ${status}`}>
    <strong>{data.requestIndex ? `REQUEST #${data.requestIndex}` : data.title} · {data.decision}</strong>
    <div>{data.status.toUpperCase()}</div>
    <div>Σ {data.sum} · left {data.remaining}</div>
    <div>set [{data.chosen || "—"}]</div>
    <div>depth {data.depth}</div>
  </div>;
}
const nodeTypes = { decision: DecisionNode };

function VisualizerCanvas() {
  const { requests, target } = useProblem();
  const [trace, setTrace] = useState<TraceResponse | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runTrace = useCallback(async () => {
    setLoading(true); setError(""); setPlaying(false);
    const costs = requests.map((request) => Number(request.value));
    if (!/^\d+$/.test(target) || costs.length > 22 || costs.some((cost, index) => !/^\d+$/.test(requests[index].value) || cost < 1 || cost > 1_000_000) || Number(target) > 1_000_000) {
      setError("Add a target from 0 to 1,000,000 and up to 22 positive integer request costs before generating a trace.");
      setLoading(false); return;
    }
    try {
      const detail = costs.length <= 12 ? "detailed" : "condensed";
      const value = await api<TraceResponse>("/api/visualize", { method: "POST", body: JSON.stringify({ costs, target: Number(target), detail_level: detail }) });
      const counts = new Map<number, number>();
      const nextNodes: Node[] = value.events.map((event: TraceEvent) => {
        const depthCount = counts.get(event.depth) ?? 0;
        counts.set(event.depth, depthCount + 1);
        return {
          id: String(event.id), type: "decision", position: { x: event.depth * 205, y: depthCount * 105 },
          data: {
            title: event.request_index ? `#${requests[event.request_index - 1]?.originalIndex ?? event.request_index}` : event.index >= costs.length ? "END OF INPUT" : "SEARCH ROOT",
            requestIndex: event.request_index ? requests[event.request_index - 1]?.originalIndex ?? event.request_index : null,
            sum: event.current_sum,
            chosen: event.selected_indices.join(","),
            remaining: event.remaining_target,
            status: event.status,
            decision: event.decision,
            depth: event.depth,
          },
          className: "trace-node",
        };
      });
      const nextEdges: Edge[] = value.events.filter((event) => event.parent_id !== null).map((event) => ({
        id: `e${event.parent_id}-${event.id}`, source: String(event.parent_id), target: String(event.id),
        label: event.decision, labelStyle: { fill: "#929ba5", fontSize: 9 },
        style: { stroke: event.decision === "INCLUDE" ? "#8eb8ff" : "#636e78", strokeWidth: 1.1 }, animated: false,
      }));
      setTrace(value); setNodes(nextNodes); setEdges(nextEdges); setStep(0);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load genuine solver events.");
    } finally { setLoading(false); }
  }, [requests, target]);

  useEffect(() => { void runTrace(); }, []); // Initial trace is from the backend; no frontend simulation.
  useEffect(() => {
    if (!playing || !trace) return;
    const timer = window.setInterval(() => setStep((current) => {
      if (current >= trace.events.length - 1) { setPlaying(false); return current; }
      return current + 1;
    }), 900 / speed);
    return () => window.clearInterval(timer);
  }, [playing, trace, speed]);

  const onNodesChange: OnNodesChange = useCallback((changes) => setNodes((items) => applyNodeChanges(changes, items)), []);
  const onEdgesChange: OnEdgesChange = useCallback((changes) => setEdges((items) => applyEdgeChanges(changes, items)), []);
  const onConnect: OnConnect = useCallback((connection) => setEdges((items) => addEdge(connection, items)), []);
  const activeEvent = trace?.events[Math.min(step, (trace?.events.length ?? 1) - 1)];
  const activeId = activeEvent ? String(activeEvent.id) : "";
  const activeNodes = useMemo(() => nodes.map((node) => ({ ...node, className: node.id === activeId ? "trace-node current-node" : "trace-node" })), [nodes, activeId]);

  return <div className="container">
    <div className="page-heading"><div><div className="eyebrow">Backtracking visualizer · 02</div><h1>Follow the search.</h1><p>Every node below is a decision state returned by the Python solver—not a frontend-generated example.</p></div><button className="btn btn-primary" onClick={runTrace} disabled={loading}><Activity size={14}/>{loading ? "Tracing…" : "Run current problem"}</button></div>
    {error && <div className="error-box" role="alert" style={{marginBottom:16}}>{error}</div>}
    <div className="playback-bar panel">
      <div className="play-controls">
        <button className="icon-btn" aria-label="Reset trace" disabled={!trace} onClick={()=>{setPlaying(false);setStep(0)}}><RotateCcw size={15}/></button>
        <button className="icon-btn" aria-label="Previous step" disabled={!trace || step<=0} onClick={()=>setStep((v)=>Math.max(0,v-1))}><Rewind size={15}/></button>
        <button className="btn btn-primary playback-button" aria-label={playing ? "Pause trace" : "Play trace"} disabled={!trace} onClick={()=>setPlaying((v)=>!v)}>{playing?<Pause size={14}/>:<Play size={14} fill="currentColor"/>}{playing?"Pause":"Play"}</button>
        <button className="icon-btn" aria-label="Next step" disabled={!trace || step>=(trace.events.length-1)} onClick={()=>setStep((v)=>Math.min((trace?.events.length??1)-1,v+1))}><FastForward size={15}/></button>
      </div>
      <div className="trace-progress"><div className="trace-progress-copy"><span className="mono">{trace?`STEP ${step+1} / ${trace.events.length}`:"NO TRACE LOADED"}</span><span>{activeEvent?.decision ?? "Awaiting execution"}</span></div><input aria-label="Playback speed" type="range" min="0.5" max="3" step="0.5" value={speed} onChange={(event)=>setSpeed(Number(event.target.value))}/><span className="mono speed-label">{speed.toFixed(1)}×</span></div>
      {trace && <span className="pill">{trace.detail_level.toUpperCase()} · {trace.trace_cap.toLocaleString()} EVENT CAP</span>}
    </div>
    {trace?.trace_truncated && <div className="callout trace-notice">Detailed playback is capped at {trace.trace_cap.toLocaleString()} backend events. The execution summary below reflects all {trace.summary.explored_nodes.toLocaleString()} visited states; omitted events were not rendered.</div>}
    <div className="trace-grid">
      <div className="trace-canvas" aria-label="Interactive decision tree generated from solver events">
        {!trace && loading ? <div className="empty-state">Requesting real include/exclude events…</div> : trace && trace.events.length ? <ReactFlow nodes={activeNodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} fitView minZoom={0.08} maxZoom={1.7} attributionPosition="bottom-left"><Background color="#25303a" gap={25} size={1}/><Controls showInteractive={false}/><MiniMap nodeColor={(node)=>node.className?.includes("current")?"#b9f36b":"#6f8794"}/></ReactFlow> : <div className="empty-state">Run a valid problem to render the backend's execution trace.</div>}
      </div>
      <aside className="trace-side panel">
        <h2 className="panel-title">Execution state <span>REAL TRACE</span></h2>
        <div className="side-stat"><span>Request</span><strong className="mono">{activeEvent?.request_index ? `#${requests[activeEvent.request_index - 1]?.originalIndex ?? activeEvent.request_index} · position ${activeEvent.request_index}` : activeEvent ? "Terminal" : "—"}</strong></div>
        <div className="side-stat"><span>Decision</span><strong className="mono">{activeEvent?.decision ?? "—"}</strong></div>
        <div className="side-stat"><span>Current sum</span><strong className="mono">{activeEvent?.current_sum ?? "—"}</strong></div>
        <div className="side-stat"><span>Target</span><strong className="mono">{target || "—"}</strong></div>
        <div className="side-stat"><span>Remaining target</span><strong className="mono">{activeEvent?.remaining_target ?? "—"}</strong></div>
        <div className="side-stat"><span>Selected</span><strong className="mono">{activeEvent?.selected_indices.length ? activeEvent.selected_indices.map((i)=>`#${requests[i - 1]?.originalIndex ?? i}`).join(", ") : "EMPTY"}</strong></div>
        <div className="side-stat"><span>Depth</span><strong className="mono">{activeEvent?.depth ?? "—"}</strong></div>
        <div className="side-stat"><span>Branch status</span><strong className="mono">{activeEvent?.status.toUpperCase() ?? "—"}</strong></div>
        <div className="side-divider"/><div className="side-stat"><span>Valid plans found</span><strong className="mono lime-text">{trace?.summary.count.toLocaleString() ?? "—"}</strong></div>
        <div className="side-stat"><span>Optimal plans</span><strong className="mono">{trace?.summary.optimal_count.toLocaleString() ?? "—"}</strong></div>
        <div className="side-stat"><span>Explored nodes</span><strong className="mono">{trace?.summary.explored_nodes.toLocaleString() ?? "—"}</strong></div>
        <div className="side-stat"><span>Pruned nodes</span><strong className="mono">{trace?.summary.pruned_nodes.toLocaleString() ?? "—"}</strong></div>
      </aside>
    </div>
  </div>;
}

export default function VisualizerPage() {
  return <ReactFlowProvider><VisualizerCanvas/></ReactFlowProvider>;
}
