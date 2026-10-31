"use client";

import { useEffect } from "react";

export function StoryEffects() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let revert: (() => void) | undefined;
    let cancelled = false;
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([gsapModule, triggerModule]) => {
      if (cancelled) return;
      const gsap = gsapModule.gsap;
      const ScrollTrigger = triggerModule.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);
      const context = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((section) => {
          const children = section.querySelectorAll(".eyebrow, h2, p, .story-rail, .trace-preview, .feature-grid, .story-cta");
          gsap.fromTo(children, { y: 22, opacity: 0 }, {
            y: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: "power2.out",
            scrollTrigger: { trigger: section, start: "top 82%", once: true },
          });
        });
        gsap.to(".pinned-art", {
          rotateY: -8, scale: 1.04,
          scrollTrigger: { trigger: ".pinned-stage", start: "top top", end: "+=520", scrub: 0.7, pin: ".pinned-copy", pinSpacing: false, invalidateOnRefresh: true },
        });
        gsap.to(".hero-cube.main", { rotateX: 24, rotateY: 122, scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 } });
      });
      revert = () => context.revert();
    });
    return () => { cancelled = true; revert?.(); };
  }, []);
  return null;
}
