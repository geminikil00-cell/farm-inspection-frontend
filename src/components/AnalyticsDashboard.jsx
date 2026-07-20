import React, { useMemo, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { TrendingUp, BarChart2, PieChart as PieIcon, Activity, Calendar, Award } from 'lucide-react';

const COLORS = {
  excellent: '#22c55e',
  veryGood: '#3b82f6',
  good: '#06b6d4',
  acceptable: '#eab308',
  bad: '#ef4444',
};

export const AnalyticsDashboard = ({ summaryData, history, t, lang, onFilterChange }) => {
  const [yearFilter, setYearFilter] = useState('');
  const [quarterFilter, setQuarterFilter] = useState('');

  const availableYears = useMemo(() => {
    const years = new Set();
    history.forEach(r => {
      if (r.inspection_year) years.add(r.inspection_year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [history]);

  const availableQuarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  const handleYearChange = (e) => {
    setYearFilter(e.target.value);
    onFilterChange(e.target.value || undefined, quarterFilter || undefined);
  };

  const handleQuarterChange = (e) => {
    setQuarterFilter(e.target.value);
    onFilterChange(yearFilter || undefined, e.target.value || undefined);
  };

  if (!summaryData && history.length < 2) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center text-yellow-800 focus-ring" tabIndex="0">
        <Activity size={32} className="mx-auto mb-2 opacity-50" />
        <p className="font-bold">{t.insufficientData}</p>
        <p className="text-sm mt-1">{t.minTwoRecords}</p>
      </div>
    );
  }

  if (!summaryData) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-500">{t.loading}</p>
      </div>
    );
  }

  if (summaryData.recordCount === 0) {
    return (
      <div className="bg-gray-100 rounded-xl p-6 sm:p-8 text-center text-gray-500">
        <p className="font-bold text-sm sm:text-base">No records match the active filter criteria.</p>
      </div>
    );
  }

  const {
    recordCount,
    averageScore,
    trendData = [],
    comparisonData = [],
    radarData = [],
    pieData = [],
    quarterlyStatusData = [],
  } = summaryData;

  const statusLabels = {
    Excellent: t.excellentLabel,
    VeryGood: t.veryGoodLabel,
    Good: t.goodLabel,
    Acceptable: t.acceptableLabel,
    Bad: t.badLabel,
  };

  const mappedPieData = pieData.map(d => ({
    ...d,
    name: statusLabels[d.name] || d.name,
  }));

  const mappedQuarterly = quarterlyStatusData.map(d => ({
    ...d,
    [statusLabels.Excellent]: d.Excellent || 0,
    [statusLabels.VeryGood]: d.VeryGood || 0,
    [statusLabels.Good]: d.Good || 0,
    [statusLabels.Acceptable]: d.Acceptable || 0,
    [statusLabels.Bad]: d.Bad || 0,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
        <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
          <Calendar className="text-blue-600" size={18} />
          <span>Filters</span>
        </h3>
        <div className="flex flex-wrap gap-2 sm:gap-3 items-center w-full md:w-auto">
          <select
            value={yearFilter}
            onChange={handleYearChange}
            className="bg-gray-50 border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-xs sm:text-sm text-gray-700 shadow-sm flex-1 md:flex-none"
          >
            <option value="">{t.allYears}</option>
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={quarterFilter}
            onChange={handleQuarterChange}
            className="bg-gray-50 border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-xs sm:text-sm text-gray-700 shadow-sm flex-1 md:flex-none"
          >
            <option value="">{t.allQuarters}</option>
            {availableQuarters.map(q => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-800">{t.analytics}</h3>
        </div>
        <div className="flex gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="bg-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow-sm border font-bold text-gray-700">
            {t.recordCount}: {recordCount}
          </div>
          <div className="bg-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow-sm border font-bold text-gray-700">
            {t.average}: <span className="text-green-600">{averageScore}%</span>
          </div>
        </div>
      </div>

      <div className="analytics-print-container grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 analytics-print-item focus-ring" tabIndex="0" aria-label="Performance trend chart">
          <h4 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-500" />
            {t.performanceTrend}
          </h4>
          <div className="h-64 w-full" style={{ direction: 'ltr' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="date" fontSize={12} tick={{ fill: '#666' }} />
                <YAxis domain={[0, 100]} fontSize={12} tick={{ fill: '#666' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="score"
                  name={t.score}
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 analytics-print-item focus-ring" tabIndex="0" aria-label="Locations radar chart">
          <h4 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
            <Award size={18} className="text-green-500" />
            {t.performanceByFacility} (Radar)
          </h4>
          <div className="h-64 w-full" style={{ direction: 'ltr' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" fontSize={8} tick={{ fill: '#4a5568' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} fontSize={8} />
                <Radar
                  name="Average Score"
                  dataKey="score"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.2}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 analytics-print-item focus-ring" tabIndex="0" aria-label="Quarterly status distribution chart">
          <h4 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
            <BarChart2 size={18} className="text-orange-500" />
            {t.quarterlyTrend}
          </h4>
          <div className="h-64 w-full" style={{ direction: 'ltr' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mappedQuarterly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" fontSize={11} tick={{ fill: '#666' }} />
                <YAxis fontSize={12} tick={{ fill: '#666' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey={statusLabels.Excellent} stackId="a" fill={COLORS.excellent} />
                <Bar dataKey={statusLabels.VeryGood} stackId="a" fill={COLORS.veryGood} />
                <Bar dataKey={statusLabels.Good} stackId="a" fill={COLORS.good} />
                <Bar dataKey={statusLabels.Acceptable} stackId="a" fill={COLORS.acceptable} />
                <Bar dataKey={statusLabels.Bad} stackId="a" fill={COLORS.bad} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 analytics-print-item focus-ring" tabIndex="0" aria-label="Department comparison chart">
          <h4 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
            <BarChart2 size={18} className="text-purple-500" />
            {t.compDepartments}
          </h4>
          <div className="h-64 w-full" style={{ direction: 'ltr' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" fontSize={9} tick={{ fill: '#666' }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis domain={[0, 100]} fontSize={12} tick={{ fill: '#666' }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="average" name={t.average} fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 analytics-print-full lg:col-span-2 focus-ring" tabIndex="0" aria-label="Status distribution chart">
          <h4 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
            <PieIcon size={18} className="text-green-500" />
            {t.distStatus}
          </h4>
          <div className="h-64 w-full flex justify-center" style={{ direction: 'ltr' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mappedPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mappedPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
