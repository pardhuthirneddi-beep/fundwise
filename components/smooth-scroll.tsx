"use client";

import { useEffect } from "react";

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let lenis: import("lenis").default | undefined;
    let frame: ((time: number) => void) | undefined;
    let gsapTicker: typeof import("gsap").gsap | undefined;
    let cancelled = false;

    void Promise.all([import("lenis"), import("gsap"), import("gsap/ScrollTrigger")]).then(([LenisModule, gsapModule, triggerModule]) => {
      if (cancelled) return;
      const gsap = gsapModule.gsap;
      const ScrollTrigger = triggerModule.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);
      lenis = new LenisModule.default({ lerp: 0.085, smoothWheel: true, anchors: true });
      lenis.on("scroll", ScrollTrigger.update);
      frame = (time) => lenis?.raf(time * 1000);
      gsapTicker = gsap;
      gsap.ticker.add(frame);
      gsap.ticker.lagSmoothing(0);
    });

    return () => {
      cancelled = true;
      if (frame && gsapTicker) gsapTicker.ticker.remove(frame);
      lenis?.destroy();
    };
  }, []);
  return null;
}
