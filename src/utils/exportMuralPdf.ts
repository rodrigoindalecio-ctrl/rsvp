import jsPDF from 'jspdf'

export interface MuralMessage {
    id: string
    guestName?: string
    message?: string
    createdAt: string | Date
    type?: 'gift' | 'rsvp' | string
}

export interface ExportPdfOptions {
    coupleName?: string
    eventDate?: string | Date
    slug?: string
    messages: MuralMessage[]
}

// Converte imagem da URL pública em base64 e detecta o aspect ratio natural
async function getBase64ImageFromUrl(imageUrl: string): Promise<{ base64: string; aspect: number } | null> {
    try {
        const res = await fetch(imageUrl)
        const blob = await res.blob()
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => {
                const base64 = reader.result as string
                const img = new Image()
                img.onload = () => {
                    const aspect = (img.naturalWidth || 1) / (img.naturalHeight || 1)
                    resolve({ base64, aspect })
                }
                img.onerror = () => resolve({ base64, aspect: 1 })
                img.src = base64
            }
            reader.onerror = () => resolve(null)
            reader.readAsDataURL(blob)
        })
    } catch {
        return null
    }
}

// Parseia datas de forma segura sem deslocamento de fuso (UTC midnight → local day)
function safeParseDate(d: string | Date): Date {
    if (d instanceof Date) return d
    // "2026-11-20" sem hora → forçar meio-dia local para evitar shift de fuso
    if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
        return new Date(d + 'T12:00:00')
    }
    return new Date(d)
}

