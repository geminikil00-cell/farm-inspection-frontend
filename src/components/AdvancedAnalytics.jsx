import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, BarChart2, PieChart as PieIcon, Download,
  RefreshCw, AlertOctagon, ClipboardCheck, Activity, FileText
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { api } from '../api';

const NC_COLORS = { Critical: '#dc2626', Major: '#f97316', Minor: '#eab308', Observation: '#3b82f6' };
const STATUS_COLORS = { open: '#ef4444', assigned: '#f97316', in_progress: '#3b82f6', action_taken: '#8b5cf6', under_review: '#6366f1', closed: '#22c55e', reopened: '#eab308' };
const AUDIT_COLORS = ['#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#06b6d4', '#ec4899'];

export function AdvancedAnalytics({ t, onNavigate }) {
  const [tab, setTab] = useState('audits');
  const [auditData, setAuditData] = useState(null);
  const [ncData, setNCData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getAnalyticsAudits(),
      api.getAnalyticsNCs(),
    ]).then(([ad, nd]) => {
      setAuditData(ad);
      setNCData(nd);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleExportCSV = (type) => {
    const token = localStorage.getItem('farm_token');
    const base = import.meta.env.VITE_API_URL || '';
    const url = `${base}/api/analytics/export/${type}`;
    const link = document.createElement('a');
    link.href = url + `?token=${token}`;
    link.download = `${type}.csv`;
    link.click();
  };

  if (loading) {
    return <div className="flex justify-center py-12"><RefreshCw className="w-8 h-8 animate-spin text-green-600" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <BarChart2 className="text-purple-600" size={22} />
          {t.analytics || 'Analytics'}
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 p-1 rounded-lg border">
            <button onClick={() => setTab('audits')} className={`px-3 py-1.5 text-xs font-semibold rounded-md ${tab === 'audits' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>
              <ClipboardCheck size={13} className="inline mr-1" /> {t.audits || 'Audits'}
            </button>
            <button onClick={() => setTab('ncs')} className={`px-3 py-1.5 text-xs font-semibold rounded-md ${tab === 'ncs' ? 'bg-white shadow text-red-600' : 'text-gray-500'}`}>
              <AlertOctagon size={13} className="inline mr-1" /> {t.ncs || 'NCs'}
            </button>
          </div>
          <button onClick={() => handleExportCSV(tab)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg">
            <Download size={13} /> CSV
          </button>
        </div>
      </div>

      {tab === 'audits' && auditData && (
        <div className="space-y-6">
          {/* Overall stats */}
          {auditData.overall && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KPI label={t.totalAudits || 'Total'} value={auditData.overall.total_all || 0} color="bg-blue-500" />
              <KPI label={t.avgScore || 'Avg Score'} value={`${auditData.overall.overall_avg || 0}%`} color="bg-purple-500" />
              <KPI label={t.passed || 'Passed'} value={auditData.overall.total_passed || 0} color="bg-green-500" />
              <KPI label={t.passRate || 'Pass Rate'} value={`${auditData.overall.total_all ? Math.round((auditData.overall.total_passed || 0) / auditData.overall.total_all * 100) : 0}%`} color="bg-emerald-500" />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard icon={TrendingUp} title={t.performanceTrend || 'Score Trend'} color="text-blue-500">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={auditData.monthly || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis domain={[0, 100]} fontSize={11} />
                  <Tooltip />
                  <Line type="monotone" dataKey="avg_score" name="Avg Score" stroke="#3b82f6" strokeWidth={3} dot />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard icon={BarChart2} title={t.byTemplate || 'By Template'} color="text-purple-500">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={auditData.byTemplate || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} fontSize={11} />
                  <YAxis dataKey="template_name" type="category" width={120} fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="avg_score" name="Avg Score" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard icon={Activity} title={t.monthlyVolume || 'Audits per Month'} color="text-emerald-500" className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={auditData.monthly || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" name="Audits" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="passed" name="Passed" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      )}

      {tab === 'ncs' && ncData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <KPI label={t.totalNCs || 'Total'} value={ncData.closure?.total || 0} color="bg-red-500" />
            <KPI label={t.closed || 'Closed'} value={ncData.closure?.closed_count || 0} color="bg-green-500" />
            <KPI label={t.avgClosureDays || 'Avg Closure'} value={`${ncData.closure?.avg_days || '-'}d`} color="bg-purple-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard icon={PieIcon} title={t.severityDistribution || 'By Severity'} color="text-red-500">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={ncData.severity || []} dataKey="count" nameKey="severity" cx="50%" cy="50%" outerRadius={80} label={({ severity, count }) => `${severity}: ${count}`}>
                    {(ncData.severity || []).map((e, i) => (
                      <Cell key={i} fill={NC_COLORS[e.severity] || '#9ca3af'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard icon={BarChart2} title={t.statusDistribution || 'By Status'} color="text-blue-500">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ncData.status || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" fontSize={10} angle={-20} textAnchor="end" height={50} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]}>
                    {(ncData.status || []).map((e, i) => (
                      <Cell key={i} fill={STATUS_COLORS[e.status] || '#9ca3af'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      )}

      {!auditData && !ncData && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <FileText size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">{t.insufficientData || 'No data available yet'}</p>
        </div>
      )}
    </div>
  );
}

function KPI({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border p-4 text-center">
      <div className={`inline-flex w-8 h-8 rounded-lg ${color} items-center justify-center mb-2`}>
        <span className="text-white text-xs font-bold">{String(value)[0]}</span>
      </div>
      <div className="text-xl font-extrabold text-gray-800">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function ChartCard({ icon: Icon, title, children, color, className }) {
  return (
    <div className={`bg-white rounded-xl border p-5 ${className || ''}`}>
      <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
        <Icon size={17} className={color} /> {title}
      </h4>
      {children}
    </div>
  );
}
