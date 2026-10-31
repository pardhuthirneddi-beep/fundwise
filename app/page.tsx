import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, GitBranch, Sparkles } from "lucide-react";
import { HomeTracePreview } from "@/components/home-trace-preview";
import { StoryEffects } from "@/components/story-effects";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return <>
    <StoryEffects />
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <div className="eyebrow">Exact budget · minimum team</div>
        <h1 id="hero-title">Build the<br /><span>smallest</span><br />team.</h1>
        <p>Explore every possible funding combination. Find the exact budget match. Discover the smallest team.</p>
        <div className="hero-actions">
          <Button asChild variant="primary"><Link href="/solver">Try the Solver <ArrowUpRight size={15} /></Link></Button>
          <a className="btn" href="#decision-story"><ArrowDown size={14} /> Watch the demo</a>
        </div>
        <div className="hero-note">SUM OF SUBSETS <i>／</i> INCLUDE · EXCLUDE · OPTIMIZE</div>
      </div>
      <div className="hero-visual" aria-label="Abstract three-dimensional view of requests converging on an optimal plan">
        <div className="hero-sample-label">ILLUSTRATIVE · SAMPLE RUN</div>
        <div className="hero-grid-floor" />
        <div className="hero-orbit" /><div className="hero-orbit two" />
        <div className="hero-cube main"><span className="face front"/><span className="face back"/><span className="face right"/><span className="face left"/><span className="face top"/><span className="face bottom"/></div>
        {["cube-1","cube-2","cube-3","cube-4"].map((c,i)=><div key={c} className={`hero-cube ${c}`} aria-hidden="true"><span className="face front"/><span className="face back"/><span className="face right"/><span className="face left"/><span className="face top"/><span className="face bottom"/></div>)}
        <div className="hero-tag tag-a">TARGET <strong>10</strong></div>
        <div className="hero-tag tag-b">OPTIMAL TEAM <strong>01 request</strong></div>
        <div className="hero-tag tag-c">REQUESTS<br /><strong>01 · 02 · 03 · 04 · 05 · 06</strong></div>
      </div>
    </section>

    <section className="story-section" data-reveal>
      <div className="eyebrow">The funding problem</div>
      <h2>One target.<br />A field of possible plans.</h2>
      <p>Optional requests each carry a cost. The task is to find every combination that reaches the exact budget—not just a close match—and then discover which valid plan uses the fewest requests.</p>
      <div className="story-rail">
        <article><b>01 / REQUESTS</b><h3>Distinct by index</h3><p>Duplicate costs still represent different requests. Input order stays intact.</p></article>
        <article><b>02 / TARGET</b><h3>Exact, not approximate</h3><p>Every accepted plan sums precisely to the target budget.</p></article>
        <article><b>03 / OUTCOME</b><h3>Smallest team wins</h3><p>Count all valid plans, then select the lexicographically first minimum.</p></article>
      </div>
    </section>

    <section className="pinned-stage" id="decision-story" data-reveal>
      <div className="pinned-copy">
        <div className="eyebrow">Every decision matters</div>
        <h2>Two paths.<br />One request at a time.</h2>
        <p>For every request, FUNDWISE explores the include branch and the exclude branch. Safe pruning stops paths only when they can no longer reach the exact budget.</p>
        <div className="branch-key"><span><i className="branch-dot blue"/> INCLUDE · select</span><span><i className="branch-dot gray"/> EXCLUDE · skip</span></div>
        <Link href="/visualizer" className="text-link">Open the visualizer <ArrowRight size={14}/></Link>
      </div>
      <div className="pinned-art" aria-hidden="true">
        <div className="branch-node root">REQUEST #1</div>
        <div className="branch-stem stem-a"/><div className="branch-stem stem-b"/>
        <div className="branch-node include">INCLUDE<br /><b>sum + cost</b></div>
        <div className="branch-node exclude">EXCLUDE<br /><b>keep sum</b></div>
        <div className="branch-node leaf leaf-a">#03 · exact</div><div className="branch-node leaf leaf-b">continue</div>
        <div className="branch-stem stem-c"/><div className="branch-stem stem-d"/>
        <div className="decision-glow" />
      </div>
    </section>

    <section className="story-section" data-reveal>
      <div className="eyebrow">Find the smallest team</div>
      <h2>Every valid plan.<br /><span className="lime-text">Then the best one.</span></h2>
      <p>FUNDWISE keeps exact counting separate from minimum-size optimization. No valid plan is hidden just because a smaller plan exists.</p>
      <div className="proof-strip"><div><Check size={15}/><span>Exact solution count</span></div><div><Check size={15}/><span>Minimum-size tracking</span></div><div><Check size={15}/><span>Lexicographic tie-break</span></div><div><Check size={15}/><span>Paginated plan browsing</span></div></div>
    </section>

    <section className="story-section trace-preview-section" data-reveal>
      <div className="eyebrow">Algorithm visualization preview</div>
      <h2>Follow the actual search.</h2>
      <p>Step through solver-produced decisions. Each branch, valid plan, and safe prune comes from the same backend execution as the results.</p>
      <HomeTracePreview />
    </section>

    <section className="story-section" data-reveal>
      <div className="eyebrow">Built for decisions and technical review</div>
      <h2>Useful at the desk.<br />Transparent under scrutiny.</h2>
      <div className="feature-grid">
        {[
          ["01", "Exact solution counting", "Count every subset that reaches the target."],
          ["02", "Minimum-size optimization", "Find the smallest request group among valid plans."],
          ["03", "Optimal-plan counting", "See how many plans share the smallest size."],
          ["04", "Lexicographical selection", "Resolve ties by original request index."],
          ["05", "Python solution", "Download a standalone, executable submission."],
          ["06", "Verification", "Run edge cases and independent small-input checks."],
        ].map(([n,title,copy])=><article className="feature-item" key={n}><span>{n}</span><h3>{title}</h3><p>{copy}</p></article>)}
      </div>
    </section>

    <section className="story-cta" data-reveal>
      <div><div className="eyebrow">Start with your target</div><h2>Find your exact solution.</h2></div>
      <Link href="/solver" className="btn btn-primary">Open the Solver <ArrowUpRight size={15}/></Link>
    </section>
  </>;
}
