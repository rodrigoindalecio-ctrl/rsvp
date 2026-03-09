export interface GiftTemplate {
    name: string;
    description: string;
    price: number;
    category: 'CASA' | 'LUA_DE_MEL' | 'LUA_DE_MEL_INTERNACIONAL' | 'CUSTOM';
    imageUrl: string;
}

export const GIFT_TEMPLATES: GiftTemplate[] = [
    // ── CASA ──────────────────────────────────────────────────────
    {
        name: 'Jogo de Panelas Antiaderentes',
        description: 'Para prepararmos os melhores jantares na nossa casa nova!',
        price: 450,
        category: 'CASA',
        imageUrl: 'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=400&q=80'
    },
    {
        name: 'Jogo de Lençóis Queen Size',
        description: 'Para noites aconchegantes e bem dormidas no nosso ninho.',
        price: 280,
        category: 'CASA',
        imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80'
    },
    {
        name: 'Jogo de Toalhas de Banho 4 peças',
        description: 'Maciez e conforto para os dois!',
        price: 180,
        category: 'CASA',
        imageUrl: 'https://images.unsplash.com/photo-1607937853873-1ac9d5ef7dd5?w=400&q=80'
    },
    {
        name: 'Cafeteira Expresso',
        description: 'Nosso café da manhã fica ainda mais especial.',
        price: 350,
        category: 'CASA',
        imageUrl: 'https://images.unsplash.com/photo-1517256673644-36ad11246d21?w=400&q=80'
    },
    {
        name: 'Air Fryer',
        description: 'Refeições deliciosas e práticas para o dia a dia.',
        price: 500,
        category: 'CASA',
        imageUrl: 'https://images.unsplash.com/photo-1648393806065-4b1bfc08c2c9?w=400&q=80'
    },
    {
        name: 'Liquidificador de Alta Potência',
        description: 'Smoothies, sucos e receitas deliciosas para o nosso lar.',
        price: 220,
        category: 'CASA',
        imageUrl: 'https://images.unsplash.com/photo-1612541069537-8b1a0c4e6d75?w=400&q=80'
    },
    {
        name: 'Aparelho de Jantar 12 peças',
        description: 'Para reunir a família com elegância.',
        price: 320,
        category: 'CASA',
        imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80'
    },
    {
        name: 'Kit Facas e Tábua de Corte',
        description: 'Para cozinharmos juntos com praticidade e estilo.',
        price: 190,
        category: 'CASA',
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80'
    },
    {
        name: 'Micro-ondas Inox',
        description: 'Praticidade essencial no dia a dia da nossa cozinha.',
        price: 600,
        category: 'CASA',
        imageUrl: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&q=80'
    },
    {
        name: 'Cama de Casal Box',
        description: 'O QG dos nossos finais de semana e dos nossos sonhos.',
        price: 1500,
        category: 'CASA',
        imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&q=80'
    },

    // ── LUA DE MEL SIMPLES ────────────────────────────────────────
    {
        name: 'Jantar Romântico à Luz de Velas',
        description: 'Um momento especial para celebrarmos nossa união.',
        price: 250,
        category: 'LUA_DE_MEL',
        imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80'
    },
    {
        name: 'Passeio de Barco ao Pôr do Sol',
        description: 'Uma experiência única navegando juntos no final do dia.',
        price: 300,
        category: 'LUA_DE_MEL',
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80'
    },
    {
        name: 'Spa Casal – Dia de Relaxamento',
        description: 'Massagens e tratamentos para renovar as energias juntos.',
        price: 400,
        category: 'LUA_DE_MEL',
        imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80'
    },
    {
        name: 'Diária Extra em Hotel',
        description: 'Mais um dia juntos em nosso cantinho especial.',
        price: 500,
        category: 'LUA_DE_MEL',
        imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&q=80'
    },
    {
        name: 'Café da Manhã Surpresa na Cama',
        description: 'Começar o dia com amor e delícias.',
        price: 120,
        category: 'LUA_DE_MEL',
        imageUrl: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&q=80'
    },
    {
        name: 'Passeio Cultural e City Tour',
        description: 'Exploring a nova cidade ou destino juntos com guia.',
        price: 200,
        category: 'LUA_DE_MEL',
        imageUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80'
    },
    {
        name: 'Sessão de Fotos Profissional',
        description: 'Para eternizar esse momento mágico em imagens únicas.',
        price: 700,
        category: 'LUA_DE_MEL',
        imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80'
    },
    {
        name: 'Upgrade de Quarto para Suíte',
        description: 'Porque momentos especiais merecem o melhor!',
        price: 350,
        category: 'LUA_DE_MEL',
        imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80'
    },

    // ── CUSTOM ────────────────────────────────────────────────────
    {
        name: 'Fundo para Ração do Pet',
        description: 'Porque nosso melhor amigo também merece comemorar!',
        price: 150,
        category: 'CUSTOM',
        imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80'
    },
];
