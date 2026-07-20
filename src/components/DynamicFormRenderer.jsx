import React, { useState, useRef } from 'react';
import { AlertTriangle, Image as ImageIcon, X, Camera, Check } from 'lucide-react';

const RATING_OPTIONS = ['ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'سيء'];
const RATING_COLORS = [
  'bg-green-100 text-green-800 border-green-300',
  'bg-blue-100 text-blue-800 border-blue-300',
  'bg-cyan-100 text-cyan-800 border-cyan-300',
  'bg-yellow-100 text-yellow-800 border-yellow-300',
  'bg-red-100 text-red-800 border-red-300',
];

export function DynamicFormRenderer({ sections, responses, onChange, onNC, readOnly, t }) {
  if (!sections || !Array.isArray(sections)) return null;

  const handleResponse = (sectionId, questionId, value) => {
    onChange?.(sectionId, questionId, value);
  };

  const handleNC = (sectionId, questionId, question) => {
    onNC?.(sectionId, questionId, question);
  };

  return (
    <div className="space-y-6" id="audit-form">
      {sections.map((section, si) => (
        <SectionCard
          key={section.section_id || section.id}
          section={section}
          responses={responses?.[section.section_id || section.id]}
          sectionIndex={si}
          onResponse={(qid, val) => handleResponse(section.section_id || section.id, qid, val)}
          onNC={(qid, q) => handleNC(section.section_id || section.id, qid, q)}
          readOnly={readOnly}
          t={t}
        />
      ))}
    </div>
  );
}

function SectionCard({ section, responses, sectionIndex, onResponse, onNC, readOnly, t }) {
  const questions = section.questions || [];
  const answered = questions.filter(q => {
    const resp = responses?.[q.question_id || q.id];
    return resp?.value !== undefined && resp?.value !== null && resp?.value !== '';
  }).length;
  const ncFlagged = questions.filter(q => {
    const resp = responses?.[q.question_id || q.id];
    return resp?.nc_flagged;
  }).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
        <h3 className="font-bold text-gray-700">
          {sectionIndex + 1}. {section.section_title || section.title || `Section ${sectionIndex + 1}`}
        </h3>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{answered}/{questions.length} answered</span>
          {ncFlagged > 0 && (
            <span className="flex items-center gap-1 text-orange-600 font-semibold">
              <AlertTriangle size={12} /> {ncFlagged} NC
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {questions.map((q, qi) => {
          const qid = q.question_id || q.id;
          const resp = responses?.[qid] || {};
          return (
            <QuestionField
              key={qid}
              question={q}
              response={resp}
              onChange={(val) => onResponse(qid, val)}
              onNC={() => onNC(qid, q)}
              readOnly={readOnly}
              t={t}
            />
          );
        })}
        {questions.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No questions in this section</p>
        )}
      </div>
    </div>
  );
}

function QuestionField({ question, response, onChange, onNC, readOnly, t }) {
  const [showNC, setShowNC] = useState(false);
  const [ncDesc, setNCDesc] = useState(response?.nc_description || '');
  const [ncSeverity, setNCSeverity] = useState(response?.nc_severity || 'Minor');
  const fileRef = useRef(null);
  const { type, label, required, options } = question;

  const handleChange = (val) => {
    onChange({ value: val, nc_flagged: response?.nc_flagged, nc_description: response?.nc_description, nc_severity: response?.nc_severity });
  };

  const handlePhoto = (e) => {
    const files = Array.from(e.target.files || []);
    const readers = files.map(f => new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = ev => resolve(ev.target.result);
      reader.readAsDataURL(f);
    }));
    Promise.all(readers).then(photos => {
      const existing = response?.value || [];
      onChange({ value: [...existing, ...photos], nc_flagged: response?.nc_flagged });
    });
  };

  const handleNCSave = () => {
    const nc = !response?.nc_flagged;
    onChange({
      value: response?.value,
      nc_flagged: nc,
      nc_description: nc ? ncDesc : '',
      nc_severity: nc ? ncSeverity : '',
    });
    setShowNC(false);
  };

  const ncActive = response?.nc_flagged;

  return (
    <div className={`p-3 rounded-lg border ${ncActive ? 'border-orange-300 bg-orange-50/30' : 'border-gray-100 hover:border-gray-200'}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <label className="text-sm font-medium text-gray-700 flex-1">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {!readOnly && (
          <button
            onClick={() => setShowNC(!showNC)}
            className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium transition-colors ${
              ncActive ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
            }`}
            title={t?.flagNC || 'Flag as Non-Conformance'}
          >
            <AlertTriangle size={12} />
            {ncActive ? 'NC' : 'Flag NC'}
          </button>
        )}
      </div>

      {type === 'rating' && (
        <div className="flex flex-wrap gap-1.5">
          {(options || RATING_OPTIONS).map((opt, i) => (
            <button
              key={opt}
              onClick={() => !readOnly && handleChange(opt)}
              disabled={readOnly}
              className={`px-2.5 py-1.5 text-xs rounded-lg border font-medium transition-all ${
                response?.value === opt
                  ? `${RATING_COLORS[i] || 'bg-blue-100 text-blue-700'} ring-2 ring-offset-1`
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {type === 'yes_no' && (
        <div className="flex gap-2">
          {[
            { val: 'yes', label: t?.yes || 'Yes', cls: 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100' },
            { val: 'no', label: t?.no || 'No', cls: 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100' },
            { val: 'na', label: t?.na || 'N/A', cls: 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100' },
          ].map(opt => (
            <button
              key={opt.val}
              onClick={() => !readOnly && handleChange(opt.val)}
              disabled={readOnly}
              className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-all ${
                response?.value === opt.val ? `${opt.cls} ring-2 ring-offset-1` : 'bg-gray-50 text-gray-600 border-gray-200'
              } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {type === 'text' && (
        <textarea
          value={response?.value || ''}
          onChange={(e) => handleChange(e.target.value)}
          disabled={readOnly}
          rows={2}
          className="w-full p-2 text-sm border rounded resize-none bg-white disabled:bg-gray-50"
          placeholder={t?.textPlaceholder || 'Enter response...'}
        />
      )}

      {type === 'checkbox' && (
        <div className="space-y-1">
          {(options || ['Option 1']).map(opt => (
            <label key={opt} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Array.isArray(response?.value) && response.value.includes(opt)}
                onChange={(e) => {
                  const current = Array.isArray(response?.value) ? [...response.value] : [];
                  if (e.target.checked) current.push(opt);
                  else current.splice(current.indexOf(opt), 1);
                  handleChange(current);
                }}
                disabled={readOnly}
                className="rounded"
              />
              {opt}
            </label>
          ))}
        </div>
      )}

      {type === 'photo' && (
        <div>
          {!readOnly && (
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 border border-purple-200">
              <Camera size={14} /> {t?.addPhotos || 'Add Photos'}
            </button>
          )}
          <input ref={fileRef} type="file" multiple accept="image/*" onChange={handlePhoto} className="hidden" />
          {Array.isArray(response?.value) && response.value.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {response.value.map((src, i) => (
                <div key={i} className="relative w-20 h-20 rounded overflow-hidden border">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  {!readOnly && (
                    <button onClick={() => {
                      const updated = [...response.value]; updated.splice(i, 1);
                      onChange({ value: updated, nc_flagged: response?.nc_flagged });
                    }} className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5">
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showNC && (
        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg space-y-2">
          <p className="text-xs font-semibold text-orange-800 flex items-center gap-1">
            <AlertTriangle size={12} /> {t?.ncFlag || 'Non-Conformance'}
          </p>
          <select
            value={ncSeverity}
            onChange={(e) => setNCSeverity(e.target.value)}
            className="w-full p-1.5 text-xs border rounded"
          >
            <option value="Critical">Critical</option>
            <option value="Major">Major</option>
            <option value="Minor">Minor</option>
            <option value="Observation">Observation</option>
          </select>
          <textarea
            value={ncDesc}
            onChange={(e) => setNCDesc(e.target.value)}
            placeholder={t?.ncDescription || 'Describe the non-conformance...'}
            rows={2}
            className="w-full p-1.5 text-xs border rounded"
          />
          <div className="flex gap-2">
            <button onClick={handleNCSave} className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 flex items-center gap-1">
              <Check size={12} /> {ncActive ? (t?.updateNC || 'Update NC') : (t?.saveNC || 'Save NC')}
            </button>
            <button onClick={() => setShowNC(false)} className="px-3 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300">
              {t?.cancel || 'Cancel'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
