"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Check, Clipboard, Download, FileCode2, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import type { OnMount } from "@monaco-editor/react";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false, loading: () => <div className="code-loading">Loading Python editor…</div> });
const tabs = ["Python Code", "Pseudocode", "How It Works", "Correctness Proof", "Complexity"] as const;
type Tab = typeof tabs[number];

export default function ExplorerPage() {
  const [tab, setTab] = useState<Tab>("Python Code");
  const [source, setSource] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const sourceLines = useMemo(() => source.split("\n"), [source]);

  useEffect(() => {
    let active = true;
    fetch("/api/code", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) throw new Error("Python source endpoint is unavailable.");
      const code = await response.text();
      if (active) setSource(code);
    }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load the canonical solver source."); });
    return () => { active = false; };
  }, []);

  const copy = async () => {
    try { await navigator.clipboard.writeText(source); setCopied(true); toast.success("Canonical solver source copied."); window.setTimeout(()=>setCopied(false),1700); }
    catch { toast.error("Clipboard access is unavailable in this browser."); }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([source], { type: "text/x-python" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "CODE.py"; anchor.click(); URL.revokeObjectURL(url);
  };
  const handleMount: OnMount = (editor, monaco) => {
    const start = sourceLines.findIndex((line) => line.includes("def solve_problem")) + 1;
    const end = sourceLines.findIndex((line) => line.includes("def iter_matching_plans"));
    if (start > 0 && end > start) editor.deltaDecorations([], [{ range: new monaco.Range(start,1,end,1), options: { isWholeLine: true, className: "solver-highlight-line", linesDecorationsClassName: "solver-highlight-gutter" } }]);
  };

  return <div className="container">
    <div className="page-heading"><div><div className="eyebrow">Algorithm explorer · 03</div><h1>See how it works.</h1><p>Technical transparency from the Python source used by the solver and the generated submission artifact.</p></div><span className="pill lime"><FileCode2 size={12}/> CANONICAL SOURCE</span></div>
    {error && <div className="error-box" role="alert">{error}</div>}
    <section className="panel explorer-panel">
      <div className="tabs" role="tablist" aria-label="Algorithm topics">{tabs.map((name)=><button key={name} role="tab" aria-selected={tab===name} className={tab===name?"tab active":"tab"} onClick={()=>setTab(name)}>{name}</button>)}</div>
      {tab === "Python Code" && <div className="explorer-content">
        <div className="explorer-toolbar"><div><strong>backend/solver.py</strong><span> · Python · read only · {sourceLines.length.toLocaleString()} lines</span></div><div className="button-row"><button className="btn" onClick={copy} disabled={!source}><Clipboard size={13}/>{copied?"Copied":"Copy source"}</button><button className="btn btn-primary" onClick={download} disabled={!source}><Download size={13}/> Download CODE.py</button></div></div>
        <div className="monaco-frame"><Editor height="540px" language="python" theme="vs-dark" value={source} onMount={handleMount} options={{readOnly:true, minimap:{enabled:false}, lineNumbers:"on", scrollBeyondLastLine:false, wordWrap:"on", automaticLayout:true, fontSize:12, fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace", padding:{top:14,bottom:14}, renderLineHighlight:"line", contextmenu:false}} /></div>
        <p className="small muted">The source is fetched from the same Python module used by FastAPI; no separate illustrative code is shown.</p>
      </div>}
      {tab === "Pseudocode" && <div className="docs-content"><h2>One request. Two branches.</h2><p>The traversal visits include before exclude, preserves original positions, and stops only at a solution or a safe prune.</p><pre className="code-block">{`SEARCH(index, sum, chosen):
    if sum > target:
        return                       // safe: positive costs cannot reduce sum
    if sum == target:
        count this valid subset
        update minimum-size count and lexicographic choice
        return                       // positive costs: no extension can match
    if sum + suffixSum[index] < target:
        return                       // safe: even all remaining costs are insufficient
    if index == n:
        return

    SEARCH(index + 1, sum + costs[index], chosen + [index + 1])  // INCLUDE
    SEARCH(index + 1, sum, chosen)                               // EXCLUDE`}</pre><div className="callout">A valid subset is counted once for each distinct original-index choice, including when two requests have the same cost.</div></div>}
      {tab === "How It Works" && <div className="docs-content"><h2>From each index to the exact target</h2><div className="explain-grid">
        <article><span>01 · BASE</span><h3>Target reached</h3><p>When the running sum equals the target, record that exact subset and stop that path. Positive request costs mean any further include would exceed the target.</p></article>
        <article><span>02 · INCLUDE</span><h3>Select the request</h3><p>Add the current request cost and its 1-based original index, recurse, then remove it before exploring the alternate decision.</p></article>
        <article><span>03 · EXCLUDE</span><h3>Skip the request</h3><p>Recurse to the next position without changing the current sum or chosen list.</p></article>
        <article><span>04 · PRUNE</span><h3>Only safe exits</h3><p>Stop if the sum exceeds the target or current sum plus all remaining suffix costs cannot reach it. Do not prune based on current team size.</p></article>
        <article><span>05 · OPTIMIZE</span><h3>Track the smallest</h3><p>Each valid subset contributes to COUNT. Smaller size resets optimal count; equal size increments it and can replace the chosen list.</p></article>
        <article><span>06 · TIE-BREAK</span><h3>Compare indices</h3><p>Compare increasing 1-based index lists explicitly in lexicographic order, keeping the first differing lower index.</p></article>
      </div></div>}
      {tab === "Correctness Proof" && <div className="docs-content"><h2>Why the result is exact</h2>
        <div className="proof-block"><span>COMPLETENESS</span><p>For each request, every subset either includes it or excludes it. The recursion explores both branches in original order, so each subset maps to exactly one path. The over-target prune and insufficient-suffix prune discard only states that cannot produce a target subset. Therefore every valid subset is visited.</p></div>
        <div className="proof-block"><span>SOUNDNESS</span><p>A plan is counted only when the exact sum of the selected costs equals the target. Every recorded plan is valid.</p></div>
        <div className="proof-block"><span>MINIMUM SIZE & OPTIMAL COUNT</span><p>Because every valid plan is visited, tracking the smallest observed cardinality yields the global minimum. Resetting the optimal counter when a smaller plan appears and incrementing it for every equal-sized plan yields the exact number of minimum plans.</p></div>
        <div className="proof-block"><span>LEXICOGRAPHICAL CHOICE</span><p>Each candidate is an increasing list of original 1-based indices. Explicit list comparison examines the first differing position; keeping the smallest list among all minimum-size candidates returns the required lexicographic winner.</p></div>
      </div>}
      {tab === "Complexity" && <div className="docs-content"><h2>Bounded input. Exponential search.</h2><div className="complexity-pair"><div><span>WORST-CASE TIME</span><strong>O(2<sup>n</sup>)</strong><p>Each request can create an include and exclude branch. At n ≤ 22 this is at most 4,194,304 subset states before pruning.</p></div><div><span>AUXILIARY RECURSION SPACE</span><strong>O(n)</strong><p>The call stack and selected-index path each grow at most to the request count. Primary counting does not retain every valid subset.</p></div></div><div className="callout">Suffix and over-target pruning can reduce actual explored states, but do not change the worst-case complexity bound.</div></div>}
    </section>
  </div>;
}
