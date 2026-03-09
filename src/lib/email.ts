import nodemailer from 'nodemailer'

const createTransporter = () => {
    const port = Number(process.env.SMTP_PORT) || 465
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.hostinger.com',
        port: port,
        secure: port === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        },
        tls: {
            rejectUnauthorized: false
        }
    })
}

export async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
    const transporter = createTransporter()
    return await transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
        to,
        subject,
        html
    })
}
