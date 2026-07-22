import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle, Clock, CheckCircle, User, Calendar, ChevronRight,
  RefreshCw, Filter, ArrowUpDown
} from 'lucide-react';
import { api } from '../api';
import { NCDetail } from './NCDetail';

const STATUS_COLUMNS = [
  { key: 'open', label: 'Open', color: 'bg-red-50 border-red-300' },
  { key: 'assigned', label: 'Assigned', color: 'bg-orange-50 border-orange-300' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-blue-50 border-blue-300' },
  { key: 'action_taken', label: 'Action Taken', color: 'bg-purple-50 border-purple-300' },
  { key: 'under_review', label: 'Under Review', color: 'bg-indigo-50 border-indigo-300' },
  { key: 'closed', label: 'Closed', color: 'bg-green-50 border-green-300' },
  { key: 'reopened', label: 'Reopened', color: 'bg-yellow-50 border-yellow-300' },
];

const SEVERITY_COLORS = {
  Critical: 'bg-red-600 text-white',
  Major: 'bg-orange-500 text-white',
  Minor: 'bg-yellow-500 text-white',
  Observation: 'bg-blue-500 text-white',
};

export function NCKanbanBoard({ t }) {
  const [ncs, setNCs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNC, setSelectedNC] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterAssigned, setFilterAssigned] = useState('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const [ncRes, statsRes] = await Promise.all([
        api.getNCs(),
        api.getNCStats(),
      ]);
      setNCs(ncRes.ncs || []);
      setStats(statsRes.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    return ncs.filter(nc => {
      if (filterSeverity !== 'all' && nc.severity !== filterSeverity) return false;
      if (filterAssigned === 'me' && nc.assigned_to !== 'me') return false;
      return true;
    });
  }, [ncs, filterSeverity, filterAssigned]);

  if (selectedNC) {
    return <NCDetail ncId={selectedNC} t={t} onBack={() => { setSelectedNC(null); loadData(); }} />;
  }

  const grouped = {};
  STATUS_COLUMNS.forEach(col => { grouped[col.key] = []; });
  filtered.forEach(nc => {
    if (grouped[nc.status]) grouped[nc.status].push(nc);
  });

  if (loading) {
    return <div className="flex justify-center py-12"><RefreshCw className="w-8 h-8 animate-spin text-green-600" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          <StatBadge label="Total" value={stats.total} color="bg-gray-600" />
          <StatBadge label="Open" value={stats.open} color="bg-red-500" />
          <StatBadge label="In Progress" value={stats.in_progress} color="bg-blue-500" />
          <StatBadge label="Review" value={stats.under_review} color="bg-purple-500" />
          <StatBadge label="Closed" value={stats.closed} color="bg-green-500" />
          <StatBadge label="Overdue" value={stats.overdue} color="bg-red-700" />
          <StatBadge label="Critical" value={stats.critical} color="bg-red-800" />
          <StatBadge label="Major" value={stats.major} color="bg-orange-600" />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-gray-400" />
        <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="text-xs border rounded px-2 py-1">
          <option value="all">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="Major">Major</option>
          <option value="Minor">Minor</option>
          <option value="Observation">Observation</option>
        </select>
        <select value={filterAssigned} onChange={e => setFilterAssigned(e.target.value)} className="text-xs border rounded px-2 py-1">
          <option value="all">All NCs</option>
          <option value="me">Assigned to me</option>
        </select>
      </div>

      {/* Kanban columns */}
      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '400px' }}>
        {STATUS_COLUMNS.map(col => (
          <div key={col.key} className={`flex-shrink-0 w-64 rounded-xl border ${col.color} bg-white`}>
            <div className="px-3 py-2 border-b flex items-center justify-between">
              <span className="text-xs font-bold text-gray-600">{col.label}</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{grouped[col.key].length}</span>
            </div>
            <div className="p-2 space-y-2 max-h-[60vh] overflow-y-auto">
              {grouped[col.key].map(nc => (
                <button
                  key={nc.id}
                  onClick={() => setSelectedNC(nc.id)}
                  className="w-full text-start bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-xs font-bold text-gray-800 truncate">{nc.nc_number}</span>
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${SEVERITY_COLORS[nc.severity] || 'bg-gray-500 text-white'}`}>
                      {nc.severity?.substring(0, 3)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 mb-1.5">{nc.description}</p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    {nc.assigned_name && <span className="flex items-center gap-0.5"><User size={10} /> {nc.assigned_name}</span>}
                    {nc.due_date && <span className="flex items-center gap-0.5"><Calendar size={10} /> {nc.due_date?.split('T')[0]}</span>}
                  </div>
                </button>
              ))}
              {grouped[col.key].length === 0 && (
                <p className="text-xs text-gray-300 text-center py-4">No NCs</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatBadge({ label, value, color }) {
  return (
    <div className={`text-white rounded-lg px-2 py-1.5 text-center ${color}`}>
      <div className="text-lg font-extrabold">{value || 0}</div>
      <div className="text-[10px] font-medium opacity-90">{label}</div>
    </div>
  );
}
