'use client';

import { useState, useEffect, useCallback } from 'react';
import { Gift, Heart, Plus, Trash2, Edit2, Wallet, ArrowUpRight, CheckCircle2, AlertCircle, Sparkles, MessageSquare, ShieldCheck, X, Check, Info, Mail, Send } from 'lucide-react';


/* ─── Mini componente de modal de confirmação ─────────── */
function ConfirmModal({ title, message, onConfirm, onCancel, danger = false }: {
    title: string; message: string; onConfirm: () => void; onCancel: () => void; danger?: boolean;
}) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-surface border border-border-soft rounded-[2rem] w-full max-w-sm shadow-2xl p-8 flex flex-col items-center text-center animate-in zoom-in-95">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-5 ${danger ? 'bg-danger-light text-danger' : 'bg-brand-pale text-brand'}`}>
                    {danger ? <Trash2 size={24} /> : <AlertCircle size={24} />}
                </div>
                <h3 className="text-lg font-black text-text-primary tracking-tight mb-2">{title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-8">{message}</p>
                <div className="flex gap-3 w-full">
                    <button onClick={onCancel} className="flex-1 py-3 border border-border-soft rounded-xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:bg-bg-light transition-all outline-none focus:ring-2 focus:ring-brand/20">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all outline-none focus:ring-2 shadow-md ${danger ? 'bg-danger hover:bg-danger-dark focus:ring-danger/20' : 'bg-brand hover:bg-brand-dark focus:ring-brand/20'}`}>
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Mini Toast de notificação ──────────────────────── */
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
    const styles = {
        success: 'bg-success-light text-success-dark border-success/30',
        error: 'bg-danger-light text-danger-dark border-danger/30',
        info: 'bg-brand-pale text-brand border-brand/20',
    };
    const icons = { success: <Check size={16} />, error: <X size={16} />, info: <Info size={16} /> };
    return (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-xl max-w-sm w-full animate-in slide-in-from-bottom-4 fade-in ${styles[type]}`}>
            <span className="flex-shrink-0">{icons[type]}</span>
            <p className="text-xs font-bold flex-1 leading-relaxed">{message}</p>
            <button onClick={onClose} className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"><X size={14} /></button>
        </div>
    );
}

interface Props {
    eventId: string;
}

