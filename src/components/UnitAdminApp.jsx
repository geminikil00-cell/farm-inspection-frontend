import React, { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { UnitAuditsPage } from './UnitAuditsPage';
import { NCManagementPage } from './NCManagementPage';
import { SystemUsersPage } from './SystemUsersPage';
import { SystemTemplatesPage } from './SystemTemplatesPage';
import { SystemMessagesPage } from './SystemMessagesPage';
import { SystemNotificationsPage } from './SystemNotificationsPage';
import { SystemSettingsPage } from './SystemSettingsPage';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'audits', label: 'Conducted Audits' },
  { id: 'ncs', label: 'Non-Conformities' },
  { id: 'templates', label: 'Template Builder' },
  { id: 'users', label: 'Users Management' },
  { id: 'messages', label: 'Messages' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'settings', label: 'Settings' },
];

export function UnitAdminApp() {
  const { orgId } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <AdminDashboard onNavigate={setActiveTab} />;
      case 'audits': return <UnitAuditsPage orgId={orgId} />;
      case 'ncs': return <NCManagementPage orgId={orgId} />;
      case 'templates': return <SystemTemplatesPage />;
      case 'users': return <SystemUsersPage />;
      case 'messages': return <SystemMessagesPage />;
      case 'notifications': return <SystemNotificationsPage />;
      case 'settings': return <SystemSettingsPage />;
      default: return <AdminDashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab} tabs={TABS}>
      {renderTab()}
    </AdminLayout>
  );
}
