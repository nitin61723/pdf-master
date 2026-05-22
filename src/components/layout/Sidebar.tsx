"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import { navigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<string[]>(["Edit & Read"]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleSection = (title: string) => {
    setOpenSections((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );
  };

  const SidebarContent = (
    <div className="flex h-full flex-col bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 w-full overflow-y-auto custom-scrollbar">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
            P
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            PDF Master
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-4 pb-4">
        {/* Project Progress / Tasks */}
        <div className="mb-6 px-3 py-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Project Progress</span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">100%</span>
          </div>
          <div className="h-1.5 w-full bg-indigo-100 dark:bg-indigo-900/30 rounded-full overflow-hidden">
            <div className="h-full w-full bg-indigo-600 rounded-full" />
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Core Infrastructure ✅
            </div>
            <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              PDF Logic (8+ Tools) ✅
            </div>
            <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Authentication & PWA ✅
            </div>
          </div>
        </div>

        {navigationItems.map((section) => (

          <div key={section.title} className="mb-4">
            <button
              onClick={() => toggleSection(section.title)}
              className="flex w-full items-center justify-between py-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {section.title}
              {openSections.includes(section.title) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            
            {openSections.includes(section.title) && (
              <div className="mt-1 space-y-1 ml-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === `/tools/${item.id}`;
                  
                  return (
                    <Link
                      key={item.id}
                      href={`/tools/${item.id}`}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all",
                        isActive
                          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 font-medium"
                          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400")} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">PRO PLAN</p>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Unlock all features</p>
          <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors">
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 h-screen fixed sticky top-0 flex-shrink-0">
        {SidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm">
          <div className="w-72 h-full">
            {SidebarContent}
          </div>
          <button 
            className="absolute inset-0 -z-10 w-full h-full" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
        </div>
      )}
    </>
  );
}
