import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(
    req: Request,
    { params }: { params: { id: string, giftId: string } }
) {
    try {
        const giftId = params.giftId;
        const { error } = await supabase.from('gifts').delete().eq('id', giftId);

        if (error) throw error;

        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: 'Erro ao excluir item' }, { status: 500 });
    }
}
