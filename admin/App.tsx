import React, { useEffect, useState } from 'react';
import { supabase } from '../app/lib/supabase';
import { 
  ShieldCheck, 
  Users, 
  AlertTriangle, 
  Zap, 
  BarChart3, 
  Settings, 
  Search,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Lock
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, reports: 0, proUsers: 0, activeConfessions: 0 });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  async function checkAdminAndFetch() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profile?.is_admin) {
      setIsAdmin(true);
      await fetchAdminData();
    }
    setLoading(false);
  }

  async function fetchAdminData() {
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: reportCount } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    const { count: proCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_pro', true);
    const { count: confessionCount } = await supabase.from('confessions').select('*', { count: 'exact', head: true }).eq('status', 'active');

    setStats({ 
      users: userCount || 0, 
      reports: reportCount || 0, 
      proUsers: proCount || 0,
      activeConfessions: confessionCount || 0
    });

    const { data: recentReports } = await supabase
      .from('reports')
      .select('*, profiles!reporter_id(username), confessions(id, content, audio_url), comments(id, content, audio_url)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    setReports(recentReports || []);
  }

  async function handleModeration(reportId: string, action: 'resolve' | 'dismiss', targetType: 'confession' | 'comment', targetId: string) {
    setProcessingId(reportId);
    try {
      if (action === 'resolve') {
        // Mark content as removed
        const table = targetType === 'confession' ? 'confessions' : 'comments';
        await supabase.from(table).update({ status: 'removed' }).eq('id', targetId);
        // Mark report as resolved
        await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId);
      } else {
        // Just dismiss the report
        await supabase.from('reports').update({ status: 'dismissed' }).eq('id', reportId);
      }
      
      // Refresh data
      await fetchAdminData();
    } catch (error) {
      console.error('Moderation error:', error);
      alert('Failed to process moderation action.');
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent"></div>
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Lock className="text-red-600" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Access Denied</h1>
        <p className="text-zinc-500 mb-8">You do not have administrative privileges to access this dashboard.</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="w-full py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all"
        >
          Return to EchoVault
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 text-zinc-900 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-600 rounded-2xl shadow-xl shadow-emerald-600/20">
              <ShieldCheck className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Control</h1>
              <p className="text-zinc-500 text-sm font-medium">EchoVault Ecosystem Management</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => fetchAdminData()}
              className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-stone-50 transition-all shadow-sm"
            >
              <Zap size={20} className="text-emerald-600" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
          <AdminStatCard icon={<Users />} label="Total Users" value={stats.users} color="text-emerald-600" trend="+4%" />
          <AdminStatCard icon={<Zap />} label="Pro Members" value={stats.proUsers} color="text-amber-500" trend="+12%" />
          <AdminStatCard icon={<BarChart3 />} label="Active Whispers" value={stats.activeConfessions} color="text-blue-600" trend="+8%" />
          <AdminStatCard icon={<AlertTriangle />} label="Pending Reports" value={stats.reports} color="text-red-500" trend="-2%" />
        </div>

        {/* Main Content Area */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Moderation Queue */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">Moderation Queue</h2>
              <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full">{reports.length} Pending</span>
            </div>
            
            <div className="divide-y divide-slate-50">
              {reports.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="text-emerald-600" size={32} />
                  </div>
                  <p className="text-zinc-500 font-medium">All clear! No pending reports.</p>
                </div>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="p-6 hover:bg-stone-50 transition-colors flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                        <AlertTriangle size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900">Reported by @{report.profiles?.username || 'Anonymous'}</p>
                        <p className="text-xs text-zinc-500 mt-1">Reason: <span className="font-bold text-zinc-700">{report.reason}</span></p>
                        <div className="mt-3 p-3 bg-stone-100 rounded-xl text-xs text-zinc-600 italic border border-slate-200">
                          {report.confessions?.content || report.comments?.content || "[Audio Content Only]"}
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-2 uppercase font-bold tracking-wider">
                          Target: {report.confession_id ? 'Confession' : 'Comment'} • ID: {report.confession_id || report.comment_id}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        disabled={processingId === report.id}
                        onClick={() => handleModeration(
                          report.id, 
                          'resolve', 
                          report.confession_id ? 'confession' : 'comment', 
                          report.confession_id || report.comment_id
                        )}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        title="Remove Content"
                      >
                        <XCircle size={20} className={processingId === report.id ? 'animate-pulse' : ''} />
                      </button>
                      <button 
                        disabled={processingId === report.id}
                        onClick={() => handleModeration(
                          report.id, 
                          'dismiss', 
                          report.confession_id ? 'confession' : 'comment', 
                          report.confession_id || report.comment_id
                        )}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                        title="Dismiss Report"
                      >
                        <CheckCircle2 size={20} className={processingId === report.id ? 'animate-pulse' : ''} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* System Health / Sidebar */}
          <div className="space-y-6">
            <div className="bg-zinc-900 rounded-3xl p-6 text-white shadow-xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Zap size={18} className="text-emerald-400" />
                System Health
              </h3>
              <div className="space-y-4">
                <HealthItem label="API Response" value="99.9%" status="up" />
                <HealthItem label="Storage Usage" value="42%" status="warning" />
                <HealthItem label="Auth Service" value="Stable" status="up" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-2">
                <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-stone-50 text-sm font-medium flex items-center justify-between">
                  Export User Data <MoreHorizontal size={16} />
                </button>
                <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-stone-50 text-sm font-medium flex items-center justify-between">
                  Broadcast Message <MoreHorizontal size={16} />
                </button>
                <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-stone-50 text-sm font-medium flex items-center justify-between text-red-600">
                  Maintenance Mode <MoreHorizontal size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminStatCard({ icon, label, value, color, trend }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2.5 bg-stone-50 rounded-xl text-zinc-400">
          {icon}
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {trend}
        </span>
      </div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-1">{label}</div>
    </div>
  );
}

function HealthItem({ label, value, status }: any) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-zinc-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold">{value}</span>
        <div className={`w-1.5 h-1.5 rounded-full ${status === 'up' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
      </div>
    </div>
  );
}
