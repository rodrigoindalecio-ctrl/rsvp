'use client';

import { useState, useMemo } from 'react';
import { GIFT_TEMPLATES, SUBCATEGORY_NAMES, GiftTemplate } from '@/lib/gift-templates';
import Image from 'next/image';
import { 
    Search, 
    Filter, 
    RefreshCcw, 
    CheckCircle2, 
    XCircle, 
    ExternalLink,
    ChevronLeft,
    Check,
    Palette
} from 'lucide-react';
import Link from 'next/link';

export default function AuditPage() {
    const [search, setSearch] = useState('');
    const [selectedSub, setSelectedSub] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'ok' | 'bad'>('all');
    
    // Status tracking (local storage only for this session)
    const [auditStatus, setAuditStatus] = useState<Record<string, 'ok' | 'bad'>>({});

    const subcategories = useMemo(() => {
        const subs = [...new Set(GIFT_TEMPLATES.map(g => g.subcategory))];
        return subs.sort();
    }, []);

    const filteredGifts = useMemo(() => {
        return GIFT_TEMPLATES.filter(g => {
            const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase()) || 
                                 g.subcategory.toLowerCase().includes(search.toLowerCase());
            const matchesSub = selectedSub === 'all' || g.subcategory === selectedSub;
            
            const status = auditStatus[g.name + g.subcategory] || 'pending';
            const matchesStatus = statusFilter === 'all' || status === statusFilter;
            
            return matchesSearch && matchesSub && matchesStatus;
        });
    }, [search, selectedSub, statusFilter, auditStatus]);

    const markStatus = (gift: GiftTemplate, status: 'ok' | 'bad') => {
        setAuditStatus(prev => ({
            ...prev,
            [gift.name + gift.subcategory]: status
        }));
    };

    const stats = useMemo(() => {
        const total = GIFT_TEMPLATES.length;
        const ok = Object.values(auditStatus).filter(s => s === 'ok').length;
        const bad = Object.values(auditStatus).filter(s => s === 'bad').length;
        return { total, ok, bad, pending: total - ok - bad };
    }, [auditStatus]);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header Fixo de Auditoria */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-8 py-6">
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <Link href="/dashboard" className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all">
                            <ChevronLeft size={24} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <Palette className="text-brand" />
                                Mesa de Auditoria Visual
                            </h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                Validando {GIFT_TEMPLATES.length} Presentes na Base
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 border border-emerald-100">
                            <CheckCircle2 size={14} /> {stats.ok} OK
                        </div>
                        <div className="px-4 py-2 bg-rose-50 text-rose-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 border border-rose-100">
                            <XCircle size={14} /> {stats.bad} TROCAR
                        </div>
                        <div className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-wider border border-slate-200">
                            Faltam {stats.pending}
                        </div>
                    </div>
                </div>

                {/* Toolbar de Filtros */}
                <div className="max-w-[1600px] mx-auto mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar presente ou destino..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-6 py-3 bg-slate-50 border-transparent rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-brand/10 transition-all outline-none border hover:border-slate-200"
                        />
                    </div>

                    <select 
                        value={selectedSub}
                        onChange={(e) => setSelectedSub(e.target.value)}
                        className="px-6 py-3 bg-slate-50 border border-transparent rounded-2xl text-sm font-bold text-slate-700 outline-none hover:border-slate-200 focus:bg-white transition-all cursor-pointer"
                    >
                        <option value="all">Todas as Coleções ({subcategories.length})</option>
                        {subcategories.map(sub => (
                            <option key={sub} value={sub}>{SUBCATEGORY_NAMES[sub] || sub}</option>
                        ))}
                    </select>

                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                        {(['all', 'pending', 'ok', 'bad'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    statusFilter === s 
                                    ? 'bg-white text-slate-900 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {s === 'all' ? 'Ver Tudo' : s === 'pending' ? 'Pendentes' : s === 'ok' ? 'Auditados' : 'Erros'}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Grid de Auditoria */}
            <main className="max-w-[1600px] mx-auto px-8 py-12">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                    {filteredGifts.slice(0, 120).map((gift) => {
                        const status = auditStatus[gift.name + gift.subcategory] || 'pending';
                        
                        return (
                            <div 
                                key={gift.name + gift.subcategory} 
                                className={`group bg-white rounded-3xl border transition-all hover:shadow-2xl hover:-translate-y-1 p-2 ${
                                    status === 'ok' ? 'border-emerald-500 shadow-emerald-100' : 
                                    status === 'bad' ? 'border-rose-500 shadow-rose-100' : 
                                    'border-slate-100'
                                }`}
                            >
                                <div className="relative aspect-square rounded-2xl overflow-hidden mb-3">
                                    <Image 
                                        src={gift.imageUrl} 
                                        alt={gift.name}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                                        unoptimized // Faster preview
                                    />
                                    
                                    {/* Subcategory Badge */}
                                    <div className="absolute top-2 left-2">
                                        <span className="px-2 py-1 bg-black/40 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest rounded-lg">
                                            {gift.subcategory}
                                        </span>
                                    </div>

                                    {/* Action Overlays */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button 
                                            onClick={() => markStatus(gift, 'ok')}
                                            className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
                                        >
                                            <CheckCircle2 size={24} />
                                        </button>
                                        <button 
                                            onClick={() => markStatus(gift, 'bad')}
                                            className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
                                        >
                                            <XCircle size={24} />
                                        </button>
                                    </div>

                                    {/* Selection Border Indication */}
                                    {status === 'ok' && (
                                        <div className="absolute inset-0 border-4 border-emerald-500 rounded-2xl pointer-events-none" />
                                    )}
                                    {status === 'bad' && (
                                        <div className="absolute inset-0 border-4 border-rose-500 rounded-2xl pointer-events-none" />
                                    )}
                                </div>

                                <div className="px-3 pb-2">
                                    <h3 className="text-[11px] font-black text-slate-800 leading-tight line-clamp-2 h-8">
                                        {gift.name}
                                    </h3>
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-brand">R$ {gift.price}</span>
                                        <a 
                                            href={gift.imageUrl} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="p-1 text-slate-300 hover:text-brand transition-colors"
                                        >
                                            <ExternalLink size={12} />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredGifts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                        <RefreshCcw size={48} className="mb-4 opacity-20" />
                        <p className="font-serif italic text-lg text-slate-300">Nenhum presente combina com sua busca.</p>
                    </div>
                )}
                
                {filteredGifts.length > 120 && (
                    <div className="mt-12 text-center">
                        <p className="text-slate-400 text-sm font-medium">Mostrando os primeiros 120 de {filteredGifts.length}. Use os filtros para ver mais.</p>
                    </div>
                )}
            </main>

            {/* Footer de Exportação */}
            {stats.bad > 0 && (
                <footer className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-200 z-[100] shadow-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600">
                            <RefreshCcw className="animate-spin-slow" size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-900">{stats.bad} presentes marcados para troca</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Me envie os nomes destes itens para eu gerar novas fotos</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            const list = Object.entries(auditStatus)
                                .filter(([_, s]) => s === 'bad')
                                .map(([k]) => k)
                                .join('\n');
                            navigator.clipboard.writeText(list);
                            alert('Lista copiada! Me mande no chat para eu corrigir.');
                        }}
                        className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-2"
                    >
                        Copiar Lista de Erros
                    </button>
                </footer>
            )}
        </div>
    );
}
