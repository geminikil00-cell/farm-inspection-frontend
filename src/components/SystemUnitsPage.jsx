import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, Building2, Users, ClipboardCheck, AlertOctagon } from 'lucide-react';
import { api } from '../api';

export function SystemUnitsPage({ onNavigate }) {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null); // { mode: 'create'|'edit', unit? }
  const [name, setName] = useState('');

  const load = async () => {
    setLoading(true);
    try { const r = await api.system.getUnits(); setUnits(r.units || []); } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      if (dialog?.mode === 'create') await api.system.createUnit({ name: name.trim() });
      else if (dialog?.mode === 'edit') await api.system.updateUnit(dialog.unit.id, { name: name.trim() });
      setDialog(null);
      setName('');
      load();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (unit) => {
    if (!window.confirm(`Delete ${unit.name}?`)) return;
    try { await api.system.deleteUnit(unit.id); load(); } catch (err) { alert(err.message); }
  };

  const openEdit = (unit) => { setDialog({ mode: 'edit', unit }); setName(unit.name); };
  const openCreate = () => { setDialog({ mode: 'create' }); setName(''); };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-emerald-600" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Management</span>
          <h2 className="text-3xl font-extrabold text-slate-800 mt-1">Units</h2>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 shadow-sm">
          <Plus size={16} /> Add Unit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {units.map(unit => (
          <div key={unit.id} className="bg-white rounded-xl border border-slate-200 hover:shadow-md transition-shadow p-5">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-slate-800 text-lg">{unit.name}</h3>
              <div className="flex gap-1">
                <button onClick={() => openEdit(unit)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(unit)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-extrabold text-blue-600">{unit.user_count || 0}</div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Users</div>
              </div>
              <div>
                <div className="text-lg font-extrabold text-emerald-600">{unit.audit_count || 0}</div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Audits</div>
              </div>
              <div>
                <div className={`text-lg font-extrabold ${(unit.open_nc_count || 0) > 0 ? 'text-red-600' : 'text-slate-400'}`}>{unit.open_nc_count || 0}</div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">NCs</div>
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t">
              <button onClick={() => onNavigate?.('users')} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg">
                <Users size={12} /> Users
              </button>
              <button onClick={() => onNavigate?.('audits')} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg">
                <ClipboardCheck size={12} /> Audits
              </button>
            </div>
          </div>
        ))}
      </div>

      {units.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">No units created yet.</div>
      )}

      {dialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-bold">{dialog.mode === 'create' ? 'New Unit' : 'Edit Unit'}</h3>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Unit name" className="w-full p-2.5 border border-slate-300 rounded-xl text-sm" autoFocus />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDialog(null)} className="px-4 py-2 text-sm bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
