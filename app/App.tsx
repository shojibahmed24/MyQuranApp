import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import Auth from './components/Auth';
import Feed from './components/Feed';
import Dashboard from './components/Dashboard';
import Recorder from './components/Recorder';
import { 
  Mic, 
  LayoutDashboard, 
  Radio, 
  Bell, 
  User, 
  Plus, 
  X,
  Settings,
  LogOut
} from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'feed' | 'dashboard'>('feed');
  const [profile, setProfile] = useState<any>(null);
  const [showRecorder, setShowRecorder] = useState(false);

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
    if (data) setProfile(data);
  }

  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500 font-medium animate-pulse">EchoVault is warming up...</p>
      </div>
    </div>
  );

  if (!session) return <Auth />;

  return (
    <div className="min-h-screen bg-stone-50 text-zinc-900 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <Radio className="text-white" size={18} />
            </div>
            <h1 className="text-lg font-bold tracking-tight">EchoVault</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors">
              <Bell size={20} />
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400">
                  <User size={16} />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {view === 'feed' ? <Feed /> : <Dashboard />}
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-6 z-40">
        <button 
          onClick={() => setShowRecorder(!showRecorder)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
            showRecorder ? 'bg-zinc-900 rotate-45' : 'bg-emerald-600 hover:scale-110 shadow-emerald-600/40'
          }`}
        >
          {showRecorder ? <Plus className="text-white" size={28} /> : <Mic className="text-white" size={28} />}
        </button>
      </div>

      {/* Recorder Overlay */}
      {showRecorder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Record a Whisper</h3>
              <button onClick={() => setShowRecorder(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <Recorder onUploadComplete={() => setShowRecorder(false)} />
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 z-30">
        <div className="max-w-md mx-auto flex justify-around items-center">
          <button 
            onClick={() => setView('feed')}
            className={`flex flex-col items-center gap-1 transition-all ${view === 'feed' ? 'text-emerald-600' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            <Radio size={24} className={view === 'feed' ? 'animate-pulse' : ''} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Feed</span>
          </button>
          
          <button 
            onClick={() => setView('dashboard')}
            className={`flex flex-col items-center gap-1 transition-all ${view === 'dashboard' ? 'text-emerald-600' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            <LayoutDashboard size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Vault</span>
          </button>

          <button 
            onClick={() => supabase.auth.signOut()}
            className="flex flex-col items-center gap-1 text-zinc-400 hover:text-red-500 transition-all"
          >
            <LogOut size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Exit</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
