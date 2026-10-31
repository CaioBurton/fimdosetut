# Identidade Visual — Fórum Piauiense de Luta pelo Transporte Público

> Documento de referência para Claude construir o site do Fórum. Extraído do manual de identidade visual (forumIDV.pdf, 19 páginas). Itens marcados **[DEFINIDO]** vêm explicitamente do manual; itens **[ESTIMADO]** foram inferidos visualmente e podem ser ajustados; itens **[SUGESTÃO]** são recomendações para a adaptação ao web, não estão no manual.

---

## 1. Essência da marca

- **Nome completo:** Fórum Piauiense de Luta pelo Transporte Público
- **Nome curto / marca:** FÓRUM PIAUIENSE
- **Assinatura (tagline do logo):** "De luta pelo transporte público"
- **Idioma do site:** português do Brasil
- **Natureza:** movimento social / organização popular de Teresina, Piauí, ligado à luta por transporte público, tarifa e direito à cidade.
- **Tom visual:** combativo, popular, de cartaz e lambe-lambe. Alto contraste, imagens em preto e branco vetorizadas (estilo estêncil/xerox), formas de "explosão" e uma paleta enxuta de verde. Referência histórica: a **Revolta do Busão** (foto de jovens em cima de um ônibus, ônibus nº 007).
- **Referências do moodboard:** ônibus de Teresina (verde-limão com faixas por zona), Ponte Estaiada, Torre da Cidade, mapa e bandeira do Piauí, catraca, movimentos sociais (Comitê Popular de Luta, MST, OPA, LCP, COMSOLUTE, Catraca Livre).

---

## 2. Paleta de cores

### Cores oficiais [DEFINIDO]

| Nome | HEX | RGB | CMYK |
|---|---|---|---|
| Verde escuro (cor principal) | `#084400` | 8 / 68 / 0 | 88 / 0 / 100 / 73 |
| Verde claro / off-white (fundo) | `#F3FCEE` | 243 / 252 / 238 | 4 / 0 / 6 / 1 |

### Neutros [DEFINIDO]
- Preto `#000000` e branco `#FFFFFF`: usados só nas versões monocromáticas do logo, em fundo preto ou branco.

### Tons de apoio [ESTIMADO] (aparecem nas aplicações tom sobre tom)
- Verde médio: `#307800` (ilustrações em tom sobre tom sobre o verde escuro)
- Verde claro suave: aproximadamente `#A8D5A0` (ilustrações em tom sobre tom sobre o fundo claro)
- Verde escuro alternativo: `#004000`

### Cores só do moodboard (NÃO fazem parte da paleta final)
Verde-limão, rosa/lilás e marrom-escuro aparecem nas referências. O manual diz "Experimentar diferentes modos de mesclagem". Use-as, no máximo, como destaque pontual e experimental, nunca como base.

### Variáveis CSS sugeridas [SUGESTÃO]
```css
:root {
  --verde-escuro: #084400;
  --verde-claro: #F3FCEE;
  --verde-medio: #307800;
  --verde-suave: #A8D5A0;
  --preto: #000000;
  --branco: #FFFFFF;
}
```

### Combinações de uso [DEFINIDO]
- Verde escuro sobre verde claro (padrão principal).
- Verde claro sobre verde escuro (versão invertida).
- Preto sobre branco e branco sobre preto (versões monocromáticas).
- Contraste verde escuro `#084400` sobre `#F3FCEE`: muito alto (acessível AA/AAA).

---

## 3. Tipografia

| Uso | Família | Pesos |
|---|---|---|
| Títulos, destaques, nome da marca | **Proxima Nova Alt** | Black, Black Italic, Bold |
| Subtítulos, texto corrido, tagline | **Caros Soft** | Extra Light, Regular, Bold |

- O manual apresenta o título de tipografia como "TIPOGRAFIA / Tipography", em Black Italic.
- O nome "FÓRUM PIAUIENSE" é sempre em **caixa alta, Black Italic**, com entrelinha bem fechada.
- A tagline "De luta pelo transporte público" é em **caixa baixa, Extra Light**, em duas linhas ("De luta pelo / transporte público").

