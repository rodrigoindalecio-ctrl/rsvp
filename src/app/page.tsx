'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fcfafa] selection:bg-brand selection:text-white">
      
      {/* ── TOP HEADER (Minimalist) ────────────────────────────── */}
      <header className="absolute top-0 left-0 right-0 h-24 px-6 md:px-12 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-1.5 rounded-full bg-brand" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-text-primary">
            VB Assessoria e Cerimonial
          </span>
        </div>
        <Link 
          href="/login" 
          className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-brand transition-colors"
        >
          Login
        </Link>
      </header>

      {/* 🥇 SEÇÃO 1: HERO */}
      <section className="relative pt-32 pb-24 md:pt-60 md:pb-40 px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-10 md:space-y-14">
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-4 md:gap-6"
          >
            <div className="w-12 h-px bg-brand/30" />
            <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-brand/60">
              Plataforma Exclusiva • RSVP
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-8xl font-serif text-text-primary leading-[1.1] tracking-tight"
          >
            Organize seu evento com <br className="hidden md:block" />
            <span className="italic">simplicidade</span> e sofisticação
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="max-w-2xl mx-auto text-text-secondary text-base md:text-xl font-medium leading-relaxed opacity-70"
          >
            Gerencie convidados, confirmações e comunicação em um único lugar, com o controle total que seu evento merece.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex justify-center pt-4"
          >
            <Link
              href="/login"
              className="group relative inline-flex items-center gap-3 px-10 py-5 bg-brand text-white rounded-full text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand/20 transition-all hover:bg-brand-dark hover:-translate-y-1 active:translate-y-0"
            >
              Acessar painel
              <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 🥈 SEÇÃO 2: PROVA / CREDIBILIDADE */}
      <section className="py-24 md:py-32 border-y border-border-soft/40 bg-white/50">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-16">
            Plataforma utilizada em centenas de eventos
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8">
            {[
              { label: 'confirmações', value: '98%' },
              { label: 'eventos', value: '1.2k+' },
              { label: 'convidados', value: '50k+' },
              { label: 'Dados em tempo real', value: 'REAL' }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="space-y-2"
              >
                <h4 className="text-3xl md:text-5xl font-serif text-text-primary tracking-tighter decoration-brand/20 decoration-2 underline-offset-8">
                  {stat.value}
                </h4>
                <p className="text-[9px] md:text-[10px] font-black text-text-muted uppercase tracking-widest">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 🥉 SEÇÃO 3: FUNCIONALIDADES PRINCIPAIS */}
      <section className="py-32 md:py-48 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 md:gap-16">
            {[
              {
                title: 'Gestão de convidados',
                desc: 'Organize listas, convites e confirmações com total facilidade e organização.'
              },
              {
                title: 'Confirmações em tempo real',
                desc: 'Acompanhe as respostas dos seus convidados de forma prática e centralizada.'
              },
              {
                title: 'Site Personalizado',
                desc: 'Um site elegante para o casal com galeria de fotos, cronograma e contagem regressiva.'
              },
              {
                title: 'Lista de Presentes',
                desc: 'Gerencie sua lista de desejos e receba carinho de forma organizada e segura.'
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.1 }}
                className="space-y-6 flex flex-col items-center md:items-start text-center md:text-left"
              >
                <div className="w-10 h-0.5 bg-brand/20" />
                <h3 className="text-xl font-serif text-text-primary italic">
                  {feature.title}
                </h3>
                <p className="text-[13px] text-text-secondary leading-relaxed font-medium opacity-70">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>

          {/* New Row of specific app features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-20 md:gap-16 mt-32">
            {[
              {
                title: 'Mural de Mensagens',
                desc: 'Permita que seus convidados deixem palavras de carinho diretamente no seu site.'
              },
              {
                title: 'Linha do Tempo',
                desc: 'Conte sua história de amor através de marcos cronológicos emocionantes.'
              },
              {
                title: 'Mapas e Logística',
                desc: 'Integração com Google Maps para facilitar a chegada dos convidados ao local.'
              }
            ].map((feature, i) => (
              <motion.div 
                key={i + 4}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: (i + 4) * 0.1 }}
                className="space-y-6 flex flex-col items-center md:items-start text-center md:text-left"
              >
                <div className="w-10 h-0.5 bg-brand-pale" />
                <h3 className="text-xl font-serif text-text-primary italic">
                  {feature.title}
                </h3>
                <p className="text-[13px] text-text-secondary leading-relaxed font-medium opacity-70">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 🧠 SEÇÃO 4: COMO FUNCIONA */}
      <section className="py-32 md:py-48 bg-[#fcfafa]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-24 space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand/60">Processo</span>
            <h2 className="text-3xl md:text-5xl font-serif text-text-primary">Como funciona</h2>
          </div>

          <div className="relative flex flex-col md:flex-row gap-12 md:gap-2 justify-between">
            {/* Linha conectora desktop */}
            <div className="hidden md:block absolute top-6 left-0 right-0 h-px bg-border-soft/50 -z-10" />
            
            {[
              'Crie seu evento',
              'Adicione seus convidados',
              'Acompanhe tudo em tempo real'
            ].map((step, i) => (
              <div key={i} className="flex-1 px-8 space-y-6 text-center group">
                <div className="w-12 h-12 bg-white rounded-full border border-border-soft flex items-center justify-center mx-auto shadow-sm group-hover:border-brand/40 group-hover:bg-brand group-hover:text-white transition-all duration-500">
                  <span className="text-[10px] font-black uppercase tracking-widest">0{i + 1}</span>
                </div>
                <p className="text-sm md:text-base font-black text-text-primary uppercase tracking-widest leading-relaxed">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 💎 SEÇÃO 5: DIFERENCIAL */}
      <section className="py-40 md:py-60 px-6 bg-white relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] border border-brand/5 rounded-full -z-10 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] border border-brand/5 rounded-full -z-10 pointer-events-none opacity-50" />

        <div className="max-w-4xl mx-auto text-center space-y-12 animate-in fade-in duration-1000">
          <div className="w-20 h-px bg-brand/20 mx-auto" />
          <h2 className="text-2xl md:text-4xl font-serif text-text-primary italic leading-relaxed md:leading-loose max-w-2xl mx-auto">
            "Uma plataforma pensada para simplificar a organização de eventos, mantendo controle, clareza e eficiência em cada etapa."
          </h2>
          <div className="pt-8">
             <Link 
               href="/login" 
               className="text-[10px] font-black uppercase tracking-[0.4em] text-brand hover:tracking-[0.6em] transition-all duration-500"
             >
               Começar agora →
             </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER MINIMALISTA ─────────────────────────────────────── */}
      <footer className="py-20 bg-white border-t border-border-soft/40 text-center">
        <div className="flex flex-col items-center gap-6 opacity-40 hover:opacity-100 transition-all duration-700">
          <div className="w-8 h-8 rounded-lg overflow-hidden grayscale brightness-150">
            <img src="/Logo-03.jpg" alt="VB" className="w-full h-full object-cover" />
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-text-primary">RSVP • Gestão de Eventos</p>
          <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-text-muted mt-2">© 2026 VB Assessoria e Cerimonial</p>
        </div>
      </footer>

    </div>
  )
}
