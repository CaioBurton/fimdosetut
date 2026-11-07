-- Tempo real da fila de fotos: o admin vê a foto nova chegar (e o contador da aba Fotos subir)
-- sem recarregar a página. A leitura continua protegida pela RLS de `fotos_pendentes` (autor ou
-- admin), então os eventos de INSERT só chegam a quem pode ler a linha.
alter publication supabase_realtime add table fotos_pendentes;
