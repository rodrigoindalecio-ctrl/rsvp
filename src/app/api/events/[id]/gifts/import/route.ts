import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { GIFT_TEMPLATES } from '@/lib/gift-templates';

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const eventId = params.id;
        const { category, subcategory, items } = await req.json();

        // Se vieram itens específicos do preview, usá-los diretamente
        const templates = items && Array.isArray(items) && items.length > 0
            ? items
            : GIFT_TEMPLATES.filter(t => {
                const matchCategory = t.category === category;
                const matchSubcategory = subcategory ? t.subcategory === subcategory : true;
                return matchCategory && matchSubcategory;
            });

        if (templates.length === 0) {
            return NextResponse.json({ error: 'Nenhum presente encontrado para esta seleção' }, { status: 400 });
        }

        // Criar presentes em lote para o evento
        const inserts = templates.map((t: any, index: number) => ({
            event_id: eventId,
            name: t.name,
            description: t.description,
            price: t.price,
            category: t.category,
            subcategory: t.subcategory,
            image_url: t.imageUrl,
            is_quota: t.isQuota || false,
            quantity: t.quantity || 1,
            active: true,
            is_custom: false,
            order: index
        }));

        const { error } = await supabaseAdmin.from('gifts').insert(inserts);

        if (error) {
            console.error('[GIFT IMPORT] Supabase error:', JSON.stringify(error));
            return NextResponse.json({ error: error.message, code: error.code, details: error.details }, { status: 500 });
        }

        return NextResponse.json({ ok: true, count: templates.length });

    } catch (e: any) {
        console.error('[GIFT IMPORT] Exception:', e);
        return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
    }
}
