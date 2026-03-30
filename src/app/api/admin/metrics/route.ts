import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAuth } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const isAuth = await verifyAuth(req, true);
        if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        
        // 1. Pending Withdrawals
        const { count: pendingWithdrawals } = await supabaseAdmin
            .from('withdrawals')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'PENDING');

        // 2. New Users (24h)
        const { count: newUsers } = await supabaseAdmin
            .from('admin_users')
            .select('*', { count: 'exact', head: true })
            .gt('created_at', yesterday);

        // 3. Events today/tomorrow
        const todayStr = now.toISOString().split('T')[0];
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const { count: upcomingEvents } = await supabaseAdmin
            .from('events')
            .select('*', { count: 'exact', head: true })
            .or(`event_date.eq.${todayStr},event_date.eq.${tomorrowStr}`);

        // 4. Transaction History (last 7 days) & Anomalies
        const { data: recentTxs, error: txError } = await supabaseAdmin
            .from('gift_transactions')
            .select('amount_gross, amount_fee, created_at, event_id')
            .eq('status', 'APPROVED')
            .gt('created_at', sevenDaysAgo)
            .order('created_at', { ascending: true });

        if (txError) throw txError;

        // Group transactions by day for the chart
        const history: Record<string, { total: number, count: number }> = {};
        for (let i = 0; i < 7; i++) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            history[date] = { total: 0, count: 0 };
        }

        let totalRevenue = 0;
        let anomalies: any[] = [];
        const eventRecentCounts: Record<string, { count: number, lastTx: Date }> = {};

        recentTxs?.forEach(tx => {
            const date = tx.created_at.split('T')[0];
            if (history[date]) {
                history[date].total += Number(tx.amount_gross);
                history[date].count += 1;
            }
            totalRevenue += Number(tx.amount_fee);

            // Basic Anomaly Detection: > 5 txs in 1 hour for same event
            const txTime = new Date(tx.created_at);
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
            
            if (txTime > oneHourAgo) {
                eventRecentCounts[tx.event_id] = {
                    count: (eventRecentCounts[tx.event_id]?.count || 0) + 1,
                    lastTx: txTime
                };
            }
        });

        // Identify anomalies
        Object.keys(eventRecentCounts).forEach(eid => {
            if (eventRecentCounts[eid].count >= 5) {
                anomalies.push({
                    event_id: eid,
                    count: eventRecentCounts[eid].count,
                    type: 'HIGH_VOLUME_SHORT_TIME'
                });
            }
        });

        return NextResponse.json({
            pendingWithdrawals: pendingWithdrawals || 0,
            newUsers: newUsers || 0,
            upcomingEvents: upcomingEvents || 0,
            totalRevenue,
            transactionHistory: Object.entries(history).map(([date, val]) => ({ date, ...val })).reverse(),
            anomalies
        });

    } catch (e: any) {
        console.error('[ADMIN METRICS]', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
