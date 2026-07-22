import React, { useEffect, useState } from 'react';
import { Building2, ClipboardCheck, AlertOctagon, Users, FileText, RefreshCw, TrendingUp } from 'lucide-react';
import { api } from '../api';

export function AdminDashboard({ t, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.system.getUnits(), api.system.getUnitsAudits()]).then(([units, audits]) => {
      const totalUsers = units.units?.reduce((s, u) => s + (u.user_count || 0), 0) || 0;
      const totalAudits = audits.units?.reduce((s, u) => s + (u.total_audits || 0), 0) || 0;
      const totalNCs = units.units?.reduce((s, u) => s + (u.open_nc_count || 0), 0) || 0;
      const avgScore = audits.units?.length
        ? Math.round(audits.units.reduce((s, u) => s + (u.avg_score || 0), 0) / audits.units.filter(u => u.avg_score).length) || 0
        : 0;

      setData({ units: units.units || [], unitAudits: audits.units || [], totalUsers, totalAudits, totalNCs, avgScore });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-emerald-600" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Overview</span>
        <h2 className="text-3xl font-extrabold text-slate-800 mt-1">System Dashboard</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Building2} label="Total Units" value={data?.units?.length || 0} color="bg-blue-500" onClick={() => onNavigate('units')} />
        <StatCard icon={Users} label="Total Users" value={data?.totalUsers || 0} color="bg-indigo-500" onClick={() => onNavigate('users')} />
        <StatCard icon={ClipboardCheck} label="Total Audits" value={data?.totalAudits || 0} color="bg-emerald-500" onClick={() => onNavigate('audits')} />
        <StatCard icon={AlertOctagon} label="Open NCs" value={data?.totalNCs || 0} color="bg-red-500" onClick={() => onNavigate('notifications')} />
        <StatCard icon={TrendingUp} label="Avg Score" value={`${data?.avgScore || 0}%`} color="bg-purple-500" />
      </div>

      {/* Unit cards */}
      <div>
        <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Building2 size={20} className="text-blue-500" />
          Units Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.units?.map(unit => (
            <div key={unit.id} className="bg-white rounded-xl border border-slate-200 hover:shadow-md transition-shadow p-5 cursor-pointer" onClick={() => onNavigate('audits')}>
              <h4 className="font-bold text-slate-800 text-lg mb-3">{unit.name}</h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-2xl font-extrabold text-blue-600">{unit.user_count || 0}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Users</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-emerald-600">{unit.audit_count || 0}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Audits</div>
                </div>
                <div>
                  <div className={`text-2xl font-extrabold ${(unit.open_nc_count || 0) > 0 ? 'text-red-600' : 'text-slate-400'}`}>{unit.open_nc_count || 0}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Open NCs</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent audits by unit */}
      {data?.unitAudits?.filter(u => u.total_audits > 0).length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <ClipboardCheck size={20} className="text-emerald-500" />
            Audit Summary by Unit
          </h3>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase">
                <tr>
                  <th className="p-3 text-left">Unit</th>
                  <th className="p-3 text-center">Total</th>
                  <th className="p-3 text-center">In Progress</th>
                  <th className="p-3 text-center">Submitted</th>
                  <th className="p-3 text-center">Avg Score</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.unitAudits.map(u => (
                  <tr key={u.unit_id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-700">{u.unit_name}</td>
                    <td className="p-3 text-center">{u.total_audits}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-semibold">{u.in_progress || 0}</span>
                    </td>
                    <td className="p-3 text-center">{u.submitted || 0}</td>
                    <td className="p-3 text-center font-bold">{u.avg_score || '-'}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, onClick }) {
  return (
    <div onClick={onClick} className={`bg-white rounded-xl border border-slate-200 p-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}>
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="text-2xl font-extrabold text-slate-800">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5 font-medium">{label}</div>
    </div>
  );
}
