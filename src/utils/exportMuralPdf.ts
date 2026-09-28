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
    const margin = 16
    const contentWidth = pageWidth - (margin * 2)

    // Paleta de Cores Editorial Premium
    const MARSALA = { r: 139, g: 45, b: 79 } // #8B2D4F
    const MARSALA_LIGHT = { r: 253, g: 242, b: 244 } // #FDF2F4
    const GOLD = { r: 191, g: 155, b: 98 } // #BF9B62 Ouro sofisticado
    const GOLD_LIGHT = { r: 248, g: 244, b: 236 }
    const BG_OFFWHITE = { r: 253, g: 252, b: 250 } // #FDFCF8
    const TEXT_DARK = { r: 44, g: 36, b: 40 } // #2C2428
    const TEXT_MUTED = { r: 140, g: 130, b: 135 } // #8C8287
    const CARD_BORDER = { r: 232, g: 224, b: 220 } // #E8E0DC
    const GIFT_GREEN = { r: 45, g: 122, b: 72 } // #2D7A48
    const GIFT_BG = { r: 240, g: 248, b: 242 }

    // Carregar logo da marca com proporção natural
    const logoData = await getBase64ImageFromUrl('/logo_marsala.png')

    // Função para pintar o fundo suave
    const drawPageBackground = (isCover = false) => {
        doc.setFillColor(BG_OFFWHITE.r, BG_OFFWHITE.g, BG_OFFWHITE.b)
        doc.rect(0, 0, pageWidth, pageHeight, 'F')
        
        if (isCover) {
            // Moldura externa elegante da capa
            doc.setDrawColor(GOLD.r, GOLD.g, GOLD.b)
            doc.setLineWidth(0.4)
            doc.rect(10, 10, pageWidth - 20, pageHeight - 20, 'S')

            doc.setDrawColor(MARSALA.r, MARSALA.g, MARSALA.b)
            doc.setLineWidth(0.6)
            doc.rect(12, 12, pageWidth - 24, pageHeight - 24, 'S')

            // Cantoneiras ornamentais clássicas nos 4 cantos
            const cornerSize = 6
            const cLeft = 14
            const cRight = pageWidth - 14
            const cTop = 14
            const cBottom = pageHeight - 14

            doc.setDrawColor(GOLD.r, GOLD.g, GOLD.b)
            doc.setLineWidth(0.3)
            // Top-Left
            doc.line(cLeft, cTop, cLeft + cornerSize, cTop)
            doc.line(cLeft, cTop, cLeft, cTop + cornerSize)
            // Top-Right
            doc.line(cRight, cTop, cRight - cornerSize, cTop)
            doc.line(cRight, cTop, cRight, cTop + cornerSize)
            // Bottom-Left
            doc.line(cLeft, cBottom, cLeft + cornerSize, cBottom)
            doc.line(cLeft, cBottom, cLeft, cBottom - cornerSize)
            // Bottom-Right
            doc.line(cRight, cBottom, cRight - cornerSize, cBottom)
            doc.line(cRight, cBottom, cRight, cBottom - cornerSize)
        } else {
            // Borda suave interna nas páginas de conteúdo
            doc.setDrawColor(CARD_BORDER.r, CARD_BORDER.g, CARD_BORDER.b)
            doc.setLineWidth(0.2)
            doc.rect(8, 8, pageWidth - 16, pageHeight - 16, 'S')
        }
    }

    // ==========================================
    // 1. CAPA ELEGANTE & BALANCEADA
    // ==========================================
    drawPageBackground(true)

    // Logo Proporcional (sem distorção)
    if (logoData) {
        try {
            const aspect = logoData.aspect || 1
            const maxDimension = 32
            let logoW = maxDimension
            let logoH = maxDimension
            if (aspect > 1) {
                logoH = maxDimension / aspect
            } else {
                logoW = maxDimension * aspect
            }
            doc.addImage(logoData.base64, 'PNG', (pageWidth - logoW) / 2, 34, logoW, logoH)
        } catch {
            // Fallback se erro ao desenhar imagem
        }
    }

    // Tag Superior
    let currentY = 74
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(GOLD.r, GOLD.g, GOLD.b)
    doc.text('LIVRO DE RECADOS & MEMÓRIAS', pageWidth / 2, currentY, { align: 'center', charSpace: 1.5 })

    // Título Principal
    currentY += 12
    doc.setFont('times', 'italic')
    doc.setFontSize(36)
    doc.setTextColor(MARSALA.r, MARSALA.g, MARSALA.b)
    doc.text('Mural de Carinho', pageWidth / 2, currentY, { align: 'center' })

    // Divisor com losango geométrico vetorial dourado
    currentY += 8
    doc.setDrawColor(GOLD.r, GOLD.g, GOLD.b)
    doc.setLineWidth(0.4)
    doc.line((pageWidth / 2) - 35, currentY, (pageWidth / 2) - 6, currentY)
    doc.line((pageWidth / 2) + 6, currentY, (pageWidth / 2) + 35, currentY)
    
    // Losango central
    doc.setFillColor(GOLD.r, GOLD.g, GOLD.b)
    const midX = pageWidth / 2
    doc.triangle(midX, currentY - 1.8, midX + 2.2, currentY, midX - 2.2, currentY, 'F')
    doc.triangle(midX, currentY + 1.8, midX + 2.2, currentY, midX - 2.2, currentY, 'F')

    // Nomes do Casal / Título do Evento
    currentY += 22
    doc.setFont('times', 'bold')
    doc.setFontSize(24)
    doc.setTextColor(TEXT_DARK.r, TEXT_DARK.g, TEXT_DARK.b)
    doc.text(coupleName, pageWidth / 2, currentY, { align: 'center' })

    // Data do Evento
    if (eventDate) {
        currentY += 9
        const formattedDate = new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        }).format(new Date(eventDate))
        
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(GOLD.r, GOLD.g, GOLD.b)
        doc.text(formattedDate.toUpperCase(), pageWidth / 2, currentY, { align: 'center', charSpace: 1.2 })
    }

    // Caixa Editorial da Citação
    currentY += 26
    const quoteBoxW = 144
    const quoteBoxH = 46
    const quoteBoxX = (pageWidth - quoteBoxW) / 2

    // Fundo da Citação suave com moldura dupla delicada
    doc.setFillColor(GOLD_LIGHT.r, GOLD_LIGHT.g, GOLD_LIGHT.b)
    doc.roundedRect(quoteBoxX, currentY, quoteBoxW, quoteBoxH, 3, 3, 'F')
    doc.setDrawColor(CARD_BORDER.r, CARD_BORDER.g, CARD_BORDER.b)
    doc.setLineWidth(0.3)
    doc.roundedRect(quoteBoxX, currentY, quoteBoxW, quoteBoxH, 3, 3, 'S')

    // Moldura dourada interna
    doc.setDrawColor(GOLD.r, GOLD.g, GOLD.b)
    doc.setLineWidth(0.15)
    doc.roundedRect(quoteBoxX + 2, currentY + 2, quoteBoxW - 4, quoteBoxH - 4, 2, 2, 'S')

    // Aspas elegantes no topo da caixa
    doc.setFont('times', 'italic')
    doc.setFontSize(26)
    doc.setTextColor(GOLD.r, GOLD.g, GOLD.b)
    doc.text('“', pageWidth / 2, currentY + 11, { align: 'center' })

    // Texto da citação
    doc.setFont('times', 'italic')
    doc.setFontSize(11)
    doc.setTextColor(TEXT_DARK.r, TEXT_DARK.g, TEXT_DARK.b)
    const quoteText = 'Cada presente é um gesto de carinho, mas cada palavra é um tesouro que guardaremos para sempre.'
    const splitQuote = doc.splitTextToSize(quoteText, quoteBoxW - 24)
    doc.text(splitQuote, pageWidth / 2, currentY + 19, { align: 'center', lineHeightFactor: 1.35 })

    // Contador de Mensagens
    currentY += quoteBoxH + 26
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(TEXT_MUTED.r, TEXT_MUTED.g, TEXT_MUTED.b)
    const countLabel = validMessages.length === 1 ? '1 RECADO ESPECIAL' : `${validMessages.length} RECADOS ESPECIAIS`
    doc.text(`COLEÇÃO DE ${countLabel}`, pageWidth / 2, currentY, { align: 'center', charSpace: 1.2 })

    // Rodapé da Capa
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(TEXT_MUTED.r, TEXT_MUTED.g, TEXT_MUTED.b)
    doc.text('RSVP · Inteligência em Eventos', pageWidth / 2, pageHeight - 18, { align: 'center' })

    // ==========================================
    // 2. PÁGINAS DE RECADOS
    // ==========================================
    let currentPage = 1
    let yPos = 24

    const startNewPage = () => {
        doc.addPage()
        currentPage++
        drawPageBackground(false)

        // Cabeçalho da página de recados
        doc.setFont('times', 'italic')
        doc.setFontSize(11)
        doc.setTextColor(MARSALA.r, MARSALA.g, MARSALA.b)
        doc.text('Mural de Carinho', margin, 15)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(TEXT_MUTED.r, TEXT_MUTED.g, TEXT_MUTED.b)
        doc.text(coupleName, pageWidth - margin, 15, { align: 'right' })

        doc.setDrawColor(CARD_BORDER.r, CARD_BORDER.g, CARD_BORDER.b)
        doc.setLineWidth(0.2)
        doc.line(margin, 18, pageWidth - margin, 18)

        yPos = 24
    }

    if (validMessages.length > 0) {
        startNewPage()

        validMessages.forEach((msg) => {
            const cardPadding = 7
            const textWidth = contentWidth - (cardPadding * 2) - 10

            doc.setFont('times', 'italic')
            doc.setFontSize(11)
            const cleanMessage = (msg.message || '').trim()
            const splitMsg = doc.splitTextToSize(cleanMessage, textWidth)
            const textHeight = Math.max(splitMsg.length * 5, 8)

            // Altura compacta e proporcional
            const cardHeight = Math.max(9 + textHeight + 14 + 10, 36)

            // Se não couber na página atual (reserva 22mm para rodapé), cria nova página
            if (yPos + cardHeight > pageHeight - 22) {
                startNewPage()
            }

            const cardX = margin
            const cardY = yPos

            // Fundo do Card
            doc.setFillColor(255, 255, 255)
            doc.roundedRect(cardX, cardY, contentWidth, cardHeight, 3, 3, 'F')
            doc.setDrawColor(CARD_BORDER.r, CARD_BORDER.g, CARD_BORDER.b)
            doc.setLineWidth(0.3)
            doc.roundedRect(cardX, cardY, contentWidth, cardHeight, 3, 3, 'S')

            // Barra decorativa lateral esquerda no card
            const isGift = msg.type === 'gift'
            if (isGift) {
                doc.setFillColor(GIFT_GREEN.r, GIFT_GREEN.g, GIFT_GREEN.b)
            } else {
                doc.setFillColor(MARSALA.r, MARSALA.g, MARSALA.b)
            }
            doc.roundedRect(cardX, cardY, 2, cardHeight, 1, 1, 'F')

            // Badge de Tipo
            const badgeW = isGift ? 38 : 36
            const badgeH = 5.2
            const badgeX = cardX + cardPadding + 2
            const badgeY = cardY + cardPadding

            if (isGift) {
                doc.setFillColor(GIFT_BG.r, GIFT_BG.g, GIFT_BG.b)
                doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.2, 1.2, 'F')
                
                // Ponto decorativo verde
                doc.setFillColor(GIFT_GREEN.r, GIFT_GREEN.g, GIFT_GREEN.b)
                doc.circle(badgeX + 3.2, badgeY + 2.6, 1.1, 'F')

                doc.setFont('helvetica', 'bold')
                doc.setFontSize(6.5)
                doc.setTextColor(GIFT_GREEN.r, GIFT_GREEN.g, GIFT_GREEN.b)
                doc.text('PRESENTE RECEBIDO', badgeX + 6.2, badgeY + 3.7)
            } else {
                doc.setFillColor(MARSALA_LIGHT.r, MARSALA_LIGHT.g, MARSALA_LIGHT.b)
                doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.2, 1.2, 'F')

                // Ponto decorativo marsala
                doc.setFillColor(MARSALA.r, MARSALA.g, MARSALA.b)
                doc.circle(badgeX + 3.2, badgeY + 2.6, 1.1, 'F')

                doc.setFont('helvetica', 'bold')
                doc.setFontSize(6.5)
                doc.setTextColor(MARSALA.r, MARSALA.g, MARSALA.b)
                doc.text('RECADO NO RSVP', badgeX + 6.2, badgeY + 3.7)
            }

            // Data à direita
            if (msg.createdAt) {
                const msgDate = new Intl.DateTimeFormat('pt-BR', {
                    day: '2-digit',
                    month: 'short'
                }).format(new Date(msg.createdAt))
                doc.setFont('helvetica', 'bold')
                doc.setFontSize(7)
                doc.setTextColor(TEXT_MUTED.r, TEXT_MUTED.g, TEXT_MUTED.b)
                doc.text(msgDate.toUpperCase(), cardX + contentWidth - cardPadding, badgeY + 3.7, { align: 'right' })
            }

            // Texto da Mensagem
            const textY = badgeY + badgeH + 5
            doc.setFont('times', 'italic')
            doc.setFontSize(10.5)
            doc.setTextColor(TEXT_DARK.r, TEXT_DARK.g, TEXT_DARK.b)
            doc.text(splitMsg, cardX + cardPadding + 3, textY, { lineHeightFactor: 1.3 })

            // Linha divisória antes do autor
            const footerY = cardY + cardHeight - 11
            doc.setDrawColor(244, 238, 235)
            doc.setLineWidth(0.2)
            doc.line(cardX + cardPadding + 2, footerY, cardX + contentWidth - cardPadding, footerY)

            // Avatar circular do autor
            const avatarX = cardX + cardPadding + 6
            const avatarY = footerY + 5.5
            const avatarR = 3.5

            doc.setFillColor(MARSALA_LIGHT.r, MARSALA_LIGHT.g, MARSALA_LIGHT.b)
            doc.circle(avatarX, avatarY, avatarR, 'F')
            doc.setDrawColor(CARD_BORDER.r, CARD_BORDER.g, CARD_BORDER.b)
            doc.setLineWidth(0.15)
            doc.circle(avatarX, avatarY, avatarR, 'S')

            const initial = (msg.guestName || 'C').charAt(0).toUpperCase()
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(7)
            doc.setTextColor(MARSALA.r, MARSALA.g, MARSALA.b)
            doc.text(initial, avatarX, avatarY + 2.2, { align: 'center' })

            // Nome do Convidado
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(8)
            doc.setTextColor(TEXT_DARK.r, TEXT_DARK.g, TEXT_DARK.b)
            doc.text(msg.guestName || 'Convidado Especial', avatarX + 6.5, avatarY + 1)

            // Subtítulo Convidado
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(6)
            doc.setTextColor(TEXT_MUTED.r, TEXT_MUTED.g, TEXT_MUTED.b)
            doc.text('CONVIDADO(A)', avatarX + 6.5, avatarY + 3.8)

            // Avançar Y para o próximo card com respiro
            yPos += cardHeight + 5
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
        
        // Rodapé elegante
        doc.text('RSVP · Inteligência em Eventos', margin, pageHeight - 12)
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 12, { align: 'right' })
    }

    // Salvar o arquivo PDF
    const cleanFileName = `Mural de Carinho - ${coupleName.replace(/[^a-zA-Z0-9À-ÿ\s]/g, '')}.pdf`
    doc.save(cleanFileName)
}
