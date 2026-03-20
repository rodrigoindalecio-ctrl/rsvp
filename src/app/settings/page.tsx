'use client'

import { useAuth } from '@/lib/auth-context'
import { useEvent, EventSettings } from '@/lib/event-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef, Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { SharedLayout } from '@/app/components/shared-layout'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api'

const libraries: ("places")[] = ["places"]

export default function SettingsPage() {
    const { user, loading: authLoading, logout } = useAuth()
    const { eventSettings, updateEventSettings } = useEvent()
    const router = useRouter()
    
    if (authLoading || !eventSettings) {
        return <div className="min-h-screen bg-bg-light flex items-center justify-center"><div className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin" /></div>
    }

    // Wrap with Suspense because useSearchParams is used
    return (
        <Suspense fallback={<div className="min-h-screen bg-bg-light flex items-center justify-center"><div className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin" /></div>}>
            <SettingsContent user={user} authLoading={authLoading} eventSettings={eventSettings} updateEventSettings={updateEventSettings} router={router} />
        </Suspense>
    )
}

function SettingsContent({ user, authLoading, eventSettings, updateEventSettings, router }: any) {
    const searchParams = useSearchParams()
    const isOnboarding = searchParams.get('onboarding') === 'true'
    
    // Form states - Initialize from context
    const [eventType, setEventType] = useState<'casamento' | 'debutante'>(eventSettings.eventType)
    const [coupleNames, setCoupleNames] = useState(eventSettings.coupleNames)
    const [slug, setSlug] = useState(eventSettings.slug)
    const [eventDate, setEventDate] = useState(eventSettings.eventDate)
    const [eventTime, setEventTime] = useState(eventSettings.eventTime || '21:00')
    const [confirmationDeadline, setConfirmationDeadline] = useState(eventSettings.confirmationDeadline)
    const [eventLocation, setEventLocation] = useState(eventSettings.eventLocation)
    const [wazeLocation, setWazeLocation] = useState(eventSettings.wazeLocation || '')
    const [giftListLinks, setGiftListLinks] = useState<{ name: string; url: string }[]>(eventSettings.giftListLinks || [])
    const [coverImage, setCoverImage] = useState(eventSettings.coverImage)
    const [coverImagePosition, setCoverImagePosition] = useState(eventSettings.coverImagePosition || 50)
    const [coverImageScale, setCoverImageScale] = useState(eventSettings.coverImageScale || 1)
    const [customMessage, setCustomMessage] = useState(eventSettings.customMessage)
    const [notifyOwnerOnRSVP, setNotifyOwnerOnRSVP] = useState(eventSettings.notifyOwnerOnRSVP ?? true)
    const [carouselImages, setCarouselImages] = useState<string[]>(eventSettings.carouselImages || [])
    const [galleryImages, setGalleryImages] = useState<string[]>(eventSettings.galleryImages || [])
    const [coupleStory, setCoupleStory] = useState(eventSettings.coupleStory || '')
    const [coupleStoryTitle, setCoupleStoryTitle] = useState(eventSettings.coupleStoryTitle || 'Como Tudo Começou')
    const [emailConfirmationTitle, setEmailConfirmationTitle] = useState(eventSettings.emailConfirmationTitle || 'Confirmação de Presença')
    const [emailConfirmationGreeting, setEmailConfirmationGreeting] = useState(eventSettings.emailConfirmationGreeting || 'Ficamos muito felizes com a sua confirmação! 🎉 Sua presença é o que tornará este dia verdadeiramente especial para nós.')
    const [timelineEvents, setTimelineEvents] = useState(eventSettings.timelineEvents || [])
    const [dressCode, setDressCode] = useState(eventSettings.dressCode || '')
    const [parkingSettings, setParkingSettings] = useState<NonNullable<EventSettings['parkingSettings']>>({
        hasParking: eventSettings.parkingSettings?.hasParking ?? false,
        type: eventSettings.parkingSettings?.type ?? 'free',
        price: eventSettings.parkingSettings?.price ?? '',
        address: eventSettings.parkingSettings?.address ?? '',
        receptionOnly: eventSettings.parkingSettings?.receptionOnly ?? false
    })
    const [brandColor, setBrandColor] = useState(eventSettings.brandColor || '#7b2d3d')
    const [brandFont, setBrandFont] = useState(eventSettings.brandFont || 'lora')
    const [hasSeparateCeremony, setHasSeparateCeremony] = useState(eventSettings.hasSeparateCeremony ?? false)
    const [ceremonyLocation, setCeremonyLocation] = useState(eventSettings.ceremonyLocation || '')
    const [ceremonyAddress, setCeremonyAddress] = useState(eventSettings.ceremonyAddress || '')
    const [ceremonyWazeLocation, setCeremonyWazeLocation] = useState(eventSettings.ceremonyWazeLocation || '')
    const [ceremonyTime, setCeremonyTime] = useState(eventSettings.ceremonyTime || '19:00')
    const [isGiftListEnabled, setIsGiftListEnabled] = useState(eventSettings.isGiftListEnabled ?? true)
    const [eventAddress, setEventAddress] = useState(eventSettings.eventAddress || '')

    const [activeTab, setActiveTab] = useState<'geral' | 'visual' | 'conteudo' | 'seguranca'>('geral')
    const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })
    const [passwordLoading, setPasswordLoading] = useState(false)

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
    const [cropTarget, setCropTarget] = useState<{ type: 'cover' | 'timeline' | 'gallery' | 'carousel' | 'logo', index?: number } | null>(null)
    const [cropQueue, setCropQueue] = useState<{ src: string, type: any, index?: number }[]>([])
    const [touchDistance, setTouchDistance] = useState(0)
    const [touchStartRotation, setTouchStartRotation] = useState(0)
    const cropPreviewRef = useRef<HTMLDivElement>(null)
    
    // Autocomplete Refs
    const ceremonyAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
    const receptionAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
    const parkingAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '',
        libraries: libraries
    })

    const onCeremonyPlaceChanged = () => {
        if (ceremonyAutocompleteRef.current) {
            const place = ceremonyAutocompleteRef.current.getPlace()
            if (place.formatted_address) {
                setCeremonyLocation(place.name || place.formatted_address)
                setCeremonyAddress(place.formatted_address)
                if (place.url) setCeremonyWazeLocation(place.url)
            }
        }
    }

    const onReceptionPlaceChanged = () => {
        if (receptionAutocompleteRef.current) {
            const place = receptionAutocompleteRef.current.getPlace()
            if (place.formatted_address) {
                setEventLocation(place.name || place.formatted_address)
                setEventAddress(place.formatted_address)
                if (place.url) setWazeLocation(place.url)
            }
        }
    }

    const onParkingPlaceChanged = () => {
        if (parkingAutocompleteRef.current) {
            const place = parkingAutocompleteRef.current.getPlace()
            if (place.formatted_address) {
                setParkingSettings({
                    ...parkingSettings,
                    address: place.name || place.formatted_address,
                    wazeLocation: place.url || undefined
                })
            }
        }
    }

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
        const cleanSlug = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
        setSlug(cleanSlug)
        setSlugEdited(true)
    }

    const handleEventDateChange = (newDate: string) => {
        setEventDate(newDate)
        if (newDate) {
            // Cálculo robusto de data (7 dias antes)
            const [year, month, day] = newDate.split('-').map(Number)
            const date = new Date(year, month - 1, day)
            date.setDate(date.getDate() - 7)
            
            // Formatar YYYY-MM-DD
            const y = date.getFullYear()
            const m = String(date.getMonth() + 1).padStart(2, '0')
            const d = String(date.getDate()).padStart(2, '0')
            setConfirmationDeadline(`${y}-${m}-${d}`)
        }
    }

    const handleImageMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true)
        setDragStartX(e.clientX - dragOffsetX)
        setDragStartY(e.clientY - dragOffsetY)
    }

    const handleImageMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging || !cropPreviewRef.current) return
        const rect = cropPreviewRef.current.getBoundingClientRect()
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
        
        let newX = clientX - dragStartX
        let newY = clientY - dragStartY

        // Bounds clamping logic (prevention of black bars)
        const maxOffsetX = (rect.width * (cropScale - 1)) / 2
        const maxOffsetY = (rect.height * (cropScale - 1)) / 2
        
        newX = Math.max(-maxOffsetX, Math.min(maxOffsetX, newX))
        newY = Math.max(-maxOffsetY, Math.min(maxOffsetY, newY))

        setDragOffsetX(newX)
        setDragOffsetY(newY)
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
            setDragStartX(e.touches[0].clientX - dragOffsetX)
            setDragStartY(e.touches[0].clientY - dragOffsetY)
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
            handleImageMouseMove(e)
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
            toast.info('Processando foto...', {
                description: 'Isso pode demorar um pouco se o arquivo for muito pesado.'
            })
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            const base64String = reader.result as string
            setTempImage(base64String)
            setCropTarget({ type: 'cover' })
            setShowCropModal(true)
            setCropScale(1.1) // Start with a bit of zoom to hide edges
            setCropRotation(0)
            setDragOffsetX(0)
            setDragOffsetY(0)
        }
        reader.readAsDataURL(file)
    }

    const handleCropConfirm = async () => {
        if (!tempImage || !cropPreviewRef.current) return

        try {
            // Real pixel crop using Canvas
            const img = new (window as any).Image()
            img.src = tempImage
            await new Promise((resolve) => img.onload = resolve)

            const canvas = document.createElement('canvas')
            const rect = cropPreviewRef.current.getBoundingClientRect()
            
            // Set output size based on aspect ratio
            const isSquare = cropTarget?.type === 'timeline' || cropTarget?.type === 'gallery'
            const isCarousel = cropTarget?.type === 'carousel'
            
            canvas.width = isSquare ? 1000 : 1200
            canvas.height = isSquare ? 1000 : 675 
             // Se for carrossel, forçamos o aspect ratio horizontal no modal (ajustando a visualização)
            const targetAspect = isSquare ? 1 : 1200/675            
            const ctx = canvas.getContext('2d')
            if (!ctx) return

            // Transparent background
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            
            // Calculate total transformations
            const scaleFactor = canvas.width / rect.width
            
            // Apply transformations
            ctx.save()
            ctx.translate(canvas.width / 2, canvas.height / 2)
            ctx.rotate((cropRotation * Math.PI) / 180)
            
            // Map drag offsets to canvas coordinates
            const tx = dragOffsetX * scaleFactor
            const ty = dragOffsetY * scaleFactor
            ctx.translate(tx, ty)
            ctx.scale(cropScale, cropScale)
            
            // Final draw dimensions
            const imgAspect = img.width / img.height
            const canvasAspect = canvas.width / canvas.height
            let drawW, drawH
            if (imgAspect > canvasAspect) {
                drawH = canvas.height
                drawW = canvas.height * imgAspect
            } else {
                drawW = canvas.width
                drawH = canvas.width / imgAspect
            }

            ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
            ctx.restore()

            const croppedBase64 = canvas.toDataURL('image/jpeg', 0.85)

            // Apply to target
            if (cropTarget?.type === 'cover') {
                setCoverImage(croppedBase64)
                setImagePreview(croppedBase64)
            } else if (cropTarget?.type === 'timeline' && cropTarget.index !== undefined) {
                handleUpdateTimelineEvent(cropTarget.index, 'image', croppedBase64)
            } else if (cropTarget?.type === 'gallery') {
                if (cropTarget.index !== undefined && cropTarget.index < galleryImages.length) {
                    handleUpdateGalleryImage(cropTarget.index, croppedBase64)
                } else {
                    handleAddGalleryImage(croppedBase64)
                }
            } else if (cropTarget?.type === 'carousel') {
                if (cropTarget.index !== undefined && cropTarget.index < carouselImages.length) {
                    handleUpdateCarouselImage(cropTarget.index, croppedBase64)
                } else {
                    handleAddCarouselImage(croppedBase64)
                }
            }

            setShowCropModal(false)
            setTempImage('')
            setCropTarget(null)

            // Process next in queue if exists
            if (cropQueue.length > 0) {
                const [next, ...remaining] = cropQueue
                setCropQueue(remaining)
                
                // Add a small delay for the modal animation
                setTimeout(() => {
                    setTempImage(next.src)
                    setCropTarget({ type: next.type, index: next.index })
                    setShowCropModal(true)
                    setCropScale(1.1)
                    setCropRotation(0)
                    setDragOffsetX(0)
                    setDragOffsetY(0)
                }, 300)
            }
        } catch (error) {
            console.error('Erro no crop:', error)
            toast.error('Erro ao processar imagem')
        }
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

    const handleAddCarouselImage = (src: string = '') => {
        setCarouselImages(prev => [...prev, src])
    }

    const handleRemoveCarouselImage = (index: number) => {
        setCarouselImages(prev => prev.filter((_, i) => i !== index))
    }

    const handleUpdateCarouselImage = (index: number, value: string) => {
        setCarouselImages(prev => {
            const newImages = [...prev]
            newImages[index] = value
            return newImages
        })
    }

    // Gallery Handlers
    const handleAddGalleryImage = (src: string = '') => {
        setGalleryImages(prev => [...prev, src])
    }
    const handleRemoveGalleryImage = (index: number) => setGalleryImages(prev => prev.filter((_, i) => i !== index))
    const handleUpdateGalleryImage = (index: number, value: string) => {
        setGalleryImages(prev => {
            const newImages = [...prev]
            newImages[index] = value
            return newImages
        })
    }

    // Timeline Handlers
    const handleAddTimelineEvent = () => setTimelineEvents(prev => [...prev, { emoji: '✨', title: '', description: '', image: '' }])
    const handleRemoveTimelineEvent = (index: number) => setTimelineEvents(prev => prev.filter((_: any, i: number) => i !== index))
    const handleUpdateTimelineEvent = (index: number, field: string, value: string) => {
        setTimelineEvents(prev => {
            const updated = [...prev]
            updated[index] = { ...updated[index], [field]: value }
            return updated
        })
    }

    // --- Dirty State Tracking ---
    const isDirty = useMemo(() => {
        if (!eventSettings) return false;
        
        const current: any = {
            eventType, coupleNames, slug, eventDate, eventTime, 
            confirmationDeadline, eventLocation, wazeLocation, 
            giftListLinks, coverImage, coverImagePosition, 
            coverImageScale, customMessage, notifyOwnerOnRSVP,
            carouselImages, galleryImages, coupleStory, coupleStoryTitle,
            emailConfirmationTitle, emailConfirmationGreeting,
            timelineEvents, dressCode, parkingSettings,
            brandColor, brandFont, isGiftListEnabled,
            ceremonyAddress, eventAddress, hasSeparateCeremony,
            ceremonyWazeLocation, ceremonyTime, ceremonyLocation
        };

        // Comparamos campo a campo apenas os campos que o formulário controla
        for (const key of Object.keys(current)) {
            let valInitial = (eventSettings as any)[key];
            let valCurrent = current[key];

            // Normalização de valores padrão para comparação justa
            if (valInitial === undefined || valInitial === null) {
                if (key === 'eventTime') valInitial = '21:00';
                else if (key === 'notifyOwnerOnRSVP') valInitial = true;
                else if (key === 'isGiftListEnabled') valInitial = true;
                else if (key === 'coverImagePosition') valInitial = 50;
                else if (key === 'coverImageScale') valInitial = 1;
                else if (key === 'brandColor') valInitial = '#7b2d3d';
                else if (key === 'brandFont') valInitial = 'lora';
                else if (key === 'parkingSettings') valInitial = { hasParking: false, type: 'free', price: '', address: '', receptionOnly: false };
                else if (key === 'hasSeparateCeremony') valInitial = false;
                else if (key === 'ceremonyTime') valInitial = '19:00';
                else if (Array.isArray(valCurrent)) valInitial = [];
                else if (typeof valCurrent === 'string') valInitial = '';
                else if (typeof valCurrent === 'boolean') valInitial = false;
            }

            // Comparação profunda via stringify para objetos/arrays
            if (JSON.stringify(valInitial) !== JSON.stringify(valCurrent)) {
                return true;
            }
        }
        
        return false;
    }, [
        eventType, coupleNames, slug, eventDate, eventTime, 
        confirmationDeadline, eventLocation, wazeLocation, 
        giftListLinks, coverImage, coverImagePosition, 
        coverImageScale, customMessage, notifyOwnerOnRSVP,
        carouselImages, galleryImages, coupleStory, 
        timelineEvents, dressCode, parkingSettings,
        brandColor, brandFont, isGiftListEnabled,
        ceremonyAddress, eventAddress, hasSeparateCeremony,
        ceremonyWazeLocation, ceremonyTime, ceremonyLocation,
        eventSettings
    ]);

    // Warn before leaving
    useEffect(() => {
        if (!isDirty) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };

        const handleAnchorClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest('a');
            
            if (anchor && anchor.href && !anchor.href.startsWith('javascript:') && !anchor.href.startsWith('#')) {
                try {
                    const url = new URL(anchor.href);
                    if (url.origin === window.location.origin && url.pathname !== window.location.pathname) {
                        if (!window.confirm('Você tem alterações não salvas. Deseja realmente sair sem salvar?')) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    }
                } catch (e) {
                    // Ignorar erros de URL
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('click', handleAnchorClick, true);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('click', handleAnchorClick, true);
        };
    }, [isDirty]);

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        try {
            await updateEventSettings({
                eventType,
                coupleNames,
                slug,
                eventDate,
                eventTime,
                confirmationDeadline,
                eventLocation,
                wazeLocation,
                hasSeparateCeremony,
                ceremonyLocation,
                ceremonyWazeLocation,
                ceremonyTime,
                giftListLinks,
                coverImage,
                coverImagePosition,
                coverImageScale,
                customMessage,
                notifyOwnerOnRSVP,
                carouselImages,
                galleryImages,
                coupleStory,
                coupleStoryTitle,
                emailConfirmationTitle,
                emailConfirmationGreeting,
                timelineEvents,
                dressCode,
                parkingSettings,
                ceremonyAddress,
                eventAddress,
                brandColor,
                brandFont,
                isGiftListEnabled
            })
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
            toast.success('Configurações salvas com sucesso! ✨')
            return true
        } catch (error: any) {
            console.error('Erro ao salvar:', error)
            toast.error('Erro ao salvar alterações', {
                description: error.message?.includes('events_slug_key') || error.message?.includes('duplicate key')
                    ? 'Este subdomínio (URL) já está em uso por outro evento. Escolha um diferente.'
                    : 'Não foi possível salvar os dados. Tente novamente.'
            })
            return false
        }
    }

    return (
        <SharedLayout
            role="user"
            title={eventSettings.coupleNames}
            subtitle="Configurações do Evento"
            onSave={handleSave}
            onBeforeNavigate={(href) => {
                if (isDirty && href !== '/settings' && !href.includes('onboarding=true')) {
                    return 'confirm_needed';
                }
                return true;
            }}
        >
            <main className="max-w-[800px] mx-auto w-full animate-in fade-in duration-500 pb-20">
                    {/* ONBOARDING BANNER */}
                    {isOnboarding && (
                        <div className="bg-brand-pale border border-brand/20 rounded-[2rem] p-6 mb-10 shadow-sm animate-in slide-in-from-top-4 duration-500 relative group">
                            <button 
                                onClick={() => router.replace('/settings')}
                                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-brand/30 hover:text-brand transition-all hover:bg-white rounded-xl"
                                title="Fechar aviso"
                            >
                                <XIcon className="w-4 h-4" />
                            </button>
                            <div className="flex gap-4 pr-8">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand flex-shrink-0 shadow-sm">
                                    <StarIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-brand tracking-tight mb-1">Quase lá! ✨</h3>
                                    <p className="text-xs font-bold text-text-primary leading-relaxed">
                                        Para começar com o pé direito, preencha os dados básicos do seu evento abaixo (como a data, o local e as fotos) para o seu site ficar completo! ✨
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
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

                    {/* Tabs */}
                    <div className="flex flex-wrap gap-2 mb-8 bg-bg-light p-1.5 rounded-2xl border border-border-soft">
                        {[
                            { id: 'geral', label: 'Geral', icon: '📝' },
                            { id: 'visual', label: 'Aparência', icon: '🎨' },
                            { id: 'conteudo', label: 'Conteúdo', icon: '✨' },
                            { id: 'seguranca', label: 'Segurança', icon: '🛡️' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-brand shadow-sm border border-border-soft' : 'text-text-muted hover:text-text-primary hover:bg-white/50'}`}
                            >
                                <span className="text-base">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSave} className="relative">
                        {/* Tipo de Evento */}
                        <div className={activeTab === 'geral' ? 'grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300' : 'hidden'}>
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
                        <div className={activeTab === 'geral' ? 'p-6 bg-bg-light rounded-[2rem] border border-border-soft flex items-center justify-between group hover:border-brand/20 transition-all animate-in fade-in duration-300' : 'hidden'}>
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

                        {/* Cor do Tema */}
                        <div className={activeTab === 'visual' ? 'space-y-4 animate-in fade-in duration-300' : 'hidden'}>
                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 ml-1">Cor Principal do Site</label>
                            <div className="flex flex-wrap gap-4 items-center p-6 bg-bg-light rounded-[2rem] border border-border-soft">
                                {[
                                    '#8B2D4F', // Vinho Original
                                    '#1e293b', // Slate
                                    '#1e40af', // Blue
                                    '#065f46', // Emerald
                                    '#92400e', // Amber
                                    '#c026d3', // Fuchsia
                                ].map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setBrandColor(color)}
                                        className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${brandColor === color ? 'border-brand scale-110 shadow-lg' : 'border-white shadow-sm'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                                <div className="h-8 w-px bg-border-soft mx-2" />
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={brandColor}
                                        onChange={(e) => setBrandColor(e.target.value)}
                                        className="w-10 h-10 rounded-xl bg-white border border-border-soft overflow-hidden cursor-pointer"
                                    />
                                    <span className="text-[10px] font-black font-mono text-text-muted uppercase tracking-widest">{brandColor}</span>
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.05em] ml-1 opacity-70">
                                Dica: Escolha a cor predominante da sua identidade visual ou decoração.
                            </p>
                        </div>

                        {/* Fonte Principal */}
                        <div className={activeTab === 'visual' ? 'space-y-4 animate-in fade-in duration-300' : 'hidden'}>
                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 ml-1">Estilo de Fonte Principal</label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                {[
                                    { id: 'lora', label: 'Clássica', sample: 'Aa', fontStyle: 'var(--font-lora)' },
                                    { id: 'playfair', label: 'Elegante', sample: 'Aa', fontStyle: 'var(--font-playfair)' },
                                    { id: 'inter', label: 'Moderna', sample: 'Aa', fontStyle: 'var(--font-inter)' },
                                    { id: 'outfit', label: 'Descontraída', sample: 'Aa', fontStyle: 'var(--font-outfit)' },
                                    { id: 'great-vibes', label: 'Caligrafia', sample: 'Aa', fontStyle: 'var(--font-great-vibes)' },
                                ].map((font) => (
                                    <button
                                        key={font.id}
                                        type="button"
                                        onClick={() => setBrandFont(font.id)}
                                        className={`p-4 rounded-[1.5rem] border bg-bg-light transition-all flex flex-col items-center gap-2 ${brandFont === font.id ? 'border-brand bg-brand-pale/30 shadow-sm' : 'border-border-soft hover:border-brand/30'}`}
                                    >
                                        <span className="text-2xl text-text-primary" style={{ fontFamily: font.fontStyle }}>{font.sample}</span>
                                        <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">{font.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Slug (URL) */}
                        <div className={activeTab === 'geral' ? 'animate-in fade-in duration-300' : 'hidden'}>
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
                        <div className={activeTab === 'geral' ? 'grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300' : 'hidden'}>
                            <div>
                                <label htmlFor="eventDate" className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 ml-1">Data do Evento</label>
                                <input
                                    type="date"
                                    id="eventDate"
                                    value={eventDate}
                                    onChange={(e) => handleEventDateChange(e.target.value)}
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
                                 <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-3 ml-1 leading-relaxed opacity-60">
                                     💡 Recomendamos definir o horário do convite com pelo menos 30 minutos de antecedência ao início real da cerimônia. Isso garante que todos os convidados já estejam acomodados quando a celebração começar!
                                 </p>
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

                        {/* Traje */}
                        <div className={activeTab === 'conteudo' ? 'pt-4 animate-in fade-in duration-300' : 'hidden'}>
                            <label htmlFor="dressCode" className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 ml-1">Sugestão de Traje (Dress Code)</label>
                            <input
                                type="text"
                                id="dressCode"
                                value={dressCode}
                                onChange={(e) => setDressCode(e.target.value)}
                                placeholder="Ex: Esporte Fino, Gala, Passeio Completo..."
                                className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary placeholder:text-text-muted"
                            />
                        </div>

                        {/* Localização */}
                        <div className={activeTab === 'geral' ? 'space-y-6 pt-4 animate-in fade-in duration-300' : 'hidden'}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-bg-light border border-border-soft rounded-xl flex items-center justify-center text-text-muted">
                                    <PinIconRose />
                                </div>
                                <h3 className="text-lg font-black text-text-primary tracking-tight">Localização</h3>
                            </div>

                            {/* Toggle de Cerimônia em local separado */}
                            <div className="p-6 bg-brand-pale/10 rounded-3xl border border-brand-pale/30 space-y-4 mb-8">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white border border-brand/10 rounded-lg flex items-center justify-center text-brand">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 10a2 2 0 1 0-4 0a2 2 0 1 0 4 0Z" /><path d="M12 10v4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m19.07 4.93-1.41 1.41" /><path d="m6.34 17.66-1.41 1.41" /></svg>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-text-primary uppercase tracking-widest">Locais Diferentes?</span>
                                            <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Cerimônia e Recepção em lugares distintos</span>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={hasSeparateCeremony}
                                            onChange={(e) => setHasSeparateCeremony(e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-border-soft peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                                    </label>
                                </div>
                            </div>

                            {hasSeparateCeremony && (
                                <div className="space-y-6 pb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-brand px-2 py-1 bg-brand-pale rounded-md">Parte 1</span>
                                        <h4 className="text-[11px] font-black uppercase tracking-widest text-text-primary">Dados da Cerimônia</h4>
                                    </div>

                                    <div>
                                        <label htmlFor="ceremonyLocation" className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 ml-1">Local da Cerimônia</label>
                                        {isLoaded ? (
                                            <Autocomplete
                                                onLoad={(autocomplete) => (ceremonyAutocompleteRef.current = autocomplete)}
                                                onPlaceChanged={onCeremonyPlaceChanged}
                                            >
                                                <input
                                                    type="text"
                                                    id="ceremonyLocation"
                                                    value={ceremonyLocation}
                                                    onChange={(e) => setCeremonyLocation(e.target.value)}
                                                    placeholder="Ex: Igreja Matriz, Capela São Pedro..."
                                                    className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary placeholder:text-text-muted"
                                                />
                                            </Autocomplete>
                                        ) : (
                                            <input
                                                type="text"
                                                id="ceremonyLocation"
                                                value={ceremonyLocation}
                                                onChange={(e) => setCeremonyLocation(e.target.value)}
                                                placeholder="Ex: Igreja Matriz, Capela São Pedro..."
                                                className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary placeholder:text-text-muted"
                                            />
                                        )}
                                    </div>

                                    {(ceremonyAddress || eventSettings.ceremonyAddress) && (
                                        <div className="bg-bg-light/50 border border-border-soft p-4 rounded-2xl animate-in fade-in slide-in-from-top-2">
                                            <label className="block text-[8px] font-black text-text-muted uppercase tracking-widest mb-1.5 ml-1">Endereço Completo (Preenchido Automaticamente)</label>
                                            <p className="text-[11px] font-bold text-text-primary px-1">{ceremonyAddress || eventSettings.ceremonyAddress}</p>
                                        </div>
                                    )}

                                    <div>
                                        <label htmlFor="ceremonyWaze" className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 ml-1">Link do Google Maps da Cerimônia</label>
                                        <input
                                            type="text"
                                            id="ceremonyWaze"
                                            value={ceremonyWazeLocation}
                                            onChange={(e) => setCeremonyWazeLocation(e.target.value)}
                                            placeholder="Link compartilhado do Google Maps ou Waze"
                                            className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary placeholder:text-text-muted"
                                        />
                                    </div>

                                    <div className="w-full h-px bg-border-soft my-8" />
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-brand px-2 py-1 bg-brand-pale rounded-md">Parte 2</span>
                                        <h4 className="text-[11px] font-black uppercase tracking-widest text-text-primary">Dados da Recepção / Festa</h4>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label htmlFor="eventLocation" className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 ml-1">
                                    {hasSeparateCeremony ? 'Local da Recepção (Buffet/Festa)' : 'Endereço Completo da Festa'}
                                </label>
                                {isLoaded ? (
                                    <Autocomplete
                                        onLoad={(autocomplete) => (receptionAutocompleteRef.current = autocomplete)}
                                        onPlaceChanged={onReceptionPlaceChanged}
                                    >
                                        <input
                                            type="text"
                                            id="eventLocation"
                                            value={eventLocation}
                                            onChange={(e) => setEventLocation(e.target.value)}
                                            placeholder="Ex: Mansão Victoria, Buffet Ravena..."
                                            className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary placeholder:text-text-muted"
                                        />
                                    </Autocomplete>
                                ) : (
                                    <input
                                        type="text"
                                        id="eventLocation"
                                        value={eventLocation}
                                        onChange={(e) => setEventLocation(e.target.value)}
                                        placeholder="Ex: Mansão Victoria, Buffet Ravena..."
                                        className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary placeholder:text-text-muted"
                                    />
                                )}
                            </div>

                            {(eventAddress || eventSettings.eventAddress) && (
                                <div className="bg-bg-light/50 border border-border-soft p-4 rounded-2xl animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-[8px] font-black text-text-muted uppercase tracking-widest mb-1.5 ml-1">Endereço Completo (Preenchido Automaticamente)</label>
                                    <p className="text-[11px] font-bold text-text-primary px-1">{eventAddress || eventSettings.eventAddress}</p>
                                </div>
                            )}

                            <div>
                                <label htmlFor="wazeLocation" className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 ml-1">Link do Google Maps {hasSeparateCeremony ? 'da Recepção' : '(Opcional)'}</label>
                                <input
                                    type="text"
                                    id="wazeLocation"
                                    value={wazeLocation}
                                    onChange={(e) => setWazeLocation(e.target.value)}
                                    placeholder="Cole aqui o link compartilhado do GPS"
                                    className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary placeholder:text-text-muted"
                                />
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-3 ml-1 leading-relaxed opacity-60">
                                    💡 Útil quando o local é difícil de encontrar apenas pelo endereço (ex: fazendas, sítios ou novos loteamentos).
                                </p>
                            </div>

                            {/* Informações de Estacionamento */}
                            <div className="p-6 bg-bg-light/30 rounded-3xl border border-border-soft space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white border border-border-soft rounded-lg flex items-center justify-center text-brand">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></svg>
                                        </div>
                                        <span className="text-xs font-black text-text-primary uppercase tracking-widest">Informações de Estacionamento</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={parkingSettings.hasParking}
                                            onChange={(e) => setParkingSettings({ ...parkingSettings, hasParking: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-border-soft peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                                    </label>
                                </div>

                                {parkingSettings.hasParking && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="p-4 bg-brand-pale/20 border border-brand-pale/50 rounded-2xl">
                                            <p className="text-[10px] font-bold text-brand uppercase tracking-widest leading-relaxed">
                                                💡 Esta configuração de estacionamento será apresentada como referente ao local da Recepção/Festa.
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[9px] font-black text-text-muted uppercase tracking-widest mb-2 ml-1">Tipo de Estacionamento</label>
                                                <select
                                                    value={parkingSettings.type}
                                                    onChange={(e) => setParkingSettings({ ...parkingSettings, type: e.target.value as any })}
                                                    className="w-full px-4 py-3 bg-white border border-border-soft rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand/20 transition-all outline-none"
                                                >
                                                    <option value="free">Gratuito no Local</option>
                                                    <option value="valet">Valet / Estacionamento no Local (Pago)</option>
                                                    <option value="suggestion">Estacionamentos Próximos (Sugestão)</option>
                                                </select>
                                            </div>
                                            {(parkingSettings.type === 'valet' || parkingSettings.type === 'suggestion') && (
                                                <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                                                    <label className="block text-[9px] font-black text-text-muted uppercase tracking-widest mb-2 ml-1">Valor Aproximado (Opcional)</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Ex: R$ 30,00"
                                                        value={parkingSettings.price}
                                                        onChange={(e) => setParkingSettings({ ...parkingSettings, price: e.target.value })}
                                                        className="w-full px-4 py-3 bg-white border border-border-soft rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand/20 transition-all outline-none"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        {parkingSettings.type === 'suggestion' && (
                                            <div className="animate-in fade-in slide-in-from-top-1">
                                                <label className="block text-[9px] font-black text-text-muted uppercase tracking-widest mb-2 ml-1">
                                                    Endereço/Nome do Estacionamento sugerido
                                                </label>
                                                {isLoaded ? (
                                                    <Autocomplete
                                                        onLoad={(autocomplete) => (parkingAutocompleteRef.current = autocomplete)}
                                                        onPlaceChanged={onParkingPlaceChanged}
                                                    >
                                                        <input
                                                            type="text"
                                                            placeholder="Ex: Estacionamento 24h, Rua lateral..."
                                                            value={parkingSettings.address}
                                                            onChange={(e) => setParkingSettings({ ...parkingSettings, address: e.target.value })}
                                                            className="w-full px-4 py-3 bg-white border border-border-soft rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand/20 transition-all outline-none"
                                                        />
                                                    </Autocomplete>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        placeholder="Ex: Estacionamento 24h, Rua lateral..."
                                                        value={parkingSettings.address}
                                                        onChange={(e) => setParkingSettings({ ...parkingSettings, address: e.target.value })}
                                                        className="w-full px-4 py-3 bg-white border border-border-soft rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand/20 transition-all outline-none"
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Listas de Presentes */}
                        <div className={activeTab === 'conteudo' ? 'space-y-6 pt-4 animate-in fade-in duration-300' : 'hidden'}>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-bg-light border border-border-soft rounded-xl flex items-center justify-center text-text-muted">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12V8H4v4M2 4h20v4H2zM12 4v16M7 12v8h10v-8" /></svg>
                                    </div>
                                    <h3 className="text-lg font-black text-text-primary tracking-tight">Listas de Presentes Externas</h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsGiftListEnabled(!isGiftListEnabled)}
                                        className={`w-14 h-8 rounded-full relative transition-all duration-300 ${isGiftListEnabled ? 'bg-brand' : 'bg-border-soft'}`}
                                    >
                                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${isGiftListEnabled ? 'left-7' : 'left-1'}`} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleAddGiftLink}
                                        className="px-4 py-2 bg-bg-light hover:bg-brand-pale text-[10px] font-black uppercase tracking-widest text-text-muted rounded-xl transition-all border border-border-soft"
                                    >
                                        + Adicionar Loja
                                    </button>
                                </div>
                            </div>

                            <div className={`p-4 rounded-2xl border mb-6 transition-all ${isGiftListEnabled ? 'bg-brand-pale/20 border-brand-pale/50' : 'bg-bg-light border-border-soft opacity-60'}`}>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-primary mb-1">
                                    {isGiftListEnabled ? '✨ Módulo Ativo' : '⚪ Módulo Desativado'}
                                </p>
                                <p className="text-[10px] font-bold text-text-muted leading-relaxed">
                                    {isGiftListEnabled
                                        ? 'A lista de presentes está visível no seu site para todos os convidados.'
                                        : 'A lista de presentes está oculta do site. Útil para testes ou se vocês não quiserem exibir agora.'}
                                </p>
                            </div>

                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-relaxed opacity-80">
                                Adicione as lojas onde vocês já possuem listas criadas (ex: Amazon, Magalu, Camicado).<br />
                                Estes botões aparecerão na página <strong className="text-brand">"Lista de Presentes"</strong> do seu site.
                            </p>

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
                                                    type="text"
                                                    placeholder="Link da lista (ex: www.camicado.com.br)"
                                                    value={link.url}
                                                    onChange={(e) => handleUpdateGiftLink(index, 'url', e.target.value)}
                                                    onBlur={(e) => {
                                                        const val = e.target.value.trim();
                                                        if (val && !/^https?:\/\//i.test(val)) {
                                                            handleUpdateGiftLink(index, 'url', `https://${val}`);
                                                        }
                                                    }}
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
                        <div className={activeTab === 'visual' ? 'space-y-6 pt-4 animate-in fade-in duration-300' : 'hidden'}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-bg-light border border-border-soft rounded-xl flex items-center justify-center text-text-muted">
                                    <ImageIconRose />
                                </div>
                                <h3 className="text-lg font-black text-text-primary tracking-tight">Banner de Capa</h3>
                            </div>

                            {!imagePreview && (
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
                            )}

                            {!imagePreview && (
                                uploadMethod === 'url' ? (
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
                                                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-4">Escolha uma Foto</p>
                                                <p className="text-[8px] font-bold text-text-muted opacity-40 uppercase tracking-widest mt-1">Otimizada Automaticamente</p>
                                            </div>
                                        </div>
                                    </div>
                                )
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

                            {/* Os sliders de ajuste foram removidos daqui pois agora estão dentro do Modal de Edição (botão Lápis) */}
                                </div>
                            )}
                        </div>

                        {/* Galeria de Fotos */}
                        <div className={activeTab === 'conteudo' ? 'space-y-6 pt-4 animate-in fade-in duration-300' : 'hidden'}>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-bg-light border border-border-soft rounded-xl flex items-center justify-center text-text-muted">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
                                    </div>
                                    <h3 className="text-lg font-black text-text-primary tracking-tight">Galeria de Fotos (Grid)</h3>
                                </div>
                            </div>

                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4 leading-relaxed">
                                Estas fotos aparecerão no meio do site em um grid elegante.<br />Sua seleção será otimizada automaticamente.
                            </p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {galleryImages.map((src, index) => (
                                    <div key={index} className="aspect-[3/4] relative rounded-2xl overflow-hidden border border-border-soft animate-in zoom-in-95 duration-200 bg-bg-light shadow-sm">
                                        <img src={src || '/placeholder-broken.png'} alt="" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveGalleryImage(index);
                                            }}
                                            className="absolute top-2 right-2 w-7 h-7 bg-danger text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-xl z-20 border-2 border-white"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M18 6 6 18M6 6l12 12" /></svg>
                                        </button>
                                        <div className="absolute inset-0 bg-black/5 pointer-events-none" />
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => document.getElementById('gallery-bulk-upload')?.click()}
                                    className="aspect-[3/4] flex flex-col items-center justify-center gap-2 bg-bg-light border-2 border-dashed border-border-soft rounded-2xl hover:bg-brand-pale/50 hover:border-brand/40 transition-all group active:scale-95"
                                >
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-text-muted group-hover:bg-brand group-hover:text-white transition-all shadow-sm group-hover:shadow-md">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted group-hover:text-brand">Adicionar Foto</span>
                                </button>
                                <input
                                    type="file"
                                    id="gallery-bulk-upload"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files || [])
                                        if (files.length > 0) {
                                            const processFiles = async () => {
                                                const newQueue: { src: string, type: any, index?: number }[] = []
                                                for (let i = 0; i < files.length; i++) {
                                                    const reader = new FileReader()
                                                    const result = await new Promise<string>((resolve) => {
                                                        reader.onloadend = () => resolve(reader.result as string)
                                                        reader.readAsDataURL(files[i])
                                                    })
                                                    if (i === 0) {
                                                        setTempImage(result)
                                                        setCropTarget({ type: 'gallery', index: galleryImages.length })
                                                        setShowCropModal(true)
                                                        setCropScale(1.1)
                                                        setCropRotation(0)
                                                        setDragOffsetX(0)
                                                        setDragOffsetY(0)
                                                    } else {
                                                        newQueue.push({ src: result, type: 'gallery', index: galleryImages.length + i })
                                                    }
                                                }
                                                setCropQueue(newQueue)
                                            }
                                            processFiles()
                                        }
                                    }}
                                    className="hidden"
                                />
                            </div>
                        </div>

                        {/* Imagens do Carrossel (Topo) */}
                        <div className={activeTab === 'visual' ? 'space-y-6 pt-4 animate-in fade-in duration-300' : 'hidden'}>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-bg-light border border-border-soft rounded-xl flex items-center justify-center text-text-muted">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M7 12h10M12 7v10" /></svg>
                                    </div>
                                    <h3 className="text-lg font-black text-text-primary tracking-tight">Fotos do Topo (Carrossel)</h3>
                                </div>
                            </div>

                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4 leading-relaxed">
                                Estas fotos ficarão alternando no topo do site.<br />Se não adicionar nenhuma, usaremos fotos padrão com sua foto de capa.
                            </p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {carouselImages.map((img, index) => (
                                    <div key={index} className="aspect-square relative rounded-2xl overflow-hidden border border-border-soft animate-in zoom-in-95 duration-200 bg-bg-light shadow-sm">
                                        <img src={img || '/placeholder-broken.png'} alt="" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveCarouselImage(index);
                                            }}
                                            className="absolute top-2 right-2 w-7 h-7 bg-danger text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-xl z-20 border-2 border-white"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M18 6 6 18M6 6l12 12" /></svg>
                                        </button>
                                        <div className="absolute inset-0 bg-black/5 pointer-events-none" />
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => document.getElementById('carousel-bulk-upload')?.click()}
                                    className="aspect-square flex flex-col items-center justify-center gap-2 bg-bg-light border-2 border-dashed border-border-soft rounded-2xl hover:bg-brand-pale/50 hover:border-brand/40 transition-all group active:scale-95 shadow-sm"
                                >
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-text-muted group-hover:bg-brand group-hover:text-white transition-all shadow-sm group-hover:shadow-md">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted group-hover:text-brand">Adicionar Foto</span>
                                </button>
                                <input
                                    type="file"
                                    id="carousel-bulk-upload"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files || [])
                                        if (files.length > 0) {
                                            const processFiles = async () => {
                                                const newQueue: { src: string, type: any, index?: number }[] = []
                                                
                                                for (let i = 0; i < files.length; i++) {
                                                    const reader = new FileReader()
                                                    const result = await new Promise<string>((resolve) => {
                                                        reader.onloadend = () => resolve(reader.result as string)
                                                        reader.readAsDataURL(files[i])
                                                    })
                                                    
                                                    if (i === 0) {
                                                        // First one opens modal immediately
                                                        setTempImage(result)
                                                        setCropTarget({ type: 'carousel', index: carouselImages.length })
                                                        setShowCropModal(true)
                                                        setCropScale(1.1)
                                                        setCropRotation(0)
                                                        setDragOffsetX(0)
                                                        setDragOffsetY(0)
                                                    } else {
                                                        // Others go to queue
                                                        newQueue.push({ src: result, type: 'carousel', index: carouselImages.length + i })
                                                    }
                                                }
                                                setCropQueue(newQueue)
                                            }
                                            processFiles()
                                        }
                                    }}
                                    className="hidden"
                                />
                            </div>
                        </div>

                        <div className={activeTab === 'conteudo' ? 'space-y-8 pt-4 animate-in fade-in duration-300' : 'hidden'}>
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label htmlFor="coupleStoryTitle" className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 ml-1">Título da História</label>
                                    <input
                                        type="text"
                                        id="coupleStoryTitle"
                                        value={coupleStoryTitle}
                                        onChange={(e) => setCoupleStoryTitle(e.target.value)}
                                        placeholder="Ex: Como Tudo Começou"
                                        className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary placeholder:text-text-muted"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="coupleStory" className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 ml-1">Texto da História</label>
                                    <textarea
                                        id="coupleStory"
                                        value={coupleStory}
                                        onChange={(e) => setCoupleStory(e.target.value)}
                                        rows={6}
                                        placeholder="Conte um pouco sobre como vocês se conheceram..."
                                        className="w-full px-5 py-4 bg-bg-light border border-border-soft rounded-[2rem] text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary resize-none placeholder:text-text-muted"
                                    />
                                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-3 ml-1">Dica: Use parágrafos curtos para melhor leitura no celular.</p>
                                </div>
                            </div>

                            <div className="pt-10 border-t border-border-soft space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-bg-light border border-border-soft rounded-xl flex items-center justify-center text-text-muted">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                    </div>
                                    <h3 className="text-lg font-black text-text-primary tracking-tight">E-mail de Confirmação</h3>
                                </div>
                                
                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="emailConfirmationTitle" className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 ml-1">Título do Cabeçalho do E-mail</label>
                                        <input
                                            type="text"
                                            id="emailConfirmationTitle"
                                            value={emailConfirmationTitle}
                                            onChange={(e) => setEmailConfirmationTitle(e.target.value)}
                                            placeholder="Ex: Confirmação de Presença"
                                            className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary placeholder:text-text-muted"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="emailConfirmationGreeting" className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 ml-1">Mensagem de Boas-vindas (E-mail)</label>
                                        <textarea
                                            id="emailConfirmationGreeting"
                                            value={emailConfirmationGreeting}
                                            onChange={(e) => setEmailConfirmationGreeting(e.target.value)}
                                            rows={4}
                                            placeholder="Escreva a mensagem que o convidado verá no início do e-mail..."
                                            className="w-full px-5 py-4 bg-bg-light border border-border-soft rounded-[2rem] text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary resize-none placeholder:text-text-muted"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-bg-light border border-border-soft rounded-xl flex items-center justify-center text-text-muted">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                        </div>
                                        <h3 className="text-lg font-black text-text-primary tracking-tight">Timeline / Marcos</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddTimelineEvent}
                                        className="px-5 py-2.5 bg-bg-light hover:bg-brand hover:text-white text-[10px] font-black uppercase tracking-widest text-text-muted rounded-xl transition-all border border-border-soft shadow-sm active:scale-95 hover:shadow-md"
                                    >
                                        + Adicionar Evento
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {timelineEvents.map((event: any, index: number) => (
                                        <div key={index} className="p-6 bg-bg-light/30 border border-border-soft rounded-3xl animate-in slide-in-from-right-4 duration-300 relative group">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTimelineEvent(index)}
                                                className="absolute top-4 right-4 text-text-muted/20 hover:text-danger hover:scale-110 transition-all"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
                                            </button>

                                            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-6">
                                                <div className="space-y-4">
                                                    {!event.image && (
                                                        <div className="flex bg-bg-light p-1 rounded-xl border border-border-soft">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpdateTimelineEvent(index, 'image', '')}
                                                                className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${!event.image ? 'bg-white shadow-sm text-brand' : 'text-text-muted hover:text-text-primary'}`}
                                                            >
                                                                😊 Emoji
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => { if (!event.image) document.getElementById(`timeline-img-file-${index}`)?.click() }}
                                                                className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${event.image ? 'bg-white shadow-sm text-brand' : 'text-text-muted hover:text-text-primary'}`}
                                                            >
                                                                📷 Foto
                                                            </button>
                                                        </div>
                                                    )}

                                                    {!event.image ? (
                                                        <div className="grid grid-cols-4 gap-1.5 p-2 bg-white border border-border-soft rounded-2xl shadow-inner max-h-[140px] overflow-y-auto">
                                                            {['✨', '💑', '🏠', '💍', '⛪', '🥂', '🍰', '🎈', '❤️', '✈️', '🐶', '🍕', '🎉', '👶', '🎓', '🎬', '☕', '🚗', '🏖️', '⛰️'].map(emo => (
                                                                <button
                                                                    key={emo}
                                                                    type="button"
                                                                    onClick={() => handleUpdateTimelineEvent(index, 'emoji', emo)}
                                                                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-all ${event.emoji === emo ? 'bg-brand/10 border border-brand scale-110' : 'hover:bg-bg-light'}`}
                                                                >
                                                                    {emo}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            <div className="relative group/img aspect-square w-full bg-white border border-border-soft rounded-2xl flex items-center justify-center overflow-hidden shadow-inner">
                                                                <img src={event.image} alt="" className="w-full h-full object-cover" />
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all cursor-pointer"
                                                                    onClick={() => document.getElementById(`timeline-img-file-${index}`)?.click()}>
                                                                    <span className="text-[8px] font-black text-white uppercase tracking-widest text-center px-2">Trocar Foto</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <input
                                                        type="file"
                                                        id={`timeline-img-file-${index}`}
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0]
                                                            if (file) {
                                                                const reader = new FileReader()
                                                                reader.onloadend = () => {
                                                                    setTempImage(reader.result as string)
                                                                    setCropTarget({ type: 'timeline', index })
                                                                    setShowCropModal(true)
                                                                    setCropScale(1.1)
                                                                    setCropRotation(0)
                                                                    setDragOffsetX(0)
                                                                    setDragOffsetY(0)
                                                                }
                                                                reader.readAsDataURL(file)
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-[9px] font-black text-text-muted uppercase tracking-widest mb-2 ml-1">Título do Marco</label>
                                                        <input
                                                            type="text"
                                                            value={event.title}
                                                            onChange={(e) => handleUpdateTimelineEvent(index, 'title', e.target.value)}
                                                            placeholder="Ex: Pedido de Casamento"
                                                            className="w-full px-4 py-3 bg-white border border-border-soft rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand/20 transition-all outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[9px] font-black text-text-muted uppercase tracking-widest mb-2 ml-1">Descrição Curta</label>
                                                        <input
                                                            type="text"
                                                            value={event.description}
                                                            onChange={(e) => handleUpdateTimelineEvent(index, 'description', e.target.value)}
                                                            placeholder="Breve história..."
                                                            className="w-full px-4 py-3 bg-white border border-border-soft rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand/20 transition-all outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Mensagem Final */}
                        <div className={activeTab === 'conteudo' ? 'pt-4 animate-in fade-in duration-300' : 'hidden'}>
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

                        {/* Segurança - Alterar Senha */}
                        <div className={activeTab === 'seguranca' ? 'space-y-6 pt-4 animate-in fade-in duration-300' : 'hidden'}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-bg-light border border-border-soft rounded-xl flex items-center justify-center text-text-muted">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                </div>
                                <h3 className="text-lg font-black text-text-primary tracking-tight">Alterar Senha de Acesso</h3>
                            </div>

                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-relaxed opacity-80 mb-6">
                                Mantenha seu painel seguro. Você pode atualizar sua senha de acesso a qualquer momento aqui.
                            </p>

                            <div className="space-y-4 max-w-sm">
                                <div>
                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 ml-1">Senha Atual</label>
                                    <input
                                        type="password"
                                        value={passwordForm.current}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 ml-1">Nova Senha</label>
                                    <input
                                        type="password"
                                        value={passwordForm.new}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 ml-1">Confirmar Nova Senha</label>
                                    <input
                                        type="password"
                                        value={passwordForm.confirm}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-bg-light border border-border-soft rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-text-primary"
                                    />
                                </div>
                                <button
                                    type="button"
                                    disabled={passwordLoading}
                                    onClick={async () => {
                                        if (!passwordForm.current || !passwordForm.new) {
                                            toast.error('Campos incompletos', { description: 'Por favor, preencha todos os campos de senha.' })
                                            return
                                        }
                                        if (passwordForm.new !== passwordForm.confirm) {
                                            toast.error('Senhas não coincidem', { description: 'A confirmação deve ser igual à nova senha.' })
                                            return
                                        }
                                        if (passwordForm.new.length < 6) {
                                            toast.error('Senha muito curta', { description: 'A nova senha deve ter pelo menos 6 caracteres.' })
                                            return
                                        }
                                        setPasswordLoading(true)
                                        try {
                                            const res = await fetch('/api/auth/change-password', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    currentPassword: passwordForm.current,
                                                    newPassword: passwordForm.new
                                                })
                                            })
                                            const data = await res.json()
                                            if (res.ok) {
                                                toast.success('Senha atualizada!', { description: 'Sua senha de acesso foi alterada com sucesso.' })
                                                setPasswordForm({ current: '', new: '', confirm: '' })
                                                // Se veio do onboarding, remover o query param
                                                // para que o banner "Quase lá!" desapareça
                                                if (isOnboarding) {
                                                    router.replace('/settings')
                                                }
                                            } else {
                                                toast.error('Erro na atualização', { description: data.error || 'Não foi possível alterar a senha.' })
                                            }
                                        } catch (err) {
                                            toast.error('Erro de conexão', { description: 'Verifique sua internet e tente novamente.' })
                                        } finally {
                                            setPasswordLoading(false)
                                        }
                                    }}
                                    className="w-full py-4.5 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand/30 hover:bg-brand-dark hover:-translate-y-1 transition-all disabled:opacity-50"
                                >
                                    {passwordLoading ? 'Processando...' : '🛡️ Atualizar Senha'}
                                </button>
                            </div>
                        </div>

                        {/* Botão Salvar - Agora como FAB flutuante */}
                        <AnimatePresence>
                            {isDirty && (
                                <motion.div
                                    initial={{ opacity: 0, y: 100, scale: 0.8 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 100, scale: 0.8 }}
                                    className="fixed bottom-24 right-6 md:bottom-12 md:right-12 z-[100]"
                                >
                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={passwordLoading}
                                        className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl transition-all hover:scale-105 active:scale-95 ${saved ? 'bg-success text-success-dark' : 'bg-brand text-white shadow-brand/40'}`}
                                    >
                                        {saved ? (
                                            <>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>
                                                Salvo!
                                            </>
                                        ) : (
                                            <>
                                                <SaveIcon />
                                                Salvar Alterações
                                            </>
                                        )}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </div>
            </main >

            {/* Crop Modal */}
            {
                showCropModal && tempImage && (
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
                                    className={`${(cropTarget?.type === 'cover' || cropTarget?.type === 'carousel') ? 'aspect-video w-full' : 'aspect-square max-w-[400px] mx-auto'} relative rounded-[2rem] overflow-hidden bg-bg-light cursor-grab active:cursor-grabbing group shadow-inner border border-border-soft`}
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
                )
            }
        </SharedLayout >
    )
}

// Icons
const SaveIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
const InfoIcon = ({ className = "w-4 h-4" }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
const HeartIconOutline = ({ className = "w-5 h-5" }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
const PinIconRose = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
const ImageIconRose = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
const StarIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
const XIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>

