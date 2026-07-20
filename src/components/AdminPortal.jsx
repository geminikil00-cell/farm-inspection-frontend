import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, Shield, Building2, Settings, Trash2,
  AlertCircle, RefreshCw, Save, X, Pencil, FileText
} from 'lucide-react';
import { api } from '../api';
import { useAuth, ROLES } from '../context/AuthContext';
import { TemplateList } from './TemplateList';

const ROLE_OPTIONS = [
  { value: ROLES.ORG_ADMIN, label: 'Admin' },
  { value: ROLES.QUALITY_MGR, label: 'Quality Manager' },
  { value: ROLES.AUDITOR, label: 'Auditor' },
  { value: ROLES.DEPT_HEAD, label: 'Dept Head' },
  { value: ROLES.VIEWER, label: 'Viewer' },
];

export function AdminPortal({ t }) {
  const { orgName, role } = useAuth();
  const [activeSection, setActiveSection] = useState('users');
  const [users, setUsers] = useState([]);
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    username: '', password: '', fullName: '', role: ROLES.AUDITOR,
  });

  const [orgForm, setOrgForm] = useState({ name: '' });
  const [orgSaving, setOrgSaving] = useState(false);

  const canManage = role === ROLES.SUPER_ADMIN || role === ROLES.ORG_ADMIN;

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, orgRes] = await Promise.all([
        api.getOrgUsers(),
        api.getOrg(),
      ]);
      setUsers(usersRes.users || []);
      setOrg(orgRes.org);
      setOrgForm({ name: orgRes.org?.name || '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSaveOrg = async () => {
    setOrgSaving(true);
    try {
      const res = await api.updateOrg({ name: orgForm.name });
      setOrg(res.org);
    } catch (err) {
      alert(err.message);
    } finally {
      setOrgSaving(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.createUser(userForm);
      setShowUserForm(false);
      setUserForm({ username: '', password: '', fullName: '', role: ROLES.AUDITOR });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await api.updateUser(editingUser.id, {
        fullName: userForm.fullName,
        role: userForm.role,
        status: userForm.status,
      });
      setEditingUser(null);
      setShowUserForm(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.deleteUser(userId);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const openEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      password: '',
      fullName: user.full_name || '',
      role: user.role,
      status: user.status,
    });
    setShowUserForm(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="text-blue-600" size={24} />
          <div>
            <h2 className="text-xl font-bold text-gray-800">{orgName}</h2>
            <p className="text-sm text-gray-500">{t.adminPortal || 'Administration Portal'}</p>
          </div>
        </div>

        {!canManage && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-sm">
            <AlertCircle size={16} className="inline mr-1" />
            View-only access. Contact your admin to make changes.
          </div>
        )}

        <div className="flex border-b mb-6">
          <button
            onClick={() => setActiveSection('users')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeSection === 'users'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users size={16} className="inline mr-1.5" />
            {t.users || 'Users'} ({users.length})
          </button>
          <button
            onClick={() => setActiveSection('templates')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeSection === 'templates'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText size={16} className="inline mr-1.5" />
            {t.templates || 'Templates'}
          </button>
          <button
            onClick={() => setActiveSection('settings')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeSection === 'settings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings size={16} className="inline mr-1.5" />
            {t.settings || 'Settings'}
          </button>
        </div>

        {activeSection === 'users' && (
          <div>
            {canManage && (
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-700">{t.manageUsers || 'Manage Users'}</h3>
                {!showUserForm && (
                  <button
                    onClick={() => { setEditingUser(null); setShowUserForm(true); setUserForm({ username: '', password: '', fullName: '', role: ROLES.AUDITOR }); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    <UserPlus size={14} />
                    {t.addUser || 'Add User'}
                  </button>
                )}
              </div>
            )}

            {showUserForm && (
              <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="bg-gray-50 rounded-lg border p-4 mb-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-sm text-gray-700">
                    {editingUser ? (t.editUser || 'Edit User') : (t.newUser || 'New User')}
                  </h4>
                  <button type="button" onClick={() => { setShowUserForm(false); setEditingUser(null); }} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    required
                    disabled={!!editingUser}
                    placeholder={t.username || 'Username'}
                    className="p-2 border rounded text-sm disabled:bg-gray-200"
                  />
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    required={!editingUser}
                    placeholder={editingUser ? (t.newPasswordOpt || 'New password (optional)') : t.password}
                    className="p-2 border rounded text-sm"
                  />
                  <input
                    type="text"
                    value={userForm.fullName}
                    onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                    placeholder={t.fullName || 'Full Name'}
                    className="p-2 border rounded text-sm"
                  />
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="p-2 border rounded text-sm"
                  >
                    {ROLE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-1">
                    <Save size={14} /> {t.save || 'Save'}
                  </button>
                  <button type="button" onClick={() => { setShowUserForm(false); setEditingUser(null); }} className="px-4 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300">
                    {t.cancel || 'Cancel'}
                  </button>
                </div>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-3 text-start">{t.username || 'Username'}</th>
                    <th className="p-3 text-start">{t.fullName || 'Full Name'}</th>
                    <th className="p-3 text-start">{t.role || 'Role'}</th>
                    <th className="p-3 text-start">{t.status || 'Status'}</th>
                    <th className="p-3 text-end">{t.action}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium">{u.username}</td>
                      <td className="p-3 text-gray-600">{u.full_name || '-'}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                          <Shield size={12} />
                          {ROLE_OPTIONS.find((o) => o.value === u.role)?.label || u.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3 text-end">
                        {canManage && (
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => openEditUser(u)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === 'templates' && (
          <TemplateList t={t} />
        )}

        {activeSection === 'settings' && (
          <div className="max-w-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.orgName || 'Organization Name'}</label>
              <input
                type="text"
                value={orgForm.name}
                onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                disabled={!canManage}
                className="w-full p-2.5 border rounded-lg text-sm disabled:bg-gray-100"
              />
            </div>
            {canManage && (
              <button onClick={handleSaveOrg} disabled={orgSaving} className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-1.5">
                <Save size={14} />
                {orgSaving ? (t.saving || 'Saving...') : (t.saveSettings || 'Save Settings')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
