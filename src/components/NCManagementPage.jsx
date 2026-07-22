import React, { useState, useEffect, useMemo } from 'react';
import { Plus, RefreshCw, Search, Filter, Eye, Check, X, Clock, AlertTriangle, Send } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { NCDetail } from './NCDetail';

const STATUS_LABELS = {
  open: 'Open', assigned: 'Assigned', in_progress: 'In Progress',
  action_taken: 'Action Taken', under_review: 'Under Review',
  closed: 'Closed', reopened: 'Reopened',
};

export function NCManagementPage({ orgId }) {
  const [ncs, setNCs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingNC, setViewingNC] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState({ status: 'all', severity: 'all' });
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ severity: 'Minor', description: '', assigned_to: '', evidenceText: '', due_date: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [ncRes, userRes] = await Promise.all([
        api.getNCs(),
        api.system.getUnitUsers(orgId),
      ]);
      setNCs(ncRes.ncs || []);
      setUsers(userRes.users || []);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [orgId]);

  const filtered = useMemo(() => {
    return ncs.filter(nc => {
      if (filter.status !== 'all' && nc.status !== filter.status) return false;
      if (filter.severity !== 'all' && nc.severity !== filter.severity) return false;
      if (search && !nc.nc_number?.toLowerCase().includes(search.toLowerCase()) && !nc.description?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [ncs, filter, search]);

  const handleCreate = async () => {
    if (!form.description.trim()) return;
    try {
      await api.createNC({
        severity: form.severity,
        description: form.description,
        assigned_to: form.assigned_to || undefined,
        evidence_photos: form.evidenceText ? [form.evidenceText] : [],
      });
      setShowCreate(false);
      setForm({ severity: 'Minor', description: '', assigned_to: '', evidenceText: '', due_date: '' });
      load();
    } catch (err) { alert(err.message); }
  };

  const handleApprove = async (ncId) => {
    try {
      await api.updateNCStatus(ncId, 'closed', 'Approved');
      load();
    } catch (err) { alert(err.message); }
  };

  const handleReject = async (ncId) => {
    const comment = prompt('Add a comment for rejection:');
    if (!comment) return;
    try {
      await api.updateNCStatus(ncId, 'reopened', comment);
      load();
    } catch (err) { alert(err.message); }
  };

  if (viewingNC) return <NCDetail ncId={viewingNC} t={{}} onBack={() => { setViewingNC(null); load(); }} />;

  const pendingReview = ncs.filter(nc => nc.status === 'under_review').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-red-600">Management</span>
          <h2 className="text-3xl font-extrabold text-slate-800 mt-1">Non-Conformities</h2>
          {pendingReview > 0 && <p className="text-sm text-orange-600 font-medium mt-1">{pendingReview} NC awaiting your review</p>}
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 shadow-sm">
          <Plus size={16} /> Issue NC
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl w-56" />
        </div>
        <select value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })} className="p-2 text-sm border border-slate-200 rounded-xl">
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filter.severity} onChange={e => setFilter({ ...filter, severity: e.target.value })} className="p-2 text-sm border border-slate-200 rounded-xl">
          <option value="all">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="Major">Major</option>
          <option value="Minor">Minor</option>
          <option value="Observation">Observation</option>
        </select>
      </div>

      {/* NC Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase">
            <tr>
              <th className="p-3 text-left">NC Number</th>
              <th className="p-3 text-left">Severity</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">Assigned To</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Due Date</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(nc => {
              const isOverdue = nc.due_date && new Date(nc.due_date) < new Date() && nc.status !== 'closed';
              return (
                <tr key={nc.id} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-700">{nc.nc_number}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${nc.severity === 'Critical' ? 'bg-red-100 text-red-700' : nc.severity === 'Major' ? 'bg-orange-100 text-orange-700' : nc.severity === 'Minor' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{nc.severity}</span>
                  </td>
                  <td className="p-3 text-slate-600 max-w-xs truncate">{nc.description}</td>
                  <td className="p-3 text-slate-600">{nc.assigned_name || '-'}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${nc.status === 'closed' ? 'bg-green-100 text-green-700' : nc.status === 'under_review' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {STATUS_LABELS[nc.status]}
                      </span>
                      {isOverdue && <Clock size={12} className="text-red-500" />}
                    </div>
                  </td>
                  <td className="p-3 text-slate-600 text-xs">{nc.due_date?.split('T')[0] || '-'}</td>
                  <td className="p-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => setViewingNC(nc.id)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye size={14} /></button>
                      {nc.status === 'under_review' && (
                        <>
                          <button onClick={() => handleApprove(nc.id)} className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Approve"><Check size={14} /></button>
                          <button onClick={() => handleReject(nc.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Reject"><X size={14} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">No NCs found.</div>}
      </div>

      {/* Create NC Dialog */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold">Issue New NC</h3>
            <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-xl text-sm">
              <option value="Critical">Critical</option>
              <option value="Major">Major</option>
              <option value="Minor">Minor</option>
              <option value="Observation">Observation</option>
            </select>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Describe the non-conformance..." className="w-full p-2.5 border border-slate-200 rounded-xl text-sm" />
            <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-xl text-sm">
              <option value="">Assign to (optional)</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.username} ({u.role})</option>)}
            </select>
            <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-xl text-sm" />
            <input type="text" value={form.evidenceText} onChange={e => setForm({ ...form, evidenceText: e.target.value })} placeholder="Evidence description or URL" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm bg-slate-100 rounded-xl">Cancel</button>
              <button onClick={handleCreate} className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl">Issue NC</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
