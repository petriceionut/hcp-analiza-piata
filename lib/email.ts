import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const from = process.env.GMAIL_USER
  if (!from) {
    console.warn('[email] GMAIL_USER not set — email not sent to', to)
    return
  }
  await transporter.sendMail({ from, to, subject, html })
}
