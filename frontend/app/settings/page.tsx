"use client";

import React from "react";
import { 
  User, 
  Building, 
  Bell, 
  Shield, 
  CreditCard, 
  Globe, 
  Zap,
  Camera,
  CheckCircle2
} from "lucide-react";
import { config } from "@/lib/config";

const userInitials = config.currentUser.name
  .split(" ")
  .map((namePart) => namePart[0])
  .slice(0, 2)
  .join("")
  .toUpperCase();

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="space-y-1">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Configuration</h1>
        <p className="text-slate-500 font-medium">Manage your personal profiles, institution details, and AI preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Sidebar Settings list */}
        <div className="md:col-span-1 space-y-2">
          {[
            { name: "My Profile", icon: User, active: true },
            { name: "Institution Info", icon: Building },
            { name: "Global Settings", icon: Zap },
            { name: "Notifications", icon: Bell },
            { name: "Security & Privacy", icon: Shield },
            { name: "Billing", icon: CreditCard },
          ].map((item) => (
            <button 
              key={item.name}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-sm transition-all text-left ${
                item.active 
                  ? "bg-white text-slate-900 shadow-xl shadow-slate-200" 
                  : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
              }`}
            >
              <item.icon className={`w-5 h-5 ${item.active ? "text-accent" : "text-slate-300"}`} />
              {item.name}
            </button>
          ))}
        </div>

        {/* Setting Content */}
        <div className="md:col-span-2 space-y-8">
          {/* Profile Section */}
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-50 space-y-10">
            <div className="flex flex-col md:flex-row items-center gap-8 pb-10 border-b border-slate-50">
               <div className="relative group">
                  <div className="w-32 h-32 rounded-full bg-slate-100 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center p-1">
                     <div className="w-full h-full rounded-full bg-slate-200 flex items-center justify-center text-slate-400 font-black text-4xl uppercase">
                        {userInitials}
                     </div>
                  </div>
                  <button className="absolute bottom-1 right-1 w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-all border-2 border-white">
                     <Camera className="w-5 h-5" />
                  </button>
               </div>
               <div className="flex-1 text-center md:text-left space-y-2">
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <h2 className="text-3xl font-black text-slate-900">{config.currentUser.name}</h2>
                    <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5 animate-pulse">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified Educator
                    </div>
                  </div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Principal Researcher @ VedaAI Academy</p>
                  <p className="text-slate-500 font-medium italic text-sm">&quot;Passionate about leveraging AI to empower the next generation of students.&quot;</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Address</label>
                  <div className="relative group">
                     <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-accent transition-colors" />
                     <input 
                      type="text" 
                      defaultValue="john.doe@vedaai.com"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-700 outline-none focus:bg-white focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all shadow-inner"
                     />
                  </div>
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Contact Phone</label>
                  <div className="relative group">
                     <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-accent font-black text-sm transition-colors">+91</div>
                     <input 
                      type="text" 
                      defaultValue="9876543210"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 font-bold text-slate-700 outline-none focus:bg-white focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all shadow-inner"
                     />
                  </div>
               </div>
            </div>

            <div className="pt-6">
                <button className="flex items-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-2xl shadow-slate-300 hover:bg-slate-800 active:scale-[0.98] transition-all">
                  Save Changes Profile
                </button>
            </div>
          </div>

          {/* AI Settings Section */}
          <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl shadow-slate-400 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-40 -mt-40 group-hover:scale-125 transition-all duration-1000"></div>
            <div className="relative z-10 space-y-8">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-accent shadow-xl">
                        <Zap className="w-8 h-8 fill-accent/20" />
                     </div>
                     <div>
                        <h3 className="text-xl font-black">AI Generation Model</h3>
                        <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Optimized for VedaAI Engine 2.0</p>
                     </div>
                  </div>
                  <div className="bg-white/10 p-1.5 rounded-xl border border-white/5">
                     <div className="flex gap-2">
                        <span className="px-3 py-1 bg-white text-slate-900 rounded-lg text-[10px] font-black uppercase">Gemini 2.0</span>
                        <span className="px-3 py-1 hover:bg-white/5 rounded-lg text-[10px] font-black uppercase transition-colors">GPT-4o</span>
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all group/item">
                     <div className="flex items-center gap-4">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        <span className="font-bold text-white/80 group-hover/item:text-white transition-colors">Analytical Engine Power</span>
                     </div>
                     <span className="text-lg font-black text-emerald-400">Extreme</span>
                  </div>
                  <div className="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all group/item">
                     <div className="flex items-center gap-4">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                        <span className="font-bold text-white/80 group-hover/item:text-white transition-colors">Diagram Auto-Gen Mode</span>
                     </div>
                     <span className="text-lg font-black text-indigo-400">Vector (SVG)</span>
                  </div>
               </div>

               <div className="p-6 bg-white/5 rounded-3xl border border-dashed border-white/10">
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-4">API Token Signature</p>
                  <div className="bg-black/20 p-4 rounded-xl flex items-center justify-between">
                     <span className="font-mono text-white/30 truncate pr-10 tracking-widest">veda_ai_key_*****************************9021</span>
                     <button className="text-xs font-black text-accent hover:underline uppercase tracking-widest">Rotate</button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
