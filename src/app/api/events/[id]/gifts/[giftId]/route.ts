import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function DELETE(
    req: Request,
    { params }: { params: { id: string, giftId: string } }
) {
    try {
        const giftId = params.giftId;
        const { error } = await supabaseAdmin.from('gifts').delete().eq('id', giftId);

        if (error) throw error;

        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: 'Erro ao excluir item' }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: { id: string, giftId: string } }
) {
    try {
        const giftId = params.giftId;
        const body = await req.json();

        // Limpar dados para o Supabase
        const updateData = {
            name: body.name,
            description: body.description,
            price: Number(body.price),
            active: body.active !== false,
            image_url: body.imageUrl,
            category: body.category
        };

        const { error } = await supabaseAdmin
            .from('gifts')
            .update(updateData)
            .eq('id', giftId);

        if (error) throw error;

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        console.error('Update Gift Error:', e);
        return NextResponse.json({ error: 'Erro ao atualizar presente' }, { status: 500 });
    }
}
