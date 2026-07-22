import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Clock, User, AlertTriangle, Calendar, MessageSquare,
  Check, X, Send, RefreshCw, Shield, Save
} from 'lucide-react';
import { api } from '../api';
import { useAuth, ROLES } from '../context/AuthContext';

const STATUS_OPTIONS = {
  open: [{ to: 'assigned', label: 'Assign' }],
  assigned: [{ to: 'in_progress', label: 'Start Work' }],
  in_progress: [{ to: 'action_taken', label: 'Action Complete' }],
  action_taken: [{ to: 'under_review', label: 'Submit for Review' }],
  under_review: [
    { to: 'closed', label: 'Approve & Close' },
    { to: 'reopened', label: 'Reject (Reopen)' },
  ],
  reopened: [{ to: 'in_progress', label: 'Resume Work' }],
  closed: [],
};

const STATUS_LABELS = {
  open: 'Open', assigned: 'Assigned', in_progress: 'In Progress',
  action_taken: 'Action Taken', under_review: 'Under Review',
  closed: 'Closed', reopened: 'Reopened',
};

const SEVERITY_COLORS = {
  Critical: 'bg-red-100 text-red-800',
  Major: 'bg-orange-100 text-orange-800',
  Minor: 'bg-yellow-100 text-yellow-800',
  Observation: 'bg-blue-100 text-blue-800',
};

