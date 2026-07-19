import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sprout, Warehouse, Droplet, ShieldAlert, Home,
  Wrench, Trash2, Waves, Package, Users, ClipboardList,
  History, BarChart3, ChevronLeft, ChevronRight, Save,
  Printer, Plus, ArrowLeftRight, Trash, Globe, Shield, RefreshCw,
  Menu, X, FileDown
} from 'lucide-react';
import { supabase } from './supabase';
import { saveToDB, getFromDB } from './db';
import { LANGUAGES, UI_TRANSLATIONS } from './translations';
import { FACILITY_TRANSLATIONS } from './translations/criteria';
import { InspectionForm } from './components/InspectionForm';
import { HistoryPanel } from './components/HistoryPanel';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ComparisonPanel } from './components/ComparisonPanel';

const INITIAL_ROW = {
  status: '',
  action: '',
  responsible: '',
  notes: ''
};

const FACILITY_ICONS = {
  greenhouses: Sprout,
  warehouses: Warehouse,
  irrigation: Droplet,
  nursery: Sprout,
  pesticides: ShieldAlert,
  accommodation: Home,
  workshop: Wrench,
  scrap: Trash2,
  lakes: Waves,
  packing: Package,
  femaleRestArea: Users,
  maleRestArea: Users,
  generalFacilities: ClipboardList
};

// Simple helper to get score color class
const getScoreColor = (score) => {
  if (score >= 90) return 'text-green-600';
  if (score >= 80) return 'text-blue-600';
  if (score >= 60) return 'text-cyan-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
};

// Simple helper to calculate inspector year and quarter immune to timezone parsing issues
const getQuarterAndYear = (dateStr) => {
  if (!dateStr) {
    const d = new Date();
    const month = d.getMonth();
    const year = d.getFullYear();
    const q = month < 3 ? 'Q1' : month < 6 ? 'Q2' : month < 9 ? 'Q3' : 'Q4';
    return { year, quarter: q };
  }
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10); // 1-12
  let quarter = 'Q1';
  if (month >= 4 && month <= 6) quarter = 'Q2';
  else if (month >= 7 && month <= 9) quarter = 'Q3';
  else if (month >= 10 && month <= 12) quarter = 'Q4';
  return { year, quarter };
};

// Simple helper to calculate inspector score
const calculateScore = (rows) => {
  if (!Array.isArray(rows)) return 0;
  let totalScore = 0;
  let count = 0;
  
  // Statically check mapping to original values
  const scoreMapping = {
    'ممتاز': 100,
    'جيد جداً': 80,
    'جيد': 60,
    'مقبول': 40,
    'سيء': 0
  };

  rows.forEach(row => {
    if (row.status && scoreMapping[row.status] !== undefined) {
      totalScore += scoreMapping[row.status];
      count++;
    }
    for (let i = 1; i <= 6; i++) {
      const key = `status_${i}`;
      if (row[key] && scoreMapping[row[key]] !== undefined) {
        totalScore += scoreMapping[row[key]];
        count++;
      }
    }
  });
  if (count === 0) return 0;
  return Math.round(totalScore / count);
};

function App() {
  const [lang, setLang] = useState('ar');
  const [activeTab, setActiveTab] = useState('greenhouses');
  const [viewMode, setViewMode] = useState('inspection');
  const [formData, setFormData] = useState({});
  const [history, setHistory] = useState([]);
  const [showSidebar, setShowSidebar] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [viewingRecordId, setViewingRecordId] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Active translation dictionary with automatic English fallback for un-translated keys
  const t = useMemo(() => {
    const current = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.en;
    return new Proxy(current, {
      get(target, prop) {
        return target[prop] !== undefined ? target[prop] : (UI_TRANSLATIONS.en[prop] || prop);
      }
    });
  }, [lang]);
  const isRtl = useMemo(() => {
    const activeLang = LANGUAGES.find(l => l.code === lang);
    return activeLang ? activeLang.dir === 'rtl' : true;
  }, [lang]);

  // Sync online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Set html document lang & dir dynamically
  useEffect(() => {
    const currentLangObj = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];
    document.documentElement.dir = currentLangObj.dir;
    document.documentElement.lang = currentLangObj.code;
  }, [lang]);

  // Load drafts on mount
  useEffect(() => {
    const loadDrafts = async () => {
      const initialData = {};
      
      // Use Arabic template keys dynamically mapped to chosen criteria
      const templateCriteria = FACILITY_TRANSLATIONS.ar;

      Object.keys(templateCriteria).forEach(key => {
        initialData[key] = {
          inspector: '',
          date: new Date().toISOString().split('T')[0],
          notes: '',
          rows: templateCriteria[key].items.map(item => ({ ...INITIAL_ROW, criteria: item })),
          photos: []
        };
      });

      try {
        const savedDrafts = await getFromDB('drafts', 'farmInspectionData');
        if (savedDrafts) {
          const mergedData = { ...initialData };
          Object.keys(savedDrafts).forEach(key => {
            if (mergedData[key]) {
              mergedData[key] = {
                ...mergedData[key],
                ...savedDrafts[key],
                photos: savedDrafts[key].photos || []
              };
            }
          });
          setFormData(mergedData);
        } else {
          setFormData(initialData);
        }
      } catch (e) {
        console.error("Failed to load IndexedDB drafts:", e);
        setFormData(initialData);
      }
      setIsDataLoaded(true);
    };

    loadDrafts();
  }, []);

  // Fetch Supabase records and subscribe to realtime updates
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('inspection_tool_records')
          .select('*')
          .order('date', { ascending: false });
        
        if (error) {
          console.error("Supabase fetch error:", error);
          setHistory([]);
        } else {
          const normalized = (data || []).map(r => {
            if (!r.inspection_year || !r.inspection_quarter) {
              const { year, quarter } = getQuarterAndYear(r.date);
              return {
                ...r,
                inspection_year: r.inspection_year || year,
                inspection_quarter: r.inspection_quarter || quarter
              };
            }
            return r;
          });
          setHistory(normalized);
        }
      } catch (err) {
        console.error("Network error fetching Supabase records:", err);
        setHistory([]);
      }
    };

    fetchHistory();

    // Subscribe to realtime changes in public.inspection_tool_records
    let channel;
    try {
      channel = supabase
        .channel('records_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inspection_tool_records' }, (payload) => {
          const evt = payload.eventType;
          if (evt === 'INSERT') {
            const { year, quarter } = getQuarterAndYear(payload.new.date);
            const normalizedNew = {
              ...payload.new,
              inspection_year: payload.new.inspection_year || year,
              inspection_quarter: payload.new.inspection_quarter || quarter
            };
            setHistory(prev => [normalizedNew, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)));
          } else if (evt === 'DELETE') {
            setHistory(prev => prev.filter(r => r.id !== payload.old.id));
          } else if (evt === 'UPDATE') {
            const { year, quarter } = getQuarterAndYear(payload.new.date);
            const normalizedNew = {
              ...payload.new,
              inspection_year: payload.new.inspection_year || year,
              inspection_quarter: payload.new.inspection_quarter || quarter
            };
            setHistory(prev =>
              prev.map(r => r.id === payload.new.id ? normalizedNew : r)
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
            );
          }
        })
        .subscribe();
    } catch (err) {
      console.warn("Realtime sync channel setup failed:", err);
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // Auto-save form drafts to IndexedDB
  useEffect(() => {
    if (isDataLoaded && Object.keys(formData).length > 0) {
      const timer = setTimeout(() => {
        saveToDB('drafts', 'farmInspectionData', formData);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [formData, isDataLoaded]);

  // Map Arabic template criteria dynamically to current lang
  const translatedFormData = useMemo(() => {
    if (Object.keys(formData).length === 0) return {};
    
    const translated = { ...formData };
    
    // Switch criteria text on the fly based on active language
    Object.keys(translated).forEach(facilityId => {
      if (translated[facilityId]?.rows) {
        translated[facilityId].rows = translated[facilityId].rows.map((row, idx) => {
          const localizedItem = FACILITY_TRANSLATIONS[lang]?.[facilityId]?.items?.[idx] || row.criteria;
          return {
            ...row,
            criteria: localizedItem
          };
        });
      }
    });
    
    return translated;
  }, [formData, lang]);

  // Compute analytics
  const currentData = translatedFormData[activeTab];
  const currentScore = useMemo(() => currentData ? calculateScore(formData[activeTab]?.rows) : 0, [formData, activeTab]);

  const lastRecord = useMemo(() => {
    const facilityHistory = history.filter(r => r.facility_id === activeTab);
    if (facilityHistory.length === 0) return null;
    if (viewingRecordId) {
      const idx = facilityHistory.findIndex(r => r.id === viewingRecordId);
      if (idx >= 0 && idx < facilityHistory.length - 1) {
        return facilityHistory[idx + 1];
      }
      return null;
    }
    return facilityHistory[0];
  }, [history, activeTab, viewingRecordId]);

  const scoreDifference = lastRecord ? currentScore - lastRecord.score : null;

  // Header change handler
  const handleHeaderChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [field]: value
      }
    }));
  };

  // Row status/action/responsible change handler
  const handleRowChange = (index, field, value) => {
    setFormData(prev => {
      const newRows = [...prev[activeTab].rows];
      newRows[index] = { ...newRows[index], [field]: value };
      return {
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          rows: newRows
        }
      };
    });
  };

  // Photo compressor helper
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = () => resolve(event.target.result);
      };
      reader.onerror = () => resolve(null);
    });
  };

  // Handle file uploads
  const handlePhotoUpload = async (event) => {
    const files = Array.from(event.target.files);
    const newPhotos = [];
    for (const file of files) {
      const compressedBase64 = await compressImage(file);
      if (compressedBase64) {
        newPhotos.push(compressedBase64);
      }
    }
    setFormData(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        photos: [...(prev[activeTab].photos || []), ...newPhotos]
      }
    }));
  };

  // Remove photo from drafts
  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        photos: (prev[activeTab].photos || []).filter((_, i) => i !== index)
      }
    }));
  };

  // Reset form
  const resetForm = (tabId) => {
    const templateCriteria = FACILITY_TRANSLATIONS.ar;
    setFormData(prev => ({
      ...prev,
      [tabId]: {
        inspector: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        rows: templateCriteria[tabId].items.map(item => ({ ...INITIAL_ROW, criteria: item })),
        photos: []
      }
    }));
    setViewingRecordId(null);
  };

  const clearCurrentForm = () => {
    if (window.confirm(t.confirmClear)) {
      resetForm(activeTab);
    }
  };

  // Save inspection to Supabase (and storage bucket)
  const saveToHistory = async () => {
    const currentRaw = formData[activeTab];
    if (!currentRaw.inspector) {
      alert(t.enterInspector);
      return;
    }

    try {
      const score = calculateScore(currentRaw.rows);
      const photoUrls = [];

      // If online and we have photos, upload them
      if (currentRaw.photos && currentRaw.photos.length > 0) {
        for (let i = 0; i < currentRaw.photos.length; i++) {
          const base64 = currentRaw.photos[i];
          try {
            const resp = await fetch(base64);
            const blob = await resp.blob();
            const ext = base64.startsWith('data:image/png') ? 'png' : 'jpg';
            const fileName = `${activeTab}_${Date.now()}_${i}.${ext}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('inspection_tool_photos')
              .upload(fileName, blob, { contentType: `image/${ext}`, upsert: true });

            if (uploadError) {
              console.error("Storage upload failed, falling back to base64:", uploadError);
              photoUrls.push(base64);
            } else {
              const { data: urlData } = supabase.storage
                .from('inspection_tool_photos')
                .getPublicUrl(fileName);
              photoUrls.push(urlData.publicUrl);
            }
          } catch (uploadErr) {
            console.error("Photo process failed, pushing base64:", uploadErr);
            photoUrls.push(base64);
          }
        }
      }

      // Snapshot inspection record
      const activeCriteria = FACILITY_TRANSLATIONS[lang]?.[activeTab] || FACILITY_TRANSLATIONS.ar[activeTab];
      const snapshotRows = currentRaw.rows.map((row, idx) => ({
        ...row,
        criteria: activeCriteria.items[idx] || row.criteria
      }));

      const { year, quarter } = getQuarterAndYear(currentRaw.date);
      const newRecord = {
        facility_id: activeTab,
        facility_title: FACILITY_TRANSLATIONS[lang]?.[activeTab]?.title || FACILITY_TRANSLATIONS.ar[activeTab].title,
        inspector: currentRaw.inspector,
        date: currentRaw.date,
        inspection_year: year,
        inspection_quarter: quarter,
        data: {
          inspector: currentRaw.inspector,
          date: currentRaw.date,
          notes: currentRaw.notes,
          rows: snapshotRows
        },
        score: score,
        photo_urls: photoUrls
      };

      const { error } = await supabase.from('inspection_tool_records').insert(newRecord);
      if (error) throw error;

      if (window.confirm(t.confirmSave)) {
        resetForm(activeTab);
      }
    } catch (err) {
      console.error("Failed to submit record:", err);
      alert("Submission Error: " + err.message);
    }
  };

  // Delete inspection record
  const deleteRecord = async (id) => {
    if (window.confirm(t.confirmDelete)) {
      try {
        const { error } = await supabase.from('inspection_tool_records').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error("Delete record error:", err);
        alert("Deletion Error: " + err.message);
      }
    }
  };

  // Load record from history back to active form editor
  const loadRecord = (record) => {
    if (!FACILITY_TRANSLATIONS.ar[record.facility_id]) {
      alert("Error: Unknown facility type.");
      return;
    }

    if (window.confirm(t.confirmLoad)) {
      const template = FACILITY_TRANSLATIONS.ar[record.facility_id];
      const defaultRows = template.items.map(item => ({ ...INITIAL_ROW, criteria: item }));
      
      const loadedData = {
        inspector: record.data.inspector || '',
        date: record.data.date || new Date().toISOString().split('T')[0],
        notes: record.data.notes || '',
        rows: Array.isArray(record.data.rows) ? record.data.rows : defaultRows,
        photos: Array.isArray(record.photo_urls) ? record.photo_urls : []
      };

      setFormData(prev => ({
        ...prev,
        [record.facility_id]: loadedData
      }));
      setActiveTab(record.facility_id);
      setViewMode('inspection');
      setViewingRecordId(record.id);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  if (!isDataLoaded || !currentData) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center h-screen bg-gray-50 text-gray-700">
        <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
        <span className="font-bold text-lg">{t.loading}</span>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex h-screen overflow-hidden">
        
        {/* Mobile Backdrop Overlay */}
        {showSidebar && (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
            onClick={() => setShowSidebar(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar Nav */}
        <aside
          className={`sidebar bg-slate-900 text-white flex-shrink-0 transition-all duration-300 ease-in-out no-print overflow-y-auto 
            fixed inset-y-0 start-0 z-50 md:static md:z-auto ${
              showSidebar ? 'w-64' : 'max-md:hidden md:w-0'
            }`}
          role="navigation"
          aria-label={t.siteInspection}
        >
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-green-400" />
              <span>{t.title}</span>
            </h1>
            <button
              onClick={() => setShowSidebar(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>
          <nav className="p-4 space-y-2">
            <div className="text-xs text-slate-500 font-bold px-2 mb-2">{t.siteInspection}</div>
            
            {Object.keys(FACILITY_TRANSLATIONS[lang] || FACILITY_TRANSLATIONS.ar).map(key => {
              const Icon = FACILITY_ICONS[key] || Sprout;
              const title = FACILITY_TRANSLATIONS[lang]?.[key]?.title || FACILITY_TRANSLATIONS.ar[key].title;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setActiveTab(key);
                    setViewMode('inspection');
                    setViewingRecordId(null);
                    if (window.innerWidth < 768) setShowSidebar(false);
                  }}
                  className={`w-full text-start p-3 rounded-lg flex items-center gap-3 transition-colors focus-ring ${
                    activeTab === key && viewMode === 'inspection'
                      ? 'bg-green-600 text-white shadow-lg font-bold'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                  aria-current={activeTab === key && viewMode === 'inspection' ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">{title}</span>
                </button>
              );
            })}

            <div className="my-4 border-t border-slate-700"></div>
            
            <button
              onClick={() => {
                setViewMode('history');
                if (window.innerWidth < 768) setShowSidebar(false);
              }}
              className={`w-full text-start p-3 rounded-lg flex items-center gap-3 transition-colors focus-ring ${
                viewMode === 'history' ? 'bg-blue-600 text-white shadow-lg font-bold' : 'hover:bg-slate-800 text-slate-300'
              }`}
              aria-current={viewMode === 'history' ? 'page' : undefined}
            >
              <History size={20} className="flex-shrink-0" />
              <span>{t.archive}</span>
            </button>
            
            <button
              onClick={() => {
                setViewMode('analytics');
                if (window.innerWidth < 768) setShowSidebar(false);
              }}
              className={`w-full text-start p-3 rounded-lg flex items-center gap-3 transition-colors focus-ring ${
                viewMode === 'analytics' ? 'bg-purple-600 text-white shadow-lg font-bold' : 'hover:bg-slate-800 text-slate-300'
              }`}
              aria-current={viewMode === 'analytics' ? 'page' : undefined}
            >
              <BarChart3 size={20} className="flex-shrink-0" />
              <span>{t.analytics}</span>
            </button>

            <button
              onClick={() => {
                setViewMode('comparisons');
                if (window.innerWidth < 768) setShowSidebar(false);
              }}
              className={`w-full text-start p-3 rounded-lg flex items-center gap-3 transition-colors focus-ring ${
                viewMode === 'comparisons' ? 'bg-orange-600 text-white shadow-lg font-bold' : 'hover:bg-slate-800 text-slate-300'
              }`}
              aria-current={viewMode === 'comparisons' ? 'page' : undefined}
            >
              <ArrowLeftRight size={20} className="flex-shrink-0" />
              <span>{t.comparisons}</span>
            </button>
          </nav>
          
          <div className="p-4 mt-auto border-t border-slate-800 text-xs text-slate-500 text-center flex flex-col gap-1">
            <span>{t.version}</span>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          
          {/* Header */}
          <header className="bg-white shadow-sm border-b px-3 py-3 sm:px-6 sm:py-4 flex flex-wrap items-center justify-between gap-2 no-print z-10">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 focus-ring flex items-center justify-center"
                aria-label="Toggle Sidebar"
              >
                <span className="md:hidden">
                  {showSidebar ? <X size={20} /> : <Menu size={20} />}
                </span>
                <span className="hidden md:block">
                  {showSidebar ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </span>
              </button>
              <div className="min-w-0">
                <h2 className="text-base sm:text-xl font-bold text-gray-800 truncate max-w-[140px] xs:max-w-[200px] sm:max-w-none">
                  {viewMode === 'inspection'
                    ? FACILITY_TRANSLATIONS[lang]?.[activeTab]?.title || FACILITY_TRANSLATIONS.ar[activeTab].title
                    : viewMode === 'history'
                    ? t.historyHeader
                    : viewMode === 'comparisons'
                    ? t.comparisons
                    : t.analytics}
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
              {/* Language Selection */}
              <div className="relative flex items-center gap-1 bg-gray-100 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-green-500 text-xs sm:text-sm">
                <Globe size={14} className="text-gray-500 flex-shrink-0" />
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs sm:text-sm font-semibold text-gray-700 cursor-pointer"
                  aria-label="Change Language"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Online/Offline Status */}
              <div
                className={`p-1.5 rounded-full flex items-center justify-center border ${
                  isOnline
                    ? 'bg-green-50 border-green-200 text-green-600'
                    : 'bg-red-50 border-red-200 text-red-600'
                }`}
                title={isOnline ? "Online" : "Offline"}
                aria-label={isOnline ? "Server connected" : "Offline, saving local drafts"}
              >
                <Shield size={14} />
              </div>

              {viewMode === 'inspection' && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {lastRecord && (
                    <div
                      className={`hidden sm:flex px-2.5 py-1 rounded-lg border items-center gap-2 transition-colors ${
                        scoreDifference > 0
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : scoreDifference < 0
                          ? 'bg-red-50 border-red-200 text-red-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}
                    >
                      <span className="text-xs font-bold">{t.compareLast}</span>
                      <div className="flex items-center gap-1 dir-ltr font-bold text-sm" style={{ direction: 'ltr' }}>
                        {scoreDifference > 0 ? '+' : ''}
                        {scoreDifference}%
                      </div>
                    </div>
                  )}

                  <div className="px-2.5 py-1 sm:px-4 sm:py-1.5 bg-white rounded-lg border border-gray-200 flex items-center gap-1.5 sm:gap-3 shadow-sm">
                    <span className="text-[10px] sm:text-xs text-gray-500 font-bold">{t.score}</span>
                    <span className={`text-base sm:text-xl font-bold ${getScoreColor(currentScore)}`}>{currentScore}%</span>
                  </div>

                  <button
                    onClick={saveToHistory}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition-colors text-xs sm:text-sm font-medium focus-ring"
                    aria-label="Save Inspection"
                  >
                    <Save size={16} />
                    <span className="hidden sm:inline">{t.save}</span>
                  </button>

                  <button
                    onClick={clearCurrentForm}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200 text-xs sm:text-sm focus-ring"
                    aria-label="Clear Form"
                  >
                    <Trash size={16} />
                    <span className="hidden md:inline">{t.clear}</span>
                  </button>

                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors text-xs sm:text-sm font-medium focus-ring"
                    aria-label="Download PDF"
                    title={t.downloadPDF || 'Download PDF'}
                  >
                    <FileDown size={16} />
                    <span className="hidden sm:inline">{t.downloadPDF || 'Download PDF'}</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="hidden xs:flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg shadow-sm transition-colors text-xs sm:text-sm focus-ring"
                    aria-label="Print Form"
                  >
                    <Printer size={16} />
                    <span className="hidden md:inline">{t.print}</span>
                  </button>
                </div>
              )}

              {viewMode === 'analytics' && (
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors text-xs sm:text-sm font-medium focus-ring"
                >
                  <Printer size={16} />
                  <span>{t.printReport}</span>
                </button>
              )}
            </div>
          </header>

          {/* Subview router */}
          <main className="flex-1 overflow-auto p-4 sm:p-8" id="main-content" role="main">
            {viewMode === 'inspection' && (
              <div className="print-scale-down" id="printable-area">
                <InspectionForm
                  activeTab={activeTab}
                  facilityTitle={FACILITY_TRANSLATIONS[lang]?.[activeTab]?.title || FACILITY_TRANSLATIONS.ar[activeTab].title}
                  currentData={currentData}
                  lastRecord={lastRecord}
                  scoreDifference={scoreDifference}
                  currentScore={currentScore}
                  handleHeaderChange={handleHeaderChange}
                  handleRowChange={handleRowChange}
                  handlePhotoUpload={handlePhotoUpload}
                  removePhoto={removePhoto}
                  clearCurrentForm={clearCurrentForm}
                  saveToHistory={saveToHistory}
                  handlePrint={handlePrint}
                  handleDownloadPDF={handleDownloadPDF}
                  t={t}
                  isRtl={isRtl}
                />
              </div>
            )}

            {viewMode === 'history' && (
              <HistoryPanel
                history={history}
                historyFilter={historyFilter}
                setHistoryFilter={setHistoryFilter}
                facilities={FACILITY_TRANSLATIONS[lang] || FACILITY_TRANSLATIONS.ar}
                loadRecord={loadRecord}
                deleteRecord={deleteRecord}
                t={t}
              />
            )}

            {viewMode === 'analytics' && (
              <AnalyticsDashboard
                history={history}
                t={t}
                lang={lang}
              />
            )}

            {viewMode === 'comparisons' && (
              <ComparisonPanel
                history={history}
                facilities={FACILITY_TRANSLATIONS[lang] || FACILITY_TRANSLATIONS.ar}
                t={t}
                lang={lang}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