### Fontes para web [SUGESTÃO]
Proxima Nova e Caros Soft são comerciais. Se não houver licença web, use alternativas do Google Fonts:
- Título: **Montserrat** (800/900 italic) ou **Figtree** (900 italic), no lugar de Proxima Nova Alt Black.
- Texto: **Quicksand** (300/400/700) ou **Poppins** (200/300), no lugar de Caros Soft.
```css
--font-titulo: "Proxima Nova Alt", "Montserrat", sans-serif; /* 900 italic */
--font-texto: "Caros Soft", "Quicksand", sans-serif;          /* 200 / 400 / 700 */
```

### Hierarquia sugerida [SUGESTÃO]
- H1/H2: fonte de título, Black Italic, MAIÚSCULAS, line-height ~0.9–1.0.
- H3/H4: fonte de título, Bold.
- Corpo: fonte de texto, Regular (peso 400), 16–18px, line-height 1.5–1.6.
- Destaques e citações: fonte de texto, Extra Light em tamanho grande.

---

## 4. Logotipo

O logo é formado por um **ônibus visto de frente, com pessoas em cima do teto** (a imagem da Revolta do Busão, vetorizada em alto contraste) mais o texto. Existem três versões:

1. **Selo circular:** ônibus no centro, com o texto "FÓRUM PIAUIENSE DE LUTA PELO TRANSPORTE PÚBLICO" em círculo e um ponto final (•) fechando o círculo.
2. **Horizontal:** ônibus à esquerda; à direita "FÓRUM / PIAUIENSE" (Black Italic, 2 linhas) e abaixo "De luta pelo / transporte público" (Extra Light, 2 linhas).
3. **Vertical:** ônibus no topo, com o texto "FÓRUM PIAUIENSE / De luta pelo transporte público" centralizado embaixo.

### Variações de cor [DEFINIDO]
- Verde escuro `#084400` sobre fundo `#F3FCEE`.
- Preto sobre branco.
- Branco sobre preto.
- Verde claro `#F3FCEE` sobre verde escuro `#084400`.
- Selo circular: pode ser cheio (círculo sólido com o ônibus vazado) ou só contorno.

### Área de proteção [DEFINIDO]
O espaço livre mínimo ao redor do logo horizontal é **x**, onde **x = a altura da letra "F" de "FÓRUM"**. Vale para os quatro lados.

### Regras de uso no site [SUGESTÃO]
- Header: logo horizontal (versão verde escuro em fundo claro, ou clara em fundo verde escuro). Em mobile, trocar para o selo circular ou para a versão vertical compacta.
- Favicon/avatar: selo circular ou o ícone do ônibus.
- Rodapé: logo vertical ou horizontal invertido sobre verde escuro.
- Não distorcer, não recolorir fora das combinações acima, não colocar sobre fotos sem contraste.

---

## 5. Elementos gráficos de apoio (ícones/ilustrações vetoriais)

Seis elementos em estilo estêncil, em versões cheias e em contorno:

1. **Explosão cheia** (forma estrelada/"estouro" preenchida).
2. **Explosão em contorno.**
3. **Catraca com mapa do Piauí:** ícone de catraca cujo corpo tem o formato do estado.
4. **Ônibus frontal com pessoas no teto.**
5. **Ônibus lateral com pessoa agitando bandeira no teto.**
6. **Ônibus com pessoas e silhueta de explosão ao fundo** (Revolta do Busão).

### Padrão (pattern) [DEFINIDO]
Repetição em grade dos seis elementos, em duas versões:
- Elementos `#F3FCEE` sobre fundo `#084400`.
- Elementos `#084400` sobre fundo `#F3FCEE`.

### Tom sobre tom [DEFINIDO]
Em fundos grandes, o padrão e as ilustrações aparecem em tom um pouco mais claro ou mais escuro que o fundo, de forma sutil, servindo de textura (opacidade baixa).

### Imagens
- Fotos e ilustrações usam **tratamento em alto contraste**, vetorizado em duas cores (estêncil), nunca fotografia colorida cheia.
- Imagem-chave: o grupo de jovens em cima do ônibus. Pode ser usada ampliada e cortada pela borda, como em capas.

---

