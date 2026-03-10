'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface TourStep {
  targetId: string
  title: string
  content: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

interface OnboardingTourProps {
  steps: TourStep[]
  onComplete: () => void
  onSkip: () => void
  isOpen: boolean
}

// ─── Constants ───────────────────────────────────────────────
const TOOLTIP_MAX_W = 310
const TOOLTIP_H_EST = 230 // approx height for edge detection
const GAP = 16           // gap between element and tooltip
const EDGE = 14          // min distance from screen edge
const MOBILE_BREAKPOINT = 640

// ─── Tooltip position calculator ────────────────────────────
// All coords are viewport-relative (from getBoundingClientRect).
// IMPORTANT: Never use CSS `transform` here — framer-motion owns
// the transform property to animate scale/y. Mixing them breaks positioning.
function calcTooltipStyle(
  position: TourStep['position'],
  coords: { top: number; left: number; width: number; height: number }
): React.CSSProperties {
  if (typeof window === 'undefined') return {}

  const isMobile = window.innerWidth < MOBILE_BREAKPOINT
  const w = Math.min(TOOLTIP_MAX_W, window.innerWidth - EDGE * 2)
  const isCenter = position === 'center' || coords.width === 0

  // ── Center / Welcome step ────────────────────────────────
  // Compute pixels directly — avoids transform: translate() conflict
  if (isCenter) {
    return {
      position: 'fixed',
      top: Math.max(EDGE, Math.round((window.innerHeight - TOOLTIP_H_EST) / 2)),
      left: Math.round((window.innerWidth - w) / 2),
      width: w,
      zIndex: 10001,
    }
  }

  // ── Mobile: bottom sheet ─────────────────────────────────
  // Use left + right instead of left + transform: translateX(-50%)
  if (isMobile) {
    return {
      position: 'fixed',
      bottom: 92,   // above bottom nav (80px) + 12px gap
      left: EDGE,
      right: EDGE,
      zIndex: 10001,
    }
  }

  // ── Desktop: directional positioning ────────────────────
  let top = 0
  let left = 0

  switch (position) {
    case 'top':
      top = coords.top - TOOLTIP_H_EST - GAP
      left = coords.left + coords.width / 2 - w / 2
      break

    case 'left':
      top = coords.top + coords.height / 2 - TOOLTIP_H_EST / 2
      left = coords.left - w - GAP
      // Fallback to bottom if too close to left edge
      if (left < EDGE) {
        top = coords.top + coords.height + GAP
        left = coords.left + coords.width / 2 - w / 2
      }
      break

    case 'right':
      top = coords.top + coords.height / 2 - TOOLTIP_H_EST / 2
      left = coords.left + coords.width + GAP
      // Fallback to bottom if too close to right edge
      if (left + w > window.innerWidth - EDGE) {
        top = coords.top + coords.height + GAP
        left = coords.left + coords.width / 2 - w / 2
      }
      break

    case 'bottom':
    default:
      top = coords.top + coords.height + GAP
      left = coords.left + coords.width / 2 - w / 2
      break
  }

  // Clamp horizontally
  left = Math.max(EDGE, Math.min(window.innerWidth - w - EDGE, left))

  // Vertical overflow: flip direction if needed
  if (top < EDGE) {
    top = coords.top + coords.height + GAP
  }
  if (top + TOOLTIP_H_EST > window.innerHeight - EDGE) {
    top = coords.top - TOOLTIP_H_EST - GAP
  }

  // Hard clamp — never go off screen
  top = Math.max(EDGE, Math.min(window.innerHeight - TOOLTIP_H_EST - EDGE, top))

  return { position: 'fixed', top, left, width: w, zIndex: 10001 }
}


