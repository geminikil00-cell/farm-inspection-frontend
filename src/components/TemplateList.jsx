import React, { useState, useEffect } from 'react';
import {
  Plus, Pencil, Eye, CheckCircle, Archive, Trash2,
  RefreshCw, FileText, AlertCircle, Copy, History
} from 'lucide-react';
import { api } from '../api';
import { FormBuilder } from './FormBuilder';

const CATEGORY_LABELS = {
  general: 'General',
  gmp: 'GMP Audit',
  food_safety: 'Food Safety',
  internal: 'Internal Audit',
};

export function TemplateList({ t }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTemplates();
      setTemplates(res.templates || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTemplates(); }, []);

  const handlePublish = async (id) => {
    if (!window.confirm('Publish this template? Published templates cannot be edited.')) return;
    try {
      const res = await api.publishTemplate(id);
      setTemplates(prev => {
        const updated = prev.map(t => t.id === id ? { ...t, status: 'published' } : t);
        if (res.draft) updated.push(res.draft);
        return updated;
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleArchive = async (id) => {
    if (!window.confirm('Archive this template?')) return;
    try {
      await api.archiveTemplate(id);
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, status: 'archived' } : t));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template permanently?')) return;
    try {
      await api.deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = async (template) => {
    try {
      const res = await api.getTemplate(template.id);
      setEditingTemplate(res.template);
      setBuilderOpen(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setBuilderOpen(true);
  };

  if (builderOpen) {
    return (
      <FormBuilder
        template={editingTemplate}
        onSave={() => { setBuilderOpen(false); loadTemplates(); }}
        onBack={() => { setBuilderOpen(false); loadTemplates(); }}
      />
    );
  }

  const drafts = templates.filter(t => t.status === 'draft');
  const published = templates.filter(t => t.status === 'published');
  const archived = templates.filter(t => t.status === 'archived');

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="text-blue-600" size={22} />
          {t.templates || 'Audit Templates'}
        </h2>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} />
          {t.newTemplate || 'New Template'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {templates.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <FileText size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">{t.noTemplates || 'No templates yet'}</p>
          <p className="text-sm text-gray-400 mt-1">{t.noTemplatesDesc || 'Create your first audit template to get started'}</p>
        </div>
      )}

      {/* Drafts */}
      {drafts.length > 0 && (
        <Section title={`${t.drafts || 'Drafts'} (${drafts.length})`}>
          <TemplateGrid templates={drafts} onEdit={handleEdit} onPublish={handlePublish} onDelete={handleDelete} />
        </Section>
      )}

      {/* Published */}
      {published.length > 0 && (
        <Section title={`${t.published || 'Published'} (${published.length})`}>
          <TemplateGrid templates={published} onEdit={handleEdit} onArchive={handleArchive} />
        </Section>
      )}

      {archived.length > 0 && (
        <Section title={`${t.archived || 'Archived'} (${archived.length})`}>
          <TemplateGrid templates={archived} onEdit={handleEdit} onDelete={handleDelete} />
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

function TemplateGrid({ templates, onEdit, onPublish, onArchive, onDelete }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((tpl) => (
        <div key={tpl.id} className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow p-4 flex flex-col">
          <div className="flex items-start justify-between mb-3">
            <div className="min-w-0">
              <h4 className="font-bold text-gray-800 truncate">{tpl.name}</h4>
              <p className="text-xs text-gray-400 mt-0.5">v{tpl.version} · {CATEGORY_LABELS[tpl.category] || tpl.category}</p>
            </div>
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${
              tpl.status === 'published' ? 'bg-green-100 text-green-700' :
              tpl.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {tpl.status}
            </span>
          </div>

          <div className="flex-1">
            <div className="text-xs text-gray-500">
              {tpl.sections?.length || 0} sections
              · {tpl.sections?.reduce((sum, s) => sum + (s.questions?.length || 0), 0) || 0} questions
            </div>
            {tpl.description && (
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{tpl.description}</p>
            )}
            {tpl.published_from && (
              <div className="flex items-center gap-1 mt-2 text-xs text-blue-500">
                <History size={12} />
                New version of published template
              </div>
            )}
          </div>

          <div className="flex gap-1.5 mt-3 pt-3 border-t">
            <button onClick={() => onEdit(tpl)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded">
              <Pencil size={12} /> Edit
            </button>
            {tpl.status === 'draft' && onPublish && (
              <button onClick={() => onPublish(tpl.id)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded">
                <CheckCircle size={12} /> Publish
              </button>
            )}
            {tpl.status === 'published' && onArchive && (
              <button onClick={() => onArchive(tpl.id)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded">
                <Archive size={12} /> Archive
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(tpl.id)} className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded">
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