export function NCDetail({ ncId, t, onBack }) {
  const { role, userId, username } = useAuth();
  const [nc, setNC] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Edit fields
  const [editRootCause, setEditRootCause] = useState('');
  const [editAction, setEditAction] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadNC = async () => {
    setLoading(true);
    try {
      const res = await api.getNC(ncId);
      setNC(res.nc);
      setEditRootCause(res.nc.root_cause || '');
      setEditAction(res.nc.corrective_action || '');
      setEditNotes(res.nc.verification_notes || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNC(); }, [ncId]);

  const handleStatusChange = async (newStatus) => {
    setActionLoading(true);
    try {
      const res = await api.updateNCStatus(ncId, newStatus, note);
      setNC(res.nc);
      setNote('');
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.updateNC(ncId, {
        root_cause: editRootCause,
        corrective_action: editAction,
        verification_notes: editNotes,
      });
      setNC(res.nc);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTimeline = async (action) => {
    if (!note.trim()) return;
    setActionLoading(true);
    try {
      const res = await api.addNCTimeline(ncId, action, note);
      setNC(res.nc);
      setNote('');
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const canTransition = (from, to) => {
    if (nc?.status === 'closed') return false;
    // Dept head can do in_progress → action_taken
    // Quality mgr can do under_review → closed/reopened
    // Org admin can do anything
    if (role === ROLES.ORG_ADMIN || role === ROLES.SUPER_ADMIN) return true;
    if (role === ROLES.QUALITY_MGR && ['under_review', 'closed', 'reopened'].includes(from)) return true;
    if (role === ROLES.DEPT_HEAD && from === 'assigned' && to === 'in_progress') return true;
    if (role === ROLES.DEPT_HEAD && from === 'in_progress' && to === 'action_taken') return true;
    if (role === ROLES.DEPT_HEAD && from === 'reopened' && to === 'in_progress') return true;
    return role === ROLES.ORG_ADMIN || role === ROLES.SUPER_ADMIN;
  };

  const isOverdue = nc?.due_date && new Date(nc.due_date) < new Date() && nc.status !== 'closed';

  if (loading) {
    return <div className="flex justify-center py-12"><RefreshCw className="w-8 h-8 animate-spin text-green-600" /></div>;
  }

  if (!nc) return null;

  const timeline = Array.isArray(nc.timeline) ? nc.timeline : [];

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
        <ArrowLeft size={16} /> {t.back || 'Back to NCs'}
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-gray-800">{nc.nc_number}</span>
              <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${SEVERITY_COLORS[nc.severity]}`}>
                {nc.severity}
              </span>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                nc.status === 'closed' ? 'bg-green-100 text-green-700' :
                nc.status === 'reopened' ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {STATUS_LABELS[nc.status]}
              </span>
              {isOverdue && <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700">Overdue</span>}
            </div>
            <p className="text-sm text-gray-700 mt-2">{nc.description}</p>
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
              {nc.raised_name && <span className="flex items-center gap-1"><User size={12} /> Raised by: {nc.raised_name}</span>}
              {nc.assigned_name && <span className="flex items-center gap-1"><Shield size={12} /> Assigned: {nc.assigned_name}</span>}
              {nc.due_date && <span className="flex items-center gap-1"><Calendar size={12} /> Due: {nc.due_date?.split('T')[0]}</span>}
              {nc.closed_at && <span className="flex items-center gap-1 text-green-600"><Check size={12} /> Closed: {nc.closed_at?.split('T')[0]}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Status Actions */}
      {nc.status !== 'closed' && (
        <div className="bg-white rounded-xl border p-4">
          <h4 className="text-sm font-bold text-gray-700 mb-3">{t.statusTransition || 'Status Transition'}</h4>
          <div className="flex flex-wrap gap-2">
            {(STATUS_OPTIONS[nc.status] || []).filter(opt => canTransition(nc.status, opt.to)).map(opt => (
              <button
                key={opt.to}
                onClick={() => handleStatusChange(opt.to)}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Edit section */}
      {(role === ROLES.DEPT_HEAD || role === ROLES.QUALITY_MGR || role === ROLES.ORG_ADMIN || role === ROLES.SUPER_ADMIN) && (
        <div className="bg-white rounded-xl border p-4 space-y-3">
          <h4 className="text-sm font-bold text-gray-700">{t.details || 'Details'}</h4>
          <div>
            <label className="text-xs font-medium text-gray-500">{t.rootCause || 'Root Cause'}</label>
            <textarea value={editRootCause} onChange={e => setEditRootCause(e.target.value)} rows={2} className="w-full p-2 text-sm border rounded mt-1" placeholder="Enter root cause analysis..." />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">{t.correctiveAction || 'Corrective Action'}</label>
            <textarea value={editAction} onChange={e => setEditAction(e.target.value)} rows={2} className="w-full p-2 text-sm border rounded mt-1" placeholder="Describe corrective action taken..." />
          </div>
          {role === ROLES.QUALITY_MGR || role === ROLES.ORG_ADMIN || role === ROLES.SUPER_ADMIN ? (
            <div>
              <label className="text-xs font-medium text-gray-500">{t.verificationNotes || 'Verification Notes'}</label>
              <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2} className="w-full p-2 text-sm border rounded mt-1" placeholder="Quality verification notes..." />
            </div>
          ) : null}
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Save size={13} /> {saving ? (t.saving || 'Saving...') : (t.save || 'Save')}
          </button>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-xl border p-4">
        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <Clock size={15} /> {t.timeline || 'Timeline'}
        </h4>
        <div className="space-y-3">
          {timeline.map((entry, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5" />
                {i < timeline.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 my-0.5" />}
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-700">{entry.action?.replace(/_/g, ' ')}</span>
                  <span className="text-[10px] text-gray-400">{new Date(entry.timestamp).toLocaleString()}</span>
                </div>
                {entry.note && <p className="text-xs text-gray-500 mt-0.5">{entry.note}</p>}
                <p className="text-[10px] text-gray-400 mt-0.5">— {entry.username}</p>
              </div>
            </div>
          ))}
          {timeline.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-3">No timeline entries yet</p>
          )}
        </div>

        {/* Add comment */}
        <div className="mt-4 pt-3 border-t flex gap-2">
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder={t.addComment || 'Add a comment...'}
            className="flex-1 p-1.5 text-xs border rounded"
            onKeyDown={e => { if (e.key === 'Enter') handleTimeline('comment'); }}
          />
          <button onClick={() => handleTimeline('comment')} disabled={!note.trim() || actionLoading} className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50">
            <Send size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
