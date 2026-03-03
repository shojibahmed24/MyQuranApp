import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import ConfessionCard from './ConfessionCard';
import { Search } from 'lucide-react';

export default function Feed() {
  const [confessions, setConfessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchConfessions();

    const channel = supabase
      .channel('public:confessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'confessions' }, () => {
        fetchConfessions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  async function fetchConfessions() {
    let query = supabase
      .from('confessions')
      .select(`
        *,
        reactions (reaction_type, user_id)
      `)
      .eq('status', 'active');

    if (filter === 'popular') query = query.order('plays_count', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) console.error('Error fetching confessions:', error);
    else setConfessions(data || []);
    setLoading(false);
  }

  if (loading) return <div className="text-center py-12 text-zinc-500 text-sm animate-pulse font-medium">Listening to the world...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input 
            type="text" 
            placeholder="Search whispers..." 
            className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {['all', 'popular', 'recent'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${filter === f ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6">
        {confessions.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-200">
            <p className="text-zinc-500 text-sm font-medium">The vault is silent. Be the first to speak.</p>
          </div>
        ) : (
          confessions.map((confession) => (
            <ConfessionCard 
              key={confession.id} 
              confession={{
                ...confession,
                reactions: confession.reactions?.map((r: any) => ({ type: r.reaction_type, user_id: r.user_id }))
              }} 
            />
          ))
        )}
      </div>
    </div>
  );
}