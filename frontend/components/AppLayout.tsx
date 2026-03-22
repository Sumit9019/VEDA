"use client";

import React from "react";
import { Sidebar, MobileNav, AppHeader } from "./Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen bg-[#efefef] [background-image:radial-gradient(circle_at_center,_rgba(255,255,255,0.92)_0%,_rgba(243,243,245,0.96)_45%,_rgba(234,234,236,1)_100%)]"
      style={{ ["--sidebar-width" as string]: "328px" }}
    >
      <Sidebar />
      <MobileNav />
      <AppHeader />

      <main className="min-h-screen pb-28 pt-20 lg:pl-[var(--sidebar-width)] lg:pb-8 lg:pt-[84px]">
        <div className="w-full px-4 md:px-6 lg:px-5">
          {children}
        </div>
      </main>
    </div>
  );
}
