"use client";

import React from "react";
import { BarChart3, Zap, ShieldCheck, CheckCircle2, BrainCircuit } from "lucide-react";
import { motion } from "framer-motion";

interface AnalyticsResult {
  difficultySummary?: {
    easy?: number;
    medium?: number;
    hard?: number;
  };
  syllabusCoverage?: {
    coveredTopics?: string[];
    missingTopics?: string[];
  };
  auditReport?: {
    repetitiveCheck?: string;
    marksTally?: string;
    qualityScore?: number;
    suggestions?: string;
  };
  cognitiveScore?: {
    application?: number;
    rote?: number;
  };
}

interface AnalyticsSidebarProps {
  result: AnalyticsResult;
}

export default function AnalyticsSidebar({ result }: AnalyticsSidebarProps) {
  if (!result) return null;

  const easy = result.difficultySummary?.easy || 0;
  const medium = result.difficultySummary?.medium || 0;
  const hard = result.difficultySummary?.hard || 0;
  const total = easy + medium + hard || 1;
  const ep = (easy / total) * 100;
  const mp = (medium / total) * 100;
  const hp = (hard / total) * 100;

  return (
    <div className="space-y-6 sticky top-6">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-50 transition-all hover:shadow-3xl">
        <h3 className="font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-widest text-xs">
          <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
             <BarChart3 className="w-4 h-4" />
          </div>
          Analytics Profile
        </h3>

        {result.syllabusCoverage && (
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-100/30 rounded-bl-full -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
            <h4 className="text-[10px] font-black uppercase text-indigo-600 mb-4 flex items-center gap-1.5 tracking-widest">
              <Zap className="w-3.5 h-3.5" /> Syllabus Coverage
            </h4>
            <div className="space-y-4 relative z-10">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Covered Ground</span>
                <div className="flex flex-wrap gap-1.5">
                  {(result.syllabusCoverage.coveredTopics || []).map((t: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-white text-emerald-600 rounded-lg border border-emerald-100 text-[9px] font-black uppercase shrink-0 transition-all hover:scale-105">{t}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Red Zones (Missing)</span>
                <div className="flex flex-wrap gap-1.5">
                  {(result.syllabusCoverage.missingTopics || []).map((t: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-white text-rose-500 rounded-lg border border-rose-100 text-[9px] font-black uppercase shrink-0 transition-all hover:scale-105">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="group bg-emerald-50/50 hover:bg-emerald-50 p-4 rounded-2xl border border-emerald-100/50 flex items-center justify-between transition-all">
            <div className="flex flex-col">
               <span className="text-[10px] uppercase font-black text-emerald-600 tracking-widest mb-0.5">Easy Factor</span>
               <span className="text-sm font-black text-slate-700">Foundational</span>
            </div>
            <span className="text-xl font-black text-emerald-600 group-hover:scale-110 transition-transform">{easy}%</span>
          </div>
          <div className="group bg-amber-50/50 hover:bg-amber-50 p-4 rounded-2xl border border-amber-100/50 flex items-center justify-between transition-all">
            <div className="flex flex-col">
               <span className="text-[10px] uppercase font-black text-amber-600 tracking-widest mb-0.5">Medium Factor</span>
               <span className="text-sm font-black text-slate-700">Analytical</span>
            </div>
            <span className="text-xl font-black text-amber-600 group-hover:scale-110 transition-transform">{medium}%</span>
          </div>
          <div className="group bg-rose-50/50 hover:bg-rose-50 p-4 rounded-2xl border border-rose-100/50 flex items-center justify-between transition-all">
            <div className="flex flex-col">
               <span className="text-[10px] uppercase font-black text-rose-600 tracking-widest mb-0.5">Hard Factor</span>
               <span className="text-sm font-black text-slate-700">Complexity</span>
            </div>
            <span className="text-xl font-black text-rose-600 group-hover:scale-110 transition-transform">{hard}%</span>
          </div>
        </div>
        
        <div className="mt-10 p-2 bg-slate-50 rounded-2xl border border-slate-100">
           <div className="w-full flex h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div style={{width: `${ep}%`}} className="h-full bg-emerald-400"></div>
              <div style={{width: `${mp}%`}} className="h-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]"></div>
              <div style={{width: `${hp}%`}} className="h-full bg-rose-400"></div>
           </div>
           <div className="flex justify-between text-[10px] uppercase font-black text-slate-400 mt-3 px-1 tracking-widest">
             <span>Distribution</span>
             <span className="text-slate-900">Adaptive</span>
           </div>
        </div>
      </div>
      
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-50">
        <h3 className="font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-widest text-xs">
          <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
             <ShieldCheck className="w-4 h-4" />
          </div>
          AI Audit Report
        </h3>
        <div className="space-y-6">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
            <div className="mt-1 w-5 h-5 bg-white rounded-lg border border-emerald-100 flex items-center justify-center text-emerald-500 shadow-sm group-hover:scale-110 transition-transform">
               <CheckCircle2 className="w-3 h-3"/>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Marks Tally</p>
              <p className="text-xs font-bold text-slate-800 leading-relaxed">{result.auditReport?.marksTally}</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
            <div className="mt-1 w-5 h-5 bg-white rounded-lg border border-emerald-100 flex items-center justify-center text-emerald-500 shadow-sm group-hover:scale-110 transition-transform">
               <CheckCircle2 className="w-3 h-3"/>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Authenticity</p>
              <p className="text-xs font-bold text-slate-800 leading-relaxed">{result.auditReport?.repetitiveCheck}</p>
            </div>
          </div>
          <div className="pt-6 border-t border-slate-50 flex items-end justify-between">
             <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Quality Score</span>
                <span className="text-2xl font-black text-indigo-600 tracking-tighter">{result.auditReport?.qualityScore}<span className="text-slate-300 text-sm font-bold">/100</span></span>
             </div>
             <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 animate-pulse">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-white/5 text-white relative overflow-hidden group">
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-all duration-700"></div>
        <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700"></div>
        
        <h3 className="font-black mb-10 flex items-center gap-3 uppercase tracking-[0.2em] text-[10px] text-white/40 relative z-10">
          <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center text-white/60">
             <BrainCircuit className="w-4 h-4" />
          </div>
          Cognitive Load
        </h3>
        
        <div className="space-y-8 relative z-10">
          <div className="group/item">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-black tracking-widest uppercase text-white/80 group-hover/item:text-blue-400 transition-colors">Application</span>
              <span className="text-lg font-black text-blue-400">{result.cognitiveScore?.application || 50}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden p-0.5">
              <motion.div 
                style={{ width: `${result.cognitiveScore?.application || 50}%` }} 
                className="h-full bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${result.cognitiveScore?.application || 50}%` }}
              />
            </div>
          </div>
          
          <div className="group/item">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-black tracking-widest uppercase text-white/80 group-hover/item:text-orange-400 transition-colors">Rote / Memory</span>
              <span className="text-lg font-black text-orange-400">{result.cognitiveScore?.rote || 50}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden p-0.5">
              <motion.div 
                style={{ width: `${result.cognitiveScore?.rote || 50}%` }} 
                className="h-full bg-orange-500 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${result.cognitiveScore?.rote || 50}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="mt-10 p-5 bg-white/5 rounded-3xl border border-white/10 text-white/50 relative z-10">
           <Zap className="w-5 h-5 mb-3 text-amber-500 animate-bounce" />
           <p className="text-[11px] font-bold leading-relaxed italic">
             {result.auditReport?.suggestions || "This paper maintains an optimal balance between foundational knowledge and complex analysis."}
           </p>
        </div>
      </div>
    </div>
  );
}
