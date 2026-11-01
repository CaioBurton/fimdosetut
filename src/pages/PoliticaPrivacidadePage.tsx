import { AppLayout } from '../components/layout/AppLayout'
import { DocumentoLegal, type SecaoLegal } from '../components/legal/DocumentoLegal'
import { CONTATO, CONTROLADOR, ROTAS_LEGAIS } from '../lib/legal'

const SECOES: SecaoLegal[] = [
  {
    titulo: 'Quem é responsável pelos seus dados',
    conteudo: (
      <>
        <p>
          O responsável pelo tratamento dos seus dados pessoais (o “controlador”, nos termos da Lei
          Geral de Proteção de Dados – LGPD, Lei nº 13.709/2018) é o <strong>{CONTROLADOR.nome}</strong>.
        </p>
        <ul>
          <li>Identificação: {CONTROLADOR.documento}</li>
          <li>Endereço: {CONTROLADOR.endereco}</li>
          <li>Contato para assuntos de privacidade: {CONTATO.email}</li>
          <li>Responsável pelo contato com os titulares (encarregado): {CONTATO.encarregado}</li>
        </ul>
      </>
    ),
  },
  {
    titulo: 'Quais dados coletamos',
    conteudo: (
      <>
        <p>
          <strong>Dados da conta:</strong> nome, e-mail e senha (a senha é guardada de forma
          criptografada, e nem nós conseguimos lê-la), além da data de criação da conta e do registro do
          seu aceite desta política.
        </p>
        <p>
          <strong>Dados do perfil (opcionais):</strong> bairro onde você mora, local de trabalho, local
          de estudo e as linhas de ônibus que você costuma pegar. Você escolhe se quer preencher.
        </p>
        <p>
          <strong>Denúncias:</strong> a linha, o tipo de problema, a descrição que você escreve, o número
          do veículo (opcional), o local marcado no mapa e a data e hora do envio. O local pode ser
          marcado por você ou obtido pelo seu aparelho, se você autorizar o acesso à localização.
        </p>
        <p>
          <strong>Feedbacks:</strong> o tipo e o texto da mensagem que você enviar pela aba Perfil.
        </p>
        <p>
          <strong>Dados técnicos:</strong> o seu navegador guarda no aparelho a sua sessão de login e a
          informação de que você já viu o tutorial (armazenamento local, necessário para o app
          funcionar). Os serviços de hospedagem e de banco de dados podem registrar o endereço IP e
          dados do acesso por motivo de segurança e funcionamento.
        </p>
      </>
    ),
  },
  {
    titulo: 'O que aparece para outras pessoas',
    conteudo: (
      <>
        <p>
          <strong>As denúncias são públicas.</strong> Qualquer visitante vê o mapa, a lista e o painel,
          com a linha, o tipo, a descrição, o número do veículo, o local e o horário de cada denúncia.
        </p>
        <p>
          <strong>Seu nome, seu e-mail e o seu perfil não aparecem</strong> junto das denúncias. O
          vínculo entre a denúncia e a sua conta é guardado em separado e só você e a administração do
          app conseguem ver.
        </p>
        <p>
          Por isso, <strong>não escreva dados pessoais de outras pessoas</strong> (nomes, telefones,
          documentos, placas de carros particulares) na descrição da denúncia.
        </p>
      </>
    ),
  },
  {
    titulo: 'Para que usamos os dados',
    conteudo: (
      <ul>
        <li>criar e manter a sua conta e permitir o seu login;</li>
        <li>receber, mostrar e organizar as denúncias de problemas no transporte público de Teresina;</li>
        <li>gerar os números do painel (por zona, tipo de problema, linha e dia);</li>
        <li>avisar você sobre denúncias nas linhas que você cadastrou no perfil;</li>
        <li>receber as suas sugestões, críticas e elogios para melhorar o app;</li>
        <li>proteger o app contra abusos e cumprir obrigações legais.</li>
      </ul>
    ),
  },
  {
    titulo: 'Base legal',
    conteudo: (
      <>
        <p>
          Tratamos os seus dados com base no seu <strong>consentimento</strong> (art. 7º, I, da LGPD),
          que você dá ao criar a conta, ao preencher o perfil, ao autorizar a localização e ao ativar as
          notificações. Também usamos o <strong>legítimo interesse</strong> (art. 7º, IX) para a
          segurança do app e a prevenção de abusos, e <strong>obrigações legais</strong> quando exigido.
        </p>
        <p>
          Você pode retirar o consentimento a qualquer momento (veja “Seus direitos”). Isso não afeta o
          que já foi feito antes da retirada.
        </p>
      </>
    ),
  },
  {
    titulo: 'Com quem compartilhamos',
    conteudo: (
      <>
        <p>Não vendemos os seus dados. Eles passam apenas pelos serviços que fazem o app funcionar:</p>
        <ul>
          <li>
            <strong>Supabase</strong>: banco de dados e autenticação (guarda contas, perfis, denúncias e
            feedbacks);
          </li>
          <li>
            <strong>Vercel</strong>: hospedagem do app;
          </li>
          <li>
            <strong>OpenStreetMap</strong>: imagens do mapa. Ao abrir um mapa, o seu navegador pede as
            imagens a esse serviço, que enxerga o seu endereço IP e a região que você está vendo.
          </li>
        </ul>
        <p>
          Podemos ainda informar dados a autoridades quando houver obrigação legal ou ordem judicial.
          Integrantes da administração do app têm acesso restrito aos dados necessários para moderar o
          conteúdo e atender você.
        </p>
      </>
    ),
  },
  {
    titulo: 'Transferência para fora do Brasil',
    conteudo: (
      <p>
        Os serviços citados acima podem armazenar ou processar dados em servidores fora do Brasil. Nesses
        casos, buscamos provedores que adotem medidas de segurança e proteção de dados compatíveis com a
        LGPD (art. 33).
      </p>
    ),
  },
  {
    titulo: 'Por quanto tempo guardamos',
    conteudo: (
      <>
        <p>
          Guardamos os seus dados enquanto a sua conta existir. Quando uma conta é excluída, apagamos o
          perfil, as linhas cadastradas e as denúncias feitas por ela. Mensagens de feedback podem ser
          mantidas sem qualquer identificação de quem as enviou.
        </p>
        <p>Prazo para contas sem uso: [PREENCHER: definir pela organização].</p>
      </>
    ),
  },
  {
    titulo: 'Seus direitos',
    conteudo: (
      <>
        <p>Pela LGPD (art. 18), você pode pedir, a qualquer momento:</p>
        <ul>
          <li>a confirmação de que tratamos os seus dados e o acesso a eles;</li>
          <li>a correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>a anonimização, o bloqueio ou a eliminação de dados desnecessários ou excessivos;</li>
          <li>a portabilidade dos dados;</li>
          <li>a eliminação dos dados tratados com o seu consentimento;</li>
          <li>informações sobre com quem compartilhamos os dados;</li>
          <li>a retirada do consentimento.</li>
        </ul>
        <p>
          <strong>Como fazer:</strong> na aba Perfil você corrige os dados do perfil, apaga as suas
          denúncias, <strong>baixa uma cópia dos seus dados</strong> e{' '}
          <strong>exclui a sua conta</strong> (em “Meus dados e privacidade”). Para qualquer outro
          pedido, escreva para {CONTATO.email}. Respondemos no prazo legal.
        </p>
        <p>
          Se achar que seus dados foram tratados de forma irregular, você também pode reclamar à
          Autoridade Nacional de Proteção de Dados (ANPD).
        </p>
      </>
    ),
  },
  {
    titulo: 'Segurança',
    conteudo: (
      <p>
        Usamos conexão segura (HTTPS), senhas criptografadas, regras de acesso que limitam cada pessoa
        aos próprios dados e uma separação entre a denúncia pública e a sua autoria. Nenhum sistema é
        100% seguro; se houver um incidente que possa afetar você, avisaremos como a lei exige.
      </p>
    ),
  },
  {
    titulo: 'Crianças e adolescentes',
    conteudo: (
      <p>
        O app não é direcionado a crianças (menores de 12 anos) e não pedimos a idade de ninguém.
        Adolescentes devem usar o app com o conhecimento dos responsáveis, e tratamos os dados deles
        sempre no seu melhor interesse (LGPD, art. 14).
      </p>
    ),
  },
  {
    titulo: 'Mudanças nesta política',
    conteudo: (
      <p>
        Podemos atualizar esta política. Quando a mudança for relevante, avisaremos no app. A data da
        última atualização está no topo desta página.
      </p>
    ),
  },
  {
    titulo: 'Fale com a gente',
    conteudo: (
      <p>
        Dúvidas ou pedidos sobre seus dados: {CONTATO.email}. Você também nos encontra no Instagram{' '}
        {CONTATO.instagram}, mas use o e-mail para pedidos sobre dados pessoais.
      </p>
    ),
  },
]

export function PoliticaPrivacidadePage() {
  return (
    <AppLayout title="Privacidade">
      <DocumentoLegal
        titulo="Política de Privacidade"
        introducao={
          <p>
            Esta política explica, em linguagem simples, quais dados o <strong>Deu o Prego!</strong>{' '}
            coleta, para que usa, com quem compartilha e quais são os seus direitos.
          </p>
        }
        secoes={SECOES}
        outro={{ rotulo: 'Ler também os Termos de Uso', para: ROTAS_LEGAIS.termos }}
      />
    </AppLayout>
  )
}
