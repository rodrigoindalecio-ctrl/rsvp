import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/auth-utils'

// Rotas que exigem autenticação (qualquer usuário logado)
const AUTH_REQUIRED_PATHS = ['/dashboard', '/settings']

// Rotas que exigem papel de ADMIN
const ADMIN_REQUIRED_PATHS = ['/admin']

// Rotas públicas que não devem ser acessadas se o usuário já estiver logado
const GUEST_ONLY_PATHS = ['/login', '/']

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    // Verificar se a rota exige algum tipo de proteção ou é de visitante
    const requiresAuth = AUTH_REQUIRED_PATHS.some(p => pathname.startsWith(p))
    const requiresAdmin = ADMIN_REQUIRED_PATHS.some(p => pathname.startsWith(p))
    const isGuestOnly = GUEST_ONLY_PATHS.includes(pathname)

    if (!requiresAuth && !requiresAdmin && !isGuestOnly) {
        return NextResponse.next()
    }

    // Ler sessão do cookie
    const sessionCookie = request.cookies.get('rsvp_session')

    // Se estiver numa rota de visitante (Login ou Home) e TIVER sessão
    if (isGuestOnly) {
        if (sessionCookie?.value) {
            try {
                const session = await decrypt(sessionCookie.value)
                if (session) {
                    // Já está logado, mandar direto pro painel correspondente
                    const dest = session.role === 'admin' ? '/admin/dashboard' : '/dashboard'
                    return NextResponse.redirect(new URL(dest, request.url))
                }
            } catch {
                // Se a sessão for inválida, apenas continua pro Login/Home normal
            }
        }
        return NextResponse.next()
    }

    // A partir daqui, são rotas protegidas
    if (!sessionCookie?.value) {
        // Sem sessão: redirecionar para login
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    try {
        const session = await decrypt(sessionCookie.value)

        if (!session) {
            throw new Error('Sessão inválida')
        }

        // Rota de admin: exige role === 'admin'
        if (requiresAdmin && session.role !== 'admin') {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        return NextResponse.next()
    } catch {
        // Sessão inválida ou expirada: redirecionar
        return NextResponse.redirect(new URL('/login', request.url))
    }
}

export const config = {
    matcher: [
        /*
         * Corresponder a rotas importantes:
         * - Página raiz (/)
         * - Página de login
         * - Todas as rotas de apps (dashboard, admin, settings)
         */
        '/',
        '/login',
        '/dashboard/:path*',
        '/settings/:path*',
        '/admin/:path*',
    ]
}
