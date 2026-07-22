import React, { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { SystemUnitsPage } from './SystemUnitsPage';
import { SystemAuditsPage } from './SystemAuditsPage';
import { SystemUsersPage } from './SystemUsersPage';
import { SystemTemplatesPage } from './SystemTemplatesPage';
import { SystemMessagesPage } from './SystemMessagesPage';
import { SystemNotificationsPage } from './SystemNotificationsPage';
import { SystemSettingsPage } from './SystemSettingsPage';

export function SystemAdminApp() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <AdminDashboard onNavigate={setActiveTab} />;
      case 'units': return <SystemUnitsPage onNavigate={setActiveTab} />;
      case 'audits': return <SystemAuditsPage />;
      case 'users': return <SystemUsersPage />;
      case 'templates': return <SystemTemplatesPage />;
      case 'messages': return <SystemMessagesPage />;
      case 'notifications': return <SystemNotificationsPage />;
      case 'settings': return <SystemSettingsPage />;
      default: return <AdminDashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderTab()}
    </AdminLayout>
  );
}
