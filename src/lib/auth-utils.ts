import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'secret-key-fallback-for-dev-only'
)

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret)
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, secret, {
    algorithms: ['HS256'],
  })
  return payload
}

export async function getSession() {
  const session = cookies().get('rsvp_session')?.value
  if (!session) return null
  try {
    return await decrypt(session)
  } catch (err) {
    return null
  }
}

/**
 * Verifica se a requisição tem a chave secreta interna.
 */
export function verifyInternalKey(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const internalKey = process.env.INTERNAL_API_KEY
  
  if (!internalKey) return false
  
  // Suporta 'Bearer key' ou apenas 'key'
  const key = authHeader?.replace('Bearer ', '')
  return key === internalKey
}

/**
 * Verifica se a requisição é autorizada.
 * Aceita EITHER um token de sessão válido (cookie) OU a chave interna (header).
 */
export async function verifyAuth(req: NextRequest, requireAdmin = false) {
  // 1. Verificar Chave Interna (Server-to-Server)
  if (verifyInternalKey(req)) return true

  // 2. Verificar Sessão (Browser)
  const session = await getSession()
  if (!session) return false

  if (requireAdmin && session.role !== 'admin') return false

  return true
}
