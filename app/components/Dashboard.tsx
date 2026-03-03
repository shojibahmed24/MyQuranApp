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
  Filter
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

  const emotions = [
    { label: 'Sad', value: 32, color: 'bg-blue-400' },
    { label: 'Hopeful', value: 21, color: 'bg-emerald-400' },
    { label: 'Angry', value: 14, color: 'bg-red-400' },
    { label: 'Lonely', value: 18, color: 'bg-slate-400' },
    { label: 'Neutral', value: 15, color: 'bg-zinc-400' },
  ];

  if (loading) return <div className="text-zinc-500 animate-pulse">Analyzing your vault...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={<Play size={18} />} label="Total Plays" value={stats.totalPlays.toLocaleString()} subtext="Lifetime" />
        <StatCard icon={<Clock size={18} />} label="Avg Duration" value="2:45" subtext="Per session" />
        <StatCard icon={<Heart size={18} />} label="Reactions" value={stats.totalReactions.toString()} subtext="Across all posts" />
        <StatCard icon={<MessageSquare size={18} />} label="Comments" value={stats.totalComments.toString()} subtext="Voice & Text" />
        <StatCard icon={<TrendingUp size={18} />} label="Growth" value={stats.growth} subtext="Last 7 days" color="text-emerald-600" />
        <StatCard icon={<Brain size={18} />} label="Emotional" value={`${stats.emotionalScore}%`} subtext="Vulnerability" color="text-emerald-600" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Emotional Breakdown */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-zinc-900">Emotional Breakdown</h3>
            <Sparkles size={18} className="text-emerald-500" />
          </div>
          
          <div className="relative h-48 flex items-center justify-center mb-8">
             <svg className="w-40 h-40 transform -rotate-90">
                <circle cx="80" cy="80" r="70" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                <circle cx="80" cy="80" r="70" fill="transparent" stroke="#10b981" strokeWidth="12" strokeDasharray="440" strokeDashoffset="110" />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-zinc-900">84%</span>
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Score</span>
             </div>
          </div>

          <div className="space-y-3">
            {emotions.map(e => (
              <div key={e.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${e.color}`}></div>
                  <span className="text-sm text-zinc-600">{e.label}</span>
                </div>
                <span className="text-sm font-semibold text-zinc-900">{e.value}%</span>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
            <p className="text-xs text-emerald-800 leading-relaxed">
              “Your audience connects most with emotionally vulnerable content posted at night.”
            </p>
          </div>
        </div>

        {/* My Confessions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-zinc-900">My Confessions</h3>
            <div className="flex gap-2">
              <button className="p-2 bg-white border border-slate-200 rounded-xl text-zinc-400 hover:text-zinc-900 transition-colors shadow-sm">
                <Filter size={18} />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-stone-50 transition-all shadow-sm">
                View All <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {confessions.slice(0, 4).map(c => (
              <ConfessionCard 
                key={c.id} 
                confession={{
                  ...c,
                  reactions: c.reactions?.map((r: any) => ({ type: r.reaction_type, user_id: r.user_id }))
                }} 
              />
            ))}
          </div>

          {/* AI Insights Panel */}
          <div className="bg-emerald-600 rounded-2xl p-8 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-white">
              <Sparkles size={120} />
            </div>
            <div className="relative z-10 text-white">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Brain size={20} className="text-white" />
                </div>
                <h3 className="font-bold text-xl">AI Insights</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <InsightItem title="Best Posting Time" value="Tuesdays at 9:00 PM" />
                  <InsightItem title="Emotional Trend" value="Increasing Vulnerability" />
                </div>
                <div className="space-y-4">
                  <InsightItem title="Audience Psychology" value="Resonates with slow-paced audio" />
                  <InsightItem title="Suggested Tags" value="#LateNight #Healing #Truth" />
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-sm text-emerald-50 italic">
                  “Posts with slower tone and soft pauses have 22% higher completion rate.”
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subtext, color = "text-zinc-900" }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-emerald-200 transition-all group shadow-sm">
      <div className="flex items-center gap-2 text-zinc-400 mb-2 group-hover:text-emerald-600 transition-colors">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-2xl font-bold mb-1 ${color}`}>{value}</div>
      <div className="text-[10px] text-zinc-500 font-medium">{subtext}</div>
    </div>
  );
}

function InsightItem({ title, value }: any) {
  return (
    <div>
      <div className="text-[10px] text-emerald-100 uppercase font-bold tracking-widest mb-1">{title}</div>
      <div className="text-sm font-semibold text-white">{value}</div>
    </div>
  );
}