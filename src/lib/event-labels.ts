export type EventType = 'casamento' | 'debutante'

export type CoupleStyle = 'casal' | 'noivos' | 'noivas'

export interface EventLabels {
    /** Ex: "Nomes do Casal", "Nome das Noivas", "Nome da Debutante" */
    namesFieldLabel: string
    /** Ex: "Vanessa e Rodrigo", "Marina e Clara", "Maria Clara" */
    namesPlaceholder: string
    /** Ex: "o casal", "os noivos", "as noivas", "a debutante" */
    targetLower: string
    /** Ex: "O Casal", "Os Noivos", "As Noivas", "A Debutante" */
    targetCapitalized: string
    /** Ex: "para o casal", "para as noivas", "para a debutante" */
    forTarget: string
    /** Ex: "Fale com o casal", "Fale com os noivos", "Fale com as noivas" */
    talkToTarget: string
    /** Ex: "Painel do Casal", "Painel dos Noivos" */
    dashboardTitle: string
    /** Ex: "Mural do Casal", "Mural dos Noivos" */
    muralTitle: string
    /** Ex: "Presentes do Casal", "Presentes dos Noivos" */
    giftsTitle: string
}

/**
 * Retorna termos adaptados para casais homoafetivos (dois homens, duas mulheres ou neutro/casal)
 * e também para eventos de debutante.
 */
export function getEventLabels(options?: {
    eventType?: string | null
    coupleStyle?: CoupleStyle | string | null
    coupleNames?: string | null
}): EventLabels {
    const eventType = options?.eventType || 'casamento'
    const coupleStyle = (options?.coupleStyle as CoupleStyle) || 'casal'

    if (eventType === 'debutante') {
        return {
            namesFieldLabel: 'Nome da Debutante',
            namesPlaceholder: 'Ex: Maria Clara',
            targetLower: 'a debutante',
            targetCapitalized: 'A Debutante',
            forTarget: 'para a debutante',
            talkToTarget: 'Fale com a debutante',
            dashboardTitle: 'Painel da Debutante',
            muralTitle: 'Mural da Debutante',
            giftsTitle: 'Presentes da Debutante'
        }
    }

    if (coupleStyle === 'noivas') {
        return {
            namesFieldLabel: 'Nome das Noivas',
            namesPlaceholder: 'Ex: Marina e Clara',
            targetLower: 'as noivas',
            targetCapitalized: 'As Noivas',
            forTarget: 'para as noivas',
            talkToTarget: 'Fale com as noivas',
            dashboardTitle: 'Painel das Noivas',
            muralTitle: 'Mural das Noivas',
            giftsTitle: 'Presentes das Noivas'
        }
    }

    if (coupleStyle === 'noivos') {
        return {
            namesFieldLabel: 'Nome dos Noivos',
            namesPlaceholder: 'Ex: Lucas e Gabriel',
            targetLower: 'os noivos',
            targetCapitalized: 'Os Noivos',
            forTarget: 'para os noivos',
            talkToTarget: 'Fale com os noivos',
            dashboardTitle: 'Painel dos Noivos',
            muralTitle: 'Mural dos Noivos',
            giftsTitle: 'Presentes dos Noivos'
        }
    }

    // Padrão inclusivo e elegante para qualquer formato de casal
    return {
        namesFieldLabel: 'Nomes do Casal',
        namesPlaceholder: 'Ex: Vanessa e Rodrigo',
        targetLower: 'o casal',
        targetCapitalized: 'O Casal',
        forTarget: 'para o casal',
        talkToTarget: 'Fale com o casal',
        dashboardTitle: 'Painel do Casal',
        muralTitle: 'Mural do Casal',
        giftsTitle: 'Presentes do Casal'
    }
}