## 6. Aplicações e composição

- **Capa/hero:** fundo verde escuro; logo no canto superior esquerdo; imagem do grupo em cima do ônibus muito ampliada em verde claro, cortada pela borda inferior e pela lateral; selos circulares em versão clara como assinatura.
- **Peças verticais (stories/cartazes):**
  - Opção A: logo no topo; embaixo, o ônibus frontal grande em tom sobre tom, com o arco de texto "DE LUTA PELO TRA…" cortado pela borda.
  - Opção B: padrão de ícones em tom sobre tom como fundo, com o logo pequeno na base.
  - Opção C: selo circular no topo; embaixo, ilustração grande do ônibus lateral com a pessoa agitando a bandeira, cortada pela borda.
  - Cada opção existe em fundo verde escuro e em fundo claro.
- **Texto em arco:** o texto "DE LUTA PELO TRANSPORTE" em fonte de título, espaçado, em curva circular, usado como elemento gráfico grande e cortado pelas bordas.
- **Estética geral:** elementos grandes e cortados pela borda, bastante respiro, fundo chapado de uma só cor, tipografia grande e de impacto.

---

## 7. Diretrizes para o site [SUGESTÃO, derivadas da identidade]

### Estrutura visual
- Alternar seções em verde escuro (`#084400`, texto `#F3FCEE`) e verde claro (`#F3FCEE`, texto `#084400`) para dar ritmo.
- Usar o padrão de ícones como textura de fundo em seções-chave, com opacidade baixa (5–15%).
- Usar as explosões como "selos" para destaques (chamadas, datas, botões de ação) e como divisores de seção.
- Títulos grandes em MAIÚSCULAS Black Italic, com palavras-chave podendo ser destacadas em verde-limão/verde médio com moderação.

### Componentes
- **Botão primário:** fundo `#084400`, texto `#F3FCEE`, fonte de título Bold, cantos retos ou muito pouco arredondados (estética de cartaz). Hover: inverter as cores ou usar o verde médio `#307800`.
- **Botão secundário:** contorno de 2px em `#084400`, fundo transparente.
- **Cards:** fundo claro com borda verde escura ou fundo verde escuro com texto claro; sem sombras suaves, preferir bordas firmes ou sombra "chapada" deslocada.
- **Links:** verde escuro sublinhado em fundo claro; verde claro sublinhado em fundo escuro.
- **Destaques/citações:** fonte Extra Light em tamanho grande, ao lado de uma explosão ou do selo circular.

### Seções típicas
Hero com logo e chamada; Quem somos (o Fórum e suas bandeiras); Pautas/Campanhas; Notícias e notas; Agenda de atos e reuniões; Documentos e dados (tarifa, linhas, frota); Galeria (imagens em P&B vetorizado ou estêncil); Participe/Contato/Redes sociais.

### Acessibilidade
- O par `#084400` / `#F3FCEE` tem contraste muito alto. Evitar texto em `#307800` ou `#A8D5A0` sobre fundos de tom próximo.
- Todas as ilustrações decorativas com `alt=""` ou `aria-hidden`; logo com `alt="Fórum Piauiense de Luta pelo Transporte Público"`.
- Respeitar `prefers-color-scheme`: modo escuro = fundo `#084400` e texto `#F3FCEE`; modo claro = o inverso.

### O que evitar
- Cores fora da paleta como base (rosa, lilás, marrom e verde-limão do moodboard).
- Fotografias coloridas sem tratamento.
- Cantos muito arredondados, gradientes suaves e sombras difusas, que fogem da estética de cartaz.
- Esticar ou recolorir o logo, ou ignorar a área de proteção.

---

## 8. Pendências / o que o manual não informa

- Não há tamanhos mínimos do logo, nem regras de uso errado.
- Não há arquivos vetoriais neste documento: o logo e os ícones precisam ser fornecidos à parte (SVG/PNG) a partir do PDF original ou dos arquivos-fonte.
- Códigos exatos dos tons intermediários de verde não foram definidos.
- Não há textos institucionais (missão, história, redes sociais, contatos): precisam ser enviados pelo usuário.
- Não há licença confirmada para Proxima Nova Alt e Caros Soft.
