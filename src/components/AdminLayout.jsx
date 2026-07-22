import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Building2, ClipboardCheck, Users, FileText,
  MessageSquare, Bell, Settings, LogOut, Shield, Menu, X, ChevronLeft,
  ChevronRight, Sprout
} from 'lucide-react';
import { useAuth, ROLES } from '../context/AuthContext';
import { api } from '../api';

const TABS = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'units', icon: Building2, label: 'Units Management' },
  { id: 'audits', icon: ClipboardCheck, label: 'Conducted Audits' },
  { id: 'users', icon: Users, label: 'Users Management' },
  { id: 'templates', icon: FileText, label: 'Template Builder' },
  { id: 'messages', icon: MessageSquare, label: 'Messages' },
  { id: 'notifications', icon: Bell, label: 'Notifications' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export function AdminLayout({ children, activeTab, onTabChange, t }) {
  const { username, role, orgName, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('adminSidebarCollapsed') === 'true');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    api.notifications.getUnreadCount?.().then(d => setUnreadCount(d?.count || 0)).catch(() => {});
    const interval = setInterval(() => {
      api.notifications.getUnreadCount?.().then(d => setUnreadCount(d?.count || 0)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleCollapse = () => {
    const v = !collapsed;
    setCollapsed(v);
    localStorage.setItem('adminSidebarCollapsed', String(v));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 start-0 z-50 bg-slate-900 text-slate-300 flex flex-col transition-all duration-300
        ${collapsed ? 'w-16' : 'w-64'}
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-4 border-b border-slate-800`}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Sprout className="w-6 h-6 text-emerald-400" />
              <span className="font-bold text-white text-sm">{t?.systemAdmin || 'System Admin'}</span>
            </div>
          )}
          {collapsed && <Sprout className="w-6 h-6 text-emerald-400" />}
          <button onClick={toggleCollapse} className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800 hidden lg:block">
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { onTabChange(tab.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${activeTab === tab.id ? 'bg-emerald-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-300'}
                ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? tab.label : undefined}
            >
              <span className="relative flex-shrink-0">
                <tab.icon size={20} />
                {tab.id === 'notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </span>
              {!collapsed && <span>{tab.label}</span>}
            </button>
          ))}
        </nav>

        {/* User footer */}
        <div className={`p-4 border-t border-slate-800 ${collapsed ? 'text-center' : ''}`}>
          {!collapsed && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Shield size={12} className="text-emerald-400" />
                <span className="text-xs text-slate-400">{username}</span>
              </div>
              <button onClick={logout} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300">
                <LogOut size={12} /> Logout
              </button>
            </>
          )}
          {collapsed && (
            <button onClick={logout} className="text-red-400 hover:text-red-300" title="Logout">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b px-4 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-1.5 hover:bg-slate-100 rounded-lg lg:hidden">
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-800">
                {TABS.find(t => t.id === activeTab)?.label || ''}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => onTabChange('notifications')} className="relative p-2 hover:bg-slate-100 rounded-lg">
              <Bell size={18} className="text-slate-500" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              {username?.charAt(0)?.toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
