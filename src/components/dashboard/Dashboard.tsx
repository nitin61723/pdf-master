"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { navigationItems } from "@/lib/navigation";
import { ArrowRight, Star } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Dashboard() {
  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="mb-12">
        <div className="bg-indigo-600 rounded-3xl p-8 lg:p-12 text-white relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 mb-4 bg-indigo-500/30 w-fit px-3 py-1 rounded-full border border-indigo-400/30 backdrop-blur-sm">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Trusted by 1M+ Users</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold mb-6 leading-tight">
              Powerful PDF Solutions for <br /> Simplified Workflows.
            </h1>
            <p className="text-indigo-100 text-lg mb-8 max-w-lg">
              Everything you need to edit, convert, and manage your PDF documents in one professional workspace. Fast, secure, and easy to use.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="bg-white text-indigo-600 hover:bg-indigo-50 px-6 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-indigo-900/20">
                Explore All Tools
              </button>
              <button className="bg-indigo-500 hover:bg-indigo-400 px-6 py-3 rounded-xl font-bold transition-colors border border-indigo-400">
                Watch Demo
              </button>
            </div>
          </div>
          
          {/* Abstract background shapes */}
          <div className="absolute top-0 right-0 w-1/2 h-full hidden lg:block opacity-20 transform translate-x-20">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-purple-300 rounded-full blur-3xl"></div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      {navigationItems.map((category) => (
        <section key={category.title} className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{category.title}</h2>
            <Link href="#" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {category.items.map((tool) => {
              const Icon = tool.icon;
              return (
                <motion.div key={tool.id} variants={item}>
                  <Link 
                    href={`/tools/${tool.id}`}
                    className="group block p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all hover:shadow-xl hover:shadow-indigo-500/5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {tool.label}
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </section>
      ))}
    </div>
  );
}
