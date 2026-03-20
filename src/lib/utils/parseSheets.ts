/**
 * SHEET PARSING & VALIDATION UTILITIES
 * 
 * Responsável por:
 * 1. Parse de arquivos Excel/CSV
 * 2. Validação de campos obrigatórios
 * 3. Detecção de duplicidades
 * 4. Conversão para formato Guest
 * 5. Geração de relatório de erros
 */

import * as XLSX from 'xlsx'
import { Guest } from '@/lib/event-context'

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Separa lista de acompanhantes aceitando múltiplos separadores
 * Aceita: ; , / | - . e quebra de linha
 */
export function parseCompanionsList(input: string): string[] {
  if (!input || input.trim() === '') return []

  return input
    .split(/[;,/|\-.\n]+/) // Aceita múltiplos separadores
    .map((name: string) => name.trim())
    .filter((name: string) => name.length > 0)
}

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface RawGuestRow {
  [key: string]: string | number // Permite propriedades dinâmicas
}

export interface ParsedGuest extends Omit<Guest, 'id' | 'status' | 'updatedAt'> {
  telefone: string // Fallback para compatibilidade, embora removido da UI
  grupo?: string
  category: any // Será 'adult_paying' | 'child_paying' | 'child_not_paying'
}

export interface ImportError {
  linha: number
  campo: string
  mensagem: string
}

export interface ParseSheetResult {
  sucesso: boolean
  convidados: ParsedGuest[]
  erros: ImportError[]
  duplicatas: Array<{ linha: number; nomePrincipal: string; telefone: string }>
  totalLinhasProcessadas: number
}

// ==========================================
// CONSTANTS
// ==========================================

export const REQUIRED_COLUMNS = {
  nomePrincipal: 'NOME_COMPLETO_DO_TITULAR'
}

export const OPTIONAL_COLUMNS = {
  adultos: 'NOME_COMPLETO_DOS_ACOMPANHANTES',
  criancas_pagantes: 'CRIANCAS_PAGANTES',
  criancas_isentas: 'CRIANCAS_ISENTAS',
  grupo: 'GRUPO_FAMILIA',
  telefone: 'TELEFONE'
}

// ==========================================
// PARSE FILE
// ==========================================

/**
 * Parse arquivo Excel ou CSV para array de convidados
 */
export async function parseGuestsList(file: File): Promise<ParseSheetResult> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })

    // Busca a aba de dados (geralmente a segunda se a primeira for Instruções)
    let sheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('lista') || n.toLowerCase().includes('convidados'))
    if (!sheetName) sheetName = workbook.SheetNames[0]

    if (!sheetName) {
      return {
        sucesso: false,
        convidados: [],
        erros: [{ linha: 0, campo: 'arquivo', mensagem: 'Arquivo vazio ou sem planilhas' }],
        duplicatas: [],
        totalLinhasProcessadas: 0
      }
    }

    const worksheet = workbook.Sheets[sheetName]
    const dataWithHeaders = XLSX.utils.sheet_to_json<RawGuestRow>(worksheet)

    // Normalizar nomes de colunas para lowercase, sem acentos e sem espaços
    const normalizedData = dataWithHeaders.map(row => {
      const normalized: Record<string, string> = {}
      for (const [key, value] of Object.entries(row)) {
        const normalizedKey = key
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove acentos
          .replace(/[^a-zA-Z0-9]/g, '') // Remove TUDO que não for letra ou número
          .trim()
        normalized[normalizedKey] = String(value || '').trim()
      }
      return normalized
    })

    return processRows(normalizedData as any[])
  } catch (error) {
    return {
      sucesso: false,
      convidados: [],
      erros: [{
        linha: 0,
        campo: 'arquivo',
        mensagem: `Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Desconhecido'}`
      }],
      duplicatas: [],
      totalLinhasProcessadas: 0
    }
  }
}

// ==========================================
// PROCESS ROWS
// ==========================================

