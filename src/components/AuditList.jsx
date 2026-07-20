import React, { useState, useEffect } from 'react';
import {
  Plus, Play, Eye, CheckCircle, Clock, Trash2, AlertTriangle,
  RefreshCw, FileText, ChevronRight, XCircle
} from 'lucide-react';
import { api } from '../api';
import { DynamicFormRenderer } from './DynamicFormRenderer';

export function AuditList({ t, onStartAudit }) {
  const [audits, setAudits] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingAudit, setViewingAudit] = useState(null);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [inspector, setInspector] = useState('');
  const [siteName, setSiteName] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [auditRes, templateRes] = await Promise.all([
        api.getAudits(),
        api.getTemplates({ status: 'published' }),
      ]);
      setAudits(auditRes.audits || []);
      setTemplates(templateRes.templates || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleStartAudit = async () => {
    if (!selectedTemplate) return;
    try {
      const res = await api.createAudit({
        template_id: selectedTemplate,
        site_name: siteName,
        inspector: inspector || undefined,
        audit_date: new Date().toISOString().split('T')[0],
      });
      setShowStartDialog(false);
      onStartAudit(res.audit);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this audit?')) return;
    try {
      await api.deleteAudit(id);
      setAudits(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleView = async (audit) => {
    try {
      const res = await api.getAudit(audit.id);
      setViewingAudit(res.audit);
    } catch (err) {
      alert(err.message);
    }
  };

  if (viewingAudit) {
    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={() => setViewingAudit(null)} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-4">
          <ChevronRight size={16} className="rotate-180" /> {t.back || 'Back to audits'}
        </button>
        <div className="bg-white rounded-xl border p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{viewingAudit.template_name}</h2>
              <p className="text-sm text-gray-500">v{viewingAudit.template_version} · {viewingAudit.audit_date}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              viewingAudit.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {viewingAudit.overall_score}% — {viewingAudit.passed ? 'PASSED' : 'FAILED'}
            </span>
          </div>
          {viewingAudit.responses && (
            <DynamicFormRenderer
              sections={viewingAudit.responses}
              responses={Object.fromEntries(
                (viewingAudit.responses || []).map(s => [s.section_id || s.id, s.responses || {}])
              )}
              onChange={() => {}}
              readOnly={true}
              t={t}
            />
          )}
        </div>
      </div>
    );
  }

  const inProgress = audits.filter(a => a.status === 'in_progress');
  const submitted = audits.filter(a => a.status === 'submitted');

  if (loading) {
    return <div className="flex justify-center py-12"><RefreshCw className="w-8 h-8 animate-spin text-green-600" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="text-blue-600" size={22} />
          {t.audits || 'Audits'}
        </h2>
        <button
          onClick={() => setShowStartDialog(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700"
        >
          <Plus size={16} />
          {t.newAudit || 'New Audit'}
        </button>
      </div>

      {showStartDialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold">{t.startAudit || 'Start New Audit'}</h3>
            <div>
              <label className="text-sm font-medium text-gray-600">{t.selectTemplate || 'Select Template'}</label>
              <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} className="w-full p-2.5 border rounded-lg text-sm mt-1">
                <option value="">{t.selectTemplate || 'Select a template...'}</option>
                {templates.map(tpl => (
                  <option key={tpl.id} value={tpl.id}>{tpl.name} (v{tpl.version})</option>
                ))}
              </select>
            </div>
            <div>
              <input
                type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)}
                placeholder={t.siteName || 'Site / Location'}
                className="w-full p-2.5 border rounded-lg text-sm"
              />
            </div>
            <div>
              <input
                type="text" value={inspector} onChange={(e) => setInspector(e.target.value)}
                placeholder={t.inspector || 'Inspector name'}
                className="w-full p-2.5 border rounded-lg text-sm"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowStartDialog(false)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">{t.cancel || 'Cancel'}</button>
              <button onClick={handleStartAudit} disabled={!selectedTemplate} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                {t.start || 'Start'}
              </button>
            </div>
          </div>
        </div>
      )}

      {audits.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <FileText size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">{t.noAudits || 'No audits yet'}</p>
          <p className="text-sm text-gray-400 mt-1">{t.noAuditsDesc || 'Start a new audit from a published template'}</p>
        </div>
      )}

      {inProgress.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
            <Clock size={14} /> {t.inProgress || 'In Progress'} ({inProgress.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {inProgress.map(a => (
              <AuditCard key={a.id} audit={a} onContinue={() => onStartAudit(a)} onDelete={handleDelete} onView={handleView} t={t} />
            ))}
          </div>
        </div>
      )}

      {submitted.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
            <CheckCircle size={14} /> {t.submitted || 'Submitted'} ({submitted.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {submitted.map(a => (
              <AuditCard key={a.id} audit={a} onView={handleView} onDelete={handleDelete} t={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AuditCard({ audit, onContinue, onView, onDelete, t }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0">
          <h4 className="font-bold text-gray-800 truncate text-sm">{audit.template_name}</h4>
          <p className="text-xs text-gray-400">{audit.template_category} · v{audit.template_version}</p>
        </div>
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${
          audit.status === 'submitted' ? (audit.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700') : 'bg-blue-100 text-blue-700'
        }`}>
          {audit.status === 'submitted' ? `${audit.overall_score}%` : 'Draft'}
        </span>
      </div>
      <div className="text-xs text-gray-500 space-y-0.5 mb-3">
        {audit.site_name && <div>{audit.site_name}</div>}
        <div>{audit.audit_date} · {audit.inspector || '-'}</div>
        {audit.nc_flags > 0 && (
          <div className="flex items-center gap-1 text-orange-600 font-medium">
            <AlertTriangle size={11} /> {audit.nc_flags} NC flagged
          </div>
        )}
      </div>
      <div className="flex gap-1.5 pt-2 border-t">
        {audit.status === 'in_progress' && onContinue && (
          <button onClick={() => onContinue(audit)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded">
            <Play size={12} /> {t.continue || 'Continue'}
          </button>
        )}
        {audit.status === 'submitted' && (
          <button onClick={() => onView(audit)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded">
            <Eye size={12} /> {t.view || 'View'}
          </button>
        )}
        {onDelete && (
          <button onClick={() => onDelete(audit.id)} className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded">
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
