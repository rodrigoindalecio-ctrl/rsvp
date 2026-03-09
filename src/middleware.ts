import { NextRequest, NextResponse } from 'next/server'

// Rotas que exigem autenticação (qualquer usuário logado)
const AUTH_REQUIRED_PATHS = ['/dashboard', '/settings']

// Rotas que exigem papel de ADMIN
const ADMIN_REQUIRED_PATHS = ['/admin']

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    // Verificar se a rota exige algum tipo de proteção
    const requiresAuth = AUTH_REQUIRED_PATHS.some(p => pathname.startsWith(p))
    const requiresAdmin = ADMIN_REQUIRED_PATHS.some(p => pathname.startsWith(p))

    if (!requiresAuth && !requiresAdmin) {
        return NextResponse.next()
    }

    // Ler sessão do cookie (gravado via localStorage no auth-context, mais abaixo
    // precisaremos adicionar cookie de sessão — por agora lemos o header customizado
    // que o cliente pode enviar, ou usamos o cookie rsvp_session)
    const sessionCookie = request.cookies.get('rsvp_session')

    if (!sessionCookie?.value) {
        // Sem sessão: redirecionar para login
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    try {
        const session = JSON.parse(decodeURIComponent(sessionCookie.value))

        // Rota de admin: exige role === 'admin'
        if (requiresAdmin && session.role !== 'admin') {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        return NextResponse.next()
    } catch {
        // Cookie corrompido: limpar e redirecionar
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('rsvp_session')
        return response
    }
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/settings/:path*',
        '/admin/:path*',
    ]
}
