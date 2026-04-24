/**
 * Login Rate Limiter — proteção contra brute force
 * 
 * Rastreia tentativas falhas por IP e por email.
 * Após MAX_ATTEMPTS erros → bloqueia por BLOCK_DURATION_MS.
 * 
 * Usa Map em memória (funciona em produção serverless com caveats de cold start,
 * mas é eficaz contra a maioria dos ataques reais).
 */

const MAX_ATTEMPTS = 5                  // tentativas antes do bloqueio
const BLOCK_DURATION_MS = 15 * 60_000  // 15 minutos de bloqueio
const ATTEMPT_WINDOW_MS = 10 * 60_000  // janela de 10 min para contar tentativas

interface AttemptRecord {
    count: number
    firstAttemptAt: number
    blockedUntil: number | null
}

// Mapas separados para IP e email
const ipAttempts = new Map<string, AttemptRecord>()
const emailAttempts = new Map<string, AttemptRecord>()

function getRecord(map: Map<string, AttemptRecord>, key: string): AttemptRecord {
    const now = Date.now()
    const record = map.get(key)

    if (!record) {
        return { count: 0, firstAttemptAt: now, blockedUntil: null }
    }

    // Se a janela de tempo expirou e não está bloqueado, resetar
    if (!record.blockedUntil && now - record.firstAttemptAt > ATTEMPT_WINDOW_MS) {
        return { count: 0, firstAttemptAt: now, blockedUntil: null }
    }

    return record
}

/**
 * Verifica se um IP ou email está bloqueado.
 * Retorna { blocked: false } se permitido,
 * ou { blocked: true, remainingMs } se bloqueado.
 */
export function checkLoginAllowed(ip: string, email: string): 
    | { blocked: false }
    | { blocked: true; remainingMs: number; reason: 'ip' | 'email' } 
{
    const now = Date.now()

    const ipRecord = getRecord(ipAttempts, ip)
    const emailRecord = getRecord(emailAttempts, email.toLowerCase())

    // Verificar bloqueio de IP
    if (ipRecord.blockedUntil && now < ipRecord.blockedUntil) {
        return { blocked: true, remainingMs: ipRecord.blockedUntil - now, reason: 'ip' }
    }

    // Verificar bloqueio de email
    if (emailRecord.blockedUntil && now < emailRecord.blockedUntil) {
        return { blocked: true, remainingMs: emailRecord.blockedUntil - now, reason: 'email' }
    }

    // Desbloquear se o tempo expirou
    if (ipRecord.blockedUntil && now >= ipRecord.blockedUntil) {
        ipAttempts.delete(ip)
    }
    if (emailRecord.blockedUntil && now >= emailRecord.blockedUntil) {
        emailAttempts.delete(email.toLowerCase())
    }

    return { blocked: false }
}

/**
 * Registra uma tentativa falha de login.
 * Se atingir MAX_ATTEMPTS, bloqueia por BLOCK_DURATION_MS.
 */
export function recordFailedAttempt(ip: string, email: string): {
    attemptsLeft: number
    blocked: boolean
} {
    const now = Date.now()

    // Atualizar IP
    const ipRecord = getRecord(ipAttempts, ip)
    ipRecord.count++
    if (ipRecord.count >= MAX_ATTEMPTS) {
        ipRecord.blockedUntil = now + BLOCK_DURATION_MS
    }
    ipAttempts.set(ip, ipRecord)

    // Atualizar email
    const emailRecord = getRecord(emailAttempts, email.toLowerCase())
    emailRecord.count++
    if (emailRecord.count >= MAX_ATTEMPTS) {
        emailRecord.blockedUntil = now + BLOCK_DURATION_MS
    }
    emailAttempts.set(email.toLowerCase(), emailRecord)

    const attemptsLeft = Math.max(0, MAX_ATTEMPTS - Math.max(ipRecord.count, emailRecord.count))
    const blocked = ipRecord.blockedUntil !== null || emailRecord.blockedUntil !== null

    return { attemptsLeft, blocked }
}

/**
 * Limpa os registros após login bem-sucedido.
 */
export function clearLoginAttempts(ip: string, email: string): void {
    ipAttempts.delete(ip)
    emailAttempts.delete(email.toLowerCase())
}

/**
 * Formata o tempo de bloqueio em texto legível.
 */
export function formatBlockTime(ms: number): string {
    const minutes = Math.ceil(ms / 60_000)
    return minutes === 1 ? '1 minuto' : `${minutes} minutos`
}
