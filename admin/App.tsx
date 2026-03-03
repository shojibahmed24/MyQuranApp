import React, { useEffect, useState } from 'react';
import { supabase } from '../app/lib/supabase';
import { ShieldCheck, Users, AlertTriangle, Zap, BarChart3, Settings } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, reports: 0, proUsers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  async function fetchAdminStats() {
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: reportCount } = await supabase.from('reports').select('*', { count: 'exact', head: true });
    const { count: proCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_pro', true);

    setStats({ 
      users: userCount || 0, 
      reports: reportCount || 0, 
      proUsers: proCount || 0 
    });
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-stone-50 text-zinc-900 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-600/20">
              <ShieldCheck className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Admin Control</h1>
              <p className="text-zinc-500 text-sm font-medium">EchoVault Ecosystem Management</p>
            </div>
          </div>
          <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-stone-50 transition-all shadow-sm">
            <Settings size={20} className="text-zinc-400" />
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <AdminStatCard icon={<Users />} label="Total Users" value={stats.users} color="text-emerald-600" />
          <AdminStatCard icon={<Zap />} label="Pro Members" value={stats.proUsers} color="text-emerald-600" />
          <AdminStatCard icon={<AlertTriangle />} label="Pending Reports" value={stats.reports} color="text-red-500" />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold">Recent Activity</h2>
            <BarChart3 size={20} className="text-zinc-400" />
          </div>
          <div className="text-center py-12 text-zinc-400">
            <p className="font-medium">Moderation queue is empty. Great job!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminStatCard({ icon, label, value, color }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 text-zinc-400 mb-4">
        {icon}
        <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
      </div>
      <div className={`text-4xl font-bold ${color}`}>{value}</div>
    </div>
  );
}