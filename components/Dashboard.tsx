// components/Dashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Radar, 
  Plus, 
  MapPin, 
  CheckCircle, 
  Clock, 
  Archive, 
  Sparkles, 
  RefreshCw,
  Search,
  Phone,
  Settings
} from 'lucide-react';
import { AcquisitionRecommendation } from '@/lib/db/mockData';
import OpportunityCard from './OpportunityCard';

export default function Dashboard() {
  const [recommendations, setRecommendations] = useState<AcquisitionRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<'new' | 'called' | 'scheduled'>('new');
  const [selectedRegion, setSelectedRegion] = useState<string>('Vše');
  const [selectedCategory, setSelectedCategory] = useState<string>('Vše');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Settings for Region / District
  const [userRegion, setUserRegion] = useState<string>('Středočeský kraj / Mladá Boleslav');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const REGION_OPTIONS = [
    'Středočeský kraj / Mladá Boleslav',
    'Středočeský kraj / Kladno',
    'Praha / Hlavní město',
    'Plzeňský kraj / Plzeň',
    'Liberecký kraj / Liberec',
    'Jihomoravský kraj / Brno',
    'Moravskoslezský kraj / Ostrava',
    'Královéhradecký kraj / Hradec Králové'
  ];

  const handleRegionChange = (newRegion: string) => {
    setUserRegion(newRegion);
    if (typeof window !== 'undefined') {
      localStorage.setItem('g_radar_region', newRegion);
    }
    const regionName = newRegion.split(' / ')[0];
    setSelectedRegion(regionName);
    showToast(`Oblast změněna na: ${newRegion}`, 'success');
    setSettingsOpen(false);
  };

  // Toast / notification state
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const fetchRecommendations = async (showNotification = false) => {
    try {
      const res = await fetch('/api/recommendations');
      const data = await res.json();
      if (data.success) {
        setRecommendations(data.data);
        if (showNotification) {
          showToast('Data byla aktualizována', 'info');
        }
      } else {
        setError('Nepodařilo se načíst příležitosti.');
      }
    } catch (err) {
      console.error(err);
      setError('Síťová chyba při stahování dat.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('g_radar_region');
      if (stored) {
        setUserRegion(stored);
        const regionName = stored.split(' / ')[0];
        setSelectedRegion(regionName);
      } else {
        localStorage.setItem('g_radar_region', 'Středočeský kraj / Mladá Boleslav');
        setSelectedRegion('Středočeský kraj');
      }
    }
    fetchRecommendations();
  }, []);

  const showToast = (message: string, type: 'success' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleStatusChange = (id: string, newStatus: 'new' | 'called' | 'scheduled') => {
    setRecommendations(prev => 
      prev.map(rec => rec.id === id ? { ...rec, status: newStatus } : rec)
    );
    
    const statusMessages = {
      called: 'Příležitost byla označena jako zavolaná.',
      scheduled: 'Schůzka k příležitosti byla naplánována.',
      new: 'Příležitost byla obnovena.'
    };
    
    showToast(statusMessages[newStatus], newStatus === 'scheduled' ? 'success' : 'info');
  };

  const handleFeedbackChange = (id: string, newFeedback: 'positive' | 'negative' | 'none') => {
    setRecommendations(prev =>
      prev.map(rec => rec.id === id ? { ...rec, feedback: newFeedback } : rec)
    );
  };

  const handleSimulateEvent = async () => {
    setSimulating(true);
    try {
      const regionName = userRegion.split(' / ')[0];
      const res = await fetch(`/api/simulate-events?region=${encodeURIComponent(regionName)}`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data) {
        // Prepend new recommendation
        setRecommendations(prev => [data.data, ...prev]);
        showToast(`Byl zachycen nový incident v oblasti ${regionName}!`, 'success');
      } else {
        showToast('Chyba při simulaci monitoringu.', 'info');
      }
    } catch (err) {
      console.error(err);
      showToast('Nepodařilo se připojit k simulátoru.', 'info');
    } finally {
      setSimulating(false);
    }
  };

  // Get unique regions and categories for filter chips
  const regions = ['Vše', ...Array.from(new Set(recommendations.map(r => r.event?.region).filter(Boolean) as string[]))];
  const categories = ['Vše', ...Array.from(new Set(recommendations.map(r => r.product?.category).filter(Boolean) as string[]))];

  // Filtering Logic
  const filteredRecommendations = recommendations.filter(rec => {
    // 1. Tab filter
    if (activeTab === 'new' && rec.status !== 'new') return false;
    if (activeTab === 'called' && rec.status !== 'called') return false;
    if (activeTab === 'scheduled' && rec.status !== 'scheduled') return false;

    // 2. Region filter
    if (selectedRegion !== 'Vše' && rec.event?.region !== selectedRegion) return false;

    // 3. Category filter
    if (selectedCategory !== 'Vše' && rec.product?.category !== selectedCategory) return false;

    // 4. Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const titleMatch = rec.event?.title.toLowerCase().includes(query);
      const contentMatch = rec.event?.content.toLowerCase().includes(query);
      const productMatch = rec.product?.name.toLowerCase().includes(query);
      return titleMatch || contentMatch || productMatch;
    }

    return true;
  });

  // Counters
  const countNew = recommendations.filter(r => r.status === 'new').length;
  const countCalled = recommendations.filter(r => r.status === 'called').length;
  const countScheduled = recommendations.filter(r => r.status === 'scheduled').length;

  return (
    <div className="flex-1 flex flex-col max-w-md mx-auto w-full bg-brand-bg min-h-screen pb-20 relative">
      
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 glass border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-generali-red flex items-center justify-center text-white shadow-md shadow-red-500/20">
            <Radar className="w-4.5 h-4.5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 tracking-tight leading-none text-base">G-Radar</h1>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Akviziční asistent</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Nastavení regionu */}
          <div className="relative">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`p-2 rounded-xl transition ${
                settingsOpen 
                  ? 'bg-slate-150 text-slate-800' 
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
              title="Nastavení regionu"
            >
              <Settings className="w-4 h-4 animate-spin-hover" />
            </button>

            {settingsOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-3.5 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs uppercase tracking-wider mb-2 border-b border-slate-100 pb-1.5">
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  <span>Nastavení oblasti</span>
                </div>
                
                <div className="text-[10px] text-slate-450 mb-2.5 leading-snug">
                  Zvolte svůj hlavní region a okres pro cílený monitoring a vyhledávání kontaktů:
                </div>

                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
                  {REGION_OPTIONS.map((opt) => {
                    const isSelected = userRegion === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => handleRegionChange(opt)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition flex items-center justify-between cursor-pointer ${
                          isSelected 
                            ? 'bg-red-50 text-generali-red font-bold border border-red-100' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                        }`}
                      >
                        <span>{opt}</span>
                        {isSelected && <span className="text-[10px]">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => fetchRecommendations(true)}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
            title="Aktualizovat"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="px-4 py-4 flex flex-col gap-4 flex-1">
        
        {/* Active Alerts Count & Simulator Button Banner */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-lg shadow-slate-950/10 flex flex-col gap-3 relative overflow-hidden">
          <div className="absolute right-[-20px] bottom-[-20px] w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
          <div className="flex items-start justify-between">
            <div className="flex-1 mr-2">
              <div className="flex items-center justify-between w-full">
                <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Regionální monitoring</div>
                <div className="text-[9px] font-bold text-slate-400 flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full shrink-0">
                  <MapPin className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate max-w-[130px]">{userRegion}</span>
                </div>
              </div>
              <div className="text-xl font-extrabold mt-1">Aktivní příležitosti</div>
            </div>
            <span className="text-3xl font-black text-red-500 bg-white/10 px-3 py-1 rounded-xl shrink-0">
              {countNew}
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Sledujeme veřejné události ve vašem regionu a párujeme je s produkty Generali.
          </p>

          <button
            onClick={handleSimulateEvent}
            disabled={simulating}
            className="mt-1 w-full bg-generali-red hover:bg-generali-red-dark text-white rounded-xl py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-md shadow-red-500/25 cursor-pointer active:scale-98"
          >
            {simulating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Vyhledávám události...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Simulovat monitoring (novou zprávu)</span>
              </>
            )}
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 bg-slate-200/60 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('new')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              activeTab === 'new' 
                ? 'bg-white text-generali-red shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Nové</span>
            </span>
            <span className="text-[10px] opacity-75 font-semibold">({countNew})</span>
          </button>
          
          <button
            onClick={() => setActiveTab('called')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              activeTab === 'called' 
                ? 'bg-white text-generali-red shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              <span>Zavoláno</span>
            </span>
            <span className="text-[10px] opacity-75 font-semibold">({countCalled})</span>
          </button>

          <button
            onClick={() => setActiveTab('scheduled')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              activeTab === 'scheduled' 
                ? 'bg-white text-generali-red shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center gap-1">
              <Archive className="w-3.5 h-3.5" />
              <span>Naplánováno</span>
            </span>
            <span className="text-[10px] opacity-75 font-semibold">({countScheduled})</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Hledat zprávu nebo produkt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-generali-red focus:border-generali-red transition shadow-sm placeholder:text-slate-400"
          />
        </div>

        {/* Horizontal Filters Section */}
        <div className="flex flex-col gap-2.5">
          {/* Region Chips */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Kraj</span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none mask-image">
              {regions.map(reg => (
                <button
                  key={reg}
                  onClick={() => setSelectedRegion(reg)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full border shrink-0 transition cursor-pointer ${
                    selectedRegion === reg
                      ? 'bg-brand-slate text-white border-brand-slate'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {reg}
                </button>
              ))}
            </div>
          </div>

          {/* Product Category Chips */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Typ pojištění</span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full border shrink-0 transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-brand-slate text-white border-brand-slate'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Opportunity Cards Render */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400 text-xs">
            <RefreshCw className="w-8 h-8 animate-spin text-generali-red" />
            <span>Načítám příležitosti...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-generali-red p-4 rounded-xl text-center text-xs font-semibold">
            {error}
          </div>
        ) : filteredRecommendations.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
              <Sparkles className="w-6 h-6 text-slate-300" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Žádné odpovídající záznamy</h3>
              <p className="text-xs text-slate-400 max-w-[240px] mx-auto mt-1 leading-relaxed">
                {searchQuery || selectedRegion !== 'Vše' || selectedCategory !== 'Vše'
                  ? 'Zkuste upravit nastavení filtrů nebo vyhledávání.'
                  : 'V tomto seznamu momentálně nemáte žádné karty. Klikněte na tlačítko výše pro simulaci nových incidentů.'}
              </p>
            </div>
            {(searchQuery || selectedRegion !== 'Vše' || selectedCategory !== 'Vše') && (
              <button
                onClick={() => {
                  setSelectedRegion('Vše');
                  setSelectedCategory('Vše');
                  setSearchQuery('');
                }}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition active:scale-95 cursor-pointer"
              >
                Resetovat filtry
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredRecommendations.map(rec => (
              <OpportunityCard 
                key={rec.id} 
                recommendation={rec} 
                onStatusChange={handleStatusChange} 
                onFeedbackChange={handleFeedbackChange}
              />
            ))}
          </div>
        )}

      </main>

      {/* Floating Notification Toast */}
      {notification && (
        <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 transition-all duration-300 animate-bounce ${
          notification.type === 'success'
            ? 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/10'
            : 'bg-slate-900 text-white border-slate-800 shadow-slate-950/20'
        }`}>
          {notification.type === 'success' && <CheckCircle className="w-4 h-4 shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}

    </div>
  );
}
