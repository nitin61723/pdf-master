"use client";

import React from "react";
import { Search, Bell, User, Moon, Sun, LogOut, LogIn } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/context/auth-context";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const { user, loginWithGoogle, logout } = useAuth();

  return (
    <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search for tools..." 
            className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-900 border-none rounded-full text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        
        <button className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950"></span>
        </button>

        <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800 mx-2"></div>

        {user ? (
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 pl-2">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ""} className="h-8 w-8 rounded-full shadow-sm" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                  {(user.displayName || "U").charAt(0)}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-none">
                  {user.displayName || "User"}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Pro Plan active</p>
              </div>
            </button>
            <button 
              onClick={logout}
              className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <button 
            onClick={loginWithGoogle}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-900/20"
          >
            <LogIn className="h-4 w-4" />
            Login
          </button>
        )}
      </div>
    </header>
  );
}

