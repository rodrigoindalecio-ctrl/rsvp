'use client'

import { useEvent } from '@/lib/event-context'
import { usePathname } from 'next/navigation'

export function DynamicTheme() {
    const { eventSettings } = useEvent()
    const pathname = usePathname()

    // Detecta se é uma página de gestão (admin/dashboard/settings/login/etc.)
    // Nessas páginas, NÃO aplicamos a cor/fonte do cliente — só usamos os padrões do sistema.
    const isManagementPage =
        pathname?.startsWith('/admin') ||
        pathname?.startsWith('/settings') ||
        pathname?.startsWith('/dashboard') ||
        pathname?.startsWith('/login') ||
        pathname?.startsWith('/register') ||
        pathname?.startsWith('/import')

    const DEFAULT_BRAND = '#7b2d3d'

    // Em páginas de gestão, ignora a cor do cliente e usa o padrão do sistema
    const brandColor = isManagementPage
        ? DEFAULT_BRAND
        : (eventSettings?.brandColor || DEFAULT_BRAND)

    const brandFont = isManagementPage
        ? 'lora'
        : (eventSettings?.brandFont || 'lora')

    // Gera variantes claro/escuro a partir da cor base
    const adjustColor = (hex: string, amt: number): string => {
        let usePound = false
        if (hex[0] === '#') { hex = hex.slice(1); usePound = true }
        const num = parseInt(hex, 16)
        let r = (num >> 16) + amt; if (r > 255) r = 255; else if (r < 0) r = 0
        let b = ((num >> 8) & 0x00ff) + amt; if (b > 255) b = 255; else if (b < 0) b = 0
        let g = (num & 0x0000ff) + amt; if (g > 255) g = 255; else if (g < 0) g = 0
        return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0')
    }

    const brandDark = adjustColor(brandColor, -20)
    const brandLight = adjustColor(brandColor, 20)
    const brandPale = adjustColor(brandColor, 180)

    let fontVar = 'var(--font-lora)'
    if (brandFont === 'playfair') fontVar = 'var(--font-playfair)'
    if (brandFont === 'inter') fontVar = 'var(--font-inter)'
    if (brandFont === 'outfit') fontVar = 'var(--font-outfit)'
    if (brandFont === 'manrope') fontVar = 'var(--font-manrope)'

    return (
        <style dangerouslySetInnerHTML={{
            __html: `
            :root {
                --color-brand: ${brandColor} !important;
                --color-brand-dark: ${brandDark} !important;
                --color-brand-light: ${brandLight} !important;
                --color-brand-pale: ${brandPale} !important;
                ${!isManagementPage ? `--font-serif: ${fontVar}, 'Playfair Display', 'Georgia', serif !important;` : ''}
            }
        `}} />
    )
}
