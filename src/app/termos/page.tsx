import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Termos de Uso • Vanessa Bidinotti RSVP',
  description: 'Termos de Uso e Condições Gerais de Prestação de Serviços'
}

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-bg-light py-16 px-6">
      <div className="max-w-3xl mx-auto bg-surface p-8 md:p-14 rounded-3xl border border-border-soft shadow-sm space-y-8">
        <div>
          <Link href="/login" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand hover:text-brand-dark mb-6 transition-colors">
            <ArrowLeft size={14} /> Voltar
          </Link>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted block">Legal • Versão 1.0</span>
          <h1 className="text-3xl md:text-4xl font-serif text-text-primary mt-2">Termos de Uso da Plataforma</h1>
          <p className="text-xs text-text-muted mt-2">Última atualização: Novembro de 2026</p>
        </div>

        <div className="space-y-6 text-sm text-text-secondary leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-text-primary">1. Apresentação e Objeto</h2>
            <p>
              A plataforma <strong>Vanessa Bidinotti RSVP</strong> oferece serviços de confirmação digital de presença (RSVP fechado com lista trancada), mural de recados e gerenciamento inteligente de lista de presentes convertidos em dinheiro.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-text-primary">2. Cadastro e Responsabilidades do Anfitrião</h2>
            <p>
              O anfitrião (casal, debutante ou organizador) se compromete a fornecer informações verídicas e a zelar pelo sigilo de suas credenciais de acesso. O cadastro de convidados é de inteira responsabilidade do anfitrião, respeitando a legislação de proteção de dados.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-text-primary">3. Lista de Presentes e Taxa de Intermediação</h2>
            <p>
              Os presentes virtuais adquiridos pelos convidados são convertidos em saldo financeiro disponível para saque. A taxa de serviço e processamento bancário da plataforma é de <strong>5,49%</strong> sobre o valor do presente.
            </p>
            <p>
              O anfitrião pode optar, a qualquer momento pelo seu painel, por <em>absorver a taxa</em> (recebendo o valor líquido com desconto) ou <em>repassar a taxa ao convidado</em> (adicionando a tarifa no momento do pagamento, garantindo 100% líquido ao anfitrião).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-text-primary">4. Resgates e Saques via Pix</h2>
            <p>
              Os valores arrecadados podem ser solicitados para resgate pelo titular da conta cadastrada. O crédito é efetuado via Pix na chave informada pelo anfitrião em até <strong>1 dia útil (D+1)</strong> após a solicitação, sujeito a checagens de segurança e prevenção a fraudes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-text-primary">5. Cancelamento e Encerramento</h2>
            <p>
              O anfitrião pode solicitar o encerramento da sua conta e remoção dos seus dados a qualquer momento, desde que não haja pendências financeiras ativas ou saques em processamento.
            </p>
          </section>
        </div>

        <div className="pt-6 border-t border-border-soft flex justify-between items-center text-xs text-text-muted">
          <span>VB Cerimonial & Assessoria</span>
          <Link href="/privacidade" className="font-bold text-brand hover:underline">
            Ver Política de Privacidade (LGPD) →
          </Link>
        </div>
      </div>
    </div>
  )
}
