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

// Converte imagem da URL pública em base64 para o jsPDF
async function getBase64ImageFromUrl(imageUrl: string): Promise<string | null> {
    try {
        const res = await fetch(imageUrl)
        const blob = await res.blob()
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = () => resolve(null)
            reader.readAsDataURL(blob)
        })
    } catch {
        return null
    }
}

export async function generateMuralPdf({
    coupleName = 'Casal',
    eventDate,
    slug,
    messages
}: ExportPdfOptions) {
    // Filtrar mensagens válidas
    const validMessages = messages.filter(m => m.message && m.message.trim().length > 0)
    
    // Dimensões A4 em mm: 210 x 297
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    })

    const pageWidth = 210
    const pageHeight = 297
    const margin = 18
    const contentWidth = pageWidth - (margin * 2)

    // Paleta de Cores
    const MARSALA = { r: 139, g: 45, b: 79 } // #8B2D4F
    const MARSALA_LIGHT = { r: 247, g: 240, b: 243 } // #F7F0F3
    const GOLD = { r: 184, g: 145, b: 90 } // Dourado requintado
    const BG_OFFWHITE = { r: 252, g: 251, b: 249 } // #FCFBF9
    const TEXT_DARK = { r: 40, g: 30, b: 35 } // #281E23
    const TEXT_MUTED = { r: 130, g: 120, b: 125 } // #82787D
    const CARD_BORDER = { r: 228, g: 220, b: 224 } // Borda delicada

    // Carregar logo da marca
    const logoBase64 = await getBase64ImageFromUrl('/logo_marsala.png')

    // Função para pintar o fundo suave
    const drawPageBackground = () => {
        doc.setFillColor(BG_OFFWHITE.r, BG_OFFWHITE.g, BG_OFFWHITE.b)
        doc.rect(0, 0, pageWidth, pageHeight, 'F')
        
        // Borda decorativa de página fina
        doc.setDrawColor(CARD_BORDER.r, CARD_BORDER.g, CARD_BORDER.b)
        doc.setLineWidth(0.3)
        doc.rect(8, 8, pageWidth - 16, pageHeight - 16, 'S')
    }

    // ==========================================
    // 1. CAPA ELEGANTE
    // ==========================================
    drawPageBackground()

    // Borda interna dupla da capa
    doc.setDrawColor(MARSALA.r, MARSALA.g, MARSALA.b)
    doc.setLineWidth(0.6)
    doc.rect(12, 12, pageWidth - 24, pageHeight - 24, 'S')

    doc.setDrawColor(GOLD.r, GOLD.g, GOLD.b)
    doc.setLineWidth(0.2)
    doc.rect(13.5, 13.5, pageWidth - 27, pageHeight - 27, 'S')

    // Logo no topo
    if (logoBase64) {
        try {
            const logoW = 42
            const logoH = 14
            doc.addImage(logoBase64, 'PNG', (pageWidth - logoW) / 2, 38, logoW, logoH)
        } catch {
            // Fallback se não conseguir desenhar logo
        }
    }

    // Título Principal
    let currentY = 78
    doc.setFont('times', 'italic')
    doc.setFontSize(32)
    doc.setTextColor(MARSALA.r, MARSALA.g, MARSALA.b)
    doc.text('Mural de Carinho', pageWidth / 2, currentY, { align: 'center' })

    // Divisor com coração / linha elegante
    currentY += 8
    doc.setDrawColor(GOLD.r, GOLD.g, GOLD.b)
    doc.setLineWidth(0.4)
    doc.line((pageWidth / 2) - 30, currentY, (pageWidth / 2) - 8, currentY)
    doc.line((pageWidth / 2) + 8, currentY, (pageWidth / 2) + 30, currentY)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(MARSALA.r, MARSALA.g, MARSALA.b)
    doc.text('♥', pageWidth / 2, currentY + 1.2, { align: 'center' })

    // Nomes do Casal
    currentY += 24
    doc.setFont('times', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(TEXT_DARK.r, TEXT_DARK.g, TEXT_DARK.b)
    doc.text(coupleName, pageWidth / 2, currentY, { align: 'center' })

    // Data do Evento
    if (eventDate) {
        currentY += 10
        const formattedDate = new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        }).format(new Date(eventDate))
        
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(GOLD.r, GOLD.g, GOLD.b)
        doc.text(formattedDate.toUpperCase(), pageWidth / 2, currentY, { align: 'center' })
    }

    // Citação Inspiradora em Caixa Destaque
    currentY += 32
    const quoteBoxW = 140
    const quoteBoxH = 45
    const quoteBoxX = (pageWidth - quoteBoxW) / 2
    
    doc.setFillColor(MARSALA_LIGHT.r, MARSALA_LIGHT.g, MARSALA_LIGHT.b)
    doc.roundedRect(quoteBoxX, currentY, quoteBoxW, quoteBoxH, 4, 4, 'F')
    doc.setDrawColor(CARD_BORDER.r, CARD_BORDER.g, CARD_BORDER.b)
    doc.setLineWidth(0.3)
    doc.roundedRect(quoteBoxX, currentY, quoteBoxW, quoteBoxH, 4, 4, 'S')

    doc.setFont('times', 'italic')
    doc.setFontSize(28)
    doc.setTextColor(MARSALA.r, MARSALA.g, MARSALA.b)
    doc.text('“', quoteBoxX + 10, currentY + 12)

    doc.setFont('times', 'italic')
    doc.setFontSize(11)
    doc.setTextColor(TEXT_DARK.r, TEXT_DARK.g, TEXT_DARK.b)
    const quoteText = 'Cada presente é um gesto de carinho, mas cada palavra é um tesouro que guardaremos para sempre.'
    const splitQuote = doc.splitTextToSize(quoteText, quoteBoxW - 24)
    doc.text(splitQuote, pageWidth / 2, currentY + 18, { align: 'center', lineHeightFactor: 1.4 })

    // Total de Mensagens
    currentY += quoteBoxH + 28
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(TEXT_MUTED.r, TEXT_MUTED.g, TEXT_MUTED.b)
    doc.text(`COLEÇÃO DE ${validMessages.length} RECADOS ESPECIAIS`, pageWidth / 2, currentY, { align: 'center' })

    // Rodapé da Capa
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(TEXT_MUTED.r, TEXT_MUTED.g, TEXT_MUTED.b)
    doc.text('RSVP · Inteligência em Eventos', pageWidth / 2, pageHeight - 20, { align: 'center' })

    // ==========================================
    // 2. PÁGINAS DE RECADOS
    // ==========================================
    let currentPage = 1
    let yPos = margin + 18

    const startNewPage = () => {
        doc.addPage()
        currentPage++
        drawPageBackground()

        // Cabeçalho discreto no topo
        doc.setFont('times', 'italic')
        doc.setFontSize(10)
        doc.setTextColor(MARSALA.r, MARSALA.g, MARSALA.b)
        doc.text('Mural de Carinho', margin, 14)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(TEXT_MUTED.r, TEXT_MUTED.g, TEXT_MUTED.b)
        doc.text(coupleName, pageWidth - margin, 14, { align: 'right' })

        doc.setDrawColor(CARD_BORDER.r, CARD_BORDER.g, CARD_BORDER.b)
        doc.setLineWidth(0.2)
        doc.line(margin, 17, pageWidth - margin, 17)

        yPos = 24
    }

    if (validMessages.length > 0) {
        startNewPage()

        validMessages.forEach((msg) => {
            // Calcular altura necessária para o card
            const cardPadding = 8
            const textWidth = contentWidth - (cardPadding * 2) - 8

            doc.setFont('times', 'italic')
            doc.setFontSize(11)
            const splitMsg = doc.splitTextToSize(msg.message || '', textWidth)
            const textHeight = splitMsg.length * 5.2

            // Altura do card = Header do card (12) + texto + separador e autor (18) + paddings (16)
            const cardHeight = 12 + textHeight + 20 + 8

            // Se não couber na página atual (reserva 20mm para rodapé), cria nova página
            if (yPos + cardHeight > pageHeight - 20) {
                startNewPage()
            }

            const cardX = margin
            const cardY = yPos

            // Fundo do Card (Branco elegante)
            doc.setFillColor(255, 255, 255)
            doc.roundedRect(cardX, cardY, contentWidth, cardHeight, 3.5, 3.5, 'F')
            
            // Borda do Card
            doc.setDrawColor(CARD_BORDER.r, CARD_BORDER.g, CARD_BORDER.b)
            doc.setLineWidth(0.3)
            doc.roundedRect(cardX, cardY, contentWidth, cardHeight, 3.5, 3.5, 'S')

            // Badge de Tipo (Presente vs RSVP)
            const isGift = msg.type === 'gift'
            const badgeText = isGift ? '★  PRESENTE RECEBIDO' : '💬  RECADO NO RSVP'
            
            if (isGift) {
                doc.setFillColor(240, 248, 242) // Verde clarinho elegante
                doc.setTextColor(40, 140, 70)
            } else {
                doc.setFillColor(MARSALA_LIGHT.r, MARSALA_LIGHT.g, MARSALA_LIGHT.b)
                doc.setTextColor(MARSALA.r, MARSALA.g, MARSALA.b)
            }
            
            doc.roundedRect(cardX + cardPadding, cardY + cardPadding, 44, 6, 1.5, 1.5, 'F')
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(6.5)
            doc.text(badgeText, cardX + cardPadding + 3, cardY + cardPadding + 4.2)

            // Data à direita
            if (msg.createdAt) {
                const msgDate = new Intl.DateTimeFormat('pt-BR', {
                    day: '2-digit',
                    month: 'short'
                }).format(new Date(msg.createdAt))
                doc.setFont('helvetica', 'bold')
                doc.setFontSize(7.5)
                doc.setTextColor(TEXT_MUTED.r, TEXT_MUTED.g, TEXT_MUTED.b)
                doc.text(msgDate.toUpperCase(), cardX + contentWidth - cardPadding, cardY + cardPadding + 4.2, { align: 'right' })
            }

            // Aspas decorativas de fundo
            doc.setFont('times', 'bold')
            doc.setFontSize(28)
            doc.setTextColor(245, 235, 240)
            doc.text('“', cardX + cardPadding, cardY + cardPadding + 16)

            // Texto da Mensagem
            const textStartY = cardY + cardPadding + 14
            doc.setFont('times', 'italic')
            doc.setFontSize(10.5)
            doc.setTextColor(TEXT_DARK.r, TEXT_DARK.g, TEXT_DARK.b)
            doc.text(splitMsg, cardX + cardPadding + 6, textStartY, { lineHeightFactor: 1.35 })

            // Linha divisória antes do autor
            const footerDividerY = cardY + cardHeight - 14
            doc.setDrawColor(240, 235, 238)
            doc.setLineWidth(0.2)
            doc.line(cardX + cardPadding, footerDividerY, cardX + contentWidth - cardPadding, footerDividerY)

            // Avatar circular com inicial
            const avatarX = cardX + cardPadding + 4
            const avatarY = footerDividerY + 6.5
            const avatarR = 4
            
            doc.setFillColor(MARSALA_LIGHT.r, MARSALA_LIGHT.g, MARSALA_LIGHT.b)
            doc.circle(avatarX, avatarY, avatarR, 'F')
            doc.setDrawColor(CARD_BORDER.r, CARD_BORDER.g, CARD_BORDER.b)
            doc.setLineWidth(0.2)
            doc.circle(avatarX, avatarY, avatarR, 'S')

            const initial = (msg.guestName || 'C').charAt(0).toUpperCase()
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(7.5)
            doc.setTextColor(MARSALA.r, MARSALA.g, MARSALA.b)
            doc.text(initial, avatarX, avatarY + 2.5, { align: 'center' })

            // Nome do Convidado
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(8.5)
            doc.setTextColor(TEXT_DARK.r, TEXT_DARK.g, TEXT_DARK.b)
            doc.text(msg.guestName || 'Convidado Especial', avatarX + 8, avatarY + 1.2)

            // Subtítulo Convidado
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(6.5)
            doc.setTextColor(TEXT_MUTED.r, TEXT_MUTED.g, TEXT_MUTED.b)
            doc.text('CONVIDADO', avatarX + 8, avatarY + 4.8)

            // Avançar Y para o próximo card com espaçamento
            yPos += cardHeight + 6
        })
    }

    // ==========================================
    // 3. NUMERAÇÃO DE PÁGINAS E RODAPÉ
    // ==========================================
    const totalPages = doc.getNumberOfPages()
    for (let i = 2; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(TEXT_MUTED.r, TEXT_MUTED.g, TEXT_MUTED.b)
        
        // Rodapé
        doc.text('RSVP · Inteligência em Eventos', margin, pageHeight - 12)
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 12, { align: 'right' })
    }

    // Salvar o arquivo PDF
    const cleanFileName = `Mural de Carinho - ${coupleName.replace(/[^a-zA-Z0-9À-ÿ\s]/g, '')}.pdf`
    doc.save(cleanFileName)
}
