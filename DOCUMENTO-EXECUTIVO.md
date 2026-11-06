# Deu o Prego! — Documento Executivo

**O app colaborativo de fiscalização do transporte público por ônibus de Teresina e região**

| | |
| --- | --- |
| **Endereço** | https://deuoprego.com.br/ |
| **Quem mantém** | Fórum Piauiense de Luta pelo Transporte Público (movimento social, sem CNPJ) |
| **Contato** | forumpelotransporte@gmail.com · Instagram [@fimdosetut](https://www.instagram.com/fimdosetut/) |
| **Versão deste documento** | 1.0 — 05/11/2026 |

> Este documento explica a aplicação para pessoas **sem conhecimento técnico**: coordenação do Fórum,
> parceiros, apoiadores, órgãos públicos e imprensa. Não é preciso saber programar para entendê-lo.
> O detalhamento técnico para a equipe de desenvolvimento está no `README.md` do projeto.

---

## 1. Resumo executivo (leia isto em 2 minutos)

**Deu o Prego!** é uma plataforma **gratuita**, que funciona no navegador do celular ou do computador
**sem precisar instalar nada**, onde a população registra e acompanha problemas do ônibus urbano:
veículo quebrado, atraso, lotação, falta de acessibilidade e outros.

- **Qualquer pessoa** pode ver o mapa, a lista de denúncias e o painel de números — sem conta e sem dar dados.
- **Para denunciar**, não é preciso cadastro: dá para enviar na hora e criar a conta depois (as denúncias
  ficam guardadas no nome da pessoa). Quem tem conta ganha recursos extras.
- As denúncias de outras pessoas podem ser **confirmadas com um toque ("Também vi")**, o que dá
  credibilidade pública a cada registro sem expor quem denunciou.
- O app transforma relatos individuais em **dados organizados**: por linha, por zona da cidade, por tipo
  de problema, por dia e por hora — prontos para uso em reuniões, notas públicas, imprensa e cobrança
  junto às empresas e ao poder público.
- **Privacidade:** quem fez cada denúncia **nunca aparece publicamente**. Cada pessoa pode baixar uma
  cópia dos seus dados ou apagar a própria conta, em conformidade com a LGPD.
- **Custo atual: zero.** A plataforma roda em serviços gratuitos (Vercel e Supabase) com limites
  monitorados; o único compromisso fixo é o domínio próprio do site.

**Em uma frase:** o app dá à população do Grande Teresina uma ferramenta simples, pública e protegida
para transformar o dia a dia ruim do ônibus em registro organizado — e ao Fórum, dados concretos para a
luta por um transporte público decente.

---

## 2. O problema que o app resolve

| Sem o app | Com o app |
| --- | --- |
| O passageiro vê o problema, reclama com o vizinho e o registro se perde | O problema vira uma denúncia pública com data, hora, linha e local |
| Cada pessoa tem uma experiência isolada; "achismo" domina o debate | Múltiplas pessoas confirmam o mesmo problema ("Também vi"), criando evidência |
| Não há histórico por linha, zona ou empresa | Existe um painel público com números sempre atualizados |
| A cobrança por melhorias depende de denúncia genérica | A cobrança se apoia em dados: "a linha X teve N problemas nesta semana" |
| Reclamar exige identificar-se, o que inibe muita gente | A autoria é protegida: denunciar não expõe ninguém |

---

## 3. Quem usa e o que cada público ganha

| Público | O que ganha |
| --- | --- |
| **Passageiros e passageiras** | Vêem em tempo real o que está acontecendo nas linhas (inclusive nas que pegam todos os dias) e registram problemas em menos de um minuto, sem burocracia |
| **Fórum Piauiense** | Uma base de dados pública e atualizada para campanhas, notas, reuniões com SETUT, EPTT, prefeituras e imprensa |
| **Órgãos públicos e empresas** | Sinalização organizada dos pontos críticos por linha, zona, horário e veículo, útil para fiscalização e planejamento |
| **Imprensa e pesquisadores** | Fonte aberta de dados com filtros por período e zona, e imagens prontas para publicação |
| **Pessoas com deficiência (PcD)** | Bloco dedicado a acessibilidade no painel, com linhas e veículos mais citados |

---

## 4. Como funciona na prática: a jornada de uso

1. **Chegada.** A pessoa abre o site e vê o **mapa do dia**: cada denúncia é uma "explosão" no mapa,
   colorida pela zona da linha. Na primeira visita, um **tutorial de 5 passos** apresenta o app.
2. **Denunciar (com ou sem conta).** No celular, quem tem conta e já cadastrou suas linhas no perfil
   faz uma **denúncia rápida em 3 toques**: linha → problema → enviar (o local é capturado pelo GPS).
   Quem não tem conta pode enviar pelo formulário completo, marcando o local no mapa; depois o app
   convida a criar a conta para guardar o histórico. Antes de enviar, é preciso **aceitar a Política de
   Privacidade e os Termos de Uso** (o aceite fica registrado).
3. **Confirmar.** Outras pessoas tocam em **"Também vi"** (exige conta) e o contador da denúncia sobe —
   para todos, em tempo real, sem recarregar a página.
4. **Acompanhar.** A aba **Lista** reúne todas as denúncias com filtros (zona, linha, dia, status, tipo);
   a aba **Painel** mostra os números consolidados; o mapa permite voltar aos dias anteriores.
5. **Ser avisado.** Quem cadastrou as linhas que pega no perfil recebe um **aviso no app** quando alguém
   denuncia problema nessas linhas (e uma notificação do celular, se autorizada). O aviso funciona
   enquanto o app estiver aberto.
6. **Compartilhar.** O botão **Compartilhar** gera uma imagem pronta, na identidade visual do Fórum,
   no formato do feed do Instagram (serve também para WhatsApp e stories).
7. **Cuidar da própria conta.** No **Perfil**, a pessoa vê seus selos, marca denúncias como resolvidas,
   exclui registros próprios, envia feedback, baixa seus dados ou apaga a conta.

---

## 5. As telas do app

| Tela | Endereço | O que faz | Quem acessa |
| --- | --- | --- | --- |
| **Mapa** | `deuoprego.com.br` | Denúncias do dia em tempo real, marcadas por zona; seletor de dias anteriores; denúncia rápida (celular); busca por linha e filtro de status (computador); botões "Também vi" e "Compartilhar" | Todos |
| **Lista** | `/denuncias` | Todas as denúncias com filtros por zona, linha, dia, status e tipo; confirmação e compartilhamento; link "ver no mapa" | Todos |
| **Painel** | `/painel` | Números consolidados: totais, pendentes e resolvidos, gráfico por dia e por hora, rankings por zona, tipo e linha, bloco de acessibilidade e a "Linha mais problemática da semana" | Todos |
| **Nova denúncia** | `/nova` | Formulário completo: linha, tipo, número do veículo (opcional), descrição e local no mapa; envio sem cadastro permitido | Todos |
| **Perfil (Minhas)** | `/minhas` | Dados pessoais, linhas que pega, selos, minhas denúncias (resolver, reabrir, excluir), feedback, baixar meus dados, excluir conta | Contas |
| **Entrar / Criar conta** | `/login`, `/cadastro` | Acesso com e-mail e senha; confirmação por e-mail | Todos |
| **Política e Termos** | `/privacidade`, `/termos` | Documentos legais com versão e data | Todos |
| **Administração** | `/admin` | Gestão completa do app (ver seção 11) | Somente administradores |

O visual se adapta sozinho: no celular há uma barra de navegação na parte de baixo; no computador, um
menu lateral com telas mais largas. As cores seguem a identidade visual do Fórum (verde escuro e creme,
estética de cartaz de movimento popular), com contraste alto para leitura confortável.

---

## 6. O que pode ser denunciado e quais linhas estão cobertas

### Tipos de problema (9)

| Tipo | Exemplo |
| --- | --- |
| Ônibus quebrado | Veículo parou no meio do trajeto |
| Atraso | Passou muito depois do horário esperado |
| Lotação excessiva | Passageiros em pé apertados, sem condição de viajar |
| Acidente | Envolvendo o ônibus |
| Ônibus não passou | A viagem simplesmente não aconteceu |
| Ar-condicionado quebrado | Sem refrigeração no veículo |
| GPS/rastreador/letreiro com defeito | Não dá para saber onde o ônibus está ou qual é a linha |
| Acessibilidade (PcD) | Elevador fora de uso, falta de espaço ou de atendimento à pessoa com deficiência |
| Outro | Qualquer outro problema, descrito em texto |

Além do tipo, a denúncia pode incluir o **número do veículo** (importante para cobrar a empresa pelo
carro específico) e uma **descrição em texto**. O **local no mapa é obrigatório** — capturado pelo GPS
ou marcado manualmente.

### Linhas cobertas: 92, em 7 zonas

| Zona | Linhas |
| --- | --- |
| Norte, Sul, Leste e Sudeste (Teresina) | 76 linhas do sistema urbano (SETUT) |
| Timon (MA) | 11 linhas da EPTT, prefixo "T" (travessia pelas pontes para Teresina) |
| Rural | 5 linhas sem número (Campestre Norte, Santa Luz, Fazenda Soares, Bela Vista e Cajuína) |
| Outras | Categoria para casos não classificados |

A lista de linhas é gerenciada pela administração do Fórum dentro do próprio app: pode ser atualizada
a qualquer momento quando houver mudanças nos itinerários.

---

## 7. Confiança e controle de abuso

O app foi desenhado para que **dados falsos não sejam vantajosos** e que **manipulação seja difícil**:

| Proteção | Como funciona |
| --- | --- |
| Limite para quem não tem conta | No máximo **5 denúncias por hora** por pessoa anônima |
| "Também vi" só com conta | Confirmações exigem cadastro; anônimos não confirmam |
| Não vale confirmar a própria denúncia | O sistema bloqueia e avisa |
| Selo não nasce de denúncia enviada | Selos só são conquistados quando **outras pessoas** confirmam as denúncias de alguém — mandar denúncia falsa não rende nada |
| "Linha da semana" exige diversidade | Só entra no destaque semanal a linha denunciada por **pelo menos 2 pessoas diferentes** — uma conta sozinha não fabrica o ranking |
| Contadores protegidos | Os totais de confirmação não podem ser alterados manualmente nem pelas próprias pessoas |
| Banimento | Moderadores podem bloquear quem abusar; a pessoa bloqueada não denuncia nem confirma |
| Exclusão em cascata | Ao apagar uma denúncia, confirmações e autoria somem junto, sem sobras de dados |

---

## 8. Privacidade e LGPD, em linguagem simples

O tratamento de dados segue a Lei Geral de Proteção de Dados (LGPD):

- **Quem denunciou não aparece.** A autoria de cada denúncia fica em registro separado, **não público**.
  No mapa, na lista e no painel, ninguém vê quem fez a denúncia — apenas a linha, o tipo, o texto, o
  local, a data e quantas pessoas confirmaram.
- **Cadastro mínimo.** A conta pede apenas e-mail e senha; nome e bairro/trabalho/estudo são opcionais.
  Denunciar sem cadastro não pede nada além do aceite dos documentos.
- **Aceite registrado.** A Política de Privacidade e os Termos de Uso (versão de 01/11/2026) são aceitos
  no cadastro e no primeiro envio, com registro do aceite. Se o texto mudar de forma relevante, o app
  pede novo aceite.
- **A pessoa controla seus dados.** No Perfil, é possível **baixar uma cópia completa** dos próprios
  dados e **excluir a própria conta**. A exclusão é barrada apenas para o último administrador
  (proteção para o app não ficar sem gestão).
- **Imagens de compartilhamento seguras.** O cartão gerado para Instagram/WhatsApp é desenhado no
  próprio aparelho e só leva dados públicos — nunca a autoria.
- **Canal para exercer direitos.** Pedidos sobre dados pessoais (acesso, correção, exclusão) podem ser
  feitos a **forumpelotransporte@gmail.com**.

> **Pendência jurídica conhecida:** os textos legais atuais ainda não descrevem explicitamente o envio
> de denúncia sem cadastro (sessão anônima) nem as confirmações "Também vi". Recomenda-se revisão por
> quem responde juridicamente pelo Fórum — ao revisar, a versão dos documentos deve ser atualizada
> para que todos aceitem de novo.

---

## 9. Dados e números que o app produz (uso para a luta do Fórum)

O **Painel público** (`/painel`) calcula tudo no banco de dados, sem baixar as denúncias para o
aparelho, e pode ser filtrado por **período** (hoje, 7 dias, 30 dias ou todo o período) e por **zona**:

- Totais de denúncias, **pendentes** e **resolvidas**;
- Gráfico **por dia** (últimos 14 dias) e **por hora do dia** (com calendário — mostra, por exemplo,
  se os problemas se concentram no horário de pico);
- Rankings por **zona**, por **tipo de problema** e **top 5 linhas**;
- **Linha mais problemática da semana**: destaque dos últimos 7 dias, com a regra das 2 pessoas
  diferentes (e mensagem explicando a regra quando não há dados suficientes);
- **Bloco de acessibilidade (PcD)**: total, pendentes, linhas e **veículos** mais citados — base direta
  para cobrança sobre elevadores e atendimento.

Tudo em **tempo real**: uma denúncia enviada aparece na hora para todos que estão com o app aberto.

Para uso interno, a administração conta com um painel com filtros e **exportação em planilha (CSV)** —
arquivo que abre direto no Excel — com todas as colunas relevantes para análise.

**Sugestões de uso:** notas semanais do Fórum com a "linha mais problemática"; apresentações em
audiências públicas; pedidos de informação amparados em números; séries históricas por zona e horário
para debater frota e frequência; o bloco PcD para pautas de acessibilidade.

---

## 10. Engajamento: selos e reconhecimento leve

Para incentivar a colaboração **sem virar competição entre pessoas** — e sem ranking de usuários —
cada pessoa vê **no próprio perfil** os selos que conquistou e o que falta para os próximos:

| Selo | Como se conquista |
| --- | --- |
| **Voz ouvida** | Uma denúncia sua foi confirmada por outra pessoa |
| **Fiscal da linha (código)** | 3 denúncias suas na mesma linha, confirmadas por outras pessoas |
| **3, 7 e 30 dias seguidos** | Colaborar (enviar ou confirmar denúncias) em dias seguidos |

Como os selos dependem de **confirmação de outras pessoas**, denúncia falsa não gera reconhecimento.
O único ranking público é de **linhas** (nunca de pessoas).

---

## 11. Administração (o que a equipe do Fórum faz no app)

A área `/admin`, restrita a administradores, tem 5 abas:

| Aba | O que permite |
| --- | --- |
| **Painel** | Visão geral com dashboard filtrável (zona, tipo, status, período, linha, busca) e exportação CSV |
| **Denúncias** | Marcar como resolvida/pendente, excluir denúncia (com confirmação) |
| **Linhas** | Criar, editar e excluir linhas (ex.: quando a SETUT/EPTT muda itinerários) |
| **Usuários** | Ver contas, promover outros administradores e banir quem abusar |
| **Feedbacks** | Ler sugestões, problemas e elogios enviados pelas pessoas (só administradores têm acesso) |

Cada administrador pode promover outros pela própria tela. O bloqueio de um usuário
("banir") interrompe o envio e a confirmação de denúncias por aquela conta. Contas que nunca
cadastraram e-mail aparecem em branco na lista (são as anônimas).

---

## 12. Divulgação e presença digital

- **Cartões compartilháveis:** o botão "Compartilhar" (lista, mapa e ranking) gera imagem 1080×1350
  no formato de feed do Instagram, com a identidade visual do Fórum. No celular, abre o
  compartilhamento nativo (Instagram, WhatsApp etc.); no computador, baixa o arquivo. A imagem é
  gerada no próprio aparelho, em segundos.
- **Instagram do Fórum:** @fimdosetut, vinculado em pontos do app (ex.: tutorial).
- **Endereço memorável:** deuoprego.com.br — o nome "Deu o Prego!" vem do bordão popular para
  "deu problema", alinhado à linguagem das ruas.

---

## 13. Onde o app "mora" e quanto custa (visão sem jargão)

O app não tem servidor próprio: ele é composto por um **site** (a parte visual, que roda no aparelho
de cada pessoa) e um **serviço de dados** (onde ficam contas, denúncias e cálculos). Ambos usam
planos gratuitos consolidados no mercado:

| Serviço | Papel | Custo |
| --- | --- | --- |
| **Vercel** | Publica o site e entrega o endereço com segurança (HTTPS) | Gratuito (plano Hobby, uso não comercial) |
| **Supabase** | Guarda os dados, gerencia contas, envia e-mails de confirmação, alimenta o tempo real | Gratuito, com limites |
| **OpenStreetMap** | Mapa de fundo (colaborativo, tipo Wikipédia dos mapas) | Gratuito |
| **Domínio** | deuoprego.com.br | Renovação anual (único custo fixo) |

**Limites a acompanhar conforme o app cresce** (todos conhecidos e monitoráveis): quantidade de
e-mails de confirmação por hora (baixo sem configurar um remetente próprio), número de usuários
ativos, tamanho do banco e tráfego de dados. Em uso esperado de campanha, os planos gratuitos
comportam bem; o plano de contingência é migrar para planos pagos de baixo custo.

**Backup:** há um procedimento manual (`npm run backup`) que salva cópia completa dos dados em JSON.
Como a cópia contém dados pessoais, deve ser guardada em local privado. No plano gratuito do Supabase
não há backup automático — ver rotina na seção 14.

---

## 14. Rotina de operação: o que precisa ser feito para o app continuar saudável

| Frequência | Tarefa | Responsável sugerido |
| --- | --- | --- |
| Diária (ou a cada uso) | Moderar denúncias (marcar resolvido, excluir ofensas, banir abusos) e ler feedbacks | Equipe de moderação do Fórum |
| Semanal | Rodar o backup manual e guardar a cópia em local privado (apagar cópias antigas) | Equipe técnica |
| Mensal | Conferir limites do Supabase (e-mails, banco, usuários) e o uso da Vercel | Equipe técnica |
| Quando mudarem linhas | Atualizar itinerários na aba Linhas do admin | Equipe de moderação |
| Sempre que textos legais mudarem | Revisão jurídica + atualizar a versão dos documentos (todos aceitam de novo) | Responsável jurídico |
| Pontual | Configurar SMTP próprio (remetente de e-mail) se o volume de cadastros crescer; garantir pelo menos 2 administradores | Equipe técnica |

**Boas práticas já adotadas pelo projeto:** mais de 180 testes automáticos (45 arquivos) protegem as
regras do negócio; revisões de segurança com foco em privacidade (a autoria é privada por padrão);
qualidade de código verificada por ferramentas a cada alteração; respeita a preferência do aparelho
por menos animações (acessibilidade); alvos de toque grandes no celular.

---

## 15. Evolução recente (novidades incorporadas em 2026)

- **Cobertura ampliada:** linhas de **Timon/MA (EPTT)** e da **zona rural** de Teresina somaram-se às
  76 linhas urbanas — o app hoje cobre o Grande Teresina (92 linhas, 7 zonas).
- **Novos tipos de denúncia:** ônibus não passou, ar-condicionado quebrado e GPS/rastreador/letreiro
  com defeito (antes iam como "outro"); os três tipos de acessibilidade viram um único tipo "PcD".
- **Alertas de linha:** aviso no app (e notificação do navegador, se autorizada) quando alguém denuncia
  problema numa linha que a pessoa cadastrou no perfil.
- **Painel por hora do dia:** novo gráfico com calendário ao lado do histórico por dia — mostra a
  concentração de problemas nos horários de pico.
- **Bloco de acessibilidade no painel público**, com veículos mais citados.
- **Mapa melhorado:** denúncias muito próximas ficam agrupadas (o cartão navega entre elas), zoom
  inicial maior e seletor de dias anteriores.
- **Denúncia sem cadastro amadurecida:** limite por hora para anônimos, aceite registrado dos
  documentos e conversão suave em conta (as denúncias acompanham a pessoa).
- **Administração mais forte:** dashboard com filtros e busca, exportação CSV, paginação em todas as
  tabelas e gerenciamento completo de linhas.

---

## 16. Situação atual e próximos passos

**Situação:** o app está no ar em https://deuoprego.com.br/, com as funções descritas neste documento
implementadas e testadas. O projeto conta com checklist formal de publicação (segurança, privacidade e
fluxos reais no navegador) para validar cada entrega em ambiente de teste antes de ir ao público.

**Pendências recomendadas antes de uma campanha de divulgação em larga escala** (extraídas do
checklist de publicação do projeto):

1. **SMTP próprio** para e-mails de confirmação (sem isso, o Supabase limita os envios por hora e
   cadastros simultâneos podem ficar sem e-mail);
2. **Revisão jurídica** da Política de Privacidade, incluindo denúncia sem cadastro e "Também vi";
3. **Rotina de backup** efetivada (definir responsável e periodicidade);
4. **Responsável de moderação** formalizado, com pelo menos dois administradores ativos;
5. Avaliar **proteção anti-robô (CAPTCHA)** no envio anônimo, hoje tratada por limites de uso.

**Próximos passos sugeridos:** campanha de divulgação nos canais do Fórum; parcerias com entidades de
bairros e movimento PcD para ampliar a base; séries de dados mensais publicadas no Instagram;
encontro com SETUT/EPTT apresentando o painel.

---

## 17. Perguntas frequentes

**Preciso instalar algo?**
Não. É um site: abra deuoprego.com.br no navegador do celular ou computador e use. Pode ser adicionado
à tela de início como atalho.

**Preciso de conta para ver as denúncias?**
Não. Mapa, lista e painel são públicos.

**E para denunciar?**
Também não é obrigatório: dá para enviar na hora (até 5 por hora) e criar a conta depois. A conta
desbloqueia confirmações ("Também vi"), selos, alertas das suas linhas e histórico completo.

**Meu nome aparece na denúncia?**
Nunca. A autoria é guardada em registro privado; o público vê só o conteúdo da denúncia e quantas
pessoas a confirmaram.

**E se alguém denunciar mentira?**
Denúncia falsa não gera selo (que depende de confirmação de outras pessoas), não entra no destaque
semanal sem 2 pessoas diferentes e pode ser excluída pela moderação. Quem insistir pode ser banido.

**Quem vê meu e-mail?**
A administração do Fórum, apenas para gestão da plataforma. Nada de contato aparece publicamente.

**O app sabe onde estou?**
O local é usado apenas quando você denuncia: pelo GPS ou marcando no mapa. Denúncias mostram o ponto
escolhido, não a sua identidade.

**Quem paga o app?**
Hoje, ninguém: a infraestrutura é gratuita e o desenvolvimento é do Fórum. O único custo fixo é o
domínio. Se o uso crescer muito, planos pagos de baixo custo podem ser necessários.

**Posso usar os dados do painel em uma matéria/nota pública?**
Sim. O painel é público e pode ser citado com o endereço da fonte. A exportação completa (CSV) fica
com a administração do Fórum.

---

## 18. Glossário sem jargão

| Termo | O que significa aqui |
| --- | --- |
| **App / aplicativo** | Neste caso, um site que funciona como aplicativo, no navegador |
| **Conta / cadastro** | E-mail e senha para identificar a pessoa e guardar o histórico dela |
| **Denúncia anônima (sem cadastro)** | Envio imediato, sem conta; o app cria um identificador interno para depois, se a pessoa quiser, transformar em conta sem perder as denúncias |
| **"Também vi"** | Confirmação de que outra pessoa presenciou o mesmo problema; soma ao contador público da denúncia |
| **Tempo real** | As mudanças aparecem para todos na hora, sem recarregar a página |
| **Zona** | Região da cidade (Norte, Sul, Leste, Sudeste, Timon, Rural ou Outras) a que a linha pertence |
| **PcD** | Pessoa com deficiência; tipo de denúncia e bloco do painel dedicados à acessibilidade |
| **Selo** | Reconhecimento pessoal e privado, exibido só no perfil de quem conquistou |
| **LGPD** | Lei Geral de Proteção de Dados (Lei nº 13.709/2018), que rege o uso de dados pessoais |
| **CSV** | Arquivo de planilha que abre no Excel |
| **SMTP** | Configuração de remetente próprio para e-mails automáticos (ex.: confirmação de cadastro) |
| **Administrador (admin)** | Conta da equipe do Fórum com acesso à área de gestão `/admin` |
| **Banir** | Bloquear uma conta de denunciar e confirmar, usado em caso de abuso |
| **Backup** | Cópia de segurança dos dados, guardada fora do app |
| **Infraestrutura** | Os serviços que mantêm o app no ar (Vercel e Supabase) |
| **Vercel / Supabase / OpenStreetMap** | Serviços usados, respectivamente, para publicar o site, guardar dados e desenhar o mapa |

---

*Documento produzido a partir do código-fonte e da documentação técnica do projeto em 05/11/2026.
Para detalhes técnicos (instalação, banco de dados, testes, deploy), consulte o `README.md`; para o
roteiro de validação de publicação, o `CHECKLIST-PUBLICACAO.md`.*
