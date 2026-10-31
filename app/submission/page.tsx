"use client";

import { useState } from "react";
import { ArrowDownToLine, Check, FileCode2, FileText, LoaderCircle, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";

type Submission = { status: "success"; files: { name: string; url: string; size: number }[]; validation: { code_executes: boolean; sample_output: string; pdf_exists: boolean } };

export default function SubmissionPage() {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const generate = async () => {
    setLoading(true); setError(""); setSubmission(null);
    try { setSubmission(await api<Submission>("/api/generate-submission", { method: "POST", body: "{}" })); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Generation or validation failed."); }
    finally { setLoading(false); }
  };
  return <div className="container">
    <div className="page-heading"><div><div className="eyebrow">Hackathon handoff · 05</div><h1>Submission Studio.</h1><p>Generate the standalone Python solution and the technical document. Downloads unlock only after the backend validates them.</p></div><button className="btn btn-primary" onClick={generate} disabled={loading}>{loading?<LoaderCircle size={15} className="spin"/>:<ShieldCheck size={15}/ >}{loading?"Generating and verifying…":"Generate & validate files"}</button></div>
    <div className="submission-grid">
      <section className="panel deliverable-panel"><div className="deliverable-icon"><FileCode2 size={20}/></div><div className="eyebrow">Deliverable 01</div><h2>CODE.py</h2><p>Standalone, standard-library Python. Reads n and T plus request costs from standard input. Implements recursive include/exclude backtracking and prints the exact required output format.</p><ul><li>Exact valid-plan count</li><li>Minimum size and optimal-plan count</li><li>Lexicographical chosen indices</li><li>EMPTY and NONE special cases</li></ul></section>
      <section className="panel deliverable-panel"><div className="deliverable-icon blue"><FileText size={20}/></div><div className="eyebrow">Deliverable 02</div><h2>CODE-DOC.pdf</h2><p>Professional algorithm documentation with input/output, pseudocode, proof, safe pruning, complexity and edge cases.</p><ul><li>Readable code and page-numbered layout</li><li>Sample and edge-case table</li><li>Official checklist left adaptable</li></ul></section>
    </div>
    {error && <div className="error-box generation-error" role="alert">{error}</div>}
    {submission && <section className="panel generated-panel" aria-live="polite">
      <div className="generated-heading"><div><div className="eyebrow">Validated output</div><h2><Check size={17}/> Files are ready.</h2><p>CODE.py executed against sample 1. The PDF file was generated and passed the backend file check.</p></div><span className="status success">VALIDATED</span></div>
      <div className="file-links">{submission.files.map((file)=><a key={file.name} className="file-card download-card" href={file.url} download={file.name}><span className="file-kind">{file.name.endsWith(".py")?<FileCode2 size={19}/>:<FileText size={19}/>}</span><strong>{file.name}</strong><small>{(file.size/1024).toFixed(1)} KB · verified file</small><span className="download-affordance">Download <ArrowDownToLine size={13}/></span></a>)}</div>
      <details className="sample-output"><summary>View executed sample output</summary><pre className="code-block">{submission.validation.sample_output}</pre></details>
    </section>}
    {!submission && !error && <div className="submission-note"><div className="callout"><strong>Checklist note.</strong> The official first-page submission checklist was not supplied. The generated PDF will not invent checklist requirements and can be adapted when the real checklist is available.</div><div className="submission-idle">{loading?"Generation is running and verification is in progress.":"No download is marked successful until file generation and CODE.py execution both pass."}</div></div>}
  </div>;
}
