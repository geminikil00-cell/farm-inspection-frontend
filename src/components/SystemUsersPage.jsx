import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, Search, Shield, ChevronLeft } from 'lucide-react';
import { api } from '../api';

const ROLE_OPTS = [
  { value: 'org_admin', label: 'Unit Admin' },
  { value: 'quality_mgr', label: 'Quality Mgr' },
  { value: 'auditor', label: 'Auditor' },
  { value: 'dept_head', label: 'Dept Head' },
  { value: 'viewer', label: 'Viewer' },
];

export function SystemUsersPage() {
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ username: '', password: '', fullName: '', role: 'auditor' });

  const loadUnits = async () => {
    try { const r = await api.system.getUnits(); setUnits(r.units || []); } catch (_) {}
    setLoading(false);
  };

  const loadUsers = async (unitId) => {
    try { const r = await api.system.getUnitUsers(unitId); setUsers(r.users || []); } catch (_) {}
  };

  useEffect(() => { loadUnits(); }, []);

  const selectUnit = (unit) => { setSelectedUnit(unit); loadUsers(unit.id); };

  const handleSave = async () => {
    if (!form.username.trim() || (!dialog?.edit && !form.password)) return;
    try {
      if (dialog?.edit) {
        await api.system.updateUnitUser(selectedUnit.id, dialog.user.id, { fullName: form.fullName, role: form.role });
      } else {
        await api.system.createUnitUser(selectedUnit.id, form);
      }
      setDialog(null);
      loadUsers(selectedUnit.id);
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user ${user.username}?`)) return;
    try { await api.system.deleteUnitUser(selectedUnit.id, user.id); loadUsers(selectedUnit.id); } catch (err) { alert(err.message); }
  };

  const openCreate = () => { setDialog({ edit: false }); setForm({ username: '', password: '', fullName: '', role: 'auditor' }); };
  const openEdit = (user) => { setDialog({ edit: true, user }); setForm({ username: user.username, password: '', fullName: user.full_name || '', role: user.role }); };

  const filtered = users.filter(u => !search || u.username?.toLowerCase().includes(search.toLowerCase()) || u.full_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Management</span>
        <h2 className="text-3xl font-extrabold text-slate-800 mt-1">Users</h2>
      </div>

      {!selectedUnit ? (
        <>
          <p className="text-sm text-slate-500">Select a unit to manage its users</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {units.map(unit => (
              <button key={unit.id} onClick={() => selectUnit(unit)} className="bg-white rounded-xl border border-slate-200 hover:shadow-md transition-shadow p-5 text-left">
                <h3 className="font-bold text-slate-800">{unit.name}</h3>
                <p className="text-sm text-slate-400 mt-1">{unit.user_count || 0} users</p>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <button onClick={() => setSelectedUnit(null)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
              <ChevronLeft size={16} /> All Units
            </button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl w-48" />
              </div>
              <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700">
                <Plus size={14} /> Add User
              </button>
            </div>
          </div>

          <h3 className="text-lg font-bold text-slate-700">{selectedUnit.name} — Users</h3>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase">
                <tr>
                  <th className="p-3 text-left">Username</th>
                  <th className="p-3 text-left">Full Name</th>
                  <th className="p-3 text-left">Role</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-700">{u.username}</td>
                    <td className="p-3 text-slate-600">{u.full_name || '-'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-100 text-blue-700">{ROLE_OPTS.find(o => o.value === u.role)?.label || u.role}</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.status}</span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => openEdit(u)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(u)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="text-center py-8 text-slate-400 text-sm">No users found.</div>}
          </div>
        </>
      )}

      {dialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-3">
            <h3 className="text-lg font-bold">{dialog.edit ? 'Edit User' : 'New User'}</h3>
            <input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} disabled={dialog.edit} placeholder="Username" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm disabled:bg-slate-100" />
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={dialog.edit ? 'New password (optional)' : 'Password'} className="w-full p-2.5 border border-slate-200 rounded-xl text-sm" />
            <input type="text" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="Full name" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm" />
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-xl text-sm">
              {ROLE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setDialog(null)} className="px-4 py-2 text-sm bg-slate-100 rounded-xl">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-xl">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
