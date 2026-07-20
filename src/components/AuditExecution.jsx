import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Save, Send, ArrowLeft, RefreshCw, AlertTriangle, Clock } from 'lucide-react';
import { api } from '../api';
import { DynamicFormRenderer } from './DynamicFormRenderer';

export function AuditExecution({ audit: initialAudit, onBack, t }) {
  const [audit, setAudit] = useState(initialAudit);
  const [sections, setSections] = useState([]);
  const [responses, setResponses] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const autoSaveTimer = useRef(null);

  useEffect(() => {
    const loadFull = async () => {
      if (initialAudit.responses && Array.isArray(initialAudit.responses)) {
        setSections(initialAudit.responses);
        const respMap = {};
        initialAudit.responses.forEach(s => {
          respMap[s.section_id || s.id] = s.responses || {};
        });
        setResponses(respMap);
      } else {
        try {
          const res = await api.getAudit(initialAudit.id);
          const a = res.audit;
          setAudit(a);
          setSections(a.responses || []);
          const respMap = {};
          (a.responses || []).forEach(s => {
            respMap[s.section_id || s.id] = s.responses || {};
          });
          setResponses(respMap);
        } catch (err) {
          console.error(err);
        }
      }
    };
    loadFull();
  }, [initialAudit.id]);

  const handleResponseChange = useCallback((sectionId, questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [sectionId]: { ...(prev[sectionId] || {}), [questionId]: value },
    }));
  }, []);

  const buildSectionsWithResponses = useCallback(() => {
    return sections.map(section => ({
      ...section,
      responses: responses[section.section_id || section.id] || {},
    }));
  }, [sections, responses]);

  const autoSave = useCallback(async (sectionsData) => {
    try {
      await api.updateAuditResponses(audit.id, { responses: sectionsData });
      setLastSaved(new Date());
    } catch (err) {
      console.error('Auto-save failed:', err.message);
    }
  }, [audit.id]);

  useEffect(() => {
    if (audit.status !== 'in_progress') return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      const sectionsData = buildSectionsWithResponses();
      autoSave(sectionsData);
    }, 3000);
    return () => clearTimeout(autoSaveTimer.current);
  }, [responses, buildSectionsWithResponses, autoSave, audit.status]);

  const handleManualSave = async () => {
    setSaving(true);
    try {
      const sectionsData = buildSectionsWithResponses();
      await api.updateAuditResponses(audit.id, { responses: sectionsData });
      setLastSaved(new Date());
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    const unanswered = [];
    sections.forEach(section => {
      (section.questions || []).forEach(q => {
        if (q.required) {
          const r = responses[section.section_id || section.id]?.[q.question_id || q.id];
          if (!r || r.value === undefined || r.value === null || r.value === '') {
            unanswered.push(q.label);
          }
        }
      });
    });

    if (unanswered.length > 0) {
      const confirm = window.confirm(
        `${unanswered.length} required question(s) unanswered:\n${unanswered.slice(0, 5).join('\n')}${unanswered.length > 5 ? '\n...' : ''}\n\nSubmit anyway?`
      );
      if (!confirm) return;
    }

    setSubmitting(true);
    try {
      const sectionsData = buildSectionsWithResponses();
      const res = await api.submitAudit(audit.id, sectionsData);
      setAudit(res.audit);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const ncCount = Object.values(responses).reduce((sum, section) => {
    return sum + Object.values(section).filter(r => r?.nc_flagged).length;
  }, 0);

  const answeredCount = sections.reduce((sum, section) => {
    return sum + (section.questions || []).filter(q => {
      const r = responses[section.section_id || section.id]?.[q.question_id || q.id];
      return r?.value !== undefined && r?.value !== null && r?.value !== '';
    }).length;
  }, 0);

  const totalQuestions = sections.reduce((sum, s) => sum + (s.questions?.length || 0), 0);

  if (audit.status === 'submitted') {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
          <ArrowLeft size={16} /> {t.back || 'Back to audits'}
        </button>
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">{audit.template_name}</h2>
              <p className="text-sm text-gray-500">v{audit.template_version} · {audit.audit_date}</p>
            </div>
            <div className="text-center">
              <div className={`text-4xl font-extrabold ${audit.passed ? 'text-green-600' : 'text-red-600'}`}>
                {audit.overall_score}%
              </div>
              <div className={`text-sm font-bold ${audit.passed ? 'text-green-600' : 'text-red-600'}`}>
                {audit.passed ? 'PASSED' : 'FAILED'}
              </div>
              <div className="text-xs text-gray-400 mt-1">Threshold: {audit.pass_threshold}%</div>
            </div>
          </div>
          {sections.length > 0 && (
            <DynamicFormRenderer
              sections={sections}
              responses={responses}
              onChange={() => {}}
              readOnly={true}
              t={t}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b px-4 py-3 mb-4 rounded-xl shadow-sm flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="font-bold text-gray-800">{audit.template_name}</h2>
            <p className="text-xs text-gray-400">v{audit.template_version} · {audit.audit_date || 'Today'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-gray-500">
            <Clock size={14} />
            <span>{answeredCount}/{totalQuestions}</span>
          </div>
          {ncCount > 0 && (
            <div className="flex items-center gap-1 text-orange-600 font-semibold">
              <AlertTriangle size={14} /> {ncCount} NC
            </div>
          )}
          {lastSaved && (
            <span className="text-gray-400">Saved {Math.round((Date.now() - lastSaved) / 1000)}s ago</span>
          )}
          <button
            onClick={handleManualSave}
            disabled={saving}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium disabled:opacity-50"
          >
            <Save size={13} /> {saving ? 'Saving...' : (t.save || 'Save')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
          >
            <Send size={13} /> {submitting ? 'Submitting...' : (t.submit || 'Submit')}
          </button>
        </div>
      </div>

      {sections.length > 0 && (
        <DynamicFormRenderer
          sections={sections}
          responses={responses}
          onChange={handleResponseChange}
          onNC={(sectionId, questionId, question) => {}}
          readOnly={false}
          t={t}
        />
      )}

      {sections.length === 0 && (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
        </div>
      )}
    </div>
  );
}
