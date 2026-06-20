import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Hr,
} from '@react-email/components'

interface InviteEmailProps {
  clientName: string
  inviteUrl: string
}

export function InviteEmail({ clientName, inviteUrl }: InviteEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Inter, Arial, sans-serif', background: '#f0f9ff', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 16px' }}>
          <Heading style={{ color: '#0c4a6e', fontSize: '22px', marginBottom: '8px' }}>
            🦐 Bem-vindo ao Camarão Camarada!
          </Heading>
          <Text style={{ color: '#374151', fontSize: '15px' }}>
            Olá, <strong>{clientName}</strong>!
          </Text>
          <Text style={{ color: '#374151', fontSize: '15px' }}>
            Seu laboratório de análise de água cadastrou você no{' '}
            <strong>Camarão Camarada</strong>, um portal para acompanhar a qualidade
            da água das suas fazendas em tempo real.
          </Text>
          <Text style={{ color: '#374151', fontSize: '15px' }}>
            Clique no botão abaixo para criar sua senha e acessar o portal:
          </Text>

          <Button
            href={inviteUrl}
            style={{
              background: '#0284c7',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '15px',
              fontWeight: 'bold',
              display: 'inline-block',
              marginTop: '8px',
              marginBottom: '24px',
            }}
          >
            Acessar meu portal
          </Button>

          <Text style={{ color: '#6b7280', fontSize: '13px' }}>
            O link acima expira em 24 horas. Se você não solicitou este acesso, pode ignorar este e-mail.
          </Text>

          <Hr style={{ borderColor: '#e5e7eb', marginTop: '24px' }} />
          <Text style={{ color: '#9ca3af', fontSize: '12px' }}>
            Camarão Camarada — Portal de Monitoramento da Qualidade da Água
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default InviteEmail