function processRows(rows: RawGuestRow[]): ParseSheetResult {
  const convidados: ParsedGuest[] = []
  const erros: ImportError[] = []
  const duplicatas: Array<{ linha: number; nomePrincipal: string; telefone: string }> = []
  const processedNames = new Set<string>() // Para detectar duplicatas DENTRO do arquivo

  rows.forEach((row, index) => {
    const linhaNum = index + 2

    const normalizedRow: Record<string, string> = {}
    for (const [key, value] of Object.entries(row)) {
      normalizedRow[key] = String(value || '').trim()
    }

    // Pular linhas vazias
    if (!normalizedRow['nomecompleto'] && !normalizedRow['nomecompletodotitular'] && !normalizedRow['nomeconvidado']) {
      return
    }

    // Validar campos obrigatórios
    const errors = validateGuestRow(normalizedRow, linhaNum)
    if (errors.length > 0) {
      erros.push(...errors)
      return
    }

    const nomePrincipal =
      normalizedRow['nomecompletodotitular'] ||
      normalizedRow['nomecompleto'] ||
      normalizedRow['nomeconvidado'] ||
      ''

    // Detectar duplicatas usando apenas nome
    const nameKey = nomePrincipal.toLowerCase().trim()
    if (processedNames.has(nameKey)) {
      duplicatas.push({ linha: linhaNum, nomePrincipal, telefone: '' })
      erros.push({
        linha: linhaNum,
        campo: 'nome',
        mensagem: `Duplicata detectada: ${nomePrincipal} já existe nesta importação`
      })
      return
    }
    processedNames.add(nameKey)

    // Parse Acompanhantes
    const companionsList: any[] = []
    const parseBucket = (keys: string[], category: string) => {
      for (const k of keys) {
        if (normalizedRow[k]) {
          const names = parseCompanionsList(normalizedRow[k])
          names.forEach(name => {
            companionsList.push({ name, isConfirmed: false, category })
          })
          break
        }
      }
    }

    parseBucket(['nomecompletodosacompanhantes', 'adultos'], 'adult_paying')
    parseBucket(['criancaspagantes'], 'child_paying')
    parseBucket(['criancasisentas'], 'child_not_paying')

    // Retrocompatibilidade
    if (companionsList.length === 0 && normalizedRow['acompanhantes']) {
      parseCompanionsList(normalizedRow['acompanhantes']).forEach(n => {
        companionsList.push({ name: n, isConfirmed: false, category: 'adult_paying' })
      })
    }

    const guest: ParsedGuest = {
      name: nomePrincipal,
      companions: companionsList.length,
      companionsList,
      telefone: normalizedRow['telefone'] || normalizedRow['whatsapp'] || normalizedRow['celular'] || '',
      grupo: normalizedRow['grupofamilia'] || undefined,
      category: 'adult_paying',
    }

    convidados.push(guest)
  })

  return {
    sucesso: erros.length === 0 && convidados.length > 0,
    convidados,
    erros,
    duplicatas,
    totalLinhasProcessadas: rows.length
  }
}

export function validateGuestRow(row: Record<string, string>, linhaNum: number): ImportError[] {
  const errors: ImportError[] = []
  const nome = row.nomecompletodotitular || row.nomecompleto || row.nomeconvidado
  if (!nome || nome.trim().length === 0) {
    errors.push({
      linha: linhaNum,
      campo: 'nome',
      mensagem: 'Coluna "NOME_COMPLETO_DO_TITULAR" é obrigatória'
    })
  }
  return errors
}

// ==========================================
// DETECT DUPLICATES WITH EXISTING
// ==========================================

export function detectDuplicatesWithExisting(
  newGuests: ParsedGuest[],
  existingGuests: Guest[]
): Array<{ novo: ParsedGuest; existente: Guest; motivo: string }> {
  const duplicates: Array<{ novo: ParsedGuest; existente: Guest; motivo: string }> = []

  newGuests.forEach(newGuest => {
    const found = existingGuests.find(existing =>
      existing.name.toLowerCase().trim() === newGuest.name.toLowerCase().trim()
    )

    if (found) {
      duplicates.push({
        novo: newGuest,
        existente: found,
        motivo: `${newGuest.name} já existe no evento`
      })
    }
  })

  return duplicates
}

// ==========================================
// GENERATE TEMPLATE
// ==========================================

