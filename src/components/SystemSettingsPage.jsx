import React, { useState } from 'react';
import { Lock, Globe, Save } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { LANGUAGES } from '../translations';

export function SystemSettingsPage() {
  const { username, logout } = useAuth();
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);
  const [lang, setLang] = useState(localStorage.getItem('farm_lang') || 'en');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPw !== confirmPw) { setPwMsg({ type: 'error', text: 'Passwords do not match' }); return; }
    if (newPw.length < 6) { setPwMsg({ type: 'error', text: 'Password must be at least 6 characters' }); return; }
    setPwSaving(true);
    setPwMsg(null);
    try {
      await api.settings.changePassword(currentPw, newPw);
      setPwMsg({ type: 'success', text: 'Password changed successfully' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      setPwMsg({ type: 'error', text: err.message });
    } finally {
      setPwSaving(false);
    }
  };

  const handleLangChange = (code) => {
    setLang(code);
    localStorage.setItem('farm_lang', code);
  };

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Configuration</span>
        <h2 className="text-3xl font-extrabold text-slate-800 mt-1">Settings</h2>
      </div>

      {/* Password */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h3 className="font-bold text-slate-700 flex items-center gap-2"><Lock size={18} /> Change Password</h3>
        {pwMsg && (
          <div className={`p-3 rounded-lg text-sm ${pwMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {pwMsg.text}
          </div>
        )}
        <form onSubmit={handleChangePassword} className="space-y-3">
          <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required placeholder="Current password" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm" />
          <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required placeholder="New password" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm" />
          <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required placeholder="Confirm new password" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm" />
          <button type="submit" disabled={pwSaving} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50">
            <Save size={14} /> {pwSaving ? 'Saving...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Language */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h3 className="font-bold text-slate-700 flex items-center gap-2"><Globe size={18} /> Language</h3>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map(l => (
            <button key={l.code} onClick={() => handleLangChange(l.code)} className={`px-4 py-2 text-sm rounded-xl font-medium transition-colors ${lang === l.code ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Account info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-700 mb-2">Account</h3>
        <p className="text-sm text-slate-500">Logged in as <strong>{username}</strong></p>
        <button onClick={logout} className="mt-3 px-4 py-2 text-sm text-red-600 bg-red-50 rounded-xl hover:bg-red-100 font-medium">Logout</button>
      </div>
    </div>
  );
}
