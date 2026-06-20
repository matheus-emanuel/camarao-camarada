import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Section,
  Row,
  Column,
  Hr,
  Link,
} from '@react-email/components'
import type { AlertedParam } from '@/types/app'

interface AlertEmailProps {
  clientName: string
  pondName: string
  farmName: string
  collectedAt: string
  alertedParams: AlertedParam[]
  portalUrl: string
}

export function AlertEmail({
  clientName,
  pondName,
  farmName,
  collectedAt,
  alertedParams,
  portalUrl,
}: AlertEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Inter, Arial, sans-serif', background: '#f0f9ff', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 16px' }}>
          <Heading style={{ color: '#0c4a6e', fontSize: '22px', marginBottom: '8px' }}>
            ⚠️ Alerta de Qualidade da Água
          </Heading>
          <Text style={{ color: '#374151', fontSize: '15px' }}>
            Olá, <strong>{clientName}</strong>!
          </Text>
          <Text style={{ color: '#374151', fontSize: '15px' }}>
            A análise coletada em <strong>{collectedAt}</strong> no viveiro{' '}
            <strong>{pondName}</strong> ({farmName}) identificou{' '}
            <strong>{alertedParams.length} parâmetro(s)</strong> fora dos valores de referência:
          </Text>

          <Section style={{ background: '#fff1f2', borderRadius: '8px', padding: '16px 20px', marginBottom: '24px' }}>
            <Row style={{ marginBottom: '8px', borderBottom: '1px solid #fecdd3', paddingBottom: '8px' }}>
              <Column style={{ width: '40%', fontWeight: 'bold', color: '#991b1b', fontSize: '13px' }}>Parâmetro</Column>
              <Column style={{ width: '30%', fontWeight: 'bold', color: '#991b1b', fontSize: '13px' }}>Valor Medido</Column>
              <Column style={{ width: '30%', fontWeight: 'bold', color: '#991b1b', fontSize: '13px' }}>Referência</Column>
            </Row>
            {alertedParams.map((p) => (
              <Row key={p.name} style={{ marginBottom: '6px' }}>
                <Column style={{ width: '40%', color: '#1f2937', fontSize: '14px' }}>{p.name}</Column>
                <Column style={{ width: '30%', color: '#dc2626', fontWeight: 'bold', fontSize: '14px' }}>
                  {p.value} {p.unit ?? ''}
                </Column>
                <Column style={{ width: '30%', color: '#6b7280', fontSize: '13px' }}>
                  {p.ref_min !== null && p.ref_max !== null
                    ? `${p.ref_min} – ${p.ref_max}`
                    : p.ref_max !== null
                    ? `máx. ${p.ref_max}`
                    : p.ref_min !== null
                    ? `mín. ${p.ref_min}`
                    : '—'}
                  {p.unit ? ` ${p.unit}` : ''}
                </Column>
              </Row>
            ))}
          </Section>

          <Hr style={{ borderColor: '#e5e7eb' }} />

          <Text style={{ color: '#374151', fontSize: '14px' }}>
            Acesse o portal para ver o resultado completo e o histórico de evolução:
          </Text>
          <Link href={portalUrl} style={{ color: '#0369a1', fontSize: '14px', wordBreak: 'break-all' }}>
            {portalUrl}
          </Link>

          <Hr style={{ borderColor: '#e5e7eb', marginTop: '24px' }} />
          <Text style={{ color: '#9ca3af', fontSize: '12px' }}>
            Camarão Camarada — Portal de Monitoramento da Qualidade da Água
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default AlertEmail