export default function GiftManagementTab({ eventId }: Props) {
    const [gifts, setGifts] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalNet: 0, pendingNet: 0, availableNet: 0 });
    const [settings, setSettings] = useState<any>({ giftListEnabled: false, taxPayer: 'COUPLE', slug: '' });
    const [transactions, setTransactions] = useState<any[]>([]);
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [importing, setImporting] = useState(false);
    const [requestingWithdrawal, setRequestingWithdrawal] = useState(false);
    const [thankingTx, setThankingTx] = useState<any>(null);
    const [thankMessage, setThankMessage] = useState('');
    const [sendingThanks, setSendingThanks] = useState(false);

    // Modal & Toast state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; danger?: boolean; onConfirm: () => void } | null>(null);

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type });
    }, []);

    const showConfirm = useCallback((title: string, message: string, onConfirm: () => void, danger = false) => {
        setConfirmModal({ title, message, onConfirm, danger });
    }, []);

    useEffect(() => {
        if (!eventId) return;
        fetchData();
    }, [eventId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/events/${eventId}/gifts`);
            const data = await res.json();
            if (data && !data.error) {
                setGifts(data.gifts || []);
                setStats(data.stats || { totalNet: 0, pendingNet: 0, availableNet: 0 });
                setSettings(data.settings || { giftListEnabled: false, taxPayer: 'COUPLE', slug: '' });
                setTransactions(data.transactions || []);
                setWithdrawals(data.withdrawals || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingSettings(true);
        try {
            const res = await fetch(`/api/events/${eventId}/gift-settings`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            showToast('Configurações salvas com sucesso!', 'success');
        } catch (error: any) {
            showToast(error.message || 'Erro ao salvar configurações.', 'error');
        } finally {
            setSavingSettings(false);
        }
    };

    const handleImportTemplate = (category: string) => {
        const label = category === 'CASA' ? 'Produtos p/ Casa' : 'Lua de Mel Simples';
        showConfirm(
            'Importar Modelos',
            `Deseja importar a lista de "${label}"? Os itens serão adicionados à sua lista atual.`,
            async () => {
                setConfirmModal(null);
                setImporting(true);
                try {
                    const res = await fetch(`/api/events/${eventId}/gifts/import`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ category })
                    });
                    const data = await res.json();
                    if (res.ok) {
                        showToast(`${data.count} presentes importados com sucesso! 🎁`, 'success');
                        fetchData();
                    } else {
                        showToast(`Erro ao importar: ${data.error || 'Erro desconhecido'}`, 'error');
                    }
                } catch (e: any) {
                    showToast(`Erro interno: ${e?.message || e}`, 'error');
                } finally {
                    setImporting(false);
                }
            }
        );
    };

    const handleDeleteGift = (id: string) => {
        showConfirm(
            'Excluir Presente',
            'Tem certeza que deseja remover este item da lista? Esta ação não pode ser desfeita.',
            async () => {
                setConfirmModal(null);
                try {
                    const res = await fetch(`/api/events/${eventId}/gifts/${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        setGifts(prev => prev.filter(g => g.id !== id));
                        showToast('Presente removido da lista.', 'info');
                    } else {
                        showToast('Erro ao excluir o presente.', 'error');
                    }
                } catch (error) {
                    showToast('Erro ao excluir o presente.', 'error');
                }
            },
            true // danger
        );
    };

    const handleRequestWithdrawal = () => {
        if (!settings.bankPixKey) {
            showToast('Por favor, configure sua chave Pix antes de solicitar o saque.', 'error');
            return;
        }

        showConfirm(
            'Solicitar Resgate',
            `Deseja solicitar o saque de R$ ${Number(stats.availableNet).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para a chave Pix cadastrada?`,
            async () => {
                setConfirmModal(null);
                setRequestingWithdrawal(true);
                try {
                    const res = await fetch(`/api/events/${eventId}/withdrawals`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            amount: stats.availableNet,
                            pixKey: settings.bankPixKey,
                            pixType: settings.bankType,
                            beneficiary: settings.bankBeneficiary
                        })
                    });

                    if (res.ok) {
                        showToast('Solicitação de saque enviada com sucesso! 🚀', 'success');
                        fetchData(); // Atualiza o saldo
                    } else {
                        const data = await res.json();
                        showToast(data.error || 'Erro ao solicitar saque.', 'error');
                    }
                } catch (error) {
                    showToast('Erro ao processar solicitação de saque.', 'error');
                } finally {
                    setRequestingWithdrawal(false);
                }
            }
        );
    };

    const handleSendThankYouEmail = async () => {
        if (!thankingTx || !thankingTx.guestEmail) return;
        setSendingThanks(true);
        try {
            const res = await fetch(`/api/send-thank-you-email`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    guestEmail: thankingTx.guestEmail,
                    guestName: thankingTx.guestName,
                    coupleNames: settings.coupleNames || 'Os Noivos',
                    customMessage: thankMessage,
                    amount: thankingTx.amountNet
                })
            });

            if (res.ok) {
                showToast(`E-mail de agradecimento enviado para ${thankingTx.guestName}!`, 'success');
                setThankingTx(null);
                setThankMessage('');
            } else {
                const data = await res.json();
                showToast(data.error || 'Erro ao enviar e-mail.', 'error');
            }
        } catch (error) {
            showToast('Erro interno ao enviar e-mail.', 'error');
        } finally {
            setSendingThanks(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-text-muted"><div className="w-8 h-8 mx-auto border-4 border-brand border-t-transparent rounded-full animate-spin"></div><p className="mt-4 text-xs font-bold uppercase tracking-widest text-brand">Carregando Tesouros...</p></div>;

    const domain = typeof window !== 'undefined' ? window.location.origin : '';
    const publicUrl = settings.slug ? `${domain}/${settings.slug}/presentes` : '';

    if (!loading && settings.giftListEnabled === false) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 bg-surface border border-border-soft rounded-[3rem] shadow-sm animate-in fade-in zoom-in-95">
                <div className="w-20 h-20 bg-bg-light rounded-full flex items-center justify-center mb-6 text-text-muted opacity-30">
                    <Heart size={40} />
                </div>
                <h3 className="text-xl font-black text-text-primary tracking-tight mb-2">Módulo Desativado</h3>
                <p className="text-sm text-text-muted text-center max-w-xs font-serif italic">
                    Este módulo foi desativado nas configurações do evento. Você não pode visualizar ou gerenciar presentes enquanto estiver desabilitado.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
            {/* MODAIS E TOASTS */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            {confirmModal && (
                <ConfirmModal
                    title={confirmModal.title}
                    message={confirmModal.message}
                    danger={confirmModal.danger}
                    onConfirm={confirmModal.onConfirm}
                    onCancel={() => setConfirmModal(null)}
                />
            )}

            {/* MODAL DE AGRADECIMENTO */}
            {thankingTx && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-surface border border-border-soft rounded-[2rem] w-full max-w-lg shadow-2xl p-8 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-serif text-text-primary tracking-tight">E-mail de Agradecimento</h3>
                            <button onClick={() => setThankingTx(null)} className="opacity-50 hover:opacity-100 transition-opacity"><X size={20} /></button>
                        </div>

                        <div className="mb-6 p-4 bg-bg-light border border-border-soft rounded-2xl">
                            <p className="text-xs font-bold text-text-secondary">Para: <span className="text-text-primary">{thankingTx.guestName}</span> ({thankingTx.guestEmail || 'Sem e-mail cadastrado'})</p>
                            <p className="text-xs font-bold text-text-secondary mt-1">Presente: <span className="text-brand">R$ {Number(thankingTx.amountNet).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                            {thankingTx.message && (
                                <div className="mt-3 p-3 bg-white border-l-2 border-brand text-[11px] italic text-text-muted rounded-r-xl">
                                    "{thankingTx.message}"
                                </div>
                            )}
                        </div>

                        {!thankingTx.guestEmail ? (
                            <div className="text-center p-4 bg-warning-light text-warning-dark rounded-xl mb-6 text-sm">
                                Este convidado não cadastrou e-mail na hora da compra. Não é possível enviar o agradecimento por aqui.
                            </div>
                        ) : (
                            <div className="mb-6">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Sua mensagem personalizada</label>
                                <textarea
                                    value={thankMessage}
                                    onChange={e => setThankMessage(e.target.value)}
                                    placeholder="Escreva algo especial para agradecer o presente..."
                                    className="w-full h-32 px-4 py-3 bg-surface border border-border-soft rounded-xl text-sm font-sans text-text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all resize-none shadow-inner"
                                />
                                <p className="text-[10px] text-text-muted mt-2 px-1">Seu nome ({settings.coupleNames}) e a nossa saudação padrão já estarão no e-mail.</p>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={() => setThankingTx(null)} disabled={sendingThanks} className="px-6 py-3 border border-border-soft rounded-xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:bg-bg-light transition-all outline-none">
                                Cancelar
                            </button>
                            <button
                                onClick={handleSendThankYouEmail}
                                disabled={sendingThanks || !thankingTx.guestEmail}
                                className="px-6 py-3 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-brand-dark transition-all flex items-center gap-2 outline-none disabled:opacity-50 disabled:grayscale"
                            >
                                {sendingThanks ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={14} />}
                                Enviar E-mail
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CABEÇALHO */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-serif text-text-primary">Tesouraria dos Noivos</h2>
                    <p className="text-sm text-text-muted mt-1 font-serif italic">Receba dinheiro vivo direto na conta para realizar seus sonhos.</p>
                </div>
                {settings.giftListEnabled && settings.slug && (
                    <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-3 bg-brand-pale border border-brand/20 rounded-full text-[10px] font-black uppercase tracking-widest text-brand hover:bg-brand hover:text-white shadow-sm transition-all focus:ring-2 focus:ring-brand/20 outline-none">
                        <ArrowUpRight size={14} /> Vitrine Pública
                    </a>
                )}
            </div>

            {/* CARDS DE SALDO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface rounded-[2rem] p-8 border border-border-soft shadow-sm relative overflow-hidden group hover:-translate-y-1 hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-8 text-black/5 opacity-50 group-hover:scale-110 transition-transform"><Wallet size={120} /></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-6 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-info" /> Saldo Total Recebido</p>
                        <h3 className="text-4xl font-light text-text-primary">R$ {Number(stats.totalNet || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                        <p className="text-[10px] font-bold text-text-muted mt-2 italic">* Valor já descontado as taxas.</p>
                    </div>
                </div>

                <div className="bg-surface rounded-[2rem] p-8 border border-border-soft shadow-sm relative overflow-hidden group hover:-translate-y-1 hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-8 text-warning-light group-hover:scale-110 transition-transform"><CheckCircle2 size={120} /></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-6 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-warning" /> Saldo Pendente (A Liberar)</p>
                        <h3 className="text-4xl font-light text-text-primary">R$ {Number(stats.pendingNet || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                        <p className="text-[10px] text-warning font-bold mt-2 uppercase tracking-widest">D+2 para Pix | D+14 para Cartão</p>
                    </div>
                </div>

                <div className="bg-brand text-white rounded-[2rem] p-8 shadow-xl relative overflow-hidden group hover:-translate-y-1 hover:shadow-2xl transition-all">
                    <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:rotate-12 transition-transform"><Sparkles size={120} /></div>
                    <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl opacity-50 group-hover:bg-white/20 transition-all" />
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-6 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_8px_white]" /> Saldo Disponível P/ Saque</p>
                        <h3 className="text-4xl font-black drop-shadow-md tracking-tight text-white">R$ {Number(stats.availableNet || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                        <button
                            onClick={handleRequestWithdrawal}
                            disabled={Number(stats.availableNet) <= 0 || requestingWithdrawal}
                            className="mt-8 px-6 py-3 w-full bg-white text-brand rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-brand-pale active:scale-95 transition-all outline-none focus:ring-4 focus:ring-white/20 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                        >
                            {requestingWithdrawal ? 'Processando...' : 'Solicitar Resgate via Pix'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LISTA E IMPORTAÇÃO (COL 1 e 2) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-surface rounded-[2rem] p-8 border border-border-soft shadow-sm">
                        <div className="flex justify-between items-center mb-8 pb-4 border-b border-border-soft">
                            <h3 className="text-2xl font-serif text-text-primary tracking-tight">Nossa Lista de Presentes</h3>
                            {gifts.length > 0 && <button className="w-10 h-10 rounded-xl bg-bg-light text-brand flex items-center justify-center hover:bg-brand hover:text-white transition-all shadow-inner focus:outline-none focus:ring-2 focus:ring-brand/20"><Plus size={18} /></button>}
                        </div>

                        {gifts.length === 0 ? (
                            <div className="text-center py-16 px-4 bg-bg-light rounded-[2rem] border border-dashed border-border-soft">
                                <div className="w-20 h-20 bg-brand-pale shadow-inner border border-brand/10 rounded-full flex items-center justify-center mx-auto mb-6 text-brand">
                                    <Heart size={32} />
                                </div>
                                <h4 className="text-lg font-black tracking-tight text-text-primary mb-2">Sua lista está vazia!</h4>
                                <p className="text-xs text-text-muted font-bold leading-relaxed mb-8 max-w-sm mx-auto">Adicione itens manualmente ou importe modelos fantásticos com um só clique.</p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
                                    <button onClick={() => handleImportTemplate('CASA')} disabled={importing} className="p-4 bg-surface border border-border-soft rounded-2xl flex flex-col items-center hover:border-brand/40 hover:shadow-lg transition-all disabled:opacity-50 outline-none focus:ring-2 focus:ring-brand/20">
                                        <span className="text-2xl mb-2">🏠</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-text-primary">Produtos p/ Casa</span>
                                    </button>
                                    <button onClick={() => handleImportTemplate('LUA_DE_MEL')} disabled={importing} className="p-4 bg-surface border border-border-soft rounded-2xl flex flex-col items-center hover:border-brand/40 hover:shadow-lg transition-all disabled:opacity-50 outline-none focus:ring-2 focus:ring-brand/20">
                                        <span className="text-2xl mb-2">✈️</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-text-primary">Lua de Mel Simples</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {gifts.map(gift => (
                                    <div key={gift.id} className="group flex items-center p-4 rounded-[1.5rem] border border-border-soft bg-surface hover:bg-bg-light hover:border-brand/30 hover:shadow-md transition-all gap-4">
                                        <div className="w-16 h-16 rounded-xl bg-bg-light flex items-center justify-center overflow-hidden flex-shrink-0 border border-border-soft shadow-inner">
                                            {gift.image_url ? <img src={gift.image_url} alt="" className="w-full h-full object-cover" /> : <Gift className="text-text-muted" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black text-sm text-text-primary tracking-tight truncate">{gift.name}</h4>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-brand mt-1">R$ {Number(gift.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="w-9 h-9 rounded-xl bg-surface border border-border-soft shadow-sm flex items-center justify-center text-text-muted hover:text-brand hover:border-brand/30 hover:bg-brand-pale transition-all"><Edit2 size={14} /></button>
                                            <button onClick={() => handleDeleteGift(gift.id)} className="w-9 h-9 rounded-xl bg-surface border border-border-soft shadow-sm flex items-center justify-center text-text-muted hover:text-danger hover:border-danger/30 hover:bg-danger-light transition-all"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* HISTÓRICO DE PRESENTES E AGRADECIMENTOS */}
                    <div className="bg-surface rounded-[2rem] p-8 border border-border-soft shadow-sm mt-6">
                        <div className="flex justify-between items-center mb-8 pb-4 border-b border-border-soft">
                            <h3 className="text-2xl font-serif text-text-primary tracking-tight">Histórico de Recebimentos</h3>
                        </div>

                        {transactions.length === 0 ? (
                            <div className="text-center py-12 text-text-muted">
                                <MessageSquare size={32} className="mx-auto mb-4 opacity-50" />
                                <p className="text-sm font-bold">Nenhum presente recebido ainda.</p>
                                <p className="text-xs mt-1">Quando alguém comprar algo, aparecerá aqui.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {transactions.map((tx: any) => (
                                    <div key={tx.id} className="p-5 bg-bg-light border border-border-soft rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-black text-sm text-text-primary">{tx.guestName}</h4>
                                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-white border border-border-soft text-text-secondary shrink-0">
                                                    {new Date(tx.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-brand font-black text-xs mb-3">R$ {Number(tx.amountNet).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>

                                            {tx.message ? (
                                                <div className="bg-surface p-3 rounded-xl border-l-2 border-brand text-xs italic text-text-muted shadow-sm">
                                                    "{tx.message}"
                                                </div>
                                            ) : (
                                                <p className="text-xs text-text-muted italic opacity-60">Nenhuma mensagem deixada.</p>
                                            )}
                                        </div>
                                        <div className="shrink-0 w-full md:w-auto flex flex-col items-end gap-2 mt-2 md:mt-0">
                                            <button
                                                onClick={() => {
                                                    setThankingTx(tx);
                                                    setThankMessage('');
                                                }}
                                                className="w-full md:w-auto px-4 py-2 bg-brand-pale text-brand rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-brand hover:text-white transition-all flex items-center justify-center gap-2 outline-none focus:ring-2 focus:ring-brand/20"
                                            >
                                                <Mail size={14} /> Agradecer
                                            </button>
                                            {tx.guestEmail && <span className="text-[9px] font-bold text-text-muted italic hidden md:block">{tx.guestEmail}</span>}
                                        </div>
                                    </div>
                                ))}
                                <p className="text-center text-[10px] text-text-muted uppercase tracking-widest font-bold mt-4">Exibindo os 50 mais recentes</p>
                            </div>
                        )}
                    </div>

                </div>

                {/* CONFIGURAÇÕES (COL 3) */}
                <div className="bg-surface rounded-[2rem] p-8 border border-border-soft shadow-sm h-fit">
                    <h3 className="text-2xl font-serif tracking-tight text-text-primary mb-6 pb-4 border-b border-border-soft">Configurações e Metas</h3>
                    <form onSubmit={handleSaveSettings} className="space-y-6">
                        <div className="flex items-center justify-between p-5 bg-bg-light shadow-inner rounded-2xl border border-border-soft">
                            <div>
                                <label className="text-xs font-black text-text-primary block tracking-tight">Ativar Lista</label>
                                <span className="text-[9px] font-black uppercase tracking-widest text-brand mt-1 block">Vitrine Pública on/off</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={settings.giftListEnabled} onChange={e => setSettings({ ...settings, giftListEnabled: e.target.checked })} />
                                <div className="w-11 h-6 bg-border-soft peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-soft after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
                            </label>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Link da Sua Lista</label>
                            <div className="flex bg-surface rounded-xl overflow-hidden border border-border-soft focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 transition-all shadow-inner">
                                <span className="px-4 py-3 bg-bg-light text-text-muted text-xs font-bold border-r border-border-soft flex items-center whitespace-nowrap hidden sm:flex">{domain}/v/</span>
                                <input type="text" value={settings.slug} onChange={e => setSettings({ ...settings, slug: e.target.value })} className="w-full px-4 py-3 bg-transparent text-sm outline-none font-bold text-text-primary placeholder:text-text-muted/50" placeholder="ex: casamento-joao-e-maria" />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block flex items-center gap-2"><AlertCircle size={12} /> Taxa Mercado Pago (4.99%)</label>
                            <select value={settings.taxPayer} onChange={e => setSettings({ ...settings, taxPayer: e.target.value })} className="w-full px-4 py-3 bg-surface border border-border-soft rounded-xl text-xs font-bold font-sans text-text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all shadow-inner">
                                <option value="COUPLE">Desejo absorver a taxa (Recebo o valor - 4.99%)</option>
                                <option value="GUEST">Repassar ao convidado (+4.99% no checkout)</option>
                            </select>
                        </div>

                        <div className="pt-6 border-t border-border-soft">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-brand mb-4 flex items-center gap-2"><ShieldCheck size={14} /> Dados Para Pix</h4>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2 block">Tipo de Chave</label>
                                    <select value={settings.bankType} onChange={e => setSettings({ ...settings, bankType: e.target.value })} className="w-full px-4 py-3 bg-surface border border-border-soft rounded-xl text-xs font-bold font-sans text-text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all shadow-inner">
                                        <option value="CPF">CPF</option>
                                        <option value="CNPJ">CNPJ</option>
                                        <option value="EMAIL">Email</option>
                                        <option value="TELEFONE">Telefone Celular</option>
                                        <option value="ALEATORIA">Chave Aleatória</option>
                                    </select>
                                </div>
                                <div>
                                    <input type="text" placeholder="Chave Pix..." value={settings.bankPixKey || ''} onChange={e => setSettings({ ...settings, bankPixKey: e.target.value })} className="w-full px-4 py-3 bg-surface border border-border-soft rounded-xl text-xs font-bold font-sans text-text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all shadow-inner" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2 block">Nome Completo do Titular</label>
                                    <input type="text" placeholder="Nome do Titular..." value={settings.bankBeneficiary || ''} onChange={e => setSettings({ ...settings, bankBeneficiary: e.target.value })} className="w-full px-4 py-3 bg-surface border border-border-soft rounded-xl text-xs font-bold font-sans text-text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all shadow-inner" />
                                </div>
                            </div>
                        </div>

                        <button disabled={savingSettings} type="submit" className="w-full py-4 bg-brand hover:bg-brand-dark text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center outline-none focus:ring-4 focus:ring-brand/20">
                            {savingSettings ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Salvar Configurações'}
                        </button>
                    </form>
                </div>

                {/* HISTÓRICO DE SAQUES */}
                {withdrawals.length > 0 && (
                    <div className="bg-surface rounded-[2rem] p-8 border border-border-soft shadow-sm h-fit">
                        <h3 className="text-2xl font-serif tracking-tight text-text-primary mb-6 pb-4 border-b border-border-soft flex items-center gap-2">
                            Histórico de Saques
                        </h3>
                        <div className="space-y-4">
                            {withdrawals.map(w => (
                                <div key={w.id} className="p-4 rounded-2xl bg-bg-light border border-border-soft flex justify-between items-center group hover:border-brand/20 transition-all">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-text-primary">
                                            Solicitado em {new Date(w.createdAt).toLocaleDateString()}
                                        </p>
                                        <p className="text-[9px] font-bold text-text-muted uppercase mt-1">Pix: {w.pixKey}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-brand text-xs">R$ {Number(w.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md border mt-2 inline-block ${w.status === 'COMPLETED' ? 'bg-success-light text-success-dark border-success/20' :
                                            w.status === 'REJECTED' ? 'bg-danger-light text-danger-dark border-danger/20' :
                                                'bg-warning-light text-warning-dark border-warning/20'
                                            }`}>
                                            {w.status === 'COMPLETED' ? 'Pago' : w.status === 'REJECTED' ? 'Recusado' : 'Pendente'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