// ─── Component ───────────────────────────────────────────────
export function OnboardingTour({ steps, onComplete, onSkip, isOpen }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  // coords are VIEWPORT-relative (from getBoundingClientRect)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 })
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateLayout = useCallback(() => {
    const step = steps[currentStep]
    if (!step) return

    const target = document.getElementById(step.targetId)
    if (target) {
      const rect = target.getBoundingClientRect()
      const c = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }
      setCoords(c)
      setTooltipStyle(calcTooltipStyle(step.position, c))
    } else {
      // Element not found → treat as center step (no highlight)
      setCoords({ top: 0, left: 0, width: 0, height: 0 })
      setTooltipStyle(calcTooltipStyle('center', { top: 0, left: 0, width: 0, height: 0 }))
    }
  }, [currentStep, steps])

  useEffect(() => {
    if (!isOpen) return

    const step = steps[currentStep]
    if (!step) return

    // Scroll element into center of viewport first
    const target = document.getElementById(step.targetId)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    // Run immediately + after scroll animation (~400ms) to get final coords
    updateLayout()
    const timer = setTimeout(updateLayout, 420)

    // Live-update during any scroll or resize
    const handleScroll = () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
      scrollTimerRef.current = setTimeout(updateLayout, 60)
    }
    const handleResize = () => updateLayout()

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)

    return () => {
      clearTimeout(timer)
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [isOpen, currentStep, updateLayout])

  // Reset to step 0 whenever the tour opens
  useEffect(() => {
    if (isOpen) setCurrentStep(0)
  }, [isOpen])

  if (!isOpen) return null

  const step = steps[currentStep]
  const isCenter = step.position === 'center' || coords.width === 0
  const hasHighlight = !isCenter

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(p => p + 1)
    } else {
      onComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(p => p - 1)
  }

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">

      {/* ── Dim overlay with transparent highlight cutout ── */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-auto"
        onClick={onSkip}
        style={{ cursor: 'default' }}
      >
        <defs>
          <mask id="tour-highlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {hasHighlight && (
              <motion.rect
                animate={{
                  x: coords.left - 8,
                  y: coords.top - 8,
                  width: coords.width + 16,
                  height: coords.height + 16,
                }}
                initial={false}
                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                rx="14"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.72)"
          mask="url(#tour-highlight-mask)"
        />
      </svg>

      {/* ── Highlight ring (pulsing border around element) ── */}
      {hasHighlight && (
        <motion.div
          animate={{
            top: coords.top - 10,
            left: coords.left - 10,
            width: coords.width + 20,
            height: coords.height + 20,
          }}
          initial={false}
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          className="fixed border-2 border-brand rounded-[1.25rem] pointer-events-none"
          style={{
            boxShadow: '0 0 0 4px rgba(123,45,61,0.15), 0 0 24px rgba(123,45,61,0.3)',
          }}
        />
      )}

      {/* ── Tooltip card ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: -12 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          style={tooltipStyle}
          className="bg-white rounded-[2rem] shadow-2xl pointer-events-auto border border-border-soft overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Card inner */}
          <div className="p-5 sm:p-7">

            {/* Header row: step badge + skip */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-brand-pale rounded-xl flex items-center justify-center text-brand font-black text-sm sm:text-base flex-shrink-0">
                  {currentStep + 1}
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-text-muted">
                  {currentStep + 1} de {steps.length}
                </span>
              </div>
              <button
                onClick={onSkip}
                className="text-[9px] font-black uppercase tracking-widest text-text-muted hover:text-brand transition-colors px-2 py-1 rounded-lg hover:bg-brand-pale"
              >
                Pular
              </button>
            </div>

            {/* Title */}
            <h3 className="text-base sm:text-lg font-black text-text-primary tracking-tight mb-2 leading-tight">
              {step.title}
            </h3>

            {/* Content */}
            <p className="text-xs sm:text-sm text-text-muted font-semibold leading-relaxed mb-5">
              {step.content}
            </p>

            {/* Footer: progress dots + navigation */}
            <div className="flex items-center justify-between gap-3">
              {/* Progress dots */}
              <div className="flex gap-1.5 items-center">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentStep
                        ? 'w-5 bg-brand'
                        : i < currentStep
                        ? 'w-1.5 bg-brand/40'
                        : 'w-1.5 bg-brand-pale'
                    }`}
                  />
                ))}
              </div>

              {/* Buttons */}
              <div className="flex gap-2 flex-shrink-0">
                {currentStep > 0 && (
                  <button
                    onClick={handleBack}
                    className="px-3 py-2 bg-bg-light rounded-xl text-[9px] font-black uppercase tracking-widest text-text-muted hover:bg-brand-pale hover:text-brand transition-all active:scale-95"
                  >
                    ← Voltar
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="px-4 sm:px-5 py-2 bg-brand text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md shadow-brand/25 hover:scale-105 active:scale-95 transition-all"
                >
                  {currentStep === steps.length - 1 ? 'Concluir ✓' : 'Próximo →'}
                </button>
              </div>
            </div>
          </div>

          {/* Progress bar at bottom */}
          <div className="h-1 bg-brand-pale">
            <motion.div
              className="h-full bg-brand rounded-full"
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
