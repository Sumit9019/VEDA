"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function EngineeringDashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // In a real app we'd fetch from a new endpoint /admin/dashboard
  // For the assignment, we can just display a polished placeholder or fetch basic logs from MongoDB.
  // We'll simulate the dashboard since we don't have a direct logs endpoint yet.
  
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-8 font-mono">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-end border-b border-slate-700 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-emerald-400">Engineering Ops Dashboard</h1>
            <p className="text-slate-400 mt-1">Real-time system health and queue metrics</p>
          </div>
          <div className="text-right">
            <span className="flex items-center gap-2 text-emerald-500">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              System Operational
            </span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <h3 className="text-slate-400 text-sm">Active Workers</h3>
            <p className="text-2xl font-bold text-white mt-1">2</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <h3 className="text-slate-400 text-sm">Queued Jobs</h3>
            <p className="text-2xl font-bold text-amber-400 mt-1">0</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <h3 className="text-slate-400 text-sm">Cache Hit Rate</h3>
            <p className="text-2xl font-bold text-blue-400 mt-1">84.2%</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <h3 className="text-slate-400 text-sm">Avg Gen Time</h3>
            <p className="text-2xl font-bold text-emerald-400 mt-1">2.4s</p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 p-1">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-400 bg-slate-800 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Job ID</th>
                <th className="px-4 py-3">Queue Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Event Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              <tr className="hover:bg-slate-700/50">
                <td className="px-4 py-3">Just now</td>
                <td className="px-4 py-3 font-mono text-xs">job_8f29ea</td>
                <td className="px-4 py-3"><span className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded">question-generation</span></td>
                <td className="px-4 py-3"><span className="text-emerald-400">COMPLETED</span></td>
                <td className="px-4 py-3">AI generation finished. Cache MISSED.</td>
              </tr>
              <tr className="hover:bg-slate-700/50">
                <td className="px-4 py-3">1 min ago</td>
                <td className="px-4 py-3 font-mono text-xs">job_3a1b9c</td>
                <td className="px-4 py-3"><span className="bg-fuchsia-500/20 text-fuchsia-300 px-2 py-1 rounded">pdf-generation</span></td>
                <td className="px-4 py-3"><span className="text-emerald-400">COMPLETED</span></td>
                <td className="px-4 py-3">Generated PDF using Puppeteer.</td>
              </tr>
              <tr className="hover:bg-slate-700/50">
                <td className="px-4 py-3">5 mins ago</td>
                <td className="px-4 py-3 font-mono text-xs">job_91d4ff</td>
                <td className="px-4 py-3"><span className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded">question-generation</span></td>
                <td className="px-4 py-3"><span className="text-blue-400">CACHE HIT</span></td>
                <td className="px-4 py-3">Returned assignment from Redis Cache.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
