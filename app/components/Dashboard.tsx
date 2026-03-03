import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, 
  Play, 
  Clock, 
  Heart, 
  MessageSquare, 
  Brain, 
  Sparkles, 
  ChevronRight,
  Activity,
  Shield
} from 'lucide-react';
import ConfessionCard from './ConfessionCard';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalPlays: 0,
    avgDuration: '0:00',
    totalReactions: 0,
    totalComments: 0,
    growth: '+12%',
    emotionalScore: 84
  });
  const [confessions, setConfessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userConfessions } = await supabase
      .from('confessions')
      .select(`
        *,
        reactions (reaction_type, user_id),
        comments (id)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (userConfessions) {
      setConfessions(userConfessions);
      
      const plays = userConfessions.reduce((acc, curr) => acc + (curr.plays_count || 0), 0);
      const reactions = userConfessions.reduce((acc, curr) => acc + (curr.reactions?.length || 0), 0);
      const comments = userConfessions.reduce((acc, curr) => acc + (curr.comments?.length || 0), 0);
      
      setStats(prev => ({
        ...prev,
        totalPlays: plays,
        totalReactions: reactions,
        totalComments: comments
      }));
    }
    setLoading(false);
  }

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-32 bg-slate-200 rounded-2xl" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-24 bg-slate-200 rounded-2xl" />
        <div className="h-24 bg-slate-200 rounded-2xl" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero Stats Card */}
      <div className="relative overflow-hidden bg-zinc-900 rounded-3xl p-8 text-white shadow-2xl shadow-zinc-900/20">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="text-emerald-400" size={16} />
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Your Impact</span>
          </div>
          <div className="flex items-end gap-4">
            <h2 className="text-5xl font-bold tracking-tighter">{stats.totalPlays}</h2>
            <div className="mb-2 flex items-center gap-1 text-emerald-400 text-sm font-bold">
              <TrendingUp size={16} />
              <span>{stats.growth}</span>
            </div>
          </div>
          <p className="text-zinc-400 text-sm mt-1">Total listeners reached this month</p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard 
          icon={<Heart className="text-rose-500" size={20} />} 
          label="Reactions" 
          value={stats.totalReactions} 
          sub="Community love"
        />
        <StatCard 
          icon={<MessageSquare className="text-blue-500" size={20} />} 
          label="Echoes" 
          value={stats.totalComments} 
          sub="Voice replies"
        />
      </div>

      {/* Emotional Pulse Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <Brain className="text-emerald-600" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900">Emotional Pulse</h3>
              <p className="text-xs text-zinc-500">AI-driven sentiment analysis</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-emerald-600">{stats.emotionalScore}%</span>
            <p className="text-[10px] font-bold text-zinc-400 uppercase">Stability</p>
          </div>
        </div>
        
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000"
            style={{ width: `${stats.emotionalScore}%` }}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Activity size={20} className="text-emerald-600" />
            Your Whispers
          </h3>
          <button className="text-xs font-bold text-emerald-600 hover:underline">View All</button>
        </div>

        <div className="space-y-4">
          {confessions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
              <p className="text-zinc-400 text-sm">You haven't shared any whispers yet.</p>
            </div>
          ) : (
            confessions.slice(0, 3).map((c) => (
              <ConfessionCard 
                key={c.id} 
                confession={{
                  ...c,
                  reactions: c.reactions?.map((r: any) => ({ type: r.reaction_type, user_id: r.user_id }))
                }} 
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:border-emerald-200 transition-all group">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-stone-50 rounded-xl group-hover:bg-emerald-50 transition-colors">
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-zinc-900">{value}</div>
      <p className="text-[10px] text-zinc-400 font-medium">{sub}</p>
    </div>
  );
}
