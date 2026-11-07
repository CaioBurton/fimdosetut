Segunda versão do **Deu o Prego!**, com fotos nas denúncias, instalação como app, selos de reconhecimento e muito mais.

Acesse: https://deuoprego.com.br/

## Novidades para quem usa
- **Foto na denúncia** (opcional): tire na hora ou escolha da galeria. A foto é reduzida no aparelho, sem localização (EXIF), e só é baixada quando alguém toca em "Ver foto". Passa por aprovação antes de aparecer.
- **Instale o app no celular**: o Deu o Prego! agora é um app instalável (PWA), com botão "Instalar" no Perfil.
- **Denúncia sem cadastro** e botão **"Também vi"** para confirmar denúncias de outras pessoas.
- **Selos de reconhecimento** no Perfil (Voz ouvida, Fiscal da linha, sequência de dias colaborando). Ganham selo as denúncias confirmadas por outras pessoas, não a quantidade enviada.
- **Compartilhar** a denúncia e o ranking semanal de linhas como imagem, para Instagram e WhatsApp.
- **Mapa**: calendário para escolher o dia (até 365 dias atrás), marcador da sua localização, mais zoom inicial, mais fluidez com muitas denúncias, cartão que navega entre denúncias agrupadas (Anterior/Próxima) e abertura centralizada na denúncia recém-criada.
- **Lista**: descrição longa com "Ver mais", paginação no celular e filtro de tipo suspenso no desktop. A lista baixa só o dia escolhido.
- **Acessibilidade**: tipos de denúncia para pessoas com deficiência (PcD), com destaque ao número do veículo, e bloco de acessibilidade no painel.
- **Novos tipos de denúncia**: ar-condicionado, GPS e "não passou".
- **Painel público**: gráfico de denúncias ao longo do dia com calendário e linha mais problemática da semana.
- **Mais linhas**: 11 linhas de Timon (EPTT), nova zona **Rural** (Campestre Norte, Santa Luz, Fazenda Soares, Bela Vista e Cajuína).
- Novo endereço: **deuoprego.com.br**.

## Para quem administra
- Fila de aprovação de fotos, com contador de pendentes em tempo real, remoção de fotos e limpeza de fotos órfãs do Storage.
- Mostra o nome dos usuários e o autor da denúncia no cartão da lista (só para admin).
- Exportação das denúncias em CSV.
- Gráfico de denúncias ao longo do dia e linha da semana no painel admin.
- Script de backup do Supabase (`npm run backup`).

## Desempenho
- Menos tráfego de saída do Supabase (cache, busca por dia, colunas explícitas e índices).
- Logos e SVGs otimizados (de ~840–965 KB para ~115–150 KB).

## Antes de atualizar
Rode no SQL Editor do Supabase as migrations `0012` a `0034`, em ordem, junto com o deploy do app. A `0029` cria o bucket de fotos no Storage.
