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
  Phone
} from 'lucide-react';
import { AcquisitionRecommendation } from '@/lib/db/mockData';
import OpportunityCard from './OpportunityCard';

export default function Dashboard() {
  const [recommendations, setRecommendations] = useState<AcquisitionRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<'active' | 'contacted' | 'archive'>('active');
  const [selectedRegion, setSelectedRegion] = useState<string>('Vše');
  const [selectedCategory, setSelectedCategory] = useState<string>('Vše');
  const [searchQuery, setSearchQuery] = useState<string>('');

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
    fetchRecommendations();
  }, []);

  const showToast = (message: string, type: 'success' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleStatusChange = (id: string, newStatus: 'new' | 'contacted' | 'ignored' | 'converted') => {
    setRecommendations(prev => 
      prev.map(rec => rec.id === id ? { ...rec, status: newStatus } : rec)
    );
    
    // Toast notification mapping
    const statusMessages = {
      contacted: 'Příležitost přesunuta do Osloveno.',
      converted: 'Gratulujeme! Smlouva byla označena jako sjednaná.',
      ignored: 'Příležitost byla archivována.',
      new: 'Příležitost byla obnovena.'
    };
    
    showToast(statusMessages[newStatus], newStatus === 'converted' ? 'success' : 'info');
  };

  const handleSimulateEvent = async () => {
    setSimulating(true);
    try {
      const res = await fetch('/api/simulate-events', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data) {
        // Prepend new recommendation
        setRecommendations(prev => [data.data, ...prev]);
        showToast('Byl zachycen nový regionální incident a vygenerována karta!', 'success');
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
    if (activeTab === 'active' && rec.status !== 'new') return false;
    if (activeTab === 'contacted' && rec.status !== 'contacted') return false;
    if (activeTab === 'archive' && rec.status !== 'converted' && rec.status !== 'ignored') return false;

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
  const countContacted = recommendations.filter(r => r.status === 'contacted').length;
  const countArchived = recommendations.filter(r => r.status === 'converted' || r.status === 'ignored').length;

  return (
    <div className="flex-1 flex flex-col max-w-md mx-auto w-full bg-brand-bg min-h-screen pb-20 relative">
      
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 glass border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-generali-red flex items-center justify-center text-white shadow-md shadow-red-500/20">
            <Radar className="w-4.5 h-4.5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 tracking-tight leading-none text-base">Generali Radar</h1>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Akviziční asistent</p>
          </div>
        </div>

        <button 
          onClick={() => fetchRecommendations(true)}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          title="Aktualizovat"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      {/* Main Container */}
      <main className="px-4 py-4 flex flex-col gap-4 flex-1">
        
        {/* Active Alerts Count & Simulator Button Banner */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-lg shadow-slate-950/10 flex flex-col gap-3 relative overflow-hidden">
          <div className="absolute right-[-20px] bottom-[-20px] w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Regionální monitoring</div>
              <div className="text-xl font-extrabold mt-1">Aktivní příležitosti</div>
            </div>
            <span className="text-3xl font-black text-red-500 bg-white/10 px-3 py-1 rounded-xl">
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
            onClick={() => setActiveTab('active')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              activeTab === 'active' 
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
            onClick={() => setActiveTab('contacted')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              activeTab === 'contacted' 
                ? 'bg-white text-generali-red shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              <span>Osloveno</span>
            </span>
            <span className="text-[10px] opacity-75 font-semibold">({countContacted})</span>
          </button>

          <button
            onClick={() => setActiveTab('archive')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              activeTab === 'archive' 
                ? 'bg-white text-generali-red shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center gap-1">
              <Archive className="w-3.5 h-3.5" />
              <span>Archiv</span>
            </span>
            <span className="text-[10px] opacity-75 font-semibold">({countArchived})</span>
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
