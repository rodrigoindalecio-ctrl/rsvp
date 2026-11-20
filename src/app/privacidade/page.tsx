import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'

export const metadata = {
  title: 'Política de Privacidade (LGPD) • Vanessa Bidinotti RSVP',
  description: 'Tratamento de dados pessoais em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018)'
}

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-bg-light py-16 px-6">
      <div className="max-w-3xl mx-auto bg-surface p-8 md:p-14 rounded-3xl border border-border-soft shadow-sm space-y-8">
        <div>
          <Link href="/login" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand hover:text-brand-dark mb-6 transition-colors">
            <ArrowLeft size={14} /> Voltar
          </Link>
          <div className="flex items-center gap-2 text-brand">
            <Shield size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] block">LGPD • Lei nº 13.709/2018</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif text-text-primary mt-2">Política de Privacidade e Proteção de Dados</h1>
          <p className="text-xs text-text-muted mt-2">Última atualização: Novembro de 2026</p>
        </div>

        <div className="space-y-6 text-sm text-text-secondary leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-text-primary">1. Compromisso com a sua Privacidade</h2>
            <p>
              A <strong>Vanessa Bidinotti RSVP</strong> valoriza a segurança e confidencialidade dos dados de noivos, casais, debutantes e seus convidados. Esta Política descreve como coletamos, usamos, armazenamos e protegemos suas informações de acordo com a LGPD.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-text-primary">2. Dados Coletados</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Do Anfitrião:</strong> Nome completo, e-mail, senha criptografada, nomes do casal, endereço IP e registro de consentimento na criação da conta.</li>
              <li><strong>Dos Convidados:</strong> Nome, e-mail, telefone (quando fornecido pelo anfitrião), status de confirmação e mensagens deixadas no mural.</li>
              <li><strong>Transacionais:</strong> Comprovantes ou confirmações de pagamento dos presentes adquiridos. Não armazenamos números de cartão de crédito.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-text-primary">3. Finalidade do Tratamento</h2>
            <p>
              Os dados são coletados única e exclusivamente para a operacionalização do evento: autenticação no painel, controle da lista de presença (zero penetras), envio de notificações de confirmação e viabilização dos presentes e saques.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-text-primary">4. Compartilhamento de Dados</h2>
            <p>
              Não comercializamos, alugamos ou compartilhamos dados com terceiros para fins de marketing não autorizado. O compartilhamento ocorre apenas com os provedores estritamente necessários para a prestação do serviço (serviço de hospedagem segura Supabase, processadores de pagamento e entrega de e-mails transacionais).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-text-primary">5. Seus Direitos (Art. 18 da LGPD)</h2>
            <p>
              Você tem direito de solicitar a confirmação da existência de tratamento, o acesso aos seus dados, correção de dados incompletos ou a exclusão definitiva dos seus dados de nossos servidores após a realização do evento, mediante contato com nosso suporte.
            </p>
          </section>
        </div>

        <div className="pt-6 border-t border-border-soft flex justify-between items-center text-xs text-text-muted">
          <span>VB Cerimonial & Assessoria</span>
          <Link href="/termos" className="font-bold text-brand hover:underline">
            Ver Termos de Uso →
          </Link>
        </div>
      </div>
    </div>
  )
}
