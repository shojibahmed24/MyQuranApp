import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import Auth from './components/Auth';
import Feed from './components/Feed';
import Dashboard from './components/Dashboard';
import Recorder from './components/Recorder';
import { AlertCircle, Mic, LayoutDashboard, Radio, Bell, User, Zap } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'feed' | 'dashboard'>('feed');
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(data);
  }

  const handleNewConfession = async (path: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('confessions').insert({
      user_id: user.id,
      audio_url: path,
      content: '',
      status: 'active',
      mood_tag: 'Neutral',
      is_anonymous: true
    });

    if (error) alert('Error saving confession: ' + error.message);
    else setView('feed');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-pulse text-emerald-600 font-semibold">EchoVault is waking up...</div>
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Configuration Required</h2>
          <p className="text-zinc-600 text-sm mb-6">Please set your Supabase environment variables.</p>
        </div>
      </div>
    );
  }

  if (!session) return <Auth />;

  return (
    <div className="min-h-screen bg-stone-50 text-zinc-900 font-sans selection:bg-emerald-100">
      {/* Top Navigation */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                <Mic className="text-white w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
                EchoVault
              </h1>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              <button 
                onClick={() => setView('feed')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${view === 'feed' ? 'bg-emerald-50 text-emerald-700' : 'text-zinc-600 hover:text-zinc-900 hover:bg-stone-100'}`}
              >
                Feed
              </button>
              <button 
                onClick={() => setView('dashboard')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${view === 'dashboard' ? 'bg-emerald-50 text-emerald-700' : 'text-zinc-600 hover:text-zinc-900 hover:bg-stone-100'}`}
              >
                Dashboard
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white"></span>
            </button>
            
            {!profile?.is_pro && (
              <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-600 rounded-full text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/10">
                <Zap size={14} fill="currentColor" />
                Upgrade
              </button>
            )}

            <div className="h-8 w-px bg-slate-200 mx-2"></div>

            <button 
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-2 p-1 pr-3 rounded-full bg-stone-100 hover:bg-stone-200 transition-all border border-slate-200"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                <User size={16} />
              </div>
              <span className="text-xs font-semibold text-zinc-700">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
        {view === 'feed' ? <Feed /> : <Dashboard />}
      </main>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 p-4 flex justify-around items-center z-50">
        <button onClick={() => setView('feed')} className={`flex flex-col items-center gap-1 ${view === 'feed' ? 'text-emerald-600' : 'text-zinc-400'}`}>
          <Radio size={20} />
          <span className="text-[10px] font-bold">Feed</span>
        </button>
        <div className="-mt-12">
           <Recorder onUploadComplete={handleNewConfession} />
        </div>
        <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-emerald-600' : 'text-zinc-400'}`}>
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-bold">Stats</span>
        </button>
      </div>

      {/* Desktop Recorder */}
      <div className="hidden md:block fixed bottom-8 right-8 z-50">
        <Recorder onUploadComplete={handleNewConfession} />
      </div>
    </div>
  );
}