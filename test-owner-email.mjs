// test-owner-email.mjs — roda com: node test-owner-email.mjs
import nodemailer from 'nodemailer'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Ler variáveis do .env.local manualmente
const envPath = join(__dirname, '.env.local')
const envContent = readFileSync(envPath, 'utf8')
const env = {}
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx === -1) continue
  const key = trimmed.slice(0, eqIdx).trim()
  const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
  env[key] = value
}

console.log('=== SMTP CONFIG ===')
console.log('HOST:', env.SMTP_HOST)
console.log('PORT:', env.SMTP_PORT)
console.log('USER:', env.SMTP_USER)
console.log('FROM:', env.SMTP_FROM_EMAIL)
console.log('FROM_NAME:', env.SMTP_FROM_NAME)
console.log('INTERNAL_API_KEY presente:', !!env.INTERNAL_API_KEY)
console.log('===================\n')

const port = Number(env.SMTP_PORT) || 465
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port,
  secure: port === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD
  },
  tls: { rejectUnauthorized: false }
})

console.log('Verificando conexão SMTP...')
try {
  await transporter.verify()
  console.log('✅ Conexão SMTP verificada com sucesso!\n')
} catch (err) {
  console.error('❌ Falha na verificação SMTP:', err.message)
  process.exit(1)
}

// Altere o destinatário para o email de teste
const testTo = env.SMTP_FROM_EMAIL // envia para si mesmo como teste

console.log(`Enviando email de teste para: ${testTo}`)
try {
  const info = await transporter.sendMail({
    from: { name: env.SMTP_FROM_NAME, address: env.SMTP_FROM_EMAIL },
    to: testTo,
    subject: '🔔 [TESTE] Novo RSVP — Script de validação',
    html: `
      <div style="font-family:sans-serif;max-width:500px;padding:20px;border:1px solid #eee;border-radius:10px;">
        <h2 style="color:#8B2D4F;">✅ Email de Notificação Funcionando!</h2>
        <p>Este é um email de teste enviado pelo script <code>test-owner-email.mjs</code>.</p>
        <p>Se você recebeu isso, o SMTP está funcionando corretamente.</p>
        <hr>
        <p style="font-size:12px;color:#999;">Enviado em: ${new Date().toLocaleString('pt-BR')}</p>
      </div>
    `
  })
  console.log('✅ Email enviado com sucesso!')
  console.log('Message ID:', info.messageId)
} catch (err) {
  console.error('❌ Erro ao enviar email:', err.message)
}
