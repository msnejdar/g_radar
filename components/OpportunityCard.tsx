// components/OpportunityCard.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  Car, 
  Heart, 
  Briefcase, 
  MapPin, 
  Calendar, 
  Phone, 
  Check, 
  Copy, 
  X, 
  TrendingUp, 
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Search
} from 'lucide-react';
import { AcquisitionRecommendation } from '@/lib/db/mockData';
import { Lead } from '@/lib/services/leads';

interface OpportunityCardProps {
  recommendation: AcquisitionRecommendation;
  onStatusChange: (id: string, status: 'new' | 'called' | 'scheduled') => void;
  onFeedbackChange: (id: string, feedback: 'positive' | 'negative' | 'none') => void;
}

export default function OpportunityCard({ recommendation, onStatusChange, onFeedbackChange }: OpportunityCardProps) {
  const { id, status, feedback = 'none', why_opportunity, call_script, event, product } = recommendation;
  
  // Section toggle state (mobile friendly accordions or tabs)
  const [activeTab, setActiveTab] = useState<'happened' | 'why' | 'script'>('happened');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Live acquisition targets / leads state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  // Fetch leads dynamically when card renders/mounts
  useEffect(() => {
    if (!event || !product) return;
    
    let active = true;
    async function fetchLeads() {
      setLoadingLeads(true);
      try {
        // Read specific district setting from localStorage if it matches event's region
        let regionParam = event?.region || '';
        if (typeof window !== 'undefined') {
          const storedRegion = localStorage.getItem('g_radar_region');
          if (storedRegion && storedRegion.startsWith(regionParam)) {
            regionParam = storedRegion;
          }
        }

        const params = new URLSearchParams({
          recommendation_id: id,
          region: regionParam,
          title: event?.title || '',
          content: event?.content || '',
          product_name: product?.name || '',
          product_code: product?.code || ''
        });
        const response = await fetch(`/api/leads?${params.toString()}`);
        if (response.ok) {
          const json = await response.json();
          if (active && json.success) {
            setLeads(json.data);
          }
        }
      } catch (error) {
        console.error('Error fetching live leads:', error);
      } finally {
        if (active) setLoadingLeads(false);
      }
    }

    fetchLeads();
    return () => {
      active = false;
    };
  }, [id, event, product]);

  if (!event || !product) return null;

  // Format category badge with colors and icons
  const getCategoryMeta = (cat: string) => {
    switch (cat) {
      case 'Počasí':
        return { color: 'bg-blue-50 text-blue-700 border-blue-100', bgIcon: 'bg-blue-100' };
      case 'Výstavba':
        return { color: 'bg-emerald-50 text-emerald-700 border-emerald-100', bgIcon: 'bg-emerald-100' };
      case 'Krimi':
        return { color: 'bg-purple-50 text-purple-700 border-purple-100', bgIcon: 'bg-purple-100' };
      case 'Hasiči':
        return { color: 'bg-orange-50 text-orange-700 border-orange-100', bgIcon: 'bg-orange-100' };
      default:
        return { color: 'bg-indigo-50 text-indigo-700 border-indigo-100', bgIcon: 'bg-indigo-100' };
    }
  };

  // Get product icon
  const getProductIcon = (code: string) => {
    switch (code) {
      case 'AUTO_COMPLEX':
        return <Car className="w-5 h-5 text-generali-red" />;
      case 'ZIVOT_PROFIT':
        return <Heart className="w-5 h-5 text-generali-red" />;
      case 'PODNIKATEL_PRO':
        return <Briefcase className="w-5 h-5 text-generali-red" />;
      default:
        return <Shield className="w-5 h-5 text-generali-red" />;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'called':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">Zavoláno</span>;
      case 'scheduled':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Naplánováno</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-generali-red border border-red-200">Nová</span>;
    }
  };

  // Human friendly time formatting
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    
    // Check if today
    if (date.toDateString() === now.toDateString()) {
      return `Dnes, ${date.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Check if yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Včera, ${date.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}`;
    }

    return date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const copyScript = async () => {
    try {
      const cleanScript = call_script.replace(/^„/, '').replace(/“$/, '');
      await navigator.clipboard.writeText(cleanScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleFeedback = async (type: 'positive' | 'negative') => {
    const nextFeedback = feedback === type ? 'none' : type;
    try {
      const response = await fetch('/api/recommendations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, feedback: nextFeedback }),
      });
      if (response.ok) {
        onFeedbackChange(id, nextFeedback);
      }
    } catch (error) {
      console.error('Error updating feedback:', error);
    }
  };

  const updateStatus = async (newStatus: 'new' | 'called' | 'scheduled') => {
    setLoading(true);
    try {
      const response = await fetch('/api/recommendations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (response.ok) {
        onStatusChange(id, newStatus);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLeadStatus = async (leadIndex: number, newStatus: 'new' | 'called' | 'scheduled') => {
    const lead = leads[leadIndex];
    // Optimistic local state update (works in both Demo and Production modes)
    const updatedLeads = [...leads];
    updatedLeads[leadIndex] = { ...lead, status: newStatus };
    setLeads(updatedLeads);

    try {
      await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: lead.id || `temp-${leadIndex}`, 
          status: newStatus 
        }),
      });
    } catch (error) {
      console.error('Error updating lead status in backend:', error);
    }
  };

  const catMeta = getCategoryMeta(event.category);

  // Shimmer Loader for leads
  const LeadSkeleton = () => (
    <div className="animate-pulse flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
      <div className="h-4 bg-slate-200 rounded w-2/3"></div>
      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
      <div className="h-3 bg-slate-200 rounded w-5/6"></div>
    </div>
  );

  return (
    <div className={`relative flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden ${
      status === 'new' 
        ? 'bg-white border-slate-200 shadow-md ring-1 ring-red-500/5' 
        : 'bg-white/80 border-slate-200 shadow-sm opacity-90'
    }`}>
      
      {/* Top Banner: Product & Region metadata */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-md border ${catMeta.color}`}>
              {event.category}
            </span>
            <div className="flex items-center gap-1 text-slate-500 text-xs">
              <MapPin className="w-3.5 h-3.5" />
              <span>{event.region}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span className="text-[11px] text-slate-400 mr-1">{formatTime(event.published_at)}</span>
            {getStatusBadge(status)}
            
            {/* Feedback Rating loop */}
            <div className="flex items-center gap-1 border-l border-slate-200 pl-2 ml-1">
              <button
                onClick={() => handleFeedback('positive')}
                className={`p-1 rounded-md transition hover:bg-slate-100 ${
                  feedback === 'positive' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400'
                }`}
                title="Užitečné doporučení"
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${feedback === 'positive' ? 'fill-emerald-600/20' : ''}`} />
              </button>
              <button
                onClick={() => handleFeedback('negative')}
                className={`p-1 rounded-md transition hover:bg-slate-100 ${
                  feedback === 'negative' ? 'text-rose-600 bg-rose-50' : 'text-slate-400'
                }`}
                title="Neužitečné doporučení"
              >
                <ThumbsDown className={`w-3.5 h-3.5 ${feedback === 'negative' ? 'fill-rose-600/20' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        <h3 className="font-bold text-slate-900 leading-snug text-base mt-1">
          {event.title}
        </h3>
      </div>

      {/* Product Highlight Badge */}
      <div className="mx-4 mt-3 px-3 py-2 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-100">
            {getProductIcon(product.code)}
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Doporučený produkt</div>
            <div className="text-xs font-semibold text-slate-800 leading-tight">{product.name}</div>
          </div>
        </div>
        <div className="text-[10px] bg-red-50 text-generali-red font-bold px-2 py-0.5 rounded-full">
          {product.category}
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-100 mt-3.5 px-4 gap-4">
        <button
          onClick={() => setActiveTab('happened')}
          className={`pb-2 text-xs font-bold transition-all relative border-b-2 ${
            activeTab === 'happened' 
              ? 'text-generali-red border-generali-red' 
              : 'text-slate-400 border-transparent hover:text-slate-600'
          }`}
        >
          Co se stalo
        </button>
        <button
          onClick={() => setActiveTab('why')}
          className={`pb-2 text-xs font-bold transition-all relative border-b-2 ${
            activeTab === 'why' 
              ? 'text-generali-red border-generali-red' 
              : 'text-slate-400 border-transparent hover:text-slate-600'
          }`}
        >
          Proč je to příležitost
        </button>
        <button
          onClick={() => setActiveTab('script')}
          className={`pb-2 text-xs font-bold transition-all relative border-b-2 ${
            activeTab === 'script' 
              ? 'text-generali-red border-generali-red' 
              : 'text-slate-400 border-transparent hover:text-slate-600'
          }`}
        >
          Script pro hovor
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-4 flex-1 text-sm text-slate-600 leading-relaxed min-h-[120px]">
        {activeTab === 'happened' && (
          <div className="flex flex-col gap-2.5">
            <p>{event.content}</p>
            {event.source_url && (
              <a 
                href={event.source_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-generali-red hover:underline mt-1 font-semibold self-start"
              >
                <span>Zdroj události</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {activeTab === 'why' && (
          <div className="flex gap-2">
            <TrendingUp className="w-5 h-5 text-generali-red shrink-0 mt-0.5" />
            <p className="font-medium text-slate-800">{why_opportunity}</p>
          </div>
        )}

        {activeTab === 'script' && (
          <div className="relative bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex flex-col gap-2">
            <p className="italic text-slate-800 pr-8 font-medium">
              {call_script}
            </p>
            <button
              onClick={copyScript}
              className="absolute top-3 right-3 p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 shadow-sm transition active:scale-95"
              title="Kopírovat scénář"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <div className="text-[10px] text-slate-400 self-end mt-1">
              Tip: Po zkopírování můžete rovnou vytočit.
            </div>
          </div>
        )}
      </div>

      {/* 🎯 CÍLE PRO OKAMŽITOU AKVIZICI */}
      <div className="px-4 pb-4 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <span className="text-base">🎯</span>
            <span>Cíle pro okamžitou akvizici</span>
          </div>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Živá data</span>
          </span>
        </div>

        {loadingLeads ? (
          <div className="flex flex-col gap-2">
            <LeadSkeleton />
            <LeadSkeleton />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
            Nebyly nalezeny žádné živé kontakty v okolí.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {leads.map((lead, idx) => {
              const isCalled = lead.status === 'called' || lead.status === 'scheduled';
              return (
                <div 
                  key={idx}
                  className={`p-3 rounded-xl border transition-all duration-200 ${
                    isCalled 
                      ? 'bg-slate-50/50 border-slate-150 opacity-75' 
                      : 'bg-white border-slate-250 shadow-sm hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className={`font-bold text-xs ${isCalled ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                        {lead.name}
                      </h4>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[150px]">{lead.address}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Ověřit firmu na Google */}
                      <a 
                        href={`https://www.google.com/search?q=${encodeURIComponent(`${lead.name} ${lead.address} kontakt`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-600 hover:text-slate-800 transition active:scale-95 flex items-center gap-1 cursor-pointer"
                        title="Ověřit firmu na Google"
                      >
                        <Search className="w-3 h-3 text-slate-400" />
                        <span>Ověřit</span>
                      </a>

                      {/* Telefonní dialer (pokud není 'Ověřit na Google') */}
                      {lead.phone && lead.phone !== 'Ověřit na Google' ? (
                        <a 
                          href={`tel:${lead.phone}`}
                          onClick={() => {
                            if (!isCalled) handleUpdateLeadStatus(idx, 'called');
                          }}
                          className={`p-1.5 rounded-lg border text-white transition active:scale-95 flex items-center justify-center cursor-pointer ${
                            isCalled 
                              ? 'bg-slate-350 border-slate-350 hover:bg-slate-405 text-slate-100' 
                              : 'bg-emerald-600 border-emerald-600 hover:bg-emerald-700 hover:border-emerald-700 shadow-sm shadow-emerald-500/10'
                          }`}
                          title={`Vytočit: ${lead.phone}`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      ) : null}

                      {/* Stavové tlačítko */}
                      <button
                        onClick={() => handleUpdateLeadStatus(idx, isCalled ? 'new' : 'called')}
                        className={`px-2 py-1.5 rounded-lg border text-[10px] font-bold transition active:scale-95 cursor-pointer ${
                          isCalled 
                            ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                        }`}
                      >
                        {isCalled ? 'Zavoláno' : 'Hotovo'}
                      </button>
                    </div>
                  </div>

                  {lead.contact_person && (
                    <div className="text-[10px] text-slate-500 font-semibold mt-1.5 bg-slate-50 px-2 py-0.5 rounded self-start inline-block">
                      👤 {lead.contact_person}
                    </div>
                  )}

                  {lead.website && lead.website !== 'Není k dispozici' && (
                    <div className="text-[10px] text-slate-400 mt-1 truncate">
                      🌐 <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-slate-600 font-medium">{lead.website}</a>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-500 mt-2 border-t border-slate-100 pt-1.5 font-medium italic">
                    💡 {lead.why_target}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center gap-2">
        {status === 'new' && (
          <button
            disabled={loading}
            onClick={() => updateStatus('called')}
            className="w-full py-2 px-3 bg-generali-red hover:bg-generali-red-dark text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-red-500/10 active:scale-[0.98] transition cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Zavolat</span>
          </button>
        )}

        {status === 'called' && (
          <>
            <button
              disabled={loading}
              onClick={() => updateStatus('scheduled')}
              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Naplánovat schůzku</span>
            </button>
            <button
              disabled={loading}
              onClick={() => updateStatus('new')}
              className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 rounded-xl text-xs font-bold active:scale-[0.98] transition cursor-pointer"
              title="Vrátit do nových"
            >
              Obnovit
            </button>
          </>
        )}

        {status === 'scheduled' && (
          <button
            disabled={loading}
            onClick={() => updateStatus('called')}
            className="w-full py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold active:scale-[0.98] transition cursor-pointer"
          >
            Vrátit na Zavoláno
          </button>
        )}
      </div>
      
    </div>
  );
}

