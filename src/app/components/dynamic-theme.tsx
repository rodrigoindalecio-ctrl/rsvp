'use client'

import { useEvent } from '@/lib/event-context'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function DynamicTheme() {
    const { eventSettings } = useEvent()
    const pathname = usePathname()

    const brandColor = eventSettings?.brandColor || '#7b2d3d'
    const brandFont = eventSettings?.brandFont || 'lora'

    // Função para escurecer ou clarear a cor (para gerar variantes)
    const adjustColor = (hex: string, amt: number) => {
        let usePound = false;
        if (hex[0] === "#") {
            hex = hex.slice(1);
            usePound = true;
        }
        const num = parseInt(hex, 16);
        let r = (num >> 16) + amt;
        if (r > 255) r = 255;
        else if (r < 0) r = 0;
        let b = ((num >> 8) & 0x00FF) + amt;
        if (b > 255) b = 255;
        else if (b < 0) b = 0;
        let g = (num & 0x0000FF) + amt;
        if (g > 255) g = 255;
        else if (g < 0) g = 0;
        return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
    }

    const brandDark = adjustColor(brandColor, -20)
    const brandLight = adjustColor(brandColor, 20)
    const brandPale = adjustColor(brandColor, 180)

    let fontVar = 'var(--font-lora)'
    if (brandFont === 'playfair') fontVar = 'var(--font-playfair)'
    if (brandFont === 'inter') fontVar = 'var(--font-inter)'
    if (brandFont === 'outfit') fontVar = 'var(--font-outfit)'
    if (brandFont === 'manrope') fontVar = 'var(--font-manrope)'
    if (brandFont === 'great-vibes') fontVar = 'var(--font-great-vibes)'

    const isDashboard = pathname?.startsWith('/admin') ||
        pathname?.startsWith('/settings') ||
        pathname?.startsWith('/dashboard') ||
        pathname?.startsWith('/login') ||
        pathname?.startsWith('/register')

    return (
        <style dangerouslySetInnerHTML={{
            __html: `
            :root {
                --color-brand: ${brandColor} !important;
                --color-brand-dark: ${brandDark} !important;
                --color-brand-light: ${brandLight} !important;
                --color-brand-pale: ${brandPale} !important;
                ${!isDashboard ? `--font-serif: ${fontVar}, 'Playfair Display', 'Georgia', serif !important;` : ''}
            }
            ${(!isDashboard && brandFont === 'great-vibes') ? `
                h1, h2, h3, h4, h5, h6 {
                    text-transform: none !important;
                    letter-spacing: normal !important;
                    font-weight: 400 !important;
                }
                .font-serif {
                    text-transform: none !important;
                    letter-spacing: normal !important;
                    font-weight: 400 !important;
                }
                
                /* Escala de tamanhos maiores para fonte caligráfica */
                h1 { font-size: 5rem !important; }
                h2 { font-size: 3.5rem !important; }
                h3 { font-size: 2.5rem !important; }
                
                @media (min-width: 768px) { 
                    h1 { font-size: 7.5rem !important; } 
                    h2 { font-size: 4.5rem !important; }
                }
                
                /* Ajustes específicos */
                #historia h3 {
                    font-size: 2rem !important;
                }
                nav button.font-serif {
                    font-size: 2rem !important;
                }
            ` : ''}
        `}} />
    )
}
