'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Lock, 
  ShieldCheck, 
  Percent, 
  Banknote, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Download, 
  Heart, 
  Sparkles, 
  Clock, 
  Users, 
  ChevronDown,
  Gift,
  FileSpreadsheet,
  MapPin,
  MessageCircleHeart
} from 'lucide-react'

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const toggleFaq = (idx: number) => {
    setOpenFaq(prev => prev === idx ? null : idx)
  }

  const faqItems = [
    {
      q: 'Como funciona a Lista Trancada anti-penetras?',
      a: 'Você cadastra a sua lista oficial de convidados (manualmente ou importando uma planilha do Excel). Quando a pessoa acessa o site para confirmar presença, o sistema faz uma busca inteligente: ela só consegue confirmar se o nome dela constar na lista. Além disso, ela só pode confirmar a si mesma e aos acompanhantes que você pré-autorizou por família. Sem confirmações extras indesejadas e com controle exato para o buffet.'
    },
    {
      q: 'Qual é a taxa sobre a Lista de Presentes em dinheiro?',
      a: 'Nossa taxa de intermediação é de apenas 5,49%, uma das mais baixas e justas do mercado de casamentos. Ela cobre todos os custos de processamento bancário seguro, antifraude e infraestrutura.'
    },
    {
      q: 'Posso repassar a taxa de 5,49% para o convidado?',
      a: 'Sim! No painel dos noivos você tem total liberdade: pode escolher "Absorver a taxa" (onde você recebe o valor com desconto de 5,49%) ou "Repassar ao convidado" (uma pequena taxa adicional é calculada no checkout e você recebe 100% líquido do valor do presente direto na sua conta).'
    },
    {
      q: 'Qual é o prazo para o saque cair na minha conta bancária?',
      a: 'O saque é solicitado com 1 clique direto no painel para a sua chave Pix cadastrada. Após a solicitação, o repasse é creditado via Pix em até 1 dia útil (D+1), com histórico financeiro detalhado e transparente em tempo real.'
    },
    {
      q: 'Posso exportar a lista de confirmações para a cerimonialista e o buffet?',
      a: 'Com certeza! Você pode baixar a qualquer momento um relatório completo em Excel (.xlsx) contendo todos os confirmados, acompanhantes, contatos de telefone, mensagens e contagem precisa de adultos e crianças pagantes/não pagantes.'
    }
  ]

  return (
    <div className="min-h-screen bg-[#fcfafa] selection:bg-brand selection:text-white">
      
      {/* ── TOP HEADER (Minimalist & Clean) ────────────────────────────── */}
      <header className="absolute top-0 left-0 right-0 h-24 px-6 md:px-12 flex items-center justify-between z-20 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
          <span className="text-[11px] font-black uppercase tracking-[0.35em] text-text-primary">
            VB Assessoria & Cerimonial
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-text-primary transition-colors px-3 py-2"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="text-[10px] font-black uppercase tracking-[0.25em] text-white bg-brand hover:bg-brand-dark transition-all px-4 py-2 rounded-full shadow-md shadow-brand/20"
          >
            Criar Conta Grátis →
          </Link>
        </div>
      </header>

      {/* 🥇 SEÇÃO 1: HERO PRINCIPAL */}
      <section className="relative pt-36 pb-24 md:pt-56 md:pb-36 px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-10 md:space-y-12">
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-12 h-px bg-brand/30" />
            <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.35em] text-brand bg-brand/5 px-5 py-2 rounded-full border border-brand/10">
              Plataforma Premium de RSVP & Presentes em Dinheiro
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="text-4xl sm:text-5xl md:text-7xl font-serif text-text-primary leading-[1.12] tracking-tight"
          >
            Lista de convidados <span className="italic underline decoration-brand/30 underline-offset-8">trancada</span> e presentes direto na sua conta.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-2xl mx-auto text-text-secondary text-base md:text-lg font-medium leading-relaxed opacity-85"
          >
            Sem penetras no seu evento. Confirmação inteligente restrita à sua lista oficial, presentes em dinheiro com a menor taxa (apenas 5,49% ou repassada) e saque rápido via Pix.
          </motion.p>

          {/* Destaques rápidos */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-wrap items-center justify-center gap-3 pt-2"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-border-soft shadow-xs text-[11px] font-bold text-text-secondary">
              <Lock size={13} className="text-brand" />
              <span>Zero Penetras (Lista Fechada)</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-border-soft shadow-xs text-[11px] font-bold text-text-secondary">
              <Percent size={13} className="text-brand" />
              <span>Taxa 5,49% (Pode Repassar)</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-border-soft shadow-xs text-[11px] font-bold text-text-secondary">
              <Zap size={13} className="text-brand" />
              <span>Saque Rápido via Pix (D+1)</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link
              href="/register"
              className="group relative inline-flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-4.5 bg-brand text-white rounded-full text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-brand/20 transition-all hover:bg-brand-dark hover:-translate-y-0.5 active:translate-y-0"
            >
              Criar Meu Evento Grátis
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4.5 bg-white text-text-primary rounded-full text-[11px] font-black uppercase tracking-[0.2em] border border-border-soft hover:bg-bg-light transition-all"
            >
              Já tenho conta
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 🥈 SEÇÃO 2: MÉTRICAS & CREDIBILIDADE */}
      <section className="py-20 md:py-28 border-y border-border-soft/50 bg-white/70 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-12">
            Tecnologia com o rigor de quem organiza os melhores eventos
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-8">
            {[
              { label: 'Precisão para o buffet', value: '100%', detail: 'Apenas quem está na lista' },
              { label: 'Taxa sobre presentes', value: '5,49%', detail: 'Opção de repasse integral' },
              { label: 'Prazo médio de saque', value: 'D+1', detail: 'Pix direto na conta bancária' },
              { label: 'Respostas em tempo real', value: 'AO VIVO', detail: 'Notificação a cada confirmação' }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-6 rounded-3xl bg-surface/50 border border-border-soft/60 space-y-2"
              >
                <h4 className="text-3xl md:text-4xl font-serif text-text-primary tracking-tight font-black">
                  {stat.value}
                </h4>
                <p className="text-[10px] font-black text-brand uppercase tracking-widest">
                  {stat.label}
                </p>
                <p className="text-[9px] text-text-muted font-semibold">
                  {stat.detail}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 🔒 SEÇÃO 3: DETALHE 1 - LISTA TRANCADA (ZERO PENETRAS) */}
      <section id="lista-trancada" className="py-28 md:py-36 bg-white border-b border-border-soft/40 scroll-mt-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Texto lado esquerdo */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand/5 border border-brand/10 text-brand text-[10px] font-black uppercase tracking-widest">
                <Lock size={12} />
                <span>Exclusividade & Controle Absoluto</span>
              </div>
              
              <h2 className="text-3xl md:text-5xl font-serif text-text-primary leading-tight">
                Lista Trancada: <br />
                <span className="italic">Zero penetras</span> no seu grande dia.
              </h2>
              
              <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                Um dos maiores desafios dos casamentos é o controle do buffet. Com nosso sistema de lista fechada, 
                <strong> apenas convidados cadastrados pelos noivos conseguem confirmar presença</strong>.
              </p>

              <div className="space-y-4 pt-2">
                {[
                  {
                    title: 'Busca inteligente por nome ou grupo familiar',
                    desc: 'O convidado digita as primeiras letras do nome e o sistema identifica o grupo autorizado.'
                  },
                  {
                    title: 'Controle individual de acompanhantes',
                    desc: 'Ele só pode confirmar a si mesmo e aos membros da família que você pré-aprovou.'
                  },
                  {
                    title: 'Diferenciação para o buffet',
                    desc: 'Identifique adultos pagantes, crianças e gratuidades com contagem precisa.'
                  },
                  {
                    title: 'Planilha sincronizada e exportação Excel',
                    desc: 'Importe sua lista do Excel no início e exporte o relatório final para o cerimonial em 1 clique.'
                  }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3.5">
                    <div className="w-5 h-5 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 size={13} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">{item.title}</h4>
                      <p className="text-xs text-text-secondary/80 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card visual lado direito */}
            <div className="lg:col-span-6">
              <div className="p-8 md:p-10 rounded-[2.5rem] bg-[#FAFAF8] border border-border-soft shadow-xl space-y-6 relative overflow-hidden">
                <div className="flex items-center justify-between pb-4 border-b border-border-soft">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-brand text-white flex items-center justify-center font-serif text-lg font-bold">
                      RSVP
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-text-primary">Simulação do Convidado</p>
                      <p className="text-[10px] text-text-muted">Busca inteligente no banco de dados</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Blindado
                  </span>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-wider text-text-muted">Busca por nome na lista</label>
                  <div className="p-3.5 rounded-xl bg-white border border-brand/30 shadow-inner text-sm font-bold text-text-primary flex items-center justify-between">
                    <span>Mariana Silveira</span>
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-border-soft space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-brand">Acompanhantes autorizados pelo casal:</p>
                  
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-light text-xs font-bold text-text-primary">
                    <span>👤 Mariana (Titular)</span>
                    <span className="text-emerald-600 text-[10px] font-black uppercase">Confirmada ✓</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-light text-xs font-bold text-text-primary">
                    <span>👤 Lucas (Acompanhante)</span>
                    <span className="text-emerald-600 text-[10px] font-black uppercase">Confirmado ✓</span>
                  </div>

                  <p className="text-[9px] text-text-muted italic pt-1">
                    * Qualquer pessoa fora deste grupo não tem permissão de confirmação no sistema.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-brand/5 border border-brand/10 text-center">
                  <p className="text-xs font-serif italic text-brand-dark">
                    "Controle absoluto: o buffet e a cerimonialista recebem exatamente quem vai comparecer."
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 💸 SEÇÃO 4: DETALHE 2 - PRESENTES EM DINHEIRO (TAXA 5,49% E SAQUE PIX) */}
      <section className="py-28 md:py-36 bg-[#fcfafa] border-b border-border-soft/40">
        <div className="max-w-6xl mx-auto px-6 space-y-16">
          
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black uppercase tracking-widest">
              <Banknote size={12} />
              <span>Finanças Transparentes & Sem Pegadinhas</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif text-text-primary leading-tight">
              Lista de Presentes em Dinheiro <br />
              <span className="italic font-normal">com liberdade para repassar a taxa</span>
            </h2>
            <p className="text-text-secondary text-sm md:text-base leading-relaxed">
              Receba presentes em dinheiro com a taxa mais justa do mercado, sem precisar de cotas burocráticas ou produtos físicos que você não vai usar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1: Taxa 5,49% */}
            <div className="p-8 rounded-[2rem] bg-white border border-border-soft shadow-sm hover:shadow-xl transition-all duration-300 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
                  <Percent size={24} />
                </div>
                <h3 className="text-xl font-serif text-text-primary font-bold">Taxa Fixa de 5,49%</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Sem taxas escondidas ou mensalidades. Uma taxa única cobre todo o processamento com segurança bancária, criptografia e proteção antifraude.
                </p>
              </div>
              <div className="pt-4 border-t border-border-soft">
                <span className="text-[10px] font-black text-brand uppercase tracking-wider">Menor que as grandes plataformas</span>
              </div>
            </div>

            {/* Card 2: Repasse ao Convidado */}
            <div className="p-8 rounded-[2rem] bg-white border-2 border-brand/20 shadow-md hover:shadow-xl transition-all duration-300 space-y-4 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-brand text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                Exclusivo
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-xl font-serif text-text-primary font-bold">Você Pode Repassar a Taxa</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  No painel dos noivos você escolhe: <strong>absorver</strong> o desconto ou <strong>repassar a taxa</strong> para o convidado no checkout. Se repassar, <strong>você recebe 100% líquido</strong> do valor do presente!
                </p>
              </div>
              <div className="pt-4 border-t border-border-soft">
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Zero desconto no bolso dos noivos</span>
              </div>
            </div>

            {/* Card 3: Saque via Pix */}
            <div className="p-8 rounded-[2rem] bg-white border border-border-soft shadow-sm hover:shadow-xl transition-all duration-300 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Zap size={24} />
                </div>
                <h3 className="text-xl font-serif text-text-primary font-bold">Saque Rápido via Pix</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Sem esperar semanas após o casamento! Solicite o resgate do saldo disponível direto no seu painel e receba o dinheiro via <strong>Pix na sua conta bancária em até 1 dia útil (D+1)</strong>.
                </p>
              </div>
              <div className="pt-4 border-t border-border-soft">
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Dinheiro na mão para pagar fornecedores</span>
              </div>
            </div>

          </div>

          {/* Comparativo Repasse vs Absorver */}
          <div className="max-w-4xl mx-auto p-6 md:p-8 rounded-3xl bg-white border border-border-soft shadow-sm">
            <h4 className="text-sm font-black uppercase tracking-widest text-text-primary mb-6 text-center">
              Como funciona o Repasse na prática:
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-[#FAFAF8] border border-border-soft space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary">Opção 1: Repassar ao Convidado</span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-brand bg-brand/10 px-2 py-0.5 rounded">Mais escolhida</span>
                </div>
                <p className="text-xs text-text-secondary">Presente de R$ 200,00:</p>
                <p className="text-sm font-bold text-emerald-700">Noivos recebem: R$ 200,00 líquidos (100%)</p>
                <p className="text-[11px] text-text-muted">Convidado paga R$ 210,98 no checkout (+5,49%)</p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAFAF8] border border-border-soft space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary">Opção 2: Absorver a Taxa</span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-text-muted bg-black/5 px-2 py-0.5 rounded">Tradicional</span>
                </div>
                <p className="text-xs text-text-secondary">Presente de R$ 200,00:</p>
                <p className="text-sm font-bold text-text-primary">Noivos recebem: R$ 189,02 líquidos</p>
                <p className="text-[11px] text-text-muted">Convidado paga exatamente R$ 200,00</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 🥉 SEÇÃO 5: TODOS OS RECURSOS PARA O SEU EVENTO */}
      <section className="py-28 md:py-36 bg-white border-b border-border-soft/40">
        <div className="max-w-6xl mx-auto px-6 space-y-16">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand/70">Ecossistema Completo</span>
            <h2 className="text-3xl md:text-5xl font-serif text-text-primary">Tudo o que seu evento precisa</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Lock size={20} className="text-brand" />,
                title: 'Lista 100% Trancada',
                desc: 'Apenas convidados pré-cadastrados confirmam. Zero penetras e economia real com buffet.'
              },
              {
                icon: <Banknote size={20} className="text-emerald-700" />,
                title: 'Presentes com Taxa 5,49%',
                desc: 'Receba presentes em dinheiro com a opção de repassar a taxa e receber 100% limpo.'
              },
              {
                icon: <Zap size={20} className="text-amber-600" />,
                title: 'Saque Rápido via Pix (D+1)',
                desc: 'Resgate o saldo dos presentes a qualquer momento direto na sua conta corrente via Pix.'
              },
              {
                icon: <MessageCircleHeart size={20} className="text-rose-600" />,
                title: 'Mural de Recados com Fotos',
                desc: 'Mensagens de carinho deixadas pelos convidados direto na página oficial do casal.'
              },
              {
                icon: <FileSpreadsheet size={20} className="text-blue-600" />,
                title: 'Exportação para Excel (.xlsx)',
                desc: 'Baixe listas filtradas por confirmados, pendentes, adultos e crianças em segundos.'
              },
              {
                icon: <MapPin size={20} className="text-purple-600" />,
                title: 'Site Personalizado com Mapa',
                desc: 'Contagem regressiva, história do casal, fotos em alta resolução e rota via Google Maps.'
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="p-8 rounded-3xl bg-[#FAFAF8] border border-border-soft hover:border-brand/30 hover:bg-white hover:shadow-lg transition-all duration-300 space-y-4"
              >
                <div className="w-10 h-10 rounded-2xl bg-white shadow-xs border border-border-soft flex items-center justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-serif font-bold text-text-primary">
                  {feature.title}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 🧠 SEÇÃO 6: COMO FUNCIONA O PASSO A PASSO */}
      <section className="py-28 md:py-36 bg-[#fcfafa] border-b border-border-soft/40">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-20 space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand/60">Simples & Prático</span>
            <h2 className="text-3xl md:text-5xl font-serif text-text-primary">Como funciona na prática</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Crie seu Evento',
                desc: 'Defina a data, local, fotos dos noivos e mensagem de boas-vindas.'
              },
              {
                step: '02',
                title: 'Cadastre a Lista',
                desc: 'Importe sua planilha do Excel ou adicione famílias com seus acompanhantes.'
              },
              {
                step: '03',
                title: 'Envie o Link',
                desc: 'Convidados acessam, buscam seu nome e confirmam em segundos sem login.'
              },
              {
                step: '04',
                title: 'Receba e Resgate',
                desc: 'Acompanhe as confirmações e solicite o resgate dos presentes via Pix.'
              }
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-3xl bg-white border border-border-soft text-center space-y-3 shadow-xs">
                <span className="text-2xl font-serif font-black text-brand">{item.step}</span>
                <h4 className="text-sm font-bold text-text-primary">{item.title}</h4>
                <p className="text-xs text-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ❓ SEÇÃO 7: PERGUNTAS FREQUENTES (FAQ) */}
      <section className="py-28 md:py-36 bg-white border-b border-border-soft/40">
        <div className="max-w-4xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand/60">Tire suas dúvidas</span>
            <h2 className="text-3xl md:text-4xl font-serif text-text-primary">Perguntas Frequentes</h2>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, idx) => (
              <div 
                key={idx}
                className="rounded-2xl border border-border-soft bg-[#FAFAF8] overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-sm md:text-base text-text-primary hover:text-brand transition-colors"
                >
                  <span>{item.q}</span>
                  <ChevronDown 
                    size={18} 
                    className={`shrink-0 transition-transform duration-300 text-brand ${openFaq === idx ? 'rotate-180' : ''}`} 
                  />
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-6 pb-6 text-xs md:text-sm text-text-secondary leading-relaxed border-t border-border-soft/60 pt-4"
                    >
                      {item.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 💎 SEÇÃO 8: CTA FINAL */}
      <section className="py-28 md:py-36 px-6 bg-[#fcfafa] relative overflow-hidden text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="w-16 h-px bg-brand/30 mx-auto" />
          <h2 className="text-3xl md:text-5xl font-serif text-text-primary italic leading-tight">
            "O controle que a sua cerimonialista precisa, com a sofisticação que seu casamento merece."
          </h2>
          <p className="text-sm text-text-secondary max-w-xl mx-auto">
            Pronto para transformar a organização do seu evento com lista trancada e presentes inteligentes?
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/register" 
              className="inline-flex items-center gap-3 px-10 py-5 bg-brand text-white rounded-full text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-brand/20 hover:bg-brand-dark transition-all hover:-translate-y-1"
            >
              Criar Conta e Meu Evento
              <ArrowRight size={16} />
            </Link>
            <Link 
              href="/login" 
              className="inline-flex items-center gap-3 px-8 py-5 bg-white text-text-primary rounded-full text-[11px] font-black uppercase tracking-[0.2em] border border-border-soft hover:bg-bg-light transition-all"
            >
              Já tenho conta (Entrar)
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER MINIMALISTA ─────────────────────────────────────── */}
      <footer className="py-16 bg-white border-t border-border-soft/40 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 flex justify-center items-center">
            <img src="/logo_marsala.png" alt="VB" className="w-full h-full object-contain" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-primary">
            VB Assessoria e Cerimonial
          </p>
          <p className="text-[9px] text-text-muted">
            Plataforma Exclusiva de RSVP & Gestão de Eventos • Todos os direitos reservados.
          </p>
        </div>
      </footer>

    </div>
  )
}
