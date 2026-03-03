'use client'

import { useAuth } from '@/lib/auth-context'
import { useEvent } from '@/lib/event-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { SharedLayout } from '@/app/components/shared-layout'

export default function SettingsPage() {
    const { user, loading: authLoading, logout } = useAuth()
    const { eventSettings, updateEventSettings } = useEvent()
    const router = useRouter()

    // Form states - Initialize from context
    const [eventType, setEventType] = useState<'casamento' | 'debutante'>(eventSettings.eventType)
    const [coupleNames, setCoupleNames] = useState(eventSettings.coupleNames)
    const [slug, setSlug] = useState(eventSettings.slug)
    const [eventDate, setEventDate] = useState(eventSettings.eventDate)
    const [eventTime, setEventTime] = useState(eventSettings.eventTime || '21:00')
    const [confirmationDeadline, setConfirmationDeadline] = useState(eventSettings.confirmationDeadline)
    const [eventLocation, setEventLocation] = useState(eventSettings.eventLocation)
    const [wazeLocation, setWazeLocation] = useState(eventSettings.wazeLocation || '')
    const [giftList, setGiftList] = useState(eventSettings.giftList || '')
    const [giftListLinks, setGiftListLinks] = useState<{ name: string; url: string }[]>(eventSettings.giftListLinks || [])
    const [coverImage, setCoverImage] = useState(eventSettings.coverImage)
    const [coverImagePosition, setCoverImagePosition] = useState(eventSettings.coverImagePosition || 50)
    const [coverImageScale, setCoverImageScale] = useState(eventSettings.coverImageScale || 1)
    const [customMessage, setCustomMessage] = useState(eventSettings.customMessage)
    const [notifyOwnerOnRSVP, setNotifyOwnerOnRSVP] = useState(eventSettings.notifyOwnerOnRSVP ?? true)

    const [saved, setSaved] = useState(false)
    const [slugEdited, setSlugEdited] = useState(false) // Track if user manually edited slug

    // Image upload states
    const [imagePreview, setImagePreview] = useState<string>(eventSettings.coverImage)
    const [uploadMethod, setUploadMethod] = useState<'url' | 'upload'>('upload')
    const [showCropModal, setShowCropModal] = useState(false)
    const [tempImage, setTempImage] = useState<string>('')
    const [dragOffsetX, setDragOffsetX] = useState(0)
    const [dragOffsetY, setDragOffsetY] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [dragStartX, setDragStartX] = useState(0)
    const [dragStartY, setDragStartY] = useState(0)
    const [cropScale, setCropScale] = useState(1)
    const [cropRotation, setCropRotation] = useState(0)
    const [touchDistance, setTouchDistance] = useState(0)
    const [touchStartRotation, setTouchStartRotation] = useState(0)
    const cropPreviewRef = useRef<HTMLDivElement>(null)

    // Function to generate slug from names
    const generateSlug = (text: string): string => {
        return text
            .toLowerCase()
            .normalize('NFD') // Decompõe caracteres acentuados
            .replace(/[\u0300-\u036f]/g, '') // Remove os acentos
            .replace(/[^a-z0-9]/g, '') // Remove tudo que não for letra ou número
            .trim()
    }

    // Auto-generate slug when names change (unless user manually edited it)
    const handleNamesChange = (value: string) => {
        setCoupleNames(value)
        if (!slugEdited) {
            setSlug(generateSlug(value))
        }
    }

    // Handle manual slug edit
    const handleSlugChange = (value: string) => {
        setSlug(value)
        setSlugEdited(true) // Mark as manually edited
    }

    // Handle drag on image in crop modal
    const handleImageMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true)
        setDragStartX(e.clientX)
        setDragStartY(e.clientY)
    }

    const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging) return

        const deltaX = e.clientX - dragStartX
        const deltaY = e.clientY - dragStartY

        setDragOffsetX(dragOffsetX + deltaX)
        setDragOffsetY(dragOffsetY + deltaY)
        setDragStartX(e.clientX)
        setDragStartY(e.clientY)
    }

    const handleImageMouseUp = () => {
        setIsDragging(false)
    }

    // Calculate distance between two touch points
    const getTouchDistance = (touches: React.TouchList | TouchList): number => {
        const arr = Array.from(touches) as Touch[]
        if (arr.length < 2) return 0
        const dx = arr[0].clientX - arr[1].clientX
        const dy = arr[0].clientY - arr[1].clientY
        return Math.sqrt(dx * dx + dy * dy)
    }

    // Calculate angle between two touch points
    const getTouchAngle = (touches: React.TouchList | TouchList): number => {
        const arr = Array.from(touches) as Touch[]
        if (arr.length < 2) return 0
        const dx = arr[1].clientX - arr[0].clientX
        const dy = arr[1].clientY - arr[0].clientY
        return (Math.atan2(dy, dx) * 180) / Math.PI
    }

    // Handle touch events for mobile
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if (e.touches.length === 1) {
            // Single finger - drag
            setIsDragging(true)
            setDragStartX(e.touches[0].clientX)
            setDragStartY(e.touches[0].clientY)
        } else if (e.touches.length === 2) {
            // Two fingers - pinch zoom or rotation
            e.preventDefault()
            setTouchDistance(getTouchDistance(e.touches))
            setTouchStartRotation(getTouchAngle(e.touches))
            setIsDragging(false)
        }
    }

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (e.touches.length === 1 && isDragging) {
            // Single finger drag
            const deltaX = e.touches[0].clientX - dragStartX
            const deltaY = e.touches[0].clientY - dragStartY

            setDragOffsetX(dragOffsetX + deltaX)
            setDragOffsetY(dragOffsetY + deltaY)
            setDragStartX(e.touches[0].clientX)
            setDragStartY(e.touches[0].clientY)
        } else if (e.touches.length === 2) {
            // Two fingers - pinch and rotate
            e.preventDefault()
            const currentDistance = getTouchDistance(e.touches)
            const currentAngle = getTouchAngle(e.touches)

            // Pinch zoom
            if (touchDistance > 0) {
                const scaleDelta = (currentDistance - touchDistance) * 0.005
                const newScale = Math.max(0.5, Math.min(3, cropScale + scaleDelta))
                setCropScale(newScale)
                setTouchDistance(currentDistance)
            }

            // Two-finger rotation
            if (touchStartRotation !== 0) {
                const angleDelta = currentAngle - touchStartRotation
                const newRotation = (cropRotation + angleDelta) % 360
                setCropRotation(newRotation)
                setTouchStartRotation(currentAngle)
            }
        }
    }

    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        if (e.touches.length === 0) {
            setIsDragging(false)
        }
    }

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault()
        const scaleDelta = e.deltaY > 0 ? -0.1 : 0.1
        const newScale = Math.max(0.5, Math.min(3, cropScale + scaleDelta))
        setCropScale(newScale)
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            alert('Arquivo muito grande! Máximo 5MB.')
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            const base64String = reader.result as string
            setTempImage(base64String)
            setShowCropModal(true)
            setCropScale(1)
            setCropRotation(0)
            setDragOffsetX(0)
            setDragOffsetY(0)
        }
        reader.readAsDataURL(file)
    }

    const handleCropConfirm = () => {
        setCoverImage(tempImage)
        setImagePreview(tempImage)
        setShowCropModal(false)
        setTempImage('')
    }

    const handleUrlChange = (value: string) => {
        setCoverImage(value)
        setImagePreview(value)
    }

    useEffect(() => {
        if (showCropModal && cropPreviewRef.current) {
            cropPreviewRef.current.focus()
        }
    }, [showCropModal])

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
        }
    }, [user, authLoading, router])

    if (authLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
            </div>
        )
    }

    if (!user) {
        return null
    }

    const handleAddGiftLink = () => {
        setGiftListLinks([...giftListLinks, { name: '', url: '' }])
    }

    const handleRemoveGiftLink = (index: number) => {
        setGiftListLinks(giftListLinks.filter((_, i) => i !== index))
    }

    const handleUpdateGiftLink = (index: number, field: 'name' | 'url', value: string) => {
        const updated = [...giftListLinks]
        updated[index] = { ...updated[index], [field]: value }
        setGiftListLinks(updated)
    }

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault()
        updateEventSettings({
            eventType,
            coupleNames,
            slug,
            eventDate,
            eventTime,
            confirmationDeadline,
            eventLocation,
            wazeLocation,
            giftList,
            giftListLinks,
            coverImage,
            coverImagePosition,
            coverImageScale,
            customMessage,
            notifyOwnerOnRSVP
        })
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
    }

    return (
        <SharedLayout
            role="user"
            title="Configurações"
            subtitle="Personalize as informações do seu evento"
        >
            <main className="max-w-[800px] mx-auto w-full animate-in fade-in duration-500 pb-20">
                {/* SETTINGS CARD */}
                <div className="bg-surface rounded-[2.5rem] border border-border-soft shadow-sm p-8 md:p-12">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-12 h-12 bg-brand-pale/50 rounded-2xl flex items-center justify-center text-brand">
                            <HeartIconOutline className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-text-primary tracking-tight">Evento</h2>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none">Dados principais e identidade</p>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="space-y-8">
                        {/* Tipo de Evento */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="eventType" className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 ml-1">Tipo de Evento</label>
                                <select
                                    id="eventType"
                                    value={eventType}
                                    onChange={(e) => setEventType(e.target.value as 'casamento' | 'debutante')}
                                    className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary appearance-none cursor-pointer"
                                >
                                    <option value="casamento">💍 Casamento</option>
                                    <option value="debutante">💃 Debutante</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="coupleNames" className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 ml-1">
                                    {eventType === 'casamento' ? 'Nomes do Casal' : 'Nome da Debutante'}
                                </label>
                                <input
                                    type="text"
                                    id="coupleNames"
                                    value={coupleNames}
                                    onChange={(e) => handleNamesChange(e.target.value)}
                                    placeholder={eventType === 'casamento' ? 'Ex: Vanessa e Rodrigo' : 'Ex: Maria Clara'}
                                    className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary placeholder:text-text-muted"
                                />
                            </div>
                        </div>

                        {/* Notificações */}
                        <div className="p-6 bg-bg-light rounded-[2rem] border border-border-soft flex items-center justify-between group hover:border-brand/20 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-text-muted transition-transform group-hover:scale-110 shadow-sm border border-border-soft">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none mb-1.5">Avisos por E-mail</p>
                                    <p className="text-xs font-bold text-text-primary">Receber confirmações no seu e-mail</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setNotifyOwnerOnRSVP(!notifyOwnerOnRSVP)}
                                className={`w-14 h-8 rounded-full relative transition-all duration-300 ${notifyOwnerOnRSVP ? 'bg-brand' : 'bg-border-soft'}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${notifyOwnerOnRSVP ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        {/* Slug (URL) */}
                        <div>
                            <label htmlFor="slug" className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 ml-1">
                                Slug (URL personalizada)
                                <div className="group relative inline-block">
                                    <InfoIcon className="w-4 h-4 text-text-muted/40 cursor-help hover:text-brand transition-colors" />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-72 p-4 bg-brand-dark text-white text-[11px] leading-relaxed rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 shadow-2xl pointer-events-none border border-brand/20">
                                        <p className="font-black mb-2 text-brand uppercase tracking-widest">⚠️ Atenção</p>
                                        Este é o endereço do seu site (ex: rsvp.me/{slug}). Se você alterar após já ter enviado os convites, o link anterior parará de funcionar.
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-brand-dark" />
                                    </div>
                                </div>
                            </label>
                            <div className="relative group">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted font-bold text-sm">/</span>
                                <input
                                    type="text"
                                    id="slug"
                                    value={slug}
                                    onChange={(e) => handleSlugChange(e.target.value)}
                                    className="w-full pl-9 pr-14 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-mono font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-brand"
                                />
                                {slugEdited && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSlugEdited(false)
                                            setSlug(generateSlug(coupleNames))
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-surface border border-border-soft rounded-lg text-[9px] font-black uppercase tracking-widest text-text-muted hover:text-brand shadow-sm transition-all"
                                    >
                                        Auto
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Data + Horário + Prazo */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label htmlFor="eventDate" className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 ml-1">Data do Evento</label>
                                <input
                                    type="date"
                                    id="eventDate"
                                    value={eventDate}
                                    onChange={(e) => setEventDate(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary"
                                />
                            </div>
                            <div>
                                <label htmlFor="eventTime" className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 ml-1">Horário</label>
                                <input
                                    type="time"
                                    id="eventTime"
                                    value={eventTime}
                                    onChange={(e) => setEventTime(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary"
                                />
                            </div>
                            <div>
                                <label htmlFor="confirmationDeadline" className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 ml-1">Prazo RSVP</label>
                                <input
                                    type="date"
                                    id="confirmationDeadline"
                                    value={confirmationDeadline}
                                    onChange={(e) => setConfirmationDeadline(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary"
                                />
                            </div>
                        </div>

                        {/* Localização */}
                        <div className="space-y-6 pt-4">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-bg-light border border-border-soft rounded-xl flex items-center justify-center text-text-muted">
                                    <PinIconRose />
                                </div>
                                <h3 className="text-lg font-black text-text-primary tracking-tight">Localização</h3>
                            </div>

                            <div>
                                <label htmlFor="eventLocation" className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 ml-1">Endereço Completo</label>
                                <input
                                    type="text"
                                    id="eventLocation"
                                    value={eventLocation}
                                    onChange={(e) => setEventLocation(e.target.value)}
                                    placeholder="Ex: Villa de Regale, Rua das Palmeiras, 100"
                                    className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary placeholder:text-text-muted"
                                />
                            </div>

                            <div>
                                <label htmlFor="wazeLocation" className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 ml-1">Link Waze/Maps (Opcional)</label>
                                <input
                                    type="text"
                                    id="wazeLocation"
                                    value={wazeLocation}
                                    onChange={(e) => setWazeLocation(e.target.value)}
                                    placeholder="Cole aqui o link compartilhado do GPS"
                                    className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary placeholder:text-text-muted"
                                />
                            </div>
                        </div>

                        {/* Listas de Presentes */}
                        <div className="space-y-6 pt-4">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-bg-light border border-border-soft rounded-xl flex items-center justify-center text-text-muted">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12V8H4v4M2 4h20v4H2zM12 4v16M7 12v8h10v-8" /></svg>
                                    </div>
                                    <h3 className="text-lg font-black text-text-primary tracking-tight">Presentes</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddGiftLink}
                                    className="px-4 py-2 bg-bg-light hover:bg-brand-pale text-[10px] font-black uppercase tracking-widest text-text-muted rounded-xl transition-all border border-border-soft"
                                >
                                    + Adicionar
                                </button>
                            </div>

                            {giftListLinks.length > 0 && (
                                <div className="space-y-4">
                                    {giftListLinks.map((link, index) => (
                                        <div key={index} className="flex flex-col sm:flex-row gap-4 p-5 bg-bg-light rounded-[2rem] border border-border-soft group animate-in slide-in-from-left-4 duration-300">
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    placeholder="Nome da loja"
                                                    value={link.name}
                                                    onChange={(e) => handleUpdateGiftLink(index, 'name', e.target.value)}
                                                    className="w-full px-4 py-2 bg-surface border border-border-soft rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand/20 transition-all outline-none text-text-primary"
                                                />
                                            </div>
                                            <div className="flex-[2]">
                                                <input
                                                    type="url"
                                                    placeholder="Link da lista"
                                                    value={link.url}
                                                    onChange={(e) => handleUpdateGiftLink(index, 'url', e.target.value)}
                                                    className="w-full px-4 py-2 bg-surface border border-border-soft rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand/20 transition-all outline-none text-text-primary"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveGiftLink(index)}
                                                className="self-end sm:self-center p-2 text-text-muted/40 hover:text-danger transition-colors"
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {giftListLinks.length === 0 && (
                                <div className="text-center py-8 bg-bg-light/50 rounded-[2rem] border border-dashed border-border-soft">
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Nenhuma lista adicionada</p>
                                </div>
                            )}
                        </div>

                        {/* Imagem de Capa */}
                        <div className="space-y-6 pt-4">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-bg-light border border-border-soft rounded-xl flex items-center justify-center text-text-muted">
                                    <ImageIconRose />
                                </div>
                                <h3 className="text-lg font-black text-text-primary tracking-tight">Banner de Capa</h3>
                            </div>

                            <div className="flex gap-2 p-1.5 bg-bg-light rounded-2xl w-fit mb-8 border border-border-soft">
                                <button
                                    type="button"
                                    onClick={() => setUploadMethod('upload')}
                                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${uploadMethod === 'upload' ? 'bg-surface text-brand shadow-sm border border-border-soft' : 'text-text-muted hover:text-text-secondary'}`}
                                >
                                    Arquivo
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUploadMethod('url')}
                                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${uploadMethod === 'url' ? 'bg-surface text-brand shadow-sm border border-border-soft' : 'text-text-muted hover:text-text-secondary'}`}
                                >
                                    URL Link
                                </button>
                            </div>

                            {uploadMethod === 'url' ? (
                                <input
                                    type="text"
                                    value={coverImage}
                                    onChange={(e) => handleUrlChange(e.target.value)}
                                    placeholder="https://sua-imagem.com/foto.jpg"
                                    className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary placeholder:text-text-muted"
                                />
                            ) : (
                                <div
                                    className="relative border-4 border-dashed border-border-soft rounded-[2.5rem] p-12 text-center hover:border-brand-light/30 hover:bg-bg-light transition-all cursor-pointer group"
                                    onClick={() => document.getElementById('coverImageFile')?.click()}
                                >
                                    <input
                                        type="file"
                                        id="coverImageFile"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 bg-surface border border-border-soft rounded-2xl flex items-center justify-center text-text-muted/20 shadow-sm group-hover:scale-110 transition-transform">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-text-primary">Escolha uma Foto</p>
                                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-1">JPG ou PNG até 5MB</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {imagePreview && (
                                <div className="mt-8 space-y-6 animate-in fade-in zoom-in-95 duration-500">
                                    <div className="relative rounded-[3rem] overflow-hidden border-8 border-surface shadow-2xl shadow-brand-dark/[0.05] aspect-[16/9] bg-bg-light">
                                        <Image
                                            src={imagePreview}
                                            alt="Preview"
                                            fill
                                            className="transition-all duration-300 pointer-events-none"
                                            style={{
                                                objectFit: 'cover',
                                                objectPosition: `50% ${coverImagePosition}%`,
                                                transform: `scale(${coverImageScale})`
                                            }}
                                        />
                                        <div className="absolute inset-0 border-[1.5rem] border-black/5 pointer-events-none" />
                                        <div className="absolute top-6 right-6 flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => { setTempImage(imagePreview); setShowCropModal(true); }}
                                                className="w-10 h-10 bg-surface/90 backdrop-blur text-brand rounded-2xl flex items-center justify-center hover:bg-brand hover:text-white transition-all shadow-lg border border-border-soft"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setCoverImage('https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop'); setImagePreview(''); }}
                                                className="w-10 h-10 bg-surface/90 backdrop-blur text-danger rounded-2xl flex items-center justify-center hover:bg-danger hover:text-white transition-all shadow-lg border border-border-soft"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-bg-light p-8 rounded-[2.5rem] border border-border-soft space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-text-muted">
                                                <span>Ajuste Vertical</span>
                                                <span className="text-brand">{coverImagePosition}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={coverImagePosition}
                                                onChange={(e) => setCoverImagePosition(parseInt(e.target.value))}
                                                className="w-full h-1.5 bg-border-soft rounded-full appearance-none cursor-pointer accent-brand"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-text-muted">
                                                <span>Nível de Zoom</span>
                                                <span className="text-brand">{coverImageScale.toFixed(1)}x</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="1"
                                                max="3"
                                                step="0.1"
                                                value={coverImageScale}
                                                onChange={(e) => setCoverImageScale(parseFloat(e.target.value))}
                                                className="w-full h-1.5 bg-border-soft rounded-full appearance-none cursor-pointer accent-brand"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mensagem Final */}
                        <div className="pt-4">
                            <label htmlFor="customMessage" className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 ml-1">Mensagem para os Convidados</label>
                            <textarea
                                id="customMessage"
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                rows={4}
                                placeholder="Uma mensagem carinhosa para quem vai acessar seu site..."
                                className="w-full px-5 py-4 bg-bg-light border border-border-soft rounded-[2rem] text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary resize-none placeholder:text-text-muted"
                            />
                        </div>

                        {/* Botão Salvar */}
                        <div className="pt-10">
                            <button
                                type="submit"
                                className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm transition-all shadow-xl flex items-center justify-center gap-3 ${saved ? 'bg-success text-success-dark shadow-success/20 border border-success/30' : 'bg-brand text-white shadow-brand-dark/20 hover:scale-[1.02] active:scale-95'}`}
                            >
                                {saved ? (
                                    <>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>
                                        Configurações Atualizadas!
                                    </>
                                ) : (
                                    <>
                                        <SaveIcon />
                                        Salvar Alterações
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            {/* Crop Modal */}
            {showCropModal && tempImage && (
                <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-surface rounded-[3rem] shadow-2xl max-w-2xl w-full overflow-hidden border border-border-soft animate-in zoom-in-95 duration-500">
                        <div className="p-8 border-b border-border-soft flex items-center justify-between">
                            <h3 className="text-xl font-black text-text-primary tracking-tight">Ajustar Imagem</h3>
                            <button onClick={() => setShowCropModal(false)} className="w-10 h-10 bg-bg-light rounded-2xl flex items-center justify-center text-text-muted hover:bg-brand-pale transition-all border border-border-soft">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-8">
                            <div
                                ref={cropPreviewRef}
                                className="aspect-video relative rounded-[2rem] overflow-hidden bg-bg-light cursor-grab active:cursor-grabbing group shadow-inner border border-border-soft"
                                tabIndex={0}
                                onMouseDown={handleImageMouseDown}
                                onMouseMove={handleImageMouseMove}
                                onMouseUp={handleImageMouseUp}
                                onMouseLeave={handleImageMouseUp}
                                onWheelCapture={handleWheel}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                            >
                                <Image
                                    src={tempImage}
                                    alt="Crop"
                                    fill
                                    className="pointer-events-none select-none"
                                    style={{
                                        objectFit: 'cover',
                                        transform: `translate(${dragOffsetX}px, ${dragOffsetY}px) scale(${cropScale}) rotate(${cropRotation}deg)`
                                    }}
                                />
                                <div className="absolute inset-0 border-[20px] border-black/10 pointer-events-none" />
                                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
                                    {[...Array(8)].map((_, i) => <div key={i} className="border border-white/50" />)}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mt-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Zoom</label>
                                    <input
                                        type="range" min="0.5" max="3" step="0.1"
                                        value={cropScale}
                                        onChange={(e) => setCropScale(parseFloat(e.target.value))}
                                        className="w-full h-1.5 bg-border-soft rounded-full appearance-none cursor-pointer accent-brand"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Giro</label>
                                    <input
                                        type="range" min="0" max="360"
                                        value={cropRotation}
                                        onChange={(e) => setCropRotation(parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-border-soft rounded-full appearance-none cursor-pointer accent-brand"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-bg-light flex gap-4 border-t border-border-soft">
                            <button
                                onClick={() => setShowCropModal(false)}
                                className="flex-1 py-4 bg-surface border border-border-soft text-text-muted text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-brand-pale transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCropConfirm}
                                className="flex-1 py-4 bg-brand text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-brand-dark/20 hover:scale-105 transition-all"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SharedLayout>
    )
}

// Icons
const SaveIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
const InfoIcon = ({ className = "w-4 h-4" }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
const HeartIconOutline = ({ className = "w-5 h-5" }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
const PinIconRose = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
const ImageIconRose = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
