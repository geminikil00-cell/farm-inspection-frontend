import React, { useState, useEffect } from 'react';
import { RefreshCw, Plus, Eye } from 'lucide-react';
import { api } from '../api';

export function UnitAuditsPage({ orgId }) {
  const [audits, setAudits] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDialog, setStartDialog] = useState(false);
  const [form, setForm] = useState({ template_id: '', site_name: '', inspector: '' });

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.system.getUnitAudits(orgId);
      setAudits(r.audits || []);
    } catch (_) {}
    setLoading(false);
  };

  const loadTemplates = async () => {
    try { const r = await api.getTemplates({ status: 'published' }); setTemplates(r.templates || []); } catch (_) {}
  };

  useEffect(() => { load(); }, [orgId]);

  const handleStart = async () => {
    if (!form.template_id) return;
    try {
      await api.createAudit({ template_id: form.template_id, site_name: form.site_name, inspector: form.inspector || undefined, audit_date: new Date().toISOString().split('T')[0] });
      setStartDialog(false);
      setForm({ template_id: '', site_name: '', inspector: '' });
      load();
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-emerald-600" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Audits</span>
          <h2 className="text-3xl font-extrabold text-slate-800 mt-1">Conducted Audits</h2>
        </div>
        <button onClick={() => { setStartDialog(true); loadTemplates(); }} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 shadow-sm">
          <Plus size={16} /> New Audit
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase">
            <tr>
              <th className="p-3 text-left">Template</th>
              <th className="p-3 text-left">Site</th>
              <th className="p-3 text-left">Inspector</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-center">Score</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center">NCs</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {audits.map(a => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="p-3 font-semibold text-slate-700">{a.template_name}</td>
                <td className="p-3 text-slate-600">{a.site_name || '-'}</td>
                <td className="p-3 text-slate-600">{a.inspector || '-'}</td>
                <td className="p-3 text-slate-600">{a.audit_date?.split('T')[0]}</td>
                <td className="p-3 text-center font-bold">{a.overall_score || '-'}%</td>
                <td className="p-3 text-center">
                  <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${a.status === 'submitted' ? (a.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700') : 'bg-blue-100 text-blue-700'}`}>
                    {a.status}
                  </span>
                </td>
                <td className="p-3 text-center">{a.nc_flags || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {audits.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">No audits yet.</div>}
      </div>

      {startDialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-bold">Start New Audit</h3>
            <select value={form.template_id} onChange={e => setForm({ ...form, template_id: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-xl text-sm">
              <option value="">Select template...</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name} (v{t.version})</option>)}
            </select>
            <input type="text" value={form.site_name} onChange={e => setForm({ ...form, site_name: e.target.value })} placeholder="Site / Location" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm" />
            <input type="text" value={form.inspector} onChange={e => setForm({ ...form, inspector: e.target.value })} placeholder="Inspector name" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setStartDialog(false)} className="px-4 py-2 text-sm bg-slate-100 rounded-xl">Cancel</button>
              <button onClick={handleStart} disabled={!form.template_id} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-xl disabled:opacity-50">Start</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
