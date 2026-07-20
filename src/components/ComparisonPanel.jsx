import React, { useState, useMemo } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, LineChart, Line
} from 'recharts';
import { ArrowLeftRight, Calendar, MapPin, TrendingUp } from 'lucide-react';

const COLORS = {
  primary: '#3b82f6',
  secondary: '#f97316',
};

export const ComparisonPanel = ({ summaryData, history, facilities, t, lang, onFetchComparison }) => {
  const [compMode, setCompMode] = useState('time');

  const [timeA, setTimeA] = useState({ year: '', quarter: '' });
  const [timeB, setTimeB] = useState({ year: '', quarter: '' });

  const [locA, setLocA] = useState('');
  const [locB, setLocB] = useState('');
  const [locFilter, setLocFilter] = useState({ year: '', quarter: '' });

  const availableYears = useMemo(() => {
    const years = new Set();
    history.forEach(r => {
      if (r.inspection_year) years.add(r.inspection_year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [history]);

  const availableQuarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  const facilityIds = Object.keys(facilities);

  const handleTimeChange = (setter) => (e) => {
    setter(e.target.value);
  };

  const fetchTimeComparison = () => {
    if (timeA.year || timeA.quarter || timeB.year || timeB.quarter) {
      onFetchComparison({
        mode: 'time',
        timeA_year: timeA.year || undefined,
        timeA_quarter: timeA.quarter || undefined,
        timeB_year: timeB.year || undefined,
        timeB_quarter: timeB.quarter || undefined,
      });
    }
  };

  const fetchLocComparison = () => {
    if (locA && locB) {
      onFetchComparison({
        mode: 'location',
        locA,
        locB,
        loc_year: locFilter.year || undefined,
        loc_quarter: locFilter.quarter || undefined,
      });
    }
  };

  const labelA = useMemo(() => {
    if (compMode === 'time') {
      const parts = [];
      if (timeA.quarter) parts.push(timeA.quarter);
      if (timeA.year) parts.push(timeA.year);
      return parts.length > 0 ? parts.join(' ') : (t.entityA || 'A');
    }
    return facilities[locA]?.title || (t.entityA || 'A');
  }, [compMode, timeA, locA, facilities, t]);

  const labelB = useMemo(() => {
    if (compMode === 'time') {
      const parts = [];
      if (timeB.quarter) parts.push(timeB.quarter);
      if (timeB.year) parts.push(timeB.year);
      return parts.length > 0 ? parts.join(' ') : (t.entityB || 'B');
    }
    return facilities[locB]?.title || (t.entityB || 'B');
  }, [compMode, timeB, locB, facilities, t]);

  const statusLabels = {
    Excellent: t.excellentLabel,
    VeryGood: t.veryGoodLabel,
    Good: t.goodLabel,
    Acceptable: t.acceptableLabel,
    Bad: t.badLabel,
  };

  const showComparison = useMemo(() => {
    if (compMode === 'time') {
      return !!(timeA.year || timeA.quarter || timeB.year || timeB.quarter);
    }
    return !!(locA && locB);
  }, [compMode, timeA, timeB, locA, locB]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
          <ArrowLeftRight className="text-orange-500" size={20} />
          <span>{t.comparisons}</span>
        </h3>
        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 shadow-inner w-full sm:w-auto">
          <button
            onClick={() => { setCompMode('time'); onFetchComparison({ mode: '__clear__' }); }}
            className={`flex-1 sm:flex-none px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-semibold transition-all duration-200 ${
              compMode === 'time' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar size={15} className="inline-block mr-1.5 -mt-0.5" />
            <span>{t.timeVsTime}</span>
          </button>
          <button
            onClick={() => { setCompMode('location'); onFetchComparison({ mode: '__clear__' }); }}
            className={`flex-1 sm:flex-none px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-semibold transition-all duration-200 ${
              compMode === 'location' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MapPin size={15} className="inline-block mr-1.5 -mt-0.5" />
            <span>{t.locationVsLocation}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
        {compMode === 'time' ? (
          <>
            <div className="space-y-3">
              <h4 className="font-bold text-blue-600 text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>{t.entityA || 'Entity A'}</span>
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <select value={timeA.year} onChange={(e) => { setTimeA(prev => ({ ...prev, year: e.target.value })); }} className="bg-gray-50 border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm text-gray-700 shadow-sm">
                  <option value="">{t.selectYear}</option>
                  {availableYears.map(y => (<option key={y} value={y}>{y}</option>))}
                </select>
                <select value={timeA.quarter} onChange={(e) => { setTimeA(prev => ({ ...prev, quarter: e.target.value })); }} className="bg-gray-50 border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm text-gray-700 shadow-sm">
                  <option value="">{t.selectQuarter}</option>
                  {availableQuarters.map(q => (<option key={q} value={q}>{q}</option>))}
                </select>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold text-orange-600 text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                <span>{t.entityB || 'Entity B'}</span>
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <select value={timeB.year} onChange={(e) => { setTimeB(prev => ({ ...prev, year: e.target.value })); }} className="bg-gray-50 border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-orange-500 font-medium text-sm text-gray-700 shadow-sm">
                  <option value="">{t.selectYear}</option>
                  {availableYears.map(y => (<option key={y} value={y}>{y}</option>))}
                </select>
                <select value={timeB.quarter} onChange={(e) => { setTimeB(prev => ({ ...prev, quarter: e.target.value })); }} className="bg-gray-50 border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-orange-500 font-medium text-sm text-gray-700 shadow-sm">
                  <option value="">{t.selectQuarter}</option>
                  {availableQuarters.map(q => (<option key={q} value={q}>{q}</option>))}
                </select>
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button onClick={fetchTimeComparison} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors">
                {t.compare || 'Compare'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <h4 className="font-bold text-gray-700 text-sm">{t.locationVsLocation}</h4>
              <div className="grid grid-cols-2 gap-3">
                <select value={locA} onChange={(e) => { setLocA(e.target.value); }} className="bg-gray-50 border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm text-gray-700 shadow-sm">
                  <option value="">{t.location} A</option>
                  {facilityIds.map(fid => (<option key={fid} value={fid}>{facilities[fid]?.title || fid}</option>))}
                </select>
                <select value={locB} onChange={(e) => { setLocB(e.target.value); }} className="bg-gray-50 border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-orange-500 font-medium text-sm text-gray-700 shadow-sm">
                  <option value="">{t.location} B</option>
                  {facilityIds.map(fid => (<option key={fid} value={fid}>{facilities[fid]?.title || fid}</option>))}
                </select>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold text-gray-700 text-sm flex items-center gap-1.5">
                <span>{t.date} ({t.optional || 'Optional'})</span>
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <select value={locFilter.year} onChange={(e) => { setLocFilter(prev => ({ ...prev, year: e.target.value })); }} className="bg-gray-50 border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm text-gray-700 shadow-sm">
                  <option value="">{t.allYears}</option>
                  {availableYears.map(y => (<option key={y} value={y}>{y}</option>))}
                </select>
                <select value={locFilter.quarter} onChange={(e) => { setLocFilter(prev => ({ ...prev, quarter: e.target.value })); }} className="bg-gray-50 border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm text-gray-700 shadow-sm">
                  <option value="">{t.allQuarters}</option>
                  {availableQuarters.map(q => (<option key={q} value={q}>{q}</option>))}
                </select>
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button onClick={fetchLocComparison} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors">
                {t.compare || 'Compare'}
              </button>
            </div>
          </>
        )}
      </div>

      {!showComparison || !summaryData ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center text-blue-800">
          <ArrowLeftRight size={36} className="mx-auto mb-3 text-blue-400 animate-pulse" />
          <p className="font-bold text-lg">{t.noComparisonData}</p>
          <p className="text-sm mt-1">
            {compMode === 'time'
              ? 'Please select at least one Year or Quarter filter to start comparing.'
              : 'Select two locations to see side-by-side performance analysis.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col justify-between">
              <span className="text-sm font-bold text-gray-500 truncate">{labelA}</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-blue-600">{summaryData?.avgA || 0}%</span>
                <span className="text-xs text-gray-400 font-medium">({summaryData?.countA || 0} {t.recordCount})</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col justify-between">
              <span className="text-sm font-bold text-gray-500 truncate">{labelB}</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-orange-500">{summaryData?.avgB || 0}%</span>
                <span className="text-xs text-gray-400 font-medium">({summaryData?.countB || 0} {t.recordCount})</span>
              </div>
            </div>

            <div className={`p-6 rounded-xl border shadow-sm flex flex-col justify-between ${
              summaryData?.delta > 0
                ? 'bg-green-50 border-green-200 text-green-800'
                : summaryData?.delta < 0
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-gray-50 border-gray-200 text-gray-800'
            }`}>
              <span className="text-sm font-bold opacity-75">{t.delta}</span>
              <div className="mt-2 flex items-center gap-2">
                <TrendingUp size={28} className={summaryData?.delta < 0 ? 'transform rotate-180' : ''} />
                <span className="text-4xl font-extrabold" style={{ direction: 'ltr' }}>
                  {summaryData?.delta > 0 ? '+' : ''}
                  {summaryData?.delta || 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {compMode === 'time' ? (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h4 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
                  <span>{t.radarPerformance}</span>
                </h4>
                <div className="h-80 w-full" style={{ direction: 'ltr' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={summaryData?.radarData || []}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" fontSize={9} tick={{ fill: '#4a5568' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} fontSize={10} />
                      <Radar name={labelA} dataKey="A" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.2} />
                      <Radar name={labelB} dataKey="B" stroke={COLORS.secondary} fill={COLORS.secondary} fillOpacity={0.2} />
                      <Tooltip />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h4 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
                  <span>{t.performanceTrend}</span>
                </h4>
                <div className="h-80 w-full" style={{ direction: 'ltr' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={summaryData?.trendData || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" fontSize={11} tick={{ fill: '#64748b' }} />
                      <YAxis domain={[0, 100]} fontSize={11} tick={{ fill: '#64748b' }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey={labelA} stroke={COLORS.primary} strokeWidth={3} dot={{ r: 4 }} connectNulls />
                      <Line type="monotone" dataKey={labelB} stroke={COLORS.secondary} strokeWidth={3} dot={{ r: 4 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h4 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
                <span>{t.statusDistribution}</span>
              </h4>
              <div className="h-80 w-full" style={{ direction: 'ltr' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(summaryData?.barData || []).map(d => ({
                    name: statusLabels[d.name] || d.name,
                    [labelA]: d.A !== undefined ? d.A : d[labelA] || 0,
                    [labelB]: d.B !== undefined ? d.B : d[labelB] || 0,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={11} tick={{ fill: '#64748b' }} />
                    <YAxis fontSize={11} tick={{ fill: '#64748b' }} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Legend />
                    <Bar dataKey={labelA} fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                    <Bar dataKey={labelB} fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
