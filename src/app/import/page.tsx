'use client'

import { useAuth } from '@/lib/auth-context'
import { useEvent, GuestStatus } from '@/lib/event-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { parseGuestsList, generateImportTemplate, ParseSheetResult } from '@/lib/utils/parseSheets'
import { SharedLayout } from '@/app/components/shared-layout'

export default function ImportPage() {
    const { user, loading: authLoading, logout } = useAuth()
    const { addGuest, addGuestsBatch, loading: eventLoading } = useEvent()
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    // UI States
    const [step, setStep] = useState<'choose' | 'input' | 'review' | 'success' | 'error'>('choose')
    const [method, setMethod] = useState<'excel' | 'manual' | null>(null)
    const [manualName, setManualName] = useState('')
    const [manualGrupo, setManualGrupo] = useState('')
    const [manualCategory, setManualCategory] = useState('adult_paying')
    const [manualTelefone, setManualTelefone] = useState('')

    // Acompanhantes (5 posições)
    const [manualCompanions, setManualCompanions] = useState<Array<{ name: string; category: string }>>([
        { name: '', category: 'adult_paying' },
        { name: '', category: 'adult_paying' },
        { name: '', category: 'adult_paying' },
        { name: '', category: 'adult_paying' },
        { name: '', category: 'adult_paying' }
    ])

    const [pendingGuest, setPendingGuest] = useState<{ name: string, companionsList: any[], grupo: string, category: string, email?: string, telefone?: string } | null>(null)

    // File upload states
    const [isDragging, setIsDragging] = useState(false)
    const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
    const [importedCount, setImportedCount] = useState(0)

    // New states for sheet parsing
    const [parseResult, setParseResult] = useState<ParseSheetResult | null>(null)
    const [errorMessage, setErrorMessage] = useState('')
    const [duplicatesList, setDuplicatesList] = useState<string[]>([])

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
        }
    }, [user, authLoading, router])

    if (authLoading || eventLoading) {
        return (
            <SharedLayout role="user" title="Importar Convidados">
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-brand-pale border-t-brand rounded-full animate-spin" />
                </div>
            </SharedLayout>
        )
    }

    if (!user) {
        return null
    }

    // --- MANUAL ADD HANDLER ---
    const handleManualAdd = (e: React.FormEvent) => {
        e.preventDefault()
        if (!manualName.trim()) {
            alert('O nome do convidado é obrigatório')
            return
        }

        // Filtra acompanhantes que têm nome preenchido
        const companionsList = manualCompanions
            .filter(c => c.name.trim())
            .map(c => ({
                name: c.name.trim(),
                category: c.category as any,
                isConfirmed: false
            }))

        setPendingGuest({
            name: manualName,
            companionsList,
            grupo: manualGrupo,
            category: manualCategory,
            telefone: manualTelefone
        })
        setStep('review')
    }

    const confirmAdd = async () => {
        if (!pendingGuest) return

        const success = await addGuest({
            name: pendingGuest.name,
            email: pendingGuest.email,
            telefone: pendingGuest.telefone || '',
            grupo: pendingGuest.grupo || undefined,
            companions: pendingGuest.companionsList.length,
            companionsList: pendingGuest.companionsList as any,
            category: pendingGuest.category as any
        })

        if (!success) {
            alert('Erro ao salvar convidado no banco de dados.')
            return
        }

        setImportedCount(1 + pendingGuest.companionsList.length) // 1 titular + N acompanhantes
        setStep('success')
        setManualName('')
        setManualCompanions([
            { name: '', category: 'adult_paying' },
            { name: '', category: 'adult_paying' },
            { name: '', category: 'adult_paying' },
            { name: '', category: 'adult_paying' },
            { name: '', category: 'adult_paying' }
        ])
        setManualGrupo('')
        setManualCategory('adult_paying')
        setPendingGuest(null)
    }

    const confirmBatch = async () => {
        if (!parseResult || parseResult.convidados.length === 0) return

        const result = await (addGuestsBatch(parseResult.convidados) as any)

        if (result.error) {
            alert(result.error)
            return
        }

        setImportedCount(result.imported)
        setDuplicatesList(result.duplicates)
        setStep('success')
        setParseResult(null)
    }

    const handleDownloadModel = async () => {
        try {
            const templateData = await generateImportTemplate()
            const blob = new Blob([templateData as any], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', 'modelo_importacao.xlsx')
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        } catch (error) {
            alert('Erro ao gerar modelo: ' + (error instanceof Error ? error.message : 'Desconhecido'))
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const files = e.dataTransfer.files
        if (files.length > 0) processFile(files[0])
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0])
        }
    }

    const processFile = async (file: File) => {
        setImportStatus('processing')
        setErrorMessage('')
        setDuplicatesList([])

        try {
            const result = await parseGuestsList(file)
            setParseResult(result)

            if (!result.sucesso) {
                if (result.erros.length > 0 || result.duplicatas.length > 0) {
                    setStep('error')
                    setImportStatus('error')
                    const dups = result.duplicatas.map(d => `${d.nomePrincipal}`)
                    setDuplicatesList(dups)
                    return
                }
            }

            if (result.convidados.length > 0) {
                setStep('review')
            } else {
                setErrorMessage('Nenhum convidado válido encontrado no arquivo')
                setImportStatus('error')
                setStep('error')
            }
        } catch (error) {
            setErrorMessage(`Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Desconhecido'}`)
            setImportStatus('error')
            setStep('error')
        }
    }

    return (
        <SharedLayout
            role="user"
            title="Importar Convidados"
            subtitle="Adicione convidados via Excel ou manualmente"
        >
            {eventLoading ? (
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-12 h-12 border-4 border-brand-pale border-t-brand rounded-full animate-spin mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Carregando dados do evento...</p>
                </div>
            ) : (
                <main className="max-w-[1200px] mx-auto w-full animate-in fade-in duration-500">
                    <div className="mb-8">
                        <button
                            onClick={() => {
                                if (step === 'review' || step === 'input') setStep('choose')
                                else router.back()
                            }}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-brand transition-all"
                        >
                            <ArrowLeftIcon />
                            Voltar
                        </button>
                    </div>

                    {step === 'choose' && (
                        <div className="max-w-4xl mx-auto py-4 animate-in fade-in duration-500">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-black text-text-primary tracking-tight mb-2">Lista de Presença</h2>
                                <p className="text-text-muted font-bold text-sm uppercase tracking-widest">Escolha como quer adicionar seus convidados:</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <button
                                    onClick={() => {
                                        setMethod('excel')
                                        setStep('input')
                                    }}
                                    className="bg-surface p-12 rounded-[2.5rem] border border-border-soft hover:border-brand-light/30 hover:shadow-2xl hover:shadow-brand/[0.03] transition-all flex flex-col items-center text-center group"
                                >
                                    <div className="w-20 h-20 bg-brand-pale rounded-[2.5rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-brand/10">
                                        <FileSpreadsheetIcon />
                                    </div>
                                    <h3 className="text-xl font-black text-text-primary mb-2 tracking-tight">Planilha Excel</h3>
                                    <p className="text-xs text-text-muted font-bold uppercase tracking-widest leading-relaxed px-4">
                                        Importe múltiplos convidados de uma só vez.<br />
                                        <span className="text-brand/60 mt-2 block font-black">Novidade: Liste acompanhantes por vírgula!</span>
                                    </p>
                                </button>

                                <button
                                    onClick={() => {
                                        setMethod('manual')
                                        setStep('input')
                                    }}
                                    className="bg-surface p-12 rounded-[2.5rem] border border-border-soft hover:border-brand-light/30 hover:shadow-2xl hover:shadow-brand/[0.03] transition-all flex flex-col items-center text-center group"
                                >
                                    <div className="w-20 h-20 bg-brand-pale rounded-[2.5rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-brand/10">
                                        <UserPlusIcon />
                                    </div>
                                    <h3 className="text-xl font-black text-text-primary mb-2 tracking-tight">Manualmente</h3>
                                    <p className="text-xs text-text-muted font-bold uppercase tracking-widest leading-relaxed px-4">Adicione convidados um a um com seus respectivos acompanhantes.</p>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'input' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                            {method === 'excel' && (
                                <div className="bg-surface p-8 rounded-[2.5rem] border border-border-soft shadow-sm flex flex-col lg:col-span-1">
                                    <div className="mb-8">
                                        <h2 className="text-xl font-black text-text-primary tracking-tight mb-1">Importar Excel</h2>
                                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Siga o modelo para evitar erros</p>
                                    </div>

                                    <button
                                        onClick={handleDownloadModel}
                                        className="w-full flex items-center justify-center gap-2 py-4 bg-bg-light border border-border-soft rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-secondary hover:bg-brand-pale transition-all mb-8 shadow-inner"
                                    >
                                        <DownloadIcon />
                                        Baixar modelo (.xlsx)
                                    </button>

                                    <div
                                        className={`flex-1 min-h-[300px] border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center p-8 transition-all cursor-pointer ${isDragging ? 'border-brand bg-brand-pale scale-[0.98]' : 'border-border-soft hover:border-brand-light/30 hover:bg-bg-light'}`}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept=".xlsx,.xls,.csv"
                                            onChange={handleFileSelect}
                                        />

                                        {importStatus === 'processing' ? (
                                            <div className="text-center">
                                                <div className="w-12 h-12 border-4 border-brand-pale border-t-brand rounded-full animate-spin mx-auto mb-4" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-brand">Validando arquivo...</p>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <div className="w-16 h-16 bg-bg-light rounded-2xl flex items-center justify-center mx-auto mb-4 text-text-muted shadow-sm border border-border-soft">
                                                    <UploadCloudIcon />
                                                </div>
                                                <p className="text-sm font-black text-text-primary mb-1">Upload de Arquivo</p>
                                                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Arraste ou clique para selecionar</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {method === 'manual' && (
                                <div className="bg-surface p-8 rounded-[2.5rem] border border-border-soft shadow-sm lg:col-span-1">
                                    <div className="mb-8">
                                        <h2 className="text-xl font-black text-text-primary tracking-tight mb-1">Adicionar Manual</h2>
                                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Preencha as informações obrigatórias</p>
                                    </div>

                                    <form onSubmit={handleManualAdd} className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 ml-1">Nome Completo do Titular *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Digite o nome completo"
                                                    className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary"
                                                    value={manualName}
                                                    onChange={(e) => setManualName(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 ml-1">Grupo (ex: Família Noiva)</label>
                                                <input
                                                    type="text"
                                                    placeholder="Digite o grupo"
                                                    className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary"
                                                    value={manualGrupo}
                                                    onChange={(e) => setManualGrupo(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 ml-1">Tipo do Titular</label>
                                                <select
                                                    value={manualCategory}
                                                    onChange={(e) => setManualCategory(e.target.value)}
                                                    className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-xs font-black uppercase tracking-widest text-text-secondary shadow-inner outline-none"
                                                >
                                                    <option value="adult_paying">Adulto Pagante</option>
                                                    <option value="child_paying">Criança Pagante</option>
                                                    <option value="child_not_paying">Criança Não Pagante</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 ml-1">WhatsApp / Telefone</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ex: 11999999999"
                                                    className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary"
                                                    value={manualTelefone}
                                                    onChange={(e) => setManualTelefone(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-3 ml-1">Acompanhantes (até 5)</label>
                                            <div className="space-y-3 bg-bg-light/50 p-6 rounded-2xl border border-border-soft">
                                                {manualCompanions.map((companion, idx) => (
                                                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                        <div className="sm:col-span-2">
                                                            <input
                                                                type="text"
                                                                placeholder={`Nome do Acompanhante ${idx + 1}`}
                                                                className="w-full px-4 py-2.5 bg-surface border border-border-soft rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-sm outline-none text-text-primary"
                                                                value={companion.name}
                                                                onChange={(e) => {
                                                                    const newCompanions = [...manualCompanions]
                                                                    newCompanions[idx].name = e.target.value
                                                                    setManualCompanions(newCompanions)
                                                                }}
                                                            />
                                                        </div>
                                                        <select
                                                            value={companion.category}
                                                            onChange={(e) => {
                                                                const newCompanions = [...manualCompanions]
                                                                newCompanions[idx].category = e.target.value
                                                                setManualCompanions(newCompanions)
                                                            }}
                                                            className="px-4 py-2.5 bg-surface border border-border-soft rounded-xl text-[10px] font-black uppercase tracking-widest text-text-muted outline-none"
                                                        >
                                                            <option value="adult_paying">Adulto</option>
                                                            <option value="child_paying">Criança Pag.</option>
                                                            <option value="child_not_paying">Não Pagante</option>
                                                        </select>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <button
                                                type="submit"
                                                className="w-full py-4 bg-brand text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                Revisar Convidado <ArrowRightIcon />
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'review' && (
                        <div className="max-w-4xl mx-auto animate-in slide-in-from-right-8 duration-500">
                            <div className="bg-surface p-8 rounded-[2.5rem] border border-border-soft shadow-sm mb-6">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
                                    <div>
                                        <h2 className="text-2xl font-black text-text-primary tracking-tight mb-1">Revisar Importação</h2>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Confirme os dados antes de salvar</p>
                                            <p className="text-[10px] font-black text-brand uppercase tracking-widest bg-brand-pale px-2 py-0.5 rounded-md">
                                                {pendingGuest 
                                                    ? `1 Convite • ${1 + pendingGuest.companionsList.length} Pessoas` 
                                                    : `${parseResult?.convidados.length || 0} Convites • ${parseResult?.convidados.reduce((acc, g) => acc + 1 + (g.companionsList?.length || 0), 0) || 0} Pessoas Total`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 w-full sm:w-auto">
                                        <button
                                            onClick={() => setStep('input')}
                                            className="flex-1 sm:flex-none px-6 py-3 bg-bg-light text-[10px] font-black uppercase tracking-widest text-text-muted rounded-xl hover:bg-brand-pale transition-all border border-border-soft"
                                        >
                                            Corrigir
                                        </button>
                                        <button
                                            onClick={pendingGuest ? confirmAdd : confirmBatch}
                                            className="flex-1 sm:flex-none px-8 py-3 bg-brand text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-brand/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
                                        >
                                            <CheckIcon /> Salvar Agora
                                        </button>
                                    </div>
                                </div>

                                <div className="border border-border-soft rounded-[2rem] overflow-y-auto max-h-[500px] shadow-inner bg-bg-light/30 custom-scrollbar">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-bg-light/50 border-b border-border-soft text-[9px] font-black text-text-muted uppercase tracking-widest">
                                            <tr>
                                                <th className="px-8 py-4">Nome</th>
                                                <th className="px-8 py-4">Status</th>
                                                <th className="px-8 py-4 text-right">Membros</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border-soft">
                                            {pendingGuest ? (
                                                <tr>
                                                    <td className="px-8 py-5">
                                                        <p className="font-black text-text-primary tracking-tight">{pendingGuest.name}</p>
                                                        {pendingGuest.telefone && <p className="text-[10px] text-brand font-bold mt-1">📞 {pendingGuest.telefone}</p>}
                                                        {pendingGuest.companionsList && pendingGuest.companionsList.length > 0 && (
                                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                                {pendingGuest.companionsList.map((c: any, i: number) => (
                                                                    <span key={i} className="text-[8px] font-bold text-text-muted bg-white border border-border-soft px-2 py-0.5 rounded-md">
                                                                        + {c.name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className="bg-warning-light text-warning px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border border-warning/10">Pendente</span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right font-black text-brand">{1 + pendingGuest.companionsList.length}</td>
                                                </tr>
                                            ) : parseResult?.convidados.map((guest, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-8 py-4">
                                                        <p className="font-black text-text-primary tracking-tight">{guest.name}</p>
                                                        {guest.telefone && <p className="text-[10px] text-brand font-bold mt-1">📞 {guest.telefone}</p>}
                                                        {guest.companionsList && guest.companionsList.length > 0 && (
                                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                                {guest.companionsList.map((c, i) => (
                                                                    <span key={i} className="text-[8px] font-bold text-text-muted bg-white border border-border-soft px-2 py-0.5 rounded-md">
                                                                        + {c.name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-4">
                                                        <span className="bg-success-light text-success-dark px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border border-success/10">Válido</span>
                                                    </td>
                                                    <td className="px-8 py-4 text-right font-black text-brand">{1 + (guest.companionsList?.length || 0)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="flex flex-col items-center justify-center py-12 animate-in zoom-in-95 duration-500 text-center">
                            <div className="w-24 h-24 bg-success-light rounded-[2rem] flex items-center justify-center mb-8 text-success-dark shadow-xl shadow-success/10 border-4 border-surface animate-bounce">
                                <CheckIconBig />
                            </div>
                            <h2 className="text-4xl font-black text-text-primary tracking-tight mb-2">Sucesso!</h2>
                            <p className="text-text-muted font-bold text-sm uppercase tracking-widest mb-10">
                                {importedCount} novos nomes adicionados à lista.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                                <button
                                    onClick={() => {
                                        setStep('choose')
                                        setImportedCount(0)
                                        setDuplicatesList([])
                                    }}
                                    className="flex-1 px-8 py-4 bg-surface border border-border-soft text-text-muted text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-bg-light transition-all shadow-sm"
                                >
                                    Adicionar Mais
                                </button>
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className="flex-1 px-8 py-4 bg-brand text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-brand/20 hover:scale-105 transition-all"
                                >
                                    Ver Lista Completa
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'error' && (
                        <div className="max-w-2xl mx-auto py-12 animate-in zoom-in-95 duration-500">
                            <div className="bg-surface p-12 rounded-[3rem] border-2 border-danger/20 shadow-2xl shadow-danger/5 text-center">
                                <div className="w-20 h-20 bg-danger/10 rounded-2xl flex items-center justify-center text-danger mx-auto mb-8">
                                    <XCircleRedIcon />
                                </div>
                                <h2 className="text-2xl font-black text-text-primary tracking-tight mb-4">Ops! Algo deu errado</h2>
                                <p className="text-text-muted font-bold text-sm uppercase tracking-widest leading-relaxed mb-8">
                                    {errorMessage || 'Não foi possível processar o seu arquivo. Verifique se ele segue o modelo oficial.'}
                                </p>

                                {duplicatesList.length > 0 && (
                                    <div className="mb-8 p-6 bg-danger/5 rounded-2xl border border-danger/10 text-left">
                                        <p className="text-[10px] font-black text-danger uppercase tracking-widest mb-3">Nomes Duplicados Encontrados:</p>
                                        <ul className="space-y-1.5">
                                            {duplicatesList.slice(0, 5).map((dup, i) => (
                                                <li key={i} className="text-xs font-bold text-text-muted flex items-center gap-2">
                                                    <span className="w-1 h-1 bg-danger rounded-full" /> {dup}
                                                </li>
                                            ))}
                                            {duplicatesList.length > 5 && (
                                                <li className="text-[10px] font-black text-text-muted italic mt-2">... e mais {duplicatesList.length - 5} duplicados</li>
                                            )}
                                        </ul>
                                    </div>
                                )}

                                <button
                                    onClick={() => {
                                        setStep('choose')
                                        setMethod(null)
                                        setImportStatus('idle')
                                    }}
                                    className="w-full py-4 bg-brand text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-brand/20 hover:scale-[1.02] transition-all"
                                >
                                    Tentar Novamente
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            )}
        </SharedLayout>
    )
}

// Icons
const ArrowLeftIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
const ArrowRightIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" x2="19" y1="12" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
const FileSpreadsheetIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand"><path d="M12 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10"></path><polyline points="12 2 12 10 20 10"></polyline></svg>
const UserPlusIcon = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
const UploadCloudIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M12 12v9" /><path d="m16 16-4-4-4 4" /></svg>
const DownloadIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
const CheckIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
const CheckIconBig = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
const XCircleRedIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
