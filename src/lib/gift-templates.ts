export interface GiftTemplate {
    name: string;
    description: string;
    price: number;
    category: 'DESTAQUES' | 'INTERNACIONAL' | 'NACIONAL' | 'TEMATICA' | 'CASA' | 'CUSTOM';
    subcategory: string;
    imageUrl: string;
    isQuota?: boolean;
    quantity?: number;
}

export interface CollectionMetadata {
    id: string;
    name: string;
    category: 'DESTAQUES' | 'INTERNACIONAL' | 'NACIONAL' | 'TEMATICA' | 'CASA';
    description: string;
    coverImage: string;
    itemCount: number;
    estimatedTotal: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function col(items: GiftTemplate[]): { itemCount: number; estimatedTotal: number } {
    return {
        itemCount: items.length,
        estimatedTotal: parseFloat(items.reduce((s, i) => s + i.price, 0).toFixed(2)),
    };
}

// ─── Templates por coleção ────────────────────────────────────────────────────

const GRAMADO_ITEMS: GiftTemplate[] = [
    { name: 'Sequência de Fondue Premium', description: 'Noite clássica e aconchegante com fondue de queijo e chocolate.', price: 350, category: 'NACIONAL', subcategory: 'gramado', imageUrl: 'https://images.unsplash.com/photo-1582196016295-f8c8bd4b3a99?w=800&q=80' },
    { name: 'Degustação de Vinhos Serranos', description: 'Uma tarde explorando as melhores vinícolas da Serra Gaúcha.', price: 280, category: 'NACIONAL', subcategory: 'gramado', imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80' },
    { name: 'Spa e Massagem Relaxante', description: 'Spa day completo com massagem para o casal em hotel boutique.', price: 450, category: 'NACIONAL', subcategory: 'gramado', imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80' },
    { name: 'Jantar Romântico à Luz de Velas', description: 'Jantar especial em restaurante premiado com vista para a serra.', price: 600, category: 'NACIONAL', subcategory: 'gramado', imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80' },
    { name: 'Passeio de Mini Trem Histórico', description: 'Passeio pelo centro histórico de Gramado a bordo do mini trem.', price: 120, category: 'NACIONAL', subcategory: 'gramado', imageUrl: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&q=80' },
    { name: 'Chocolate Quente e Raclette', description: 'Tarde perfeita com chocolate quente artesanal e queijo raclette.', price: 180, category: 'NACIONAL', subcategory: 'gramado', imageUrl: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=800&q=80' },
    { name: 'Trilha das Flores com Guia', description: 'Trilha guiada pelos jardins floridos da Serra em todas as estações.', price: 200, category: 'NACIONAL', subcategory: 'gramado', imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80' },
    { name: 'Hospedagem Pousada Boutique (1 diária)', description: 'Diária em pousada charmosa com café da manhã incluso.', price: 800, category: 'NACIONAL', subcategory: 'gramado', imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80' },
    { name: 'Ingresso Festival do Natal Luz', description: 'Experiência mágica no famoso festival de luzes de Gramado.', price: 160, category: 'NACIONAL', subcategory: 'gramado', imageUrl: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=800&q=80' },
    { name: 'Museu do Chocolate Artesanal', description: 'Visita guiada e degustação no museu do chocolate de Gramado.', price: 80, category: 'NACIONAL', subcategory: 'gramado', imageUrl: 'https://images.unsplash.com/photo-1481391243133-f96216dcb5d2?w=800&q=80' },
    { name: 'Cervejaria Artesanal — Degustação', description: 'Rota das cervejas artesanais da Serra Gaúcha.', price: 220, category: 'NACIONAL', subcategory: 'gramado', imageUrl: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800&q=80' },
    { name: 'Passeio ao Lago Negro', description: 'Passeio de pedalinho no Lago Negro em meio às araucárias.', price: 90, category: 'NACIONAL', subcategory: 'gramado', imageUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80' },
    { name: 'Almoço Típico Alemão', description: 'Almoço com pratos típicos da colonização alemã na Serra.', price: 250, category: 'NACIONAL', subcategory: 'gramado', imageUrl: 'https://images.unsplash.com/photo-1481070555726-e2fe8357725c?w=800&q=80' },
    { name: 'Snowland — Day Pass (Casal)', description: 'Dia completo de diversão no parque de neve Snowland.', price: 800, category: 'NACIONAL', subcategory: 'gramado', imageUrl: 'https://images.unsplash.com/photo-1418985991508-e47386d96a71?w=800&q=80' },
    { name: 'Workshop de Fondue', description: 'Aprenda a preparar o fondue perfeito com chef local.', price: 310, category: 'NACIONAL', subcategory: 'gramado', imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80' },
];

const NORONHA_ITEMS: GiftTemplate[] = [
    { name: 'Passeio de Barco "Volta à Ilha"', description: 'Circumnavegação completa da ilha com paradas para mergulho.', price: 600, category: 'NACIONAL', subcategory: 'noronha', imageUrl: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&q=80' },
    { name: 'Mergulho com Cilindro', description: 'Imersão profunda nos cristalinos corais de Noronha.', price: 400, category: 'NACIONAL', subcategory: 'noronha', imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80' },
    { name: 'Snorkel na Baía dos Porcos', description: 'Snorkel na baía mais bonita do Brasil com guia especializado.', price: 250, category: 'NACIONAL', subcategory: 'noronha', imageUrl: 'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=800&q=80' },
    { name: 'Pôr do Sol no Mirante do Boldró', description: 'Experiência inesquecível assistindo ao pôr do sol no mirante.', price: 80, category: 'NACIONAL', subcategory: 'noronha', imageUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&q=80' },
    { name: 'Trilha Atalaia com Guia', description: 'Trilha exclusiva com piscinas naturais e tartarugas marinhas.', price: 180, category: 'NACIONAL', subcategory: 'noronha', imageUrl: 'https://images.unsplash.com/photo-1440342359743-84fcb8c21f21?w=800&q=80' },
    { name: 'Aluguel de Buggy por 1 Dia', description: 'Explore toda a ilha no seu ritmo de buggy.', price: 350, category: 'NACIONAL', subcategory: 'noronha', imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80' },
    { name: 'Observação de Golfinhos', description: 'Assistir ao balé dos golfinhos na Baía dos Golfinhos ao amanhecer.', price: 200, category: 'NACIONAL', subcategory: 'noronha', imageUrl: 'https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?w=800&q=80' },
    { name: 'Jantar com Vista para o Mar', description: 'Jantar ao ar livre com frutos do mar e pôr do sol.', price: 500, category: 'NACIONAL', subcategory: 'noronha', imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80' },
    { name: 'Pousada Premium — 1 Diária', description: 'Hospedagem na melhor pousada da ilha com café da manhã.', price: 1200, category: 'NACIONAL', subcategory: 'noronha', imageUrl: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80' },
    { name: 'Aula de Surf no Mar de Fora', description: 'Aula de surf nas ondas perfeitas do oceano Atlântico.', price: 300, category: 'NACIONAL', subcategory: 'noronha', imageUrl: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&q=80' },
    { name: 'Passeio de Caiaque', description: 'Aventura de caiaque pelas enseadas de água cristalina.', price: 220, category: 'NACIONAL', subcategory: 'noronha', imageUrl: 'https://images.unsplash.com/photo-1482784160316-6eb046863ece?w=800&q=80' },
    { name: 'Fotografia Submarina', description: 'Sessão fotográfica subaquática profissional com mergulhador.', price: 450, category: 'NACIONAL', subcategory: 'noronha', imageUrl: 'https://images.unsplash.com/photo-1551244072-5d12893278bc?w=800&q=80' },
    { name: 'Trilha Noturna Guiada', description: 'Observação de estrelas na trilha noturna com guia astronômico.', price: 160, category: 'NACIONAL', subcategory: 'noronha', imageUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&q=80' },
    { name: 'Passeio de Jangada', description: 'Meia tarde em jangada tradicional nas águas azul-turquesa.', price: 350, category: 'NACIONAL', subcategory: 'noronha', imageUrl: 'https://images.unsplash.com/photo-1534008897995-27a23e859048?w=800&q=80' },
    { name: 'Caipirinhas no Mirante', description: 'Tarde de drinks artesanais na barraca mais famosa da ilha.', price: 80, category: 'NACIONAL', subcategory: 'noronha', imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&q=80' },
];

const COTAS_LUA_DE_MEL_ITEMS: GiftTemplate[] = [
    { name: 'Cota de Passagens Aéreas', description: 'Contribuição para a viagem dos sonhos do casal.', price: 500, category: 'DESTAQUES', subcategory: 'cotas-lua-de-mel', imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109c0f2?w=800&q=80', isQuota: true, quantity: 10 },
    { name: 'Diária em Hotel 5 Estrelas', description: 'Uma noite especial em hotel de luxo no destino escolhido.', price: 2000, category: 'DESTAQUES', subcategory: 'cotas-lua-de-mel', imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80' },
    { name: 'Aluguel de Carro Conversível', description: 'Liberdade para explorar o destino com estilo.', price: 1500, category: 'DESTAQUES', subcategory: 'cotas-lua-de-mel', imageUrl: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&q=80' },
    { name: 'Jantar Romântico à Beira-Mar', description: 'Mesa reservada para o casal em restaurante premium.', price: 800, category: 'DESTAQUES', subcategory: 'cotas-lua-de-mel', imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80' },
    { name: 'Passeio de Iate Privativo', description: 'Tarde exclusiva a bordo de um iate com champagne.', price: 3000, category: 'DESTAQUES', subcategory: 'cotas-lua-de-mel', imageUrl: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&q=80' },
    { name: 'Spa Day para o Casal', description: 'Dia de beleza e relaxamento no spa do hotel.', price: 1200, category: 'DESTAQUES', subcategory: 'cotas-lua-de-mel', imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80' },
    { name: 'Champagne e Surpresa no Quarto', description: 'Garrafa de champagne importada com decoração romântica.', price: 400, category: 'DESTAQUES', subcategory: 'cotas-lua-de-mel', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80' },
    { name: 'Sessão Fotográfica Profissional', description: 'Memórias eternas registradas por fotógrafo profissional.', price: 2500, category: 'DESTAQUES', subcategory: 'cotas-lua-de-mel', imageUrl: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&q=80' },
    { name: 'City Tour Privativo', description: 'Passeio exclusivo pelos melhores pontos do destino.', price: 900, category: 'DESTAQUES', subcategory: 'cotas-lua-de-mel', imageUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&q=80' },
    { name: 'Pequena Cota de Lua de Mel', description: 'Contribuição especial para a viagem dos noivos.', price: 100, category: 'DESTAQUES', subcategory: 'cotas-lua-de-mel', imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80', isQuota: true, quantity: 20 },
    { name: 'Ingresso para Show Internacional', description: 'Noite especial em show ou ópera no destino.', price: 1500, category: 'DESTAQUES', subcategory: 'cotas-lua-de-mel', imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80' },
    { name: 'Mergulho Exclusivo no Destino', description: 'Experiência de mergulho nas águas do destino escolhido.', price: 700, category: 'DESTAQUES', subcategory: 'cotas-lua-de-mel', imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80' },
];

const OPEN_HOUSE_ITEMS: GiftTemplate[] = [
    { name: 'Jogo de Panelas Premium 7 Peças', description: 'Conjunto completo em aço inox para a cozinha dos sonhos.', price: 800, category: 'DESTAQUES', subcategory: 'open-house', imageUrl: 'https://images.unsplash.com/photo-1584284778588-a5b2b4e8ee5f?w=800&q=80' },
    { name: 'Cafeteira Espresso Profissional', description: 'Café de barista no conforto da sua casa.', price: 900, category: 'DESTAQUES', subcategory: 'open-house', imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80' },
    { name: 'Jogo de Toalhas de Banho', description: 'Kit completo de toalhas felpudas de algodão egípcio.', price: 280, category: 'DESTAQUES', subcategory: 'open-house', imageUrl: 'https://images.unsplash.com/photo-1583845112203-29329902332e?w=800&q=80' },
    { name: 'Kit Ferramentas Domésticas', description: 'Tudo para montar e organizar o novo lar.', price: 200, category: 'DESTAQUES', subcategory: 'open-house', imageUrl: 'https://images.unsplash.com/photo-1416339684178-3a239570f315?w=800&q=80' },
    { name: 'Ventilador de Teto Design', description: 'Ventilador elegante com controle de velocidade e iluminação.', price: 500, category: 'DESTAQUES', subcategory: 'open-house', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80' },
    { name: 'Organizador de Closet Completo', description: 'Sistema modular para deixar o guarda-roupas impecável.', price: 450, category: 'DESTAQUES', subcategory: 'open-house', imageUrl: 'https://images.unsplash.com/photo-1558618047-3a67c21e3c92?w=800&q=80' },
    { name: 'Tapete Decorativo Sala', description: 'Tapete de design escandinavo para sala de estar.', price: 380, category: 'DESTAQUES', subcategory: 'open-house', imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80' },
    { name: 'Conjunto de Talheres 72 Peças', description: 'Talheres de aço inox polido para as melhores ocasiões.', price: 350, category: 'DESTAQUES', subcategory: 'open-house', imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80' },
    { name: 'Luminária de Chão Design', description: 'Luminária moderna para compor a decoração da sala.', price: 320, category: 'DESTAQUES', subcategory: 'open-house', imageUrl: 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=800&q=80' },
    { name: 'Jogo de Cama Queen Egípcio', description: 'Lençóis de algodão 400 fios para noites luxuosas.', price: 600, category: 'DESTAQUES', subcategory: 'open-house', imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80' },
];

const PRESENTES_CASAMENTO_ITEMS: GiftTemplate[] = [
    { name: 'Aparelho de Jantar 60 Peças', description: 'Porcelana fina para receber com elegância os convidados.', price: 1200, category: 'DESTAQUES', subcategory: 'presentes-casamento', imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80' },
    { name: 'TV 65" QLED 4K', description: 'Smart TV com resolução de cinema para o lar dos noivos.', price: 5000, category: 'DESTAQUES', subcategory: 'presentes-casamento', imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=800&q=80' },
    { name: 'Aspirador Robô Inteligente', description: 'Limpeza automática com mapeamento inteligente da casa.', price: 2500, category: 'DESTAQUES', subcategory: 'presentes-casamento', imageUrl: 'https://images.unsplash.com/photo-1558618047-3a67c21e3c92?w=800&q=80' },
    { name: 'Batedeira Planetária Premium', description: 'Design elegante e motor potente para a cozinha.', price: 2500, category: 'DESTAQUES', subcategory: 'presentes-casamento', imageUrl: 'https://images.unsplash.com/photo-1594385208974-2e75f9d8a847?w=800&q=80' },
    { name: 'Adega de Vinhos 24 Garrafas', description: 'Adega tempertada para conservar os melhores vinhos.', price: 1500, category: 'DESTAQUES', subcategory: 'presentes-casamento', imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80' },
    { name: 'Máquina Fotográfica DSLR Kit', description: 'Câmera profissional para registrar todas as memórias.', price: 4000, category: 'DESTAQUES', subcategory: 'presentes-casamento', imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80' },
    { name: 'Kit Churrasco Premium 20 Peças', description: 'Tudo para o churrasco mais especial com os amigos.', price: 800, category: 'DESTAQUES', subcategory: 'presentes-casamento', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80' },
    { name: 'Lava-Louças 14 Serviços', description: 'Mais tempo de qualidade e louças sempre brilhando.', price: 3500, category: 'DESTAQUES', subcategory: 'presentes-casamento', imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80' },
    { name: 'Liquidificador de Alta Performance', description: 'Processa qualquer ingrediente com potência máxima.', price: 900, category: 'DESTAQUES', subcategory: 'presentes-casamento', imageUrl: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=800&q=80' },
    { name: 'Jogo de Copos Cristal 12 Peças', description: 'Copos de cristal lapidado para ocasiões especiais.', price: 450, category: 'DESTAQUES', subcategory: 'presentes-casamento', imageUrl: 'https://images.unsplash.com/photo-1558618047-3a67c21e3c92?w=800&q=80' },
];

const ABU_DHABI_ITEMS: GiftTemplate[] = [
    { name: 'Jantar no Emirates Palace', description: 'Experiência gastronômica 7 estrelas no palácio mais luxuoso.', price: 2000, category: 'INTERNACIONAL', subcategory: 'abu-dhabi', imageUrl: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80' },
    { name: 'Desert Safari com Jantar', description: 'Safari noturno pelas dunas com jantar beduíno sob as estrelas.', price: 1200, category: 'INTERNACIONAL', subcategory: 'abu-dhabi', imageUrl: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800&q=80' },
    { name: 'Ferrari World — 2 Ingressos', description: 'Adrenalina no maior parque temático indoor do planeta.', price: 900, category: 'INTERNACIONAL', subcategory: 'abu-dhabi', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80' },
    { name: 'Tour Mesquita Sheikh Zayed', description: 'Visita guiada à mesquita mais imponente do mundo.', price: 300, category: 'INTERNACIONAL', subcategory: 'abu-dhabi', imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80' },
    { name: 'Passeio de Dhow pelo Golfo', description: 'Cruzeiro tradicional em barco árabe pelo Golfo Pérsico.', price: 600, category: 'INTERNACIONAL', subcategory: 'abu-dhabi', imageUrl: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&q=80' },
    { name: 'Spa Emirates Palace', description: 'Tratamento de spa em um dos hotéis mais luxuosos do mundo.', price: 1500, category: 'INTERNACIONAL', subcategory: 'abu-dhabi', imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80' },
    { name: 'Duna Bashing Adventure', description: 'Adrenalina nas dunas com veículo 4x4 e guia especializado.', price: 700, category: 'INTERNACIONAL', subcategory: 'abu-dhabi', imageUrl: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800&q=80' },
    { name: 'Louvre Abu Dhabi', description: 'Visita guiada ao museu mais moderno do Oriente Médio.', price: 400, category: 'INTERNACIONAL', subcategory: 'abu-dhabi', imageUrl: 'https://images.unsplash.com/photo-1580143381961-8f6fc900dcfa?w=800&q=80' },
    { name: 'Pôr do Sol no Deserto', description: 'Experiência mágica assistindo o sol se pôr sobre as dunas douradas.', price: 500, category: 'INTERNACIONAL', subcategory: 'abu-dhabi', imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80' },
    { name: 'Yas Waterworld — Casal', description: 'Dia de adrenalina no maior parque aquático do Médio Oriente.', price: 800, category: 'INTERNACIONAL', subcategory: 'abu-dhabi', imageUrl: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80' },
];

const AFRICA_DO_SUL_ITEMS: GiftTemplate[] = [
    { name: 'Safari no Kruger National Park', description: 'O Big Five: leão, leopardo, rinoceronte, búfalo e elefante.', price: 2500, category: 'INTERNACIONAL', subcategory: 'africa-do-sul', imageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&q=80' },
    { name: 'Degustação na Rota dos Vinhos', description: 'Stellenbosch e Franschhoek — os melhores vinhos do mundo.', price: 800, category: 'INTERNACIONAL', subcategory: 'africa-do-sul', imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80' },
    { name: 'Tour Robben Island', description: 'Visite a cela de Nelson Mandela e entenda a história.', price: 400, category: 'INTERNACIONAL', subcategory: 'africa-do-sul', imageUrl: 'https://images.unsplash.com/photo-1580143381961-8f6fc900dcfa?w=800&q=80' },
    { name: 'Teleférico Table Mountain', description: 'Subida dramática à "mesa coberta de nuvens" de Cape Town.', price: 500, category: 'INTERNACIONAL', subcategory: 'africa-do-sul', imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80' },
    { name: 'Cabo da Boa Esperança Tour', description: 'Onde dois oceanos se encontram — o fim do mundo.', price: 600, category: 'INTERNACIONAL', subcategory: 'africa-do-sul', imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80' },
    { name: 'Mergulho com Tubarões', description: 'Experiência radical em gaiola nas águas de Gansbaai.', price: 1800, category: 'INTERNACIONAL', subcategory: 'africa-do-sul', imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80' },
    { name: 'City Tour em Cape Town', description: 'Bairros coloridos de Bo-Kaap e história da cidade do Cabo.', price: 700, category: 'INTERNACIONAL', subcategory: 'africa-do-sul', imageUrl: 'https://images.unsplash.com/photo-1580143381961-8f6fc900dcfa?w=800&q=80' },
    { name: 'Colônia de Pinguins — Simon\'s Town', description: 'Encontro fofo com centenas de pinguins africanos.', price: 350, category: 'INTERNACIONAL', subcategory: 'africa-do-sul', imageUrl: 'https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=800&q=80' },
    { name: 'Garden Route — 1 Dia', description: 'Um dos cenários naturais mais belos do mundo.', price: 900, category: 'INTERNACIONAL', subcategory: 'africa-do-sul', imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80' },
    { name: 'Jantar no Topo Table Mountain', description: 'Jantar em restaurante panorâmico com Cape Town aos pés.', price: 1200, category: 'INTERNACIONAL', subcategory: 'africa-do-sul', imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80' },
];

const ADOCAO_ANIMAIS_ITEMS: GiftTemplate[] = [
    { name: 'Cota de Ração Mensal', description: 'Um mês de alimentação para um animal em abrigo.', price: 150, category: 'TEMATICA', subcategory: 'adocao-animais', imageUrl: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&q=80', isQuota: true },
    { name: 'Cota de Vacinas', description: 'Vacinas essenciais para proteger animais adotados.', price: 200, category: 'TEMATICA', subcategory: 'adocao-animais', imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80', isQuota: true },
    { name: 'Cota de Castração', description: 'Contribuição para controle responsável da população animal.', price: 350, category: 'TEMATICA', subcategory: 'adocao-animais', imageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4a?w=800&q=80', isQuota: true },
    { name: 'Kit Brinquedos para Pets', description: 'Brinquedos e mimos para os pets do abrigo.', price: 80, category: 'TEMATICA', subcategory: 'adocao-animais', imageUrl: 'https://images.unsplash.com/photo-1601758124096-519fef35e7e5?w=800&q=80' },
    { name: 'Colar GPS para Pet Adotado', description: 'Segurança e rastreamento para o novo lar do pet.', price: 180, category: 'TEMATICA', subcategory: 'adocao-animais', imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80' },
    { name: 'Cota de Abrigo Mensal', description: 'Suporte para manutenção de abrigos independentes.', price: 300, category: 'TEMATICA', subcategory: 'adocao-animais', imageUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80', isQuota: true },
    { name: 'Plano de Saúde Pet', description: 'Plano veterinário completo para um animal adotado.', price: 250, category: 'TEMATICA', subcategory: 'adocao-animais', imageUrl: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&q=80' },
    { name: 'Comedouro Premium Automático', description: 'Alimentação programada e inteligente para o pet.', price: 120, category: 'TEMATICA', subcategory: 'adocao-animais', imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80' },
];

const CHA_BAR_ITEMS: GiftTemplate[] = [
    { name: 'Kit de Cervejas Artesanais', description: 'Seleção premium de cervejas artesanais nacionais e importadas.', price: 280, category: 'TEMATICA', subcategory: 'cha-bar', imageUrl: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800&q=80' },
    { name: 'Conjunto de Taças de Cristal', description: 'Taças de cristal para servir com classe em qualquer ocasião.', price: 150, category: 'TEMATICA', subcategory: 'cha-bar', imageUrl: 'https://images.unsplash.com/photo-1558618047-3a67c21e3c92?w=800&q=80' },
    { name: 'Adega Doméstica 12 Garrafas', description: 'Temperatura perfeita para conservar os melhores rótulos.', price: 500, category: 'TEMATICA', subcategory: 'cha-bar', imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80' },
    { name: 'Kit Drinks Exóticos', description: 'Ingredientes selecionados para coquetéis surpreendentes.', price: 200, category: 'TEMATICA', subcategory: 'cha-bar', imageUrl: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=800&q=80' },
    { name: 'Mesa de Frios e Charcuterie', description: 'Embutidos, queijos e acompanhamentos importados.', price: 350, category: 'TEMATICA', subcategory: 'cha-bar', imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80' },
    { name: 'Kit Aperol Spritz Completo', description: 'Tudo para o brinde perfeito: Aperol, Prosecco e laranja.', price: 180, category: 'TEMATICA', subcategory: 'cha-bar', imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80' },
    { name: 'Kit Whiskys Importados', description: 'Seleção single malt escoceses para os apreciadores.', price: 800, category: 'TEMATICA', subcategory: 'cha-bar', imageUrl: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=800&q=80' },
    { name: 'Acessórios de Bartender Pro', description: 'Shaker, coqueteleira, muddler — tudo para o bar doméstico.', price: 280, category: 'TEMATICA', subcategory: 'cha-bar', imageUrl: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=800&q=80' },
];

// ─── Exportações ──────────────────────────────────────────────────────────────

export const GIFT_TEMPLATES: GiftTemplate[] = [
    ...GRAMADO_ITEMS,
    ...NORONHA_ITEMS,
    ...COTAS_LUA_DE_MEL_ITEMS,
    ...OPEN_HOUSE_ITEMS,
    ...PRESENTES_CASAMENTO_ITEMS,
    ...ABU_DHABI_ITEMS,
    ...AFRICA_DO_SUL_ITEMS,
    ...ADOCAO_ANIMAIS_ITEMS,
    ...CHA_BAR_ITEMS,
];

export const COLLECTIONS: CollectionMetadata[] = [
    {
        id: 'cotas-lua-de-mel',
        name: 'Cotas de lua de mel',
        category: 'DESTAQUES',
        description: 'Contribua para a viagem dos sonhos dos noivos.',
        coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
        ...col(COTAS_LUA_DE_MEL_ITEMS),
    },
    {
        id: 'open-house',
        name: 'Open House',
        category: 'DESTAQUES',
        description: 'Itens essenciais para montar o novo lar perfeito.',
        coverImage: 'https://images.unsplash.com/photo-1556911220-e1502da02721?w=800&q=80',
        ...col(OPEN_HOUSE_ITEMS),
    },
    {
        id: 'presentes-casamento',
        name: 'Presentes de casamento',
        category: 'DESTAQUES',
        description: 'A lista clássica com os itens que todo casal precisa.',
        coverImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80',
        ...col(PRESENTES_CASAMENTO_ITEMS),
    },
    {
        id: 'abu-dhabi',
        name: 'Abu Dhabi',
        category: 'INTERNACIONAL',
        description: 'Uma seleção de experiências incríveis em Abu Dhabi.',
        coverImage: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80',
        ...col(ABU_DHABI_ITEMS),
    },
    {
        id: 'africa-do-sul',
        name: 'África do Sul',
        category: 'INTERNACIONAL',
        description: 'Aventura, safari e luxury em Cape Town.',
        coverImage: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&q=80',
        ...col(AFRICA_DO_SUL_ITEMS),
    },
    {
        id: 'noronha',
        name: 'Fernando de Noronha',
        category: 'NACIONAL',
        description: 'O paraíso brasileiro com experiências únicas.',
        coverImage: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=800&q=80',
        ...col(NORONHA_ITEMS),
    },
    {
        id: 'gramado',
        name: 'Gramado',
        category: 'NACIONAL',
        description: 'Charme e romantismo na bela Serra Gaúcha.',
        coverImage: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80',
        ...col(GRAMADO_ITEMS),
    },
    {
        id: 'adocao-animais',
        name: 'Adoção de animais',
        category: 'TEMATICA',
        description: 'Cotas solidárias para ajudar animais que precisam de lar.',
        coverImage: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&q=80',
        ...col(ADOCAO_ANIMAIS_ITEMS),
    },
    {
        id: 'cha-bar',
        name: 'Chá Bar',
        category: 'TEMATICA',
        description: 'Tudo para montar o bar dos sonhos em casa.',
        coverImage: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
        ...col(CHA_BAR_ITEMS),
    },
];

// Mapa de IDs para nomes legíveis (usado na vitrine pública)
export const SUBCATEGORY_NAMES: Record<string, string> = {
    'gramado': 'Gramado',
    'noronha': 'Fernando de Noronha',
    'abu-dhabi': 'Abu Dhabi',
    'africa-do-sul': 'África do Sul',
    'cotas-lua-de-mel': 'Cotas de Lua de Mel',
    'open-house': 'Open House',
    'presentes-casamento': 'Presentes de Casamento',
    'adocao-animais': 'Adoção de Animais',
    'cha-bar': 'Chá Bar',
    'eletrodomesticos': 'Eletrodomésticos',
};
