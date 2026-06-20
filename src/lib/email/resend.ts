import { Resend } from 'resend'
import { render } from '@react-email/components'
import { AlertEmail } from './templates/alert-email'
import { InviteEmail } from './templates/invite-email'
import type { AlertedParam } from '@/types/app'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@camaraocamarada.com.br'

export async function sendAlertEmail(opts: {
  to: string
  clientName: string
  pondName: string
  farmName: string
  collectedAt: string
  alertedParams: AlertedParam[]
  analysisId: string
}) {
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/analyses/${opts.analysisId}`
  const html = await render(
    AlertEmail({
      clientName: opts.clientName,
      pondName: opts.pondName,
      farmName: opts.farmName,
      collectedAt: opts.collectedAt,
      alertedParams: opts.alertedParams,
      portalUrl,
    })
  )

  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `⚠️ Alerta de qualidade da água — ${opts.pondName}`,
    html,
  })
}

export async function sendInviteEmail(opts: {
  to: string
  clientName: string
  inviteUrl: string
}) {
  const html = await render(
    InviteEmail({
      clientName: opts.clientName,
      inviteUrl: opts.inviteUrl,
    })
  )

  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: 'Bem-vindo ao Camarão Camarada — Acesse seu portal',
    html,
  })
}
