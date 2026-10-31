"use client";

import { useState } from "react";
import { Check, CircleAlert, FlaskConical, Play } from "lucide-react";
import { api } from "@/lib/api";

type TestCase = { name: string; input: unknown; expected: unknown; actual: unknown; expected_output?: string; actual_output?: string; status: "passed"|"failed"; duration_ms: number };
type TestResult = { passed: number; total: number; status: "passed"|"failed"; duration_ms: number; cases: TestCase[] };

export default function TestsPage() {
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const run = async () => {
    setLoading(true); setError("");
    try { setResult(await api<TestResult>("/api/tests/run", { method: "POST", body: "{}" })); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Test execution failed."); }
    finally { setLoading(false); }
  };
  return <div className="container">
    <div className="page-heading"><div><div className="eyebrow">Verification suite · 04</div><h1>Test the edge cases.</h1><p>Run fixed cases and independent brute-force comparisons against the same solver used by the app.</p></div><button className="btn btn-primary" onClick={run} disabled={loading}><Play size={14} fill="currentColor"/>{loading?"Running tests…":"Run all tests"}</button></div>
    <div className="test-categories"><div className="panel"><FlaskConical size={17} color="var(--lime)"/><strong>Fixed cases</strong><p>Provided sample, target zero, impossible target, duplicates, unsorted input, minimum-size ties, lexicographical choice, and n=22.</p></div><div className="panel"><Check size={17} color="var(--blue)"/><strong>Independent oracle</strong><p>Small randomized problems are cross-checked against a separate exhaustive subset oracle.</p></div><div className="panel"><CircleAlert size={17} color="var(--muted)"/><strong>Actual run data</strong><p>Results remain blank until this page calls the test endpoint and receives executed outcomes.</p></div></div>
    {error && <div className="error-box" role="alert">{error}</div>}
    {!result && !loading && !error && <div className="empty-state test-empty">No tests run in this session yet. Start the backend suite to see measured results.</div>}
    {loading && <div className="empty-state test-empty">Executing real backtracking and oracle checks…</div>}
    {result && <section className="test-results">
      <div className="test-summary panel"><div><div className="eyebrow">Executed test suite</div><strong>{result.passed}<small> / {result.total} passed</small></strong></div><div className="test-summary-right"><span className={`status ${result.status==="passed"?"success":"error"}`}>{result.status.toUpperCase()}</span><span className="mono">{result.duration_ms.toFixed(2)} ms</span></div></div>
      <div className="table-wrap test-table-wrap"><table><thead><tr><th>Test</th><th>Input</th><th>Expected</th><th>Actual</th><th>Status</th><th>Duration</th></tr></thead><tbody>{result.cases.map((test,index)=><tr key={`${test.name}-${index}`}><td><strong>{test.name}</strong></td><td><code>{JSON.stringify(test.input)}</code></td><td><code>{test.expected_output ?? JSON.stringify(test.expected)}</code></td><td><code>{test.actual_output ?? JSON.stringify(test.actual)}</code></td><td><span className={`status ${test.status=== "passed"?"success":"error"}`}>{test.status.toUpperCase()}</span></td><td className="mono">{test.duration_ms.toFixed(2)} ms</td></tr>)}</tbody></table></div>
    </section>}
  </div>;
}
