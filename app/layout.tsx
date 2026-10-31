import type { Metadata } from "next";
import "./globals.css";
import { SiteNav, PageFrame, Footer } from "@/components/site-shell";
import { SmoothScroll } from "@/components/smooth-scroll";
import { ProblemProvider } from "@/lib/problem-context";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "FUNDWISE — Exact Budget Optimizer",
  description: "Explore every possible funding combination. Find the exact budget match. Discover the smallest team.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>
    <ProblemProvider>
      <SmoothScroll />
      <SiteNav />
      <PageFrame>{children}</PageFrame>
      <Footer />
      <Toaster theme="dark" position="bottom-right" richColors />
    </ProblemProvider>
  </body></html>;
}
