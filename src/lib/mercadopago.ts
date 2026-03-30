import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || '';

if (!accessToken && typeof window === 'undefined') {
    console.warn('⚠️ MERCADOPAGO_ACCESS_TOKEN não configurado no .env.local');
}

export const mpClient = new MercadoPagoConfig({
    accessToken: accessToken,
    options: { timeout: 10000 }
});

export const mpPreference = new Preference(mpClient);
export const mpPayment = new Payment(mpClient);
