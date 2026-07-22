import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Clock, RefreshCw, Check } from 'lucide-react';
import { api } from '../api';

const TONE_ICONS = { success: CheckCircle2, warning: AlertTriangle, info: Clock };
const TONE_COLORS = { success: 'bg-emerald-100 text-emerald-700', warning: 'bg-red-100 text-red-700', info: 'bg-blue-100 text-blue-700' };

export function SystemNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { const r = await api.notifications.get(); setNotifications(r.notifications || []); } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(); const i = setInterval(load, 30000); return () => clearInterval(i); }, []);

  const markRead = async (id) => {
    try { await api.notifications.markRead(id); setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_status: true } : n)); } catch (_) {}
  };

  const markAllRead = async () => {
    try { await api.notifications.markAllRead(); setNotifications(prev => prev.map(n => ({ ...n, read_status: true }))); } catch (_) {}
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-emerald-600" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">Alerts</span>
          <h2 className="text-3xl font-extrabold text-slate-800 mt-1">Notifications</h2>
        </div>
        {notifications.some(n => !n.read_status) && (
          <button onClick={markAllRead} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">
            <Check size={14} /> Mark all read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.map(n => {
          const Icon = TONE_ICONS[n.tone] || Clock;
          const colorClass = TONE_COLORS[n.tone] || 'bg-slate-100 text-slate-600';
          return (
            <div key={n.id} onClick={() => !n.read_status && markRead(n.id)} className={`bg-white rounded-xl border p-4 flex items-start gap-3 hover:shadow-sm transition-shadow cursor-pointer ${!n.read_status ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : 'border-slate-200'}`}>
              <div className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center flex-shrink-0`}>
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${!n.read_status ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>{n.title}</span>
                  {!n.read_status && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                </div>
                <p className="text-xs text-slate-500 mt-1">{n.details}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-slate-400">{new Date(n.created_at).toLocaleString()}</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-500 uppercase">{n.type?.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </div>
          );
        })}
        {notifications.length === 0 && (
          <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
            <Bell size={40} className="mx-auto mb-3 opacity-40" />
            <p>No notifications yet</p>
            <p className="text-xs mt-1">You'll be notified when audits are submitted or templates published</p>
          </div>
        )}
      </div>
    </div>
  );
}
