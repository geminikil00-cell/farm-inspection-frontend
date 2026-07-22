import React, { useEffect, useState } from 'react';
import {
  ClipboardCheck, AlertOctagon, TrendingUp, Users, Clock,
  CheckCircle, FileText, Play, RefreshCw, Activity, BarChart3,
  ChevronRight
} from 'lucide-react';
import { api } from '../api';
import { useAuth, ROLES } from '../context/AuthContext';

export function Dashboard({ t, onNavigate }) {
  const { role, orgName, username } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><RefreshCw className="w-8 h-8 animate-spin text-green-600" /></div>;
  }

  const nc = data?.nc || {};
  const audits = data?.audits || {};

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t.dashboard || 'Dashboard'}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {orgName} · {t[role] || role} — {username}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard icon={ClipboardCheck} label={t.totalAudits || 'Total Audits'} value={audits.total || 0} color="bg-blue-500" onClick={() => onNavigate?.('audits')} />
        <StatCard icon={AlertOctagon} label={t.openNCs || 'Open NCs'} value={nc.open_count || 0} color="bg-red-500" onClick={() => onNavigate?.('ncs')} />
        <StatCard icon={CheckCircle} label={t.closedNCs || 'Closed NCs'} value={nc.closed || 0} color="bg-green-500" />
        <StatCard icon={Clock} label={t.overdue || 'Overdue'} value={nc.overdue || 0} color="bg-orange-500" urgent={nc.overdue > 0} />
        {(role === ROLES.ORG_ADMIN || role === ROLES.SUPER_ADMIN) && (
          <StatCard icon={Users} label={t.team || 'Team'} value={data?.userCount || 0} color="bg-indigo-500" onClick={() => onNavigate?.('admin')} />
        )}
        <StatCard icon={TrendingUp} label={t.avgScore || 'Avg Score'} value={`${audits.avg_score || 0}%`} color="bg-purple-500" />
        <StatCard icon={BarChart3} label={t.passRate || 'Pass Rate'} value={audits.total ? `${Math.round((audits.passed || 0) / audits.total * 100)}%` : '-'} color="bg-cyan-500" />
      </div>

      {/* Role-specific sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <Activity size={18} className="text-blue-500" />
              {t.auditOverview || 'Audit Overview'}
            </h3>
          </div>
          <div className="space-y-3">
            <ProgressRow label={t.inProgress || 'In Progress'} value={audits.in_progress || 0} total={audits.total || 1} color="bg-blue-500" />
            <ProgressRow label={t.submitted || 'Submitted'} value={audits.submitted || 0} total={audits.total || 1} color="bg-green-500" />
            <ProgressRow label={t.passed || 'Passed'} value={audits.passed || 0} total={audits.submitted || 1} color="bg-emerald-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <AlertOctagon size={18} className="text-red-500" />
              {t.ncOverview || 'NC Overview'}
            </h3>
          </div>
          <div className="space-y-3">
            <ProgressRow label={t.open || 'Open'} value={nc.open_count || 0} total={nc.total || 1} color="bg-red-500" />
            <ProgressRow label={t.inProgress || 'In Progress'} value={nc.in_progress || 0} total={nc.total || 1} color="bg-blue-500" />
            <ProgressRow label={t.underReview || 'Under Review'} value={nc.under_review || 0} total={nc.total || 1} color="bg-purple-500" />
            <ProgressRow label={t.overdue || 'Overdue'} value={nc.overdue || 0} total={nc.total || 1} color="bg-orange-600" urgent />
          </div>
        </div>
      </div>

      {/* My tasks */}
      {(role === ROLES.AUDITOR || role === ROLES.DEPT_HEAD || role === ROLES.QUALITY_MGR) && (
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-orange-500" />
            {t.myTasks || 'My Tasks'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {role !== ROLES.QUALITY_MGR && (
              <TaskCard icon={ClipboardCheck} label={t.myAudits || 'My Audits'} value={data?.myAudits || 0} onClick={() => onNavigate?.('audits')} color="bg-blue-50 text-blue-700" />
            )}
            <TaskCard icon={AlertOctagon} label={t.myNCs || 'My NCs'} value={nc.assigned_to_me || 0} onClick={() => onNavigate?.('ncs')} color="bg-red-50 text-red-700" />
            {role === ROLES.QUALITY_MGR && (
              <TaskCard icon={CheckCircle} label={t.underReview || 'Under Review'} value={nc.under_review || 0} onClick={() => onNavigate?.('ncs')} color="bg-purple-50 text-purple-700" />
            )}
            <TaskCard icon={FileText} label={t.startAudit || 'Start Audit'} value="+" onClick={() => onNavigate?.('audits')} color="bg-green-50 text-green-700" />
          </div>
        </div>
      )}

      {/* Recent audits */}
      {data?.recentAudits?.length > 0 && (
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <FileText size={18} className="text-gray-500" />
            {t.recentAudits || 'Recent Audits'}
          </h3>
          <div className="space-y-2">
            {data.recentAudits.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-2 h-2 rounded-full ${a.passed ? 'bg-green-500' : a.status === 'in_progress' ? 'bg-blue-500' : 'bg-red-500'}`} />
                  <div className="truncate">
                    <span className="font-medium text-gray-700">{a.template_name}</span>
                    <span className="text-gray-400 ml-2 text-xs">{a.audit_date?.split('T')[0]}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400">{a.inspector}</span>
                  {a.status === 'submitted' && (
                    <span className={`text-xs font-bold ${a.passed ? 'text-green-600' : 'text-red-600'}`}>
                      {a.overall_score}%
                    </span>
                  )}
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                    a.status === 'submitted' ? (a.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700') : 'bg-blue-100 text-blue-700'
                  }`}>
                    {a.status === 'in_progress' ? 'Draft' : a.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, urgent, onClick }) {
  const El = onClick ? 'button' : 'div';
  return (
    <El onClick={onClick} className={`bg-white rounded-xl border p-4 ${onClick ? 'hover:shadow-md transition-shadow cursor-pointer' : ''} ${urgent ? 'ring-2 ring-red-300' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
      <div className="text-2xl font-extrabold text-gray-800">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </El>
  );
}

function ProgressRow({ label, value, total, color, urgent }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className={`font-bold ${urgent ? 'text-red-600' : 'text-gray-700'}`}>{value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function TaskCard({ icon: Icon, label, value, onClick, color }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 p-3 rounded-xl ${color} hover:opacity-90 transition-opacity`}>
      <Icon size={18} />
      <div className="text-start">
        <div className="text-lg font-bold">{value}</div>
        <div className="text-xs font-medium opacity-80">{label}</div>
      </div>
      <ChevronRight size={16} className="ml-auto opacity-50" />
    </button>
  );
}
