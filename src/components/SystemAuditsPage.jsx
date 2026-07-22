import React, { useState, useEffect } from 'react';
import { RefreshCw, ChevronLeft, ClipboardCheck, Eye } from 'lucide-react';
import { api } from '../api';

export function SystemAuditsPage() {
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { const r = await api.system.getUnitsAudits(); setUnits(r.units || []); } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const selectUnit = async (unit) => {
    setSelectedUnit(unit);
    try { const r = await api.system.getUnitAudits(unit.unit_id); setAudits(r.audits || []); } catch (_) {}
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-emerald-600" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">View</span>
        <h2 className="text-3xl font-extrabold text-slate-800 mt-1">Conducted Audits</h2>
      </div>

      {!selectedUnit ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map(unit => (
            <button key={unit.unit_id} onClick={() => selectUnit(unit)} className="bg-white rounded-xl border border-slate-200 hover:shadow-md transition-shadow p-5 text-left">
              <h3 className="font-bold text-slate-800 text-lg mb-3">{unit.unit_name}</h3>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-blue-50 rounded-lg p-2">
                  <div className="text-xl font-extrabold text-blue-600">{unit.total_audits || 0}</div>
                  <div className="text-[10px] text-blue-500 uppercase font-semibold">Total</div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-2">
                  <div className="text-xl font-extrabold text-emerald-600">{unit.submitted || 0}</div>
                  <div className="text-[10px] text-emerald-500 uppercase font-semibold">Submitted</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-2">
                  <div className="text-xl font-extrabold text-amber-600">{unit.in_progress || 0}</div>
                  <div className="text-[10px] text-amber-500 uppercase font-semibold">In Progress</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-2">
                  <div className="text-xl font-extrabold text-purple-600">{unit.avg_score || '-'}%</div>
                  <div className="text-[10px] text-purple-500 uppercase font-semibold">Avg Score</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <>
          <button onClick={() => setSelectedUnit(null)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
            <ChevronLeft size={16} /> All Units
          </button>
          <h3 className="text-lg font-bold text-slate-700 mb-4">{selectedUnit.unit_name} — Audits</h3>
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
                  <th className="p-3 text-center">NC Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {audits.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-700">{a.template_name}</td>
                    <td className="p-3 text-slate-600">{a.site_name || '-'}</td>
                    <td className="p-3 text-slate-600">{a.inspector || '-'}</td>
                    <td className="p-3 text-slate-600">{a.audit_date?.split('T')[0]}</td>
                    <td className="p-3 text-center">
                      <span className={`font-bold ${a.passed ? 'text-green-600' : 'text-red-600'}`}>{a.overall_score}%</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${a.status === 'submitted' ? (a.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700') : 'bg-blue-100 text-blue-700'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="p-3 text-center text-sm text-orange-600 font-semibold">{a.nc_flags || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {audits.length === 0 && <div className="text-center py-12 text-slate-400">No audits found for this unit.</div>}
          </div>
        </>
      )}
    </div>
  );
}
