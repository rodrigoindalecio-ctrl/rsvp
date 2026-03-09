import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyEventOwnership } from '@/lib/verify-ownership';

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const eventId = params.id;

        // 🔒 Verificar propriedade
        const ownership = await verifyEventOwnership(req, eventId)
        if (!ownership.authorized) return ownership.response

        const data = await req.json();

        if (data.slug) {
            const { data: existing } = await supabase
                .from('events')
                .select('id')
                .eq('slug', data.slug)
                .neq('id', eventId)
                .single();

            if (existing) {
                return NextResponse.json({ error: 'Este endereço já está em uso por outro evento.' }, { status: 400 });
            }
        }

        const { data: updated, error } = await supabase
            .from('events')
            .update({
                slug: data.slug,
                gift_list_enabled: data.giftListEnabled,
                tax_payer: data.taxPayer,
                bank_pix_key: data.bankPixKey,
                bank_type: data.bankType,
                bank_beneficiary: data.bankBeneficiary
            })
            .eq('id', eventId)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return NextResponse.json(updated);

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 });
    }
}
