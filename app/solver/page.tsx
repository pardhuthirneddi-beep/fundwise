"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight, Check, LoaderCircle, Plus, Play, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, chosenLabel, type PlansResponse, type SolveResponse } from "@/lib/api";
import { useProblem } from "@/lib/problem-context";
import { Button } from "@/components/ui/button";

const sampleOne = { requests: [5, 5, 10, 3, 7, 10], target: 10 };
const sampleTwo = { requests: [8, 2, 7, 3, 5], target: 10 };

export default function SolverPage() {
  const { requests, setRequests, target, setTarget, solution, setSolution } = useProblem();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filter, setFilter] = useState("all");
  const [searchDraft, setSearchDraft] = useState("");
  const [searchIndex, setSearchIndex] = useState("");
  const [plans, setPlans] = useState<PlansResponse | null>(null);
  const [plansError, setPlansError] = useState("");
  const numericCosts = useMemo(() => requests.map((request) => Number(request.value)), [requests]);

  const setCost = (id: string, value: string) => {
    setRequests((current) => current.map((request) => request.id === id ? { ...request, value } : request));
    setSolution(null);
    setPlans(null);
    setError("");
  };

  const loadSample = (sample: typeof sampleOne) => {
    setRequests(sample.requests.map((value, index) => ({ id: `sample-${Date.now()}-${index}`, value: String(value), originalIndex: index + 1 })));
    setTarget(String(sample.target));
    setSolution(null);
    setPlans(null);
    setError("");
  };

  const clearInputs = () => {
    if (!window.confirm("Clear the target and all requests?")) return;
    setRequests([]);
    setTarget("");
    setSolution(null);
    setPlans(null);
    setError("");
  };

  const addRequest = () => {
    if (requests.length >= 22) return;
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `request-${Date.now()}-${Math.random()}`;
    setRequests((current) => [...current, { id, value: "1", originalIndex: current.reduce((largest, request) => Math.max(largest, request.originalIndex), 0) + 1 }]);
    setSolution(null);
    setPlans(null);
  };

  const removeRequest = (id: string) => {
    setRequests((current) => current.filter((request) => request.id !== id));
    setSolution(null);
    setPlans(null);
  };

  const runSolver = async () => {
    setError("");
    if (!/^\d+$/.test(target)) return setError("Target must be a whole number from 0 to 1,000,000.");
    const targetValue = Number(target);
    if (targetValue < 0 || targetValue > 1_000_000) return setError("Target must be between 0 and 1,000,000.");
    if (requests.length > 22) return setError("At most 22 requests are allowed.");
    const bad = requests.findIndex((request) => !/^\d+$/.test(request.value) || Number(request.value) < 1 || Number(request.value) > 1_000_000);
    if (bad >= 0) return setError(`Request #${requests[bad].originalIndex} cost must be a whole number from 1 to 1,000,000.`);
    setBusy(true);
    try {
      const result = await api<SolveResponse>("/api/solve", { method: "POST", body: JSON.stringify({ costs: numericCosts, target: targetValue }) });
      setSolution(result);
      setPage(1);
      setFilter("all");
      setSearchIndex("");
      toast.success("Exact solver run complete.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The solver could not complete this request.");
    } finally { setBusy(false); }
  };

  useEffect(() => {
    if (!solution) { setPlans(null); return; }
    let active = true;
    setPlansError("");
    const params = new URLSearchParams({ session_id: solution.session_id, page: String(page), page_size: String(pageSize) });
    if (filter === "optimal") params.set("optimal_only", "true");
    if (filter === "nonoptimal") params.set("optimal_only", "false");
    if (searchIndex) params.set("search_index", searchIndex);
    api<PlansResponse>(`/api/plans?${params.toString()}`)
      .then((value) => { if (active) setPlans(value); })
      .catch((reason) => { if (active) { setPlansError(reason instanceof Error ? reason.message : "Plan page unavailable."); setPlans(null); } });
    return () => { active = false; };
  }, [solution, page, pageSize, filter, searchIndex]);

  const submitSearch = () => {
    if (searchDraft && (!/^\d+$/.test(searchDraft) || !requests.some((request) => request.originalIndex === Number(searchDraft)))) {
      setPlansError("Choose an existing original request index from the current input.");
      return;
    }
    setPlansError("");
    setPage(1);
    const positionalIndex = searchDraft ? String(requests.findIndex((request) => request.originalIndex === Number(searchDraft)) + 1) : "";
    setSearchIndex(positionalIndex);
  };

  const chosen = solution?.chosen_indices;
  const chosenDisplay = chosen === null ? "NONE" : chosen?.length === 0 ? "EMPTY" : chosen ? `#${chosen.map((index) => requests[index - 1]?.originalIndex ?? index).join(", #")}` : "—";

  return <div className="container solver-page">
    <div className="page-heading">
      <div><div className="eyebrow">Funding plan workbench · 01</div><h1>Exact budget.<br />Smallest team.</h1><p>Enter distinct requests, run the recursive solver, then inspect every valid combination—not only the winner.</p></div>
      <div className="button-row"><button className="btn" onClick={() => loadSample(sampleOne)}>Load Sample 1</button><button className="btn" onClick={() => loadSample(sampleTwo)}>Load Sample 2</button></div>
    </div>

    <div className="solver-layout">
      <section className="panel input-panel">
        <h2 className="panel-title">Problem input <span>{requests.length} / 22 requests</span></h2>
        <label className="label" htmlFor="target">Target budget</label>
        <div className="target-row"><input id="target" className="input target-input mono" inputMode="numeric" pattern="[0-9]*" value={target} onChange={(event) => { setTarget(event.target.value); setSolution(null); setPlans(null); }} aria-describedby="target-help"/><span className="target-unit">EXACT TARGET</span></div>
        <div id="target-help" className="small muted" style={{marginTop:7}}>Integer range 0–1,000,000</div>
        <div className="requests-heading"><span className="label">Optional requests</span><span className="small muted">Original order · duplicates allowed</span></div>
        <div className="request-list">
          {requests.map((request, index) => <div className="field-row" key={request.id}>
            <span className="request-index">#{request.originalIndex}</span>
            <label className="sr-only" htmlFor={`request-${request.id}`}>Request {request.originalIndex} cost</label>
            <input id={`request-${request.id}`} aria-label={`Request ${request.originalIndex} cost`} className="input mono" inputMode="numeric" pattern="[0-9]*" value={request.value} onChange={(event) => setCost(request.id, event.target.value)} />
            <button className="icon-btn" type="button" onClick={() => removeRequest(request.id)} aria-label={`Remove request ${request.originalIndex}`}><Trash2 size={15}/></button>
          </div>)}
          {requests.length === 0 && <div className="empty-state compact-empty">No requests yet. Add a positive integer cost.</div>}
        </div>
        <div className="request-actions"><button className="btn" onClick={addRequest} disabled={requests.length >= 22}><Plus size={14}/> Add request</button><span className="small muted">Each request keeps a stable identity while editing.</span></div>
        {error && <div className="error-box" role="alert" style={{marginTop:16}}><AlertCircle size={14} style={{verticalAlign:"middle",marginRight:7}}/>{error}</div>}
        <div className="solver-actions"><Button variant="primary" className="run-button" onClick={runSolver} disabled={busy}><Play size={14} fill="currentColor"/>{busy ? "Running exact search…" : "Run solver"}</Button><button className="btn btn-quiet" onClick={clearInputs}><RotateCcw size={14}/> Clear inputs</button></div>
      </section>

      <section className="results-column" aria-live="polite">
        <div className="result-topline"><div><div className="eyebrow">Solver results</div><h2>Four measures. One answer.</h2></div>{solution && <span className="status success">Backend run complete</span>}</div>
        {solution ? <>
          <div className="metric-grid result-metrics">
            <div className="metric"><label>Total valid plans</label><strong>{solution.count.toLocaleString()}</strong></div>
            <div className="metric"><label>Minimum team size</label><strong>{solution.minimum_size}</strong></div>
            <div className="metric"><label>Optimal plan count</label><strong>{solution.optimal_count.toLocaleString()}</strong></div>
            <div className="metric highlight"><label>Chosen plan</label><strong className="chosen-metric">{chosenDisplay}</strong></div>
          </div>
          <div className="execution-line"><span className="mono">{solution.execution.explored_nodes.toLocaleString()} STATES EXPLORED</span><span>·</span><span className="mono">{solution.execution.pruned_nodes.toLocaleString()} SAFELY PRUNED</span><span>·</span><span className="mono">{solution.execution.duration_ms.toFixed(2)} ms</span><button className="text-link" onClick={() => router.push("/visualizer")}>Inspect execution <ArrowRight size={13}/></button></div>
        </> : <div className="empty-state results-empty"><div className="empty-mark"><Check size={19}/></div><strong>No run yet.</strong><span>Submit a valid problem to see exact counts and optimal plans returned by the Python solver.</span></div>}
      </section>
    </div>

    <section className="plans-section section-space">
      <div className="plans-header"><div><div className="eyebrow">Complete solution set</div><h2>All valid plans</h2><p>Every exact match, in lexicographic index order. Optimal combinations are highlighted.</p></div>
        <div className="plans-controls">
          <label className="sr-only" htmlFor="plan-filter">Filter plans</label>
          <select id="plan-filter" className="input filter-select" value={filter} onChange={(event)=>{setFilter(event.target.value);setPage(1)}} disabled={!solution}><option value="all">All valid plans</option><option value="optimal">Optimal only</option><option value="nonoptimal">Non-optimal only</option></select>
          <label className="sr-only" htmlFor="page-size">Plans per page</label>
          <select id="page-size" className="input page-size" value={pageSize} onChange={(event)=>{setPageSize(Number(event.target.value));setPage(1)}} disabled={!solution}><option value={10}>10 / page</option><option value={25}>25 / page</option><option value={50}>50 / page</option></select>
        </div>
      </div>
      <details className="search-details" open>
        <summary>Search by request index <span className="muted">Optional · matches plans containing this index</span></summary>
        <div className="inline-tools search-row"><input className="input mono" aria-label="Request index to search" inputMode="numeric" placeholder="e.g. 3" value={searchDraft} onChange={(event)=>setSearchDraft(event.target.value)} disabled={!solution}/><button className="btn" onClick={submitSearch} disabled={!solution}>Apply</button>{searchIndex && <button className="btn btn-quiet" onClick={()=>{setSearchDraft("");setSearchIndex("");setPage(1)}}>Clear search</button>}</div>
      </details>
      <details className="valid-plans-details" open>
        <summary>Browse every matching plan <span>{plans ? `${plans.total.toLocaleString()} results · lexicographic order` : "Run the solver to load plans"}</span></summary>
      {plansError && <div className="error-box" role="alert">{plansError}{plansError.includes("session") && <button className="text-link" onClick={runSolver}>Run solver again</button>}</div>}
      {!solution ? <div className="empty-state">Run the solver to browse the exact valid combinations.</div> : plansError && !plans ? null : !plans ? <div className="empty-state"><span className="loading-dots"><span/><span/><span/></span> Loading genuine plan results…</div> : plans.plans.length === 0 ? <div className="empty-state">No plans match this filter and search.</div> : <>
        <div className="table-wrap"><table className="plans-table"><thead><tr><th>Plan</th><th>Original indices</th><th>Request costs</th><th>Total</th><th>Requests</th><th>Status</th></tr></thead><tbody>
          {plans.plans.map((plan, index) => <tr key={`${plan.indices.join("-")}-${index}`} className={plan.optimal ? "optimal-row" : ""}><td className="mono">{String((plans.page - 1) * plans.page_size + index + 1).padStart(2,"0")}</td><td className="mono">{plan.indices.length ? plan.indices.map((i)=>`#${requests[i - 1]?.originalIndex ?? i}`).join(", ") : "EMPTY"}</td><td className="mono">{plan.costs.length ? plan.costs.join(" + ") : "—"}</td><td className="mono">{plan.total_cost}</td><td className="mono">{plan.selected_count}</td><td>{plan.optimal ? <span className="pill lime"><Check size={11}/> OPTIMAL</span> : <span className="pill">VALID</span>}</td></tr>)}
        </tbody></table></div>
        <div className="pagination"><span className="mono">{plans.total.toLocaleString()} matching plans · page {plans.page} of {Math.max(1,plans.total_pages)}</span><div className="button-row"><button className="btn" onClick={()=>setPage((v)=>Math.max(1,v-1))} disabled={page<=1}><ArrowLeft size={13}/> Previous</button><button className="btn" onClick={()=>setPage((v)=>v+1)} disabled={page>=plans.total_pages}><span>Next</span><ArrowRight size={13}/></button></div></div>
      </>}
      </details>
    </section>
  </div>;
}