export async function generateImportTemplate(): Promise<Uint8Array> {
  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  const burgundyHex = 'FF702431'

  // Aba Instruções
  const helpSheet = workbook.addWorksheet('Instruções')
  helpSheet.getColumn(1).width = 40
  helpSheet.getColumn(2).width = 80

  const introRow = helpSheet.addRow(['INSTRUÇÕES DE PREENCHIMENTO'])
  introRow.font = { bold: true, size: 14, color: { argb: burgundyHex } }
  helpSheet.addRow([])

  const headerHelp = helpSheet.addRow(['Coluna', 'Como Preencher'])
  headerHelp.font = { bold: true }
  headerHelp.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } })

  const tips = [
    ['NOME_COMPLETO_DO_TITULAR', 'Nome COMPLETO do convidado principal. NÃO use apelidos. (APENAS 1 NOME)'],
    ['NOME_COMPLETO_DOS_ACOMPANHANTES', 'Nomes COMPLETOS de acompanhantes ADULTOS separados por vírgula.(ex: João Silva, Maria Silva).'],
    ['CRIANCAS_PAGANTES', 'Nomes COMPLETOS de crianças PAGANTES separados por vírgula.(ex: Enzo Silva, Maria Silva).'],
    ['CRIANCAS_ISENTAS', 'Nomes COMPLETOS de crianças ISENTAS (não pagantes) separados por vírgula.(ex: Enzo Silva, Maria Silva).'],
    ['GRUPO_FAMILIA', 'Ex: Família Noiva, Amigos Trabalho.'],
    ['TELEFONE', 'Número para WhatsApp com DDD (apenas números).'],
  ]

  tips.forEach(tip => {
    const r = helpSheet.addRow(tip)
    r.getCell(1).font = { bold: true }
    r.eachCell(c => c.alignment = { vertical: 'middle', wrapText: true })
  })

  helpSheet.addRow([])
  const note = helpSheet.addRow(['⚠️ IMPORTANTE: Use sempre o NOME COMPLETO. Apelidos causam erros e duplicidades.'])
  note.font = { bold: true, italic: true, color: { argb: burgundyHex } }

  const tipText = helpSheet.addRow(['💡 DICA: Se você tiver mais de um acompanhante no mesmo convite, basta colocar os nomes completos separados por vírgulas.'])
  tipText.font = { italic: true, color: { argb: 'FF666666' } }

  // Aba Lista
  const worksheet = workbook.addWorksheet('Lista de Convidados')
  worksheet.columns = [
    { header: 'NOME_COMPLETO_DO_TITULAR', key: 'nomecompletodotitular', width: 35 },
    { header: 'NOME_COMPLETO_DOS_ACOMPANHANTES', key: 'nomecompletodosacompanhantes', width: 45 },
    { header: 'CRIANCAS_PAGANTES', key: 'criancas_pagantes', width: 25 },
    { header: 'CRIANCAS_ISENTAS', key: 'criancas_isentas', width: 25 },
    { header: 'GRUPO_FAMILIA', key: 'grupofamilia', width: 20 },
    { header: 'TELEFONE', key: 'telefone', width: 20 },
  ]

  const headerRow = worksheet.getRow(1)
  headerRow.height = 30
  headerRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: burgundyHex } }
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  })

  worksheet.addRow({
    nomecompletodotitular: 'Ex: Roberto Carlos da Silva',
    nomecompletodosacompanhantes: 'Ex: Maria Aparecida Silva',
    criancas_pagantes: 'Ex: Joãozinho Silva',
    criancas_isentas: 'Ex: Bebê Ana',
    grupofamilia: 'Ex: Família Noivo',
    telefone: 'Ex: 11999999999'
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return new Uint8Array(buffer as ArrayBuffer)
}

// ==========================================
// ERROR REPORT
// ==========================================

export function generateErrorReport(result: ParseSheetResult): string {
  let report = `📋 RELATÓRIO DE IMPORTAÇÃO\n${'='.repeat(40)}\n`
  report += `✓ Processadas: ${result.totalLinhasProcessadas}\n`
  report += `✓ Válidos: ${result.convidados.length}\n`
  report += `✗ Erros: ${result.erros.length}\n`
  report += `✗ Duplicatas: ${result.duplicatas.length}\n\n`

  if (result.erros.length > 0) {
    report += `❌ ERROS:\n`
    result.erros.forEach(e => report += `  Linhha ${e.linha}: ${e.mensagem}\n`)
  }

  if (result.duplicatas.length > 0) {
    report += `\n⚠️ DUPLICATAS:\n`
    result.duplicatas.forEach(d => report += `  Linha ${d.linha}: ${d.nomePrincipal}\n`)
  }

  return report
}
