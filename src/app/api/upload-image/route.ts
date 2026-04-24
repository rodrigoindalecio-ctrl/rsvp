import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BUCKET_NAME = 'event-images'

// Admin client usando service role — bypassa RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
)

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File | null
        const folder = (formData.get('folder') as string) || 'misc'

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
        }

        const timestamp = Date.now()
        const rand = Math.random().toString(36).substring(2, 8)
        const ext = file.name?.split('.').pop() || 'jpg'
        const filePath = `${folder}/${timestamp}_${rand}.${ext}`

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const { data, error } = await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .upload(filePath, buffer, {
                contentType: file.type || 'image/jpeg',
                cacheControl: '31536000',
                upsert: false,
            })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const { data: urlData } = supabaseAdmin.storage
            .from(BUCKET_NAME)
            .getPublicUrl(data.path)

        return NextResponse.json({ url: urlData.publicUrl })
    } catch (err: any) {
        console.error('[upload-image] Erro inesperado:', err)
        return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
    }
}