export async function generateMuralPdf({
    coupleName = 'Casal',
    eventDate,
    slug,
    messages
}: ExportPdfOptions) {
    const validMessages = messages.filter(m => m.message && m.message.trim().length > 0)

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    })

    const pageWidth = 210
    const pageHeight = 297
    const margin = 14
    const contentWidth = pageWidth - (margin * 2)

    // ── Paleta Editorial ──
    const MARSALA    = { r: 139, g: 45,  b: 79  }
    const MARSALA_L  = { r: 253, g: 242, b: 244 }
    const GOLD       = { r: 191, g: 155, b: 98  }
    const GOLD_L     = { r: 248, g: 244, b: 236 }
    const OFFWHITE   = { r: 253, g: 252, b: 250 }
    const TEXT_DARK  = { r: 44,  g: 36,  b: 40  }
    const TEXT_MUTED = { r: 140, g: 130, b: 135 }
    const BORDER     = { r: 232, g: 224, b: 220 }
    const GIFT_G     = { r: 45,  g: 122, b: 72  }
    const GIFT_BG    = { r: 240, g: 248, b: 242 }

    const FOOTER_TEXT = 'RSVP · Vanessa Bidinotti · Inteligência em Eventos'

    // ── Logo ──
    const logoData = await getBase64ImageFromUrl('/logo_marsala.png')

    // ── Fundo de Página ──
    const drawBg = (isCover = false) => {
        doc.setFillColor(OFFWHITE.r, OFFWHITE.g, OFFWHITE.b)
        doc.rect(0, 0, pageWidth, pageHeight, 'F')

        if (isCover) {
            doc.setDrawColor(GOLD.r, GOLD.g, GOLD.b)
            doc.setLineWidth(0.4)
            doc.rect(10, 10, pageWidth - 20, pageHeight - 20, 'S')
            doc.setDrawColor(MARSALA.r, MARSALA.g, MARSALA.b)
            doc.setLineWidth(0.6)
            doc.rect(12, 12, pageWidth - 24, pageHeight - 24, 'S')

            // Cantoneiras douradas
            const s = 6, cL = 14, cR = pageWidth - 14, cT = 14, cB = pageHeight - 14
            doc.setDrawColor(GOLD.r, GOLD.g, GOLD.b)
            doc.setLineWidth(0.3)
            doc.line(cL, cT, cL + s, cT); doc.line(cL, cT, cL, cT + s)
            doc.line(cR, cT, cR - s, cT); doc.line(cR, cT, cR, cT + s)
            doc.line(cL, cB, cL + s, cB); doc.line(cL, cB, cL, cB - s)
            doc.line(cR, cB, cR - s, cB); doc.line(cR, cB, cR, cB - s)
        } else {
            doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b)
            doc.setLineWidth(0.2)
            doc.rect(8, 8, pageWidth - 16, pageHeight - 16, 'S')
        }
    }

    // ══════════════════════════════════════
    //  1. CAPA
    // ══════════════════════════════════════
    drawBg(true)

    // Logo com proporção natural
    if (logoData) {
        try {
            const asp = logoData.aspect || 1
            const maxDim = 30
            const logoW = asp >= 1 ? maxDim : maxDim * asp
            const logoH = asp >= 1 ? maxDim / asp : maxDim
            doc.addImage(logoData.base64, 'PNG', (pageWidth - logoW) / 2, 34, logoW, logoH)
        } catch { /* silencia */ }
    }

    let y = 74

    // Tag — sem charSpace para evitar desalinhamento com outros elementos
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(GOLD.r, GOLD.g, GOLD.b)
    doc.text('LIVRO DE RECADOS & MEMÓRIAS', pageWidth / 2, y, { align: 'center' })

    // Título
    y += 13
    doc.setFont('times', 'italic')
    doc.setFontSize(36)
    doc.setTextColor(MARSALA.r, MARSALA.g, MARSALA.b)
    doc.text('Mural de Carinho', pageWidth / 2, y, { align: 'center' })

    // Divisor vetorial (losango + linhas)
    y += 8
    doc.setDrawColor(GOLD.r, GOLD.g, GOLD.b)
    doc.setLineWidth(0.4)
    doc.line(pageWidth / 2 - 36, y, pageWidth / 2 - 5.5, y)
    doc.line(pageWidth / 2 + 5.5, y, pageWidth / 2 + 36, y)
    doc.setFillColor(GOLD.r, GOLD.g, GOLD.b)
    const mx = pageWidth / 2
    doc.triangle(mx, y - 1.8, mx + 2.2, y, mx - 2.2, y, 'F')
    doc.triangle(mx, y + 1.8, mx + 2.2, y, mx - 2.2, y, 'F')

    // Nome do Casal
    y += 22
    doc.setFont('times', 'bold')
    doc.setFontSize(24)
    doc.setTextColor(TEXT_DARK.r, TEXT_DARK.g, TEXT_DARK.b)
    doc.text(coupleName, pageWidth / 2, y, { align: 'center' })

    // Data — sem charSpace
    if (eventDate) {
        y += 9
        const formatted = new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit', month: 'long', year: 'numeric'
        }).format(safeParseDate(eventDate))
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(GOLD.r, GOLD.g, GOLD.b)
        doc.text(formatted.toUpperCase(), pageWidth / 2, y, { align: 'center' })
    }

    // Caixa de Citação
    y += 26
    const qW = 148, qH = 46, qX = (pageWidth - qW) / 2
    doc.setFillColor(GOLD_L.r, GOLD_L.g, GOLD_L.b)
    doc.roundedRect(qX, y, qW, qH, 3, 3, 'F')
    doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b)
    doc.setLineWidth(0.3)
    doc.roundedRect(qX, y, qW, qH, 3, 3, 'S')
    doc.setDrawColor(GOLD.r, GOLD.g, GOLD.b)
    doc.setLineWidth(0.15)
    doc.roundedRect(qX + 2, y + 2, qW - 4, qH - 4, 2, 2, 'S')

    doc.setFont('times', 'italic')
    doc.setFontSize(26)
    doc.setTextColor(GOLD.r, GOLD.g, GOLD.b)
    doc.text('"', pageWidth / 2, y + 11, { align: 'center' })

    doc.setFont('times', 'italic')
    doc.setFontSize(11)
    doc.setTextColor(TEXT_DARK.r, TEXT_DARK.g, TEXT_DARK.b)
    const quoteLines = doc.splitTextToSize(
        'Cada presente é um gesto de carinho, mas cada palavra é um tesouro que guardaremos para sempre.',
        qW - 24
    )
    doc.text(quoteLines, pageWidth / 2, y + 20, { align: 'center', lineHeightFactor: 1.35 })

    // Contador — sem charSpace
    y += qH + 26
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(TEXT_MUTED.r, TEXT_MUTED.g, TEXT_MUTED.b)
    const countTxt = `COLEÇÃO DE ${validMessages.length} ${validMessages.length === 1 ? 'RECADO ESPECIAL' : 'RECADOS ESPECIAIS'}`
    doc.text(countTxt, pageWidth / 2, y, { align: 'center' })

    // Rodapé da capa
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(TEXT_MUTED.r, TEXT_MUTED.g, TEXT_MUTED.b)
    doc.text(FOOTER_TEXT, pageWidth / 2, pageHeight - 18, { align: 'center' })

    // ══════════════════════════════════════
    //  2. PÁGINAS DE RECADOS — 2 colunas
    // ══════════════════════════════════════
    const colGap = 5
    const colW = (contentWidth - colGap) / 2
    const cardPad = 6

    let yPos = 24
    let col = 0 // 0 = esquerda, 1 = direita

    const startNewPage = () => {
        doc.addPage()
        drawBg(false)

        doc.setFont('times', 'italic')
        doc.setFontSize(11)
        doc.setTextColor(MARSALA.r, MARSALA.g, MARSALA.b)
        doc.text('Mural de Carinho', margin, 15)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(TEXT_MUTED.r, TEXT_MUTED.g, TEXT_MUTED.b)
        doc.text(coupleName, pageWidth - margin, 15, { align: 'right' })

        doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b)
        doc.setLineWidth(0.2)
        doc.line(margin, 18, pageWidth - margin, 18)

        yPos = 24
        col = 0
    }

    if (validMessages.length > 0) {
        startNewPage()

        // Calcula altura de cada card antes de posicionar
        const calcCardHeight = (msg: MuralMessage): number => {
            doc.setFont('times', 'italic')
            doc.setFontSize(10)
            const textW = colW - (cardPad * 2) - 4
            const lines = doc.splitTextToSize((msg.message || '').trim(), textW)
            const textH = Math.max(lines.length * 4.8, 6)
            // header badge (8) + texto + footer avatar (13) + padding (16)
            return Math.max(8 + textH + 13 + 8, 38)
        }

        validMessages.forEach((msg) => {
            const cardH = calcCardHeight(msg)

            // Decide se passa para nova linha ou nova página
            if (col === 0) {
                // Verifica se novo par cabe na página
                if (yPos + cardH > pageHeight - 22) {
                    startNewPage()
                }
            } else {
                // col 1: mesma linha já existe, não precisa verificar de novo
            }

            const cardX = margin + col * (colW + colGap)
            const cardY = yPos

            // ── Fundo e Borda do Card ──
            doc.setFillColor(255, 255, 255)
            doc.roundedRect(cardX, cardY, colW, cardH, 3, 3, 'F')
            doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b)
            doc.setLineWidth(0.3)
            doc.roundedRect(cardX, cardY, colW, cardH, 3, 3, 'S')

            // ── Barra lateral decorativa ──
            const isGift = msg.type === 'gift'
            if (isGift) {
                doc.setFillColor(GIFT_G.r, GIFT_G.g, GIFT_G.b)
            } else {
                doc.setFillColor(MARSALA.r, MARSALA.g, MARSALA.b)
            }
            doc.roundedRect(cardX, cardY, 2, cardH, 1, 1, 'F')

            // ── Badge de Tipo ──
            const badgeH = 5
            const badgeX = cardX + cardPad + 2
            const badgeY = cardY + cardPad

            if (isGift) {
                doc.setFillColor(GIFT_BG.r, GIFT_BG.g, GIFT_BG.b)
                doc.roundedRect(badgeX, badgeY, 36, badgeH, 1.2, 1.2, 'F')
                doc.setFillColor(GIFT_G.r, GIFT_G.g, GIFT_G.b)
                doc.circle(badgeX + 3, badgeY + 2.5, 1, 'F')
                doc.setFont('helvetica', 'bold')
                doc.setFontSize(6)
                doc.setTextColor(GIFT_G.r, GIFT_G.g, GIFT_G.b)
                doc.text('PRESENTE RECEBIDO', badgeX + 5.8, badgeY + 3.5)
            } else {
                doc.setFillColor(MARSALA_L.r, MARSALA_L.g, MARSALA_L.b)
                doc.roundedRect(badgeX, badgeY, 34, badgeH, 1.2, 1.2, 'F')
                doc.setFillColor(MARSALA.r, MARSALA.g, MARSALA.b)
                doc.circle(badgeX + 3, badgeY + 2.5, 1, 'F')
                doc.setFont('helvetica', 'bold')
                doc.setFontSize(6)
                doc.setTextColor(MARSALA.r, MARSALA.g, MARSALA.b)
                doc.text('RECADO NO RSVP', badgeX + 5.8, badgeY + 3.5)
            }

            // ── Data ──
            if (msg.createdAt) {
                const d = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
                    .format(safeParseDate(msg.createdAt))
                doc.setFont('helvetica', 'bold')
                doc.setFontSize(6.5)
                doc.setTextColor(TEXT_MUTED.r, TEXT_MUTED.g, TEXT_MUTED.b)
                doc.text(d.toUpperCase(), cardX + colW - cardPad, badgeY + 3.5, { align: 'right' })
            }

            // ── Texto da Mensagem ──
            doc.setFont('times', 'italic')
            doc.setFontSize(10)
            doc.setTextColor(TEXT_DARK.r, TEXT_DARK.g, TEXT_DARK.b)
            const textW = colW - (cardPad * 2) - 4
            const splitMsg = doc.splitTextToSize((msg.message || '').trim(), textW)
            const textY = badgeY + badgeH + 4.5
            doc.text(splitMsg, cardX + cardPad + 3, textY, { lineHeightFactor: 1.3 })

            // ── Linha Divisória ──
            const footerY = cardY + cardH - 11
            doc.setDrawColor(244, 238, 235)
            doc.setLineWidth(0.2)
            doc.line(cardX + cardPad + 2, footerY, cardX + colW - cardPad, footerY)

            // ── Avatar + Nome ──
            const avX = cardX + cardPad + 5
            const avY = footerY + 5
            doc.setFillColor(MARSALA_L.r, MARSALA_L.g, MARSALA_L.b)
            doc.circle(avX, avY, 3.2, 'F')
            doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b)
            doc.setLineWidth(0.15)
            doc.circle(avX, avY, 3.2, 'S')

            doc.setFont('helvetica', 'bold')
            doc.setFontSize(6.5)
            doc.setTextColor(MARSALA.r, MARSALA.g, MARSALA.b)
            doc.text((msg.guestName || 'C').charAt(0).toUpperCase(), avX, avY + 2, { align: 'center' })

            // Trunca nome se muito longo para coluna
            const maxNameW = colW - cardPad - 5 - 8
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(7.5)
            doc.setTextColor(TEXT_DARK.r, TEXT_DARK.g, TEXT_DARK.b)
            const nameLine = doc.splitTextToSize(msg.guestName || 'Convidado', maxNameW)
            doc.text(nameLine[0], avX + 5.8, avY + 0.8)

            doc.setFont('helvetica', 'normal')
            doc.setFontSize(5.5)
            doc.setTextColor(TEXT_MUTED.r, TEXT_MUTED.g, TEXT_MUTED.b)
            doc.text('CONVIDADO(A)', avX + 5.8, avY + 3.8)

            // ── Avançar coluna / linha ──
            if (col === 0) {
                col = 1
                // Não avança yPos ainda — aguarda col 1 para saber a altura máxima da linha
            } else {
                // Fim da linha: calcula a altura máxima das duas colunas
                // (card já desenhado, yPos foi mantido)
                yPos += cardH + 5
                col = 0
            }
        })

        // Se terminou em coluna ímpar (só col 0 preenchido), avança yPos
        if (col === 1) {
            const lastMsg = validMessages[validMessages.length - 1]
            yPos += calcCardHeight(lastMsg) + 5
        }
    }

    // ══════════════════════════════════════
    //  3. NUMERAÇÃO E RODAPÉ EM TODAS AS PÁGINAS
    // ══════════════════════════════════════
    const totalPages = doc.getNumberOfPages()
    for (let i = 2; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(TEXT_MUTED.r, TEXT_MUTED.g, TEXT_MUTED.b)
        doc.text(FOOTER_TEXT, margin, pageHeight - 12)
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 12, { align: 'right' })
    }

    // ── Download ──
    const cleanName = coupleName.replace(/[^a-zA-Z0-9À-ÿ\s&]/g, '').trim()
    doc.save(`Mural de Carinho - ${cleanName}.pdf`)
}

// Auxiliar para calcular altura de card fora do closure (reutilizado no forEach)
function calcCardHeight(doc: jsPDF, msg: MuralMessage, colW: number, cardPad: number): number {
    doc.setFont('times', 'italic')
    doc.setFontSize(10)
    const textW = colW - (cardPad * 2) - 4
    const lines = doc.splitTextToSize((msg.message || '').trim(), textW)
    const textH = Math.max(lines.length * 4.8, 6)
    return Math.max(8 + textH + 13 + 8, 38)
}
