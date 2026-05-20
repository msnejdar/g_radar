// components/OpportunityCard.tsx
'use client';

import { useState } from 'react';
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
  ChevronRight, 
  TrendingUp, 
  ExternalLink 
} from 'lucide-react';
import { AcquisitionRecommendation } from '@/lib/db/mockData';

interface OpportunityCardProps {
  recommendation: AcquisitionRecommendation;
  onStatusChange: (id: string, status: 'new' | 'contacted' | 'ignored' | 'converted') => void;
}

export default function OpportunityCard({ recommendation, onStatusChange }: OpportunityCardProps) {
  const { id, status, why_opportunity, call_script, event, product } = recommendation;
  
  // Section toggle state (mobile friendly accordions or tabs)
  const [activeTab, setActiveTab] = useState<'happened' | 'why' | 'script'>('happened');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

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
      case 'contacted':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">Osloveno</span>;
      case 'converted':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Sjednáno</span>;
      case 'ignored':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-500 border border-slate-200">Ignorováno</span>;
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
      // Remove starting/ending quotes if present in script for clean copy
      const cleanScript = call_script.replace(/^„/, '').replace(/“$/, '');
      await navigator.clipboard.writeText(cleanScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const updateStatus = async (newStatus: 'new' | 'contacted' | 'ignored' | 'converted') => {
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

  const catMeta = getCategoryMeta(event.category);

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
            <span className="text-[11px] text-slate-400">{formatTime(event.published_at)}</span>
            {getStatusBadge(status)}
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
              Tip: Po zkopírování můžete rovnou vytáčet.
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center gap-2">
        {status === 'new' && (
          <>
            <button
              disabled={loading}
              onClick={() => updateStatus('contacted')}
              className="flex-1 py-2 px-3 bg-generali-red hover:bg-generali-red-dark text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-red-500/10 active:scale-[0.98] transition cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Zavolat / Osloveno</span>
            </button>
            <button
              disabled={loading}
              onClick={() => updateStatus('ignored')}
              className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 rounded-xl text-xs font-bold active:scale-[0.98] transition cursor-pointer"
              title="Ignorovat příležitost"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        {status === 'contacted' && (
          <>
            <button
              disabled={loading}
              onClick={() => updateStatus('converted')}
              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Sjednáno úspěšně</span>
            </button>
            <button
              disabled={loading}
              onClick={() => updateStatus('ignored')}
              className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 rounded-xl text-xs font-bold active:scale-[0.98] transition cursor-pointer"
              title="Stornovat"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        {(status === 'ignored' || status === 'converted') && (
          <button
            disabled={loading}
            onClick={() => updateStatus('new')}
            className="w-full py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold active:scale-[0.98] transition cursor-pointer"
          >
            Obnovit příležitost
          </button>
        )}
      </div>
      
    </div>
  );
}
