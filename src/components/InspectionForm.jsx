import React, { useRef } from 'react';
import { Calendar, User, FileText, Trash2, Printer, Save, Image as ImageIcon, Plus, ArrowLeftRight, FileDown } from 'lucide-react';
import { AutoResizeTextarea } from './AutoResizeTextarea';
import { STATUS_OPTIONS } from '../translations';

const getScoreColor = (score) => {
  if (score >= 90) return 'text-green-600';
  if (score >= 80) return 'text-blue-600';
  if (score >= 60) return 'text-cyan-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
};

export const InspectionForm = ({
  activeTab,
  facilityTitle,
  currentData,

  currentScore,
  handleHeaderChange,
  handleRowChange,
  handlePhotoUpload,
  removePhoto,
  clearCurrentForm,
  saveToHistory,
  handlePrint,
  handleDownloadPDF,
  t,
  isRtl
}) => {
  const fileInputRef = useRef(null);

  const statusOpts = STATUS_OPTIONS(t);
  const currentRows = currentData.rows || [];
  const currentPhotos = currentData.photos || [];

  return (
    <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 min-h-[29.7cm] flex flex-col justify-between">
      <div className="p-4 sm:p-8 border-b-2 border-gray-100">
        {/* Print Headers */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-4 sm:mb-8 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 focus-ring" tabIndex="0">
              {t.generalTitle}
            </h1>
            <p className="text-sm sm:text-base text-gray-500">
              {t.location}: <span className="font-semibold text-gray-800">{facilityTitle}</span>
            </p>
          </div>
          
          <div className="flex gap-6 print-only">
            <div className="text-center">
              <div className="text-4xl font-bold border-4 border-black p-2 rounded-lg">{currentScore}%</div>
              <div className="text-sm font-bold mt-1">{t.generalEval}</div>
            </div>

          </div>
          
          <div className="text-start hidden sm:block">
            <div className="text-sm text-gray-400">{t.modelNo}</div>
            <div className="text-sm text-gray-400">{t.issueDate}</div>
          </div>
        </div>

        {/* Inputs Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 bg-gray-50 p-4 sm:p-6 rounded-lg border border-gray-100 no-print" role="form">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <User size={16} />
              <span>{t.inspector}</span>
            </label>
            <input
              type="text"
              value={currentData.inspector || ''}
              onChange={(e) => handleHeaderChange('inspector', e.target.value)}
              placeholder={t.inspector}
              className="w-full p-2 text-sm border border-gray-300 rounded-md focus-ring outline-none bg-white"
              aria-required="true"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Calendar size={16} />
              <span>{t.date}</span>
            </label>
            <input
              type="date"
              value={currentData.date || ''}
              onChange={(e) => handleHeaderChange('date', e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 rounded-md focus-ring outline-none bg-white"
            />
          </div>
          
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <FileText size={16} />
              <span>{t.generalNotes}</span>
            </label>
            <AutoResizeTextarea
              value={currentData.notes || ''}
              onChange={(e) => handleHeaderChange('notes', e.target.value)}
              placeholder={t.generalNotes}
              className="w-full p-2 text-sm border border-gray-300 rounded-md focus-ring outline-none bg-white"
            />
          </div>
        </div>

        {/* Print-Only Header Block */}
        <div className="hidden print-only mb-6 bg-gray-100 p-4 rounded border border-gray-300">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>{t.inspector}:</strong> {currentData.inspector || 'N/A'}
            </div>
            <div>
              <strong>{t.date}:</strong> {currentData.date}
            </div>
            <div className="col-span-2">
              <strong>{t.generalNotes}:</strong> {currentData.notes || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Checklist Table */}
      <div className="p-2 sm:p-4 flex-1 overflow-hidden">
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-start text-sm border-collapse" role="table">
            <thead className="bg-gray-50 text-gray-700 font-bold border-b-2 border-gray-200">
              <tr role="row">
                <th className="p-2.5 sm:p-3 border text-start w-48 sm:w-52 min-w-[130px] print-tight text-xs sm:text-sm">{t.criteria}</th>
                {activeTab === 'lakes' ? (
                  <>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <th key={i} className="p-2 sm:p-3 border text-center min-w-[85px] sm:min-w-[95px] print-tight text-xs sm:text-sm">
                        {t.pond} {i}
                      </th>
                    ))}
                  </>
                ) : (
                  <th className="p-2 sm:p-3 border text-center w-36 sm:w-40 min-w-[110px] text-xs sm:text-sm">{t.status}</th>
                )}
                <th className="p-2 sm:p-3 border text-start min-w-[120px] print-tight text-xs sm:text-sm">{t.action}</th>
                <th className="p-2 sm:p-3 border text-start w-28 sm:w-32 min-w-[90px] print-tight text-xs sm:text-sm">{t.responsible}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentRows.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors" role="row">
                  <td className="p-2 sm:p-3 border font-medium text-gray-800 bg-white align-top whitespace-pre-wrap print-tight text-xs sm:text-sm" role="cell">
                    {row.criteria}
                  </td>
                  {activeTab === 'lakes' ? (
                    [1, 2, 3, 4, 5, 6].map(n => (
                      <td key={n} className="p-1 border bg-white align-top" role="cell">
                        <select
                          value={row[`status_${n}`] || ''}
                          onChange={(e) => handleRowChange(index, `status_${n}`, e.target.value)}
                          className={`w-full p-1 rounded outline-none border border-gray-200 focus-ring text-center font-medium text-[10px] sm:text-xs h-[38px] leading-tight ${
                            statusOpts.find(o => o.value === row[`status_${n}`])?.color || 'bg-white'
                          }`}
                          aria-label={`${t.pond} ${n} - ${row.criteria}`}
                        >
                          {statusOpts.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    ))
                  ) : (
                    <td className="p-1 border bg-white align-top" role="cell">
                      <select
                        value={row.status || ''}
                        onChange={(e) => handleRowChange(index, 'status', e.target.value)}
                        className={`w-full p-1.5 rounded outline-none border border-gray-200 focus-ring text-center font-medium text-xs sm:text-sm h-[38px] ${
                          statusOpts.find(o => o.value === row.status)?.color || 'bg-white'
                        }`}
                        aria-label={`${t.status} - ${row.criteria}`}
                      >
                        {statusOpts.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                  <td className="p-1 border bg-white align-top" role="cell">
                    <AutoResizeTextarea
                      value={row.action || ''}
                      onChange={(e) => handleRowChange(index, 'action', e.target.value)}
                      placeholder={t.action}
                      className="w-full p-1.5 text-gray-700 outline-none focus:bg-gray-50 border border-transparent focus:border-gray-300 rounded text-xs sm:text-sm"
                      aria-label={`${t.action} for ${row.criteria}`}
                    />
                  </td>
                  <td className="p-1 border bg-white align-top" role="cell">
                    <AutoResizeTextarea
                      value={row.responsible || ''}
                      onChange={(e) => handleRowChange(index, 'responsible', e.target.value)}
                      placeholder={t.responsible}
                      className="w-full p-1.5 text-gray-700 outline-none focus:bg-gray-50 border border-transparent focus:border-gray-300 rounded text-xs sm:text-sm"
                      aria-label={`${t.responsible} for ${row.criteria}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Photo Upload Section */}
        <div className="mt-6 sm:mt-8 border-t pt-4 sm:pt-6 px-2 sm:px-4 no-print">
          <div className="flex items-center justify-between mb-4">
            <label className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2 focus-ring" tabIndex="0">
              <ImageIcon size={18} className="text-blue-600" />
              <span>{t.photos}</span>
            </label>
            <label className="cursor-pointer bg-blue-50 text-blue-600 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-blue-100 transition-colors text-xs sm:text-sm font-bold flex items-center gap-1.5 border border-blue-200 focus-ring">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
                aria-label="Upload photos"
              />
              <Plus size={16} />
              <span>{t.addPhotos}</span>
            </label>
          </div>

          {currentPhotos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4" role="region" aria-label="Attached photos preview">
              {currentPhotos.map((src, index) => (
                <div key={index} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-sm focus-ring" tabIndex="0">
                  <img src={src} alt={`Attachment ${index + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all duration-200"></div>
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all shadow-md hover:bg-red-600 focus-ring"
                    title={t.delete}
                    aria-label={`Remove photo ${index + 1}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 text-sm focus-ring" tabIndex="0">
              {t.noPhotos}
            </div>
          )}
        </div>

        {/* Print-only Photos Section at Bottom */}
        {currentPhotos.length > 0 && (
          <div className="hidden print-only mt-8 photo-appendix">
            <h3 className="text-lg font-bold mb-4 border-b pb-2">{t.photoAppendix}</h3>
            <div className="grid grid-cols-2 gap-4">
              {currentPhotos.map((src, index) => (
                <div key={index} className="border border-gray-300 p-1 rounded">
                  <img src={src} alt={`Attachment ${index + 1}`} className="w-full h-auto object-contain max-h-[300px]" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="sm:hidden sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200 p-2.5 shadow-lg flex items-center justify-around z-30 no-print">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 border rounded-md">
          <span className="text-[10px] text-gray-500 font-bold">{t.score}</span>
          <span className={`text-sm font-bold ${getScoreColor(currentScore)}`}>{currentScore}%</span>
        </div>

        <button
          onClick={saveToHistory}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white rounded-md text-xs font-bold shadow-sm"
        >
          <Save size={14} />
          <span>{t.save}</span>
        </button>

        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white rounded-md text-xs font-bold shadow-sm"
        >
          <FileDown size={14} />
          <span>PDF</span>
        </button>

        <button
          onClick={clearCurrentForm}
          className="flex items-center gap-1 px-2 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-md text-xs font-bold"
        >
          <Trash2 size={14} />
          <span>{t.clear}</span>
        </button>
      </div>
    </div>
  );
};
