import React, { useState, useCallback } from 'react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical, Plus, Trash2, Eye, Save, X, Check,
  ListOrdered, ToggleLeft, FileText, CheckSquare, Image, Layout, ArrowLeft
} from 'lucide-react';
import { api } from '../api';

const QUESTION_TYPES = {
  rating: { icon: ListOrdered, label: 'Rating', color: 'bg-blue-100 text-blue-700' },
  yes_no: { icon: ToggleLeft, label: 'Yes/No', color: 'bg-amber-100 text-amber-700' },
  text: { icon: FileText, label: 'Text', color: 'bg-gray-100 text-gray-700' },
  checkbox: { icon: CheckSquare, label: 'Checkbox', color: 'bg-green-100 text-green-700' },
  photo: { icon: Image, label: 'Photo', color: 'bg-purple-100 text-purple-700' },
};

const RATING_OPTIONS = ['ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'سيء'];

let idCounter = 0;
const genId = (prefix = '') => `${prefix}${Date.now()}_${++idCounter}`;

function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {React.cloneElement(children, { dragHandle: listeners })}
    </div>
  );
}

function QuestionEditor({ question, onChange, onDelete, dragHandle }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(question.label);
  const TypeIcon = QUESTION_TYPES[question.type]?.icon || FileText;

  return (
    <div className="flex items-start gap-2 p-3 bg-white rounded border border-gray-200 hover:border-blue-300 transition-colors group">
      <button {...dragHandle} className="mt-1.5 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing flex-shrink-0">
        <GripVertical size={16} />
      </button>

      <span className={`mt-0.5 p-1 rounded text-xs flex-shrink-0 ${QUESTION_TYPES[question.type]?.color}`}>
        <TypeIcon size={14} />
      </span>

      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full p-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none"
              autoFocus
              onBlur={() => { onChange({ ...question, label }); setEditing(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { onChange({ ...question, label }); setEditing(false); } }}
            />
            {question.type === 'rating' && (
              <div className="flex gap-1 flex-wrap">
                {RATING_OPTIONS.map((opt, i) => (
                  <span key={i} className={`px-2 py-0.5 text-xs rounded-full ${i === 0 ? 'bg-green-100 text-green-700' : i === 1 ? 'bg-blue-100 text-blue-700' : i === 2 ? 'bg-cyan-100 text-cyan-700' : i === 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {opt}
                  </span>
                ))}
              </div>
            )}
            {question.type === 'checkbox' && (
              <input
                type="text"
                value={(question.options || []).join(', ')}
                onChange={(e) => onChange({ ...question, options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                placeholder="Options (comma separated)"
                className="w-full p-1.5 text-xs border rounded"
              />
            )}
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <span
              className="text-sm text-gray-800 cursor-pointer hover:text-blue-600 flex-1"
              onClick={() => setEditing(true)}
            >
              {question.label || `Untitled ${QUESTION_TYPES[question.type]?.label}`}
            </span>
            <label className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={question.required}
                onChange={(e) => onChange({ ...question, required: e.target.checked })}
                className="rounded"
              />
              Required
            </label>
          </div>
        )}
      </div>

      <button onClick={onDelete} className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export function FormBuilder({ template, onSave, onBack }) {
  const [name, setName] = useState(template?.name || 'New Audit Template');
  const [category, setCategory] = useState(template?.category || 'general');
  const [sections, setSections] = useState(template?.sections || []);
  const [activeDrag, setActiveDrag] = useState(null);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scoringConfig, setScoringConfig] = useState(template?.scoring_config || { method: 'percentage', pass_threshold: 70 });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = useCallback((event) => {
    setActiveDrag(event.active.data.current);
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setActiveDrag(null);
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === 'toolbox') {
      // Dropping new section or question from toolbox
      if (activeData.kind === 'section') {
        setSections(prev => [...prev, {
          id: genId('sec_'),
          title: 'New Section',
          questions: []
        }]);
      } else if (activeData.kind === 'question' && overData?.sectionId) {
        const newQ = {
          id: genId('q_'),
          type: activeData.qtype,
          label: activeData.qtype === 'rating' ? 'Rate this item' :
                 activeData.qtype === 'yes_no' ? 'Is this compliant?' :
                 activeData.qtype === 'text' ? 'Enter notes' :
                 activeData.qtype === 'checkbox' ? 'Select options' : 'Attach photo',
          required: activeData.qtype !== 'text',
          ...(activeData.qtype === 'rating' && { options: RATING_OPTIONS }),
          ...(activeData.qtype === 'checkbox' && { options: ['Option 1', 'Option 2'] }),
        };
        setSections(prev => prev.map(sec =>
          sec.id === overData.sectionId
            ? { ...sec, questions: [...sec.questions, newQ] }
            : sec
        ));
      }
      return;
    }

    // Reordering within same container
    if (activeData?.sectionId && overData?.sectionId && activeData.sectionId === overData.sectionId) {
      setSections(prev => prev.map(sec => {
        if (sec.id !== activeData.sectionId) return sec;
        const oldIdx = sec.questions.findIndex(q => q.id === active.id);
        const newIdx = sec.questions.findIndex(q => q.id === over.id);
        if (oldIdx === -1 || newIdx === -1) return sec;
        return { ...sec, questions: arrayMove(sec.questions, oldIdx, newIdx) };
      }));
      return;
    }

    // Moving question between sections
    if (activeData?.type === 'question' && overData?.sectionId) {
      setSections(prev => {
        let movedQ = null;
        const without = prev.map(sec => {
          if (sec.id === activeData.sectionId) {
            const q = sec.questions.find(q => q.id === active.id);
            if (q) movedQ = q;
            return { ...sec, questions: sec.questions.filter(q => q.id !== active.id) };
          }
          return sec;
        });
        if (!movedQ) return prev;
        return without.map(sec =>
          sec.id === overData.sectionId
            ? { ...sec, questions: [...sec.questions, movedQ] }
            : sec
        );
      });
      return;
    }

    // Reordering sections
    if (activeData?.type === 'section') {
      const oldIdx = sections.findIndex(s => s.id === active.id);
      const newIdx = sections.findIndex(s => s.id === over.id);
      if (oldIdx !== -1 && newIdx !== -1) {
        setSections(arrayMove(sections, oldIdx, newIdx));
      }
    }
  }, [sections]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { name, category, sections, scoring_config: scoringConfig };
      if (template?.id) {
        await api.updateTemplate(template.id, payload);
      } else {
        await api.createTemplate(payload);
      }
      onSave?.();
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateSection = (sectionId, updates) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, ...updates } : s));
  };

  const updateQuestion = (sectionId, questionId, updates) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      return { ...s, questions: s.questions.map(q => q.id === questionId ? { ...q, ...updates } : q) };
    }));
  };

  const deleteSection = (sectionId) => {
    setSections(prev => prev.filter(s => s.id !== sectionId));
  };

  const deleteQuestion = (sectionId, questionId) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, questions: s.questions.filter(q => q.id !== questionId) } : s
    ));
  };

  const addSection = () => {
    setSections(prev => [...prev, { id: genId('sec_'), title: 'New Section', questions: [] }]);
  };

  if (preview) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{name} — Preview</h2>
          <div className="flex gap-2">
            <button onClick={() => setPreview(false)} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">
              <ArrowLeft size={14} /> Edit
            </button>
          </div>
        </div>
        {sections.map((sec, si) => (
          <div key={sec.id} className="mb-8 border rounded-lg">
            <h3 className="px-4 py-3 bg-gray-50 font-bold text-gray-700 rounded-t-lg border-b">
              {sec.title || `Section ${si + 1}`}
            </h3>
            <div className="p-4 space-y-3">
              {sec.questions.map((q) => (
                <div key={q.id} className="p-3 border rounded-lg">
                  <p className="text-sm font-medium mb-2">
                    {q.label} {q.required && <span className="text-red-500">*</span>}
                  </p>
                  {q.type === 'rating' && (
                    <div className="flex gap-1">
                      {(q.options || RATING_OPTIONS).map((opt, i) => (
                        <button key={i} className={`px-2 py-1 text-xs rounded border ${i === 0 ? 'border-green-300 bg-green-50' : i === 1 ? 'border-blue-300 bg-blue-50' : i === 2 ? 'border-cyan-300 bg-cyan-50' : i === 3 ? 'border-yellow-300 bg-yellow-50' : 'border-red-300 bg-red-50'}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                  {q.type === 'yes_no' && (
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-xs rounded border border-green-300 bg-green-50">✓ Yes</button>
                      <button className="px-3 py-1 text-xs rounded border border-red-300 bg-red-50">✗ No</button>
                      <button className="px-3 py-1 text-xs rounded border border-gray-300 bg-gray-50">N/A</button>
                    </div>
                  )}
                  {q.type === 'text' && (
                    <textarea className="w-full p-2 text-sm border rounded bg-gray-50" rows={2} disabled placeholder="Text response..." />
                  )}
                  {q.type === 'checkbox' && (
                    <div className="space-y-1">
                      {(q.options || ['Option 1', 'Option 2']).map((opt, i) => (
                        <label key={i} className="flex items-center gap-2 text-sm"><input type="checkbox" className="rounded" disabled />{opt}</label>
                      ))}
                    </div>
                  )}
                  {q.type === 'photo' && (
                    <div className="border-2 border-dashed rounded-lg p-4 text-center text-sm text-gray-400">
                      Click to upload photo
                    </div>
                  )}
                </div>
              ))}
              {sec.questions.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No questions in this section</p>
              )}
            </div>
          </div>
        ))}
        <div className="border-t pt-4 mt-6">
          <p className="text-sm text-gray-500">Pass threshold: <strong>{scoringConfig.pass_threshold}%</strong></p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4">
      {/* Toolbox */}
      <div className="w-56 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 p-3 flex flex-col">
        <h3 className="text-sm font-bold text-gray-600 mb-3 flex items-center gap-1.5">
          <Layout size={16} /> Toolbox
        </h3>
        <p className="text-xs text-gray-400 mb-3">Drag items onto canvas</p>

        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="space-y-1.5">
            <ToolboxItem id="new-section" kind="section" type="section" label="Section" icon={Layout} color="bg-indigo-100 text-indigo-700" />

            <div className="border-t my-2"></div>
            <p className="text-xs text-gray-400 font-medium">Question Types</p>

            {Object.entries(QUESTION_TYPES).map(([key, qt]) => (
              <ToolboxItem key={key} id={`tool-${key}`} kind="question" qtype={key} label={qt.label} icon={qt.icon} color={qt.color} />
            ))}
          </div>
        </DndContext>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-auto">
        <div className="sticky top-0 bg-white border-b px-4 py-3 z-10 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            {onBack && (
              <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded"><ArrowLeft size={18} /></button>
            )}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-bold text-lg border-none outline-none bg-transparent min-w-[200px]"
              placeholder="Template name"
            />
          </div>
          <div className="flex items-center gap-2">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="text-xs border rounded px-2 py-1.5">
              <option value="general">General</option>
              <option value="gmp">GMP Audit</option>
              <option value="food_safety">Food Safety</option>
              <option value="internal">Internal Audit</option>
            </select>
            <button onClick={() => setPreview(true)} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">
              <Eye size={14} /> Preview
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              <Save size={14} /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="p-6 space-y-4">
            <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
              {sections.map((section) => (
                <SortableItem key={section.id} id={section.id}>
                  <SectionCard
                    section={section}
                    onUpdate={(u) => updateSection(section.id, u)}
                    onDelete={() => deleteSection(section.id)}
                    onQuestionUpdate={(qid, u) => updateQuestion(section.id, qid, u)}
                    onQuestionDelete={(qid) => deleteQuestion(section.id, qid)}
                    onAddQuestion={(qtype) => {
                      const newQ = { id: genId('q_'), type: qtype, label: `New ${qtype} question`, required: qtype !== 'text' };
                      updateSection(section.id, { questions: [...section.questions, newQ] });
                    }}
                  />
                </SortableItem>
              ))}
            </SortableContext>

            <button
              onClick={addSection}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-400 hover:text-blue-500 text-sm font-medium transition-colors"
            >
              <Plus size={16} className="inline mr-1" /> Add Section
            </button>
          </div>

          <DragOverlay>
            {activeDrag && (
              <div className="px-3 py-2 bg-white shadow-lg rounded-lg border-2 border-blue-400 text-sm font-medium">
                {activeDrag.label}
              </div>
            )}
          </DragOverlay>
        </DndContext>

        {/* Scoring config footer */}
        <div className="border-t px-6 py-3 bg-gray-50">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600 font-medium">Scoring:</span>
            <select
              value={scoringConfig.method}
              onChange={(e) => setScoringConfig(prev => ({ ...prev, method: e.target.value }))}
              className="border rounded px-2 py-1 text-xs"
            >
              <option value="percentage">Percentage</option>
              <option value="weighted">Weighted</option>
              <option value="pass_fail">Pass/Fail</option>
            </select>
            <span className="text-gray-500">Pass threshold:</span>
            <input
              type="number"
              value={scoringConfig.pass_threshold}
              onChange={(e) => setScoringConfig(prev => ({ ...prev, pass_threshold: parseInt(e.target.value) || 70 }))}
              className="w-16 border rounded px-2 py-1 text-xs text-center"
              min={0} max={100}
            />
            <span className="text-gray-500">%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolboxItem({ label, icon: Icon, color, ...data }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: `${data.id}-${Math.random()}`,
    data: { type: 'toolbox', ...data },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${color}`}
    >
      <Icon size={14} />
      {label}
    </div>
  );
}

function SectionCard({ section, onUpdate, onDelete, onQuestionUpdate, onQuestionDelete, onAddQuestion, dragHandle }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(section.title);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
      <div className="flex items-center gap-2 px-4 py-3 bg-white border-b">
        <button {...dragHandle} className="text-gray-400 hover:text-gray-600 cursor-grab">
          <GripVertical size={16} />
        </button>
        {editingTitle ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => { onUpdate({ title }); setEditingTitle(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { onUpdate({ title }); setEditingTitle(false); } }}
            className="flex-1 font-bold text-gray-700 border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <h4
            className="flex-1 font-bold text-gray-700 text-sm cursor-pointer hover:text-blue-600"
            onClick={() => setEditingTitle(true)}
          >
            {title || 'Untitled Section'}
          </h4>
        )}
        <span className="text-xs text-gray-400">{section.questions.length} questions</span>
        <button onClick={onDelete} className="p-1 text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
      </div>

      <DndContext sensors={[useSensor(PointerSensor, { activationConstraint: { distance: 5 } })]} collisionDetection={closestCenter}
        onDragEnd={(event) => {
          const { active, over } = event;
          if (!over || !over.data.current?.sectionId) return;
          const oldIdx = section.questions.findIndex(q => q.id === active.id);
          const newIdx = section.questions.findIndex(q => q.id === over.id);
          if (oldIdx === -1 || newIdx === -1) return;
          const moved = arrayMove(section.questions, oldIdx, newIdx);
          onUpdate({ questions: moved });
        }}>
        <div className="p-4 space-y-2" data-section-id={section.id}>
          <SortableContext items={section.questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
            {section.questions.map((q) => (
              <SortableItem key={q.id} id={q.id}>
                <QuestionEditor
                  question={q}
                  onChange={(updated) => onQuestionUpdate(q.id, updated)}
                  onDelete={() => onQuestionDelete(q.id)}
                />
              </SortableItem>
            ))}
          </SortableContext>

          <div className="flex gap-1 flex-wrap pt-2">
            {Object.entries(QUESTION_TYPES).map(([key, qt]) => {
              const QIcon = qt.icon;
              return (
                <button
                  key={key}
                  onClick={() => onAddQuestion(key)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium hover:shadow-sm transition-shadow ${qt.color}`}
                >
                  <QIcon size={12} /> {qt.label}
                </button>
              );
            })}
          </div>
        </div>
      </DndContext>
    </div>
  );
}
