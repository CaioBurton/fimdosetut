# RELEASE PARA A IMPRENSA

**Para divulgação imediata · Teresina (PI), 07 de novembro de 2026**

## Fórum Piauiense de Luta pelo Transporte Público lança "Deu o Prego!", app gratuito para a população denunciar ônibus quebrados, atrasados e lotados em Teresina e Timon

*Plataforma colaborativa reúne denúncias num mapa público em tempo real, cobre 92 linhas e protege a identidade de quem denuncia.*

O **Fórum Piauiense de Luta pelo Transporte Público** disponibiliza à população o **Deu o Prego!**, plataforma gratuita para registrar e acompanhar problemas no ônibus urbano do Grande Teresina: veículo quebrado, atraso, lotação, viagem que não aconteceu, falta de acessibilidade e outros. O endereço é **https://deuoprego.com.br/**.

A ideia é simples: transformar a reclamação que hoje se perde em conversa de ponto de ônibus em **registro público, com linha, local, data e hora**, e que sirva de base de dados para cobrar melhorias da SETUT, da EPTT e do poder público.

### Como funciona

- **Mapa do dia, em tempo real.** Cada denúncia aparece no mapa, colorida pela zona da linha. Qualquer pessoa pode ver o mapa, a lista de denúncias e o painel de números, sem criar conta.
- **Denúncia em poucos toques.** No celular, quem cadastra as linhas que pega envia uma denúncia em 3 toques (linha, problema, enviar), com o local capturado pelo GPS. Também é possível denunciar sem cadastro e criar a conta depois, sem perder o histórico.
- **Foto opcional.** A pessoa pode anexar uma foto, que passa por aprovação da moderação antes de ficar pública. A imagem é reduzida no aparelho e os dados de localização do arquivo são removidos.
- **"Também vi".** Outras pessoas podem confirmar uma denúncia com um toque, o que dá credibilidade ao registro sem expor quem denunciou.
- **Instalável no celular.** O app funciona no navegador e também pode ser instalado na tela inicial, como um aplicativo.
- **Alertas.** Quem cadastra suas linhas é avisado quando alguém denuncia problema nelas.
- **Compartilhamento.** Denúncias e o ranking semanal viram imagem pronta para Instagram e WhatsApp.

### Dados abertos para a cobrança por melhorias

O **painel público** (`/painel`) consolida os números e pode ser filtrado por período e zona:

- totais de denúncias, pendentes e resolvidas;
- gráfico por dia e por hora do dia, que mostra a concentração de problemas nos horários de pico;
- rankings por zona, tipo de problema e linha;
- a **"linha mais problemática da semana"**, que só considera linhas denunciadas por pelo menos duas pessoas diferentes, para evitar manipulação;
- um **bloco de acessibilidade (PcD)**, com as linhas e os veículos mais citados em denúncias de elevador fora de uso e falta de atendimento.

### Cobertura

- **92 linhas em 7 zonas:** 76 linhas urbanas da SETUT (Norte, Sul, Leste e Sudeste), 11 linhas de Timon (MA) operadas pela EPTT, 5 linhas rurais e uma categoria para outros casos.
- **9 tipos de denúncia:** ônibus quebrado, atraso, lotação excessiva, acidente, ônibus que não passou, ar-condicionado quebrado, GPS/rastreador/letreiro com defeito, acessibilidade (PcD) e outro.

### Privacidade e controle de abuso

- **Quem denuncia não aparece.** A autoria fica em registro privado. Publicamente, só se vê a linha, o tipo, o texto, o local, a data e quantas pessoas confirmaram.
- **LGPD.** O cadastro pede apenas e-mail e senha. Cada pessoa pode baixar uma cópia dos próprios dados e excluir a conta.
- **Proteções contra manipulação.** Denúncias sem cadastro têm limite de 5 por hora, só quem tem conta confirma denúncias e ninguém confirma a própria. Os selos de reconhecimento só são concedidos quando **outras pessoas** confirmam uma denúncia, então enviar denúncia falsa não rende nada. Não há ranking de pessoas, só de linhas.

### Serviço

- **Site:** https://deuoprego.com.br/
- **Custo para o usuário:** gratuito
- **Requisitos:** navegador no celular ou no computador; instalação opcional
- **Painel público de dados:** https://deuoprego.com.br/painel

### Sobre o Fórum Piauiense de Luta pelo Transporte Público

Movimento social que atua pela melhoria do transporte coletivo em Teresina e região. O Deu o Prego! é mantido pelo Fórum e roda em serviços de hospedagem gratuitos.

### Contato para a imprensa

Fórum Piauiense de Luta pelo Transporte Público
E-mail: forumpelotransporte@gmail.com
Instagram: [@fimdosetut](https://www.instagram.com/fimdosetut/)
Telefone/WhatsApp: [PREENCHER]
Porta-voz disponível para entrevista: [PREENCHER NOME]

---

### Notas para o envio (apagar antes de mandar ao jornalista)

Estes pontos precisam ser decididos pelo Fórum, porque o repositório não traz as informações:

1. **Números de uso** (denúncias registradas, usuários, linha mais denunciada). Se houver dados do painel, vale incluí-los num parágrafo, porque jornalista costuma pedir isso. Eu não inventei nenhum.
2. **Citação de um porta-voz.** Release costuma ter uma aspa. Sugestão: *"[Nome], do Fórum Piauiense: 'O passageiro já sabe que o ônibus quebra. O que faltava era um registro público que a gente pudesse levar para a mesa de negociação.'"* Só use se a pessoa aprovar.
3. **Data de lançamento.** O texto usa a data de hoje e não diz "lançamento" de forma definitiva. Ajuste se o app já estiver no ar há mais tempo (o Documento Executivo é de 05/11/2026 e a versão atual é a 1.1.0).
4. **Revisão jurídica pendente.** O Documento Executivo registra que a Política de Privacidade ainda não descreve explicitamente a denúncia sem cadastro nem o "Também vi". Se o jornalista perguntar sobre LGPD, convém que alguém responsável juridicamente pelo Fórum já tenha revisado.
5. **E-mail de confirmação e SMTP.** Se a matéria gerar pico de cadastros, o limite de e-mails do Supabase pode travar a confirmação de contas. Vale configurar o SMTP antes da publicação (está na lista de pendências do projeto).
