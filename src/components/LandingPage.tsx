import React, { useState } from "react";
import { User, ShieldAlert, Award, GraduationCap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { loginUser, registerUser } from "../services/api";
import { User as UserType } from "../types";

interface LandingPageProps {
  onLoginSuccess: (user: UserType) => void;
}

export default function LandingPage({ onLoginSuccess }: LandingPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<"student" | "teacher">("student");
  
  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Default credentials info popover
  const [showDemoInfo, setShowDemoInfo] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        // Log in
        const user = await loginUser(email, password);
        onLoginSuccess(user);
      } else {
        // Sign up
        if (!name.trim()) throw new Error("Please enter your full name.");
        const user = await registerUser(name, email, password, role);
        onLoginSuccess(user);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadDemoUser = (userRole: "student" | "teacher") => {
    setError("");
    if (userRole === "student") {
      setEmail("aryankarna_btechedit2024@kusoed.edu.np");
      setPassword("password123");
      setRole("student");
    } else {
      setEmail("prof.vance@kusoed.edu.np");
      setPassword("password123");
      setRole("teacher");
    }
    setIsLogin(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-blue-100 overflow-x-hidden font-sans">
      {/* Top Header Section */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white border-b border-slate-200 shadow-soft sticky top-0 z-50 w-full"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <button 
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2.5 cursor-pointer group hover:opacity-90 transition-opacity text-left focus:outline-none"
            title="EduNest Home"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-900 flex items-center justify-center text-white shadow-soft">
              <GraduationCap className="w-5.5 h-5.5" />
            </div>
            <span className="font-display font-extrabold text-2xl tracking-tight text-blue-900">EduNest</span>
          </button>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setIsLogin(true);
              }}
              className="text-slate-600 hover:text-blue-900 font-medium transition-colors text-xs cursor-pointer"
            >
              Sign In
            </button>
            <button 
              onClick={() => {
                setIsLogin(false);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 transition-colors shadow-soft cursor-pointer"
            >
              Register Portal
            </button>
          </div>
        </div>
      </motion.header>

      {/* Main Container - perfectly centered minimal login */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-slate-100/20 pointer-events-none" />
        
        <div className="max-w-md w-full mx-auto relative z-10 space-y-6 flex flex-col items-center">
          
          {/* Header Title with animations */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center space-y-2"
          >
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-blue-950 tracking-tight leading-none px-2">
              EduNest Academic Portal
            </h1>
            
            <p className="text-slate-500 text-xs sm:text-sm max-w-xs mx-auto px-4">
              Welcome to the official syllabus, assignments, and curriculum portal.
            </p>
          </motion.div>

          {/* Centered Minimal Access Form Wrapper */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            id="auth-panel" 
            className="w-full px-2 sm:px-0"
          >
            <div className="bg-white rounded-2xl p-5 sm:p-6 md:p-8 shadow-premium border border-slate-200">
              {/* Login / Register Tab Switches */}
              <div className="flex border-b border-slate-100 mb-6 relative">
                <button
                  type="button"
                  onClick={() => { setIsLogin(true); setError(""); }}
                  className={`flex-1 pb-3 text-center font-display font-bold text-xs transition-all cursor-pointer relative ${
                    isLogin ? "text-blue-900" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Portal Access
                  {isLogin && (
                    <motion.div 
                      layoutId="activeTabUnderline" 
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-900" 
                    />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setIsLogin(false); setError(""); }}
                  className={`flex-1 pb-3 text-center font-display font-bold text-xs transition-all cursor-pointer relative ${
                    !isLogin ? "text-blue-900" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Create Account
                  {!isLogin && (
                    <motion.div 
                      layoutId="activeTabUnderline" 
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-900" 
                    />
                  )}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="p-3 bg-red-50 border border-red-200 text-red-750 text-xs rounded-lg flex items-start gap-2"
                    >
                      <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence initial={false}>
                  {!isLogin && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rohan Sharma"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:ring-1 focus:ring-blue-900 focus:bg-white outline-none transition-all"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Academic Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@kusoed.edu.np"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:ring-1 focus:ring-blue-900 focus:bg-white outline-none transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:ring-1 focus:ring-blue-900 focus:bg-white outline-none transition-all"
                  />
                </div>

                <AnimatePresence initial={false}>
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Platform Role
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setRole("student")}
                          className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border transition-all text-xs font-bold cursor-pointer ${
                            role === "student"
                              ? "bg-blue-50 border-blue-900 text-blue-900 shadow-soft"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <User className="w-3.5 h-3.5" />
                          Student
                        </button>
                        <button
                          type="button"
                          onClick={() => setRole("teacher")}
                          className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border transition-all text-xs font-bold cursor-pointer ${
                            role === "teacher"
                              ? "bg-blue-50 border-blue-900 text-blue-900 shadow-soft"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <GraduationCap className="w-3.5 h-3.5" />
                          Teacher
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-blue-900 text-white py-3 rounded-xl font-bold hover:bg-blue-950 transition-colors shadow-soft flex items-center justify-center disabled:opacity-50 cursor-pointer text-xs uppercase tracking-wider"
                >
                  {loading ? "Processing..." : isLogin ? "Enter Dashboard" : "Register & Access"}
                </button>

                {/* Integrated Demo Credentials Option */}
                {showDemoInfo && (
                  <div className="border-t border-slate-100 pt-4 mt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                        Demo Credentials Quick Tap
                      </span>
                      <button 
                        type="button"
                        onClick={() => setShowDemoInfo(false)}
                        className="text-[9px] text-blue-900 hover:underline font-bold cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => loadDemoUser("student")}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-900 rounded-xl border border-slate-200 hover:border-blue-200 transition-all text-slate-700 font-bold cursor-pointer text-[11px]"
                      >
                        <User className="w-3.5 h-3.5 text-blue-700" />
                        Student Demo
                      </button>
                      <button
                        type="button"
                        onClick={() => loadDemoUser("teacher")}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 rounded-xl border border-slate-200 hover:border-emerald-200 transition-all text-slate-700 font-bold cursor-pointer text-[11px]"
                      >
                        <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                        Teacher Demo
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
