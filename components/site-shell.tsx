"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, GitBranch } from "lucide-react";
import type { ReactNode } from "react";

const links = [
  ["Home", "/"], ["Solver", "/solver"], ["Visualizer", "/visualizer"],
  ["Explorer", "/explorer"], ["Tests", "/tests"], ["Submission", "/submission"],
] as const;

export function SiteNav() {
  const pathname = usePathname();
  return <header className="site-nav">
    <Link href="/" className="brand" aria-label="FUNDWISE home">
      <span className="brand-mark"><GitBranch size={17} strokeWidth={2.1} /></span>
      <span>FUND<span>WISE</span></span>
    </Link>
    <nav aria-label="Main navigation" className="nav-links">
      {links.map(([label, href]) => <Link key={href} href={href} className={pathname === href ? "nav-link active" : "nav-link"}>{label}</Link>)}
    </nav>
    <Link className="nav-cta" href="/solver">Get started <ArrowUpRight size={14} /></Link>
  </header>;
}

export function PageFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  return <AnimatePresence mode="wait" initial={false}>
    <motion.main key={pathname} className="page-transition" initial={reduceMotion ? false : { opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -5 }} transition={reduceMotion ? { duration: 0 } : { duration: 0.22, ease: "easeOut" }}>
      {children}
    </motion.main>
  </AnimatePresence>;
}

export function Footer() {
  return <footer className="footer"><div><strong>FUNDWISE</strong><span>Exact budget. Every plan. Smallest team.</span></div><span className="mono">INCLUDE <i>／</i> EXCLUDE <i>／</i> OPTIMIZE</span></footer>;
}
