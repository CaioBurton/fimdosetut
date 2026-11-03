-- Atualiza os nomes das linhas conforme a lista oficial recebida (dia útil).
-- Não insere nem exclui linhas: 523 aguarda confirmação de itinerário e zona; 613 e 618 não são
-- cadastradas (688 e 617 têm o itinerário correspondente, sem confirmação oficial de renumeração).
-- As linhas 4, 105, 501, 518 e 716 não constam na lista e ficam como estão.

-- 1. Só mudança de grafia (sem mudança de trajeto).
update linhas l set nome = v.nome
from (
  values
    ('103', 'MOCAMBINHO / ALTO ALEGRE / MATADOURO'),
    ('206', 'BUENOS AIRES / AEROPORTO'),
    ('301', 'MOCAMBINHO / DUQUE DE CAXIAS'),
    ('302', 'MOCAMBINHO / ASSEMBLEIA / SHOPPING'),
    ('303', 'SANTA SOFIA / JOSÉ DOS SANTOS E SILVA'),
    ('563', 'UNIVERSIDADE CIRCULAR I / SHOPPING'),
    ('365', 'UNIVERSIDADE CIRCULAR II'),
    ('401', 'UNIVERSIDADE'),
    ('405', 'PLANALTO URUGUAI – SHOPPING VIA AV JOCKEY CLUBE'),
    ('502', 'SOCOPO – CIDADE JARDIM'),
    ('503', 'SATÉLITE – SÃO CRISTÓVÃO'),
    ('512', 'VILA BANDEIRANTE – SÃO CRISTÓVÃO'),
    ('513', 'PLANALTO URUGUAI – SÃO CRISTÓVÃO'),
    ('610', 'TRÊS ANDARES – MONTE CASTELO'),
    ('170', 'PLANALTO BELA VISTA / POTY VELHO'),
    ('270', 'PORTO ALEGRE / MOCAMBINHO'),
    ('615', 'SACI / MIGUEL ROSA (SHOPPING)'),
    ('688', 'VAMOS VER O SOL / MIGUEL ROSA (SHOPPING)'),
    ('614', 'SANTA FÉ / MIGUEL ROSA (SHOPPING)'),
    ('617', 'PLANALTO BELA VISTA / PROMORAR / MIGUEL ROSA (SHOPPING)'),
    ('620', 'CERAMICA CIL / MIGUEL ROSA'),
    ('621', 'IRMÃ DULCE / MIGUEL ROSA (SHOPPING)'),
    ('623', 'MARIO COVAS / MIGUEL ROSA (SHOPPING)'),
    ('616', 'PORTO ALEGRE / CIDADE SUL / MIGUEL ROSA (SHOPPING)'),
    ('627', 'TERESINA SUL / PQ ELIANE / MIGUEL ROSA (SHOPPING)'),
    ('706', 'IRMÃ DULCE / BARÃO'),
    ('714', 'MARIO COVAS / BARÃO'),
    ('715', 'TERESINA SUL / PQ ELIANE / BARÃO'),
    ('713', 'CERAMICA CIL / BARÃO'),
    ('723', 'RODOVIÁRIA CIRCULAR I'),
    ('100', 'REDONDA – SHOPPING – SÃO JOÃO'),
    ('327', 'RODOVIÁRIA CIRCULAR 2'),
    ('509', 'PARQUE JUREMA – SHOPPING'),
    ('515', 'SÃO PAULO – SHOPPING – SÃO JOÃO'),
    ('519', 'SÃO PAULO – PONTE WALL FERRAZ'),
    ('603', 'PARQUE JUREMA – MIGUEL ROSA'),
    ('604', 'LOURIVAL PARENTE – MIGUEL ROSA'),
    ('611', 'ALTO DA RESSUREIÇÃO – PONTE WALL FERRAZ'),
    ('612', 'REDENÇÃO'),
    ('703', 'PARQUE JUREMA – BARÃO'),
    ('704', 'JARDIM EUROPA – BARÃO – RODOVIÁRIA'),
    ('705', 'LOURIVAL PARENTE – BARÃO')
) as v (codigo, nome)
where l.codigo = v.codigo;

-- 2. Itinerário diferente do nome antigo (terminais/bairros trocados): validar antes de aplicar.
update linhas l set nome = v.nome
from (
  values
    ('104', 'SANTA MARIA VIA SHOPPING X JACINTA ANDRADE'),
    ('106', 'SANTA MARIA / VASSOURAS / PQ BRASIL / JACINTA ANDRADE'),
    ('109', 'MONTE VERDE / SHOPPING / JACINTA ANDRADE'),
    ('201', 'SANTA MARIA DA CODIPI / FRIPISA'),
    ('202', 'SANTA MARIA DA CODIPI / MONTE VERDE / FRIPISA'),
    ('203', 'NOVA TERESINA / MOC. ALTO ALEGRE / BUENOS AIRES / CENTENÁRIO'),
    ('204', 'SANTA MARIA / PARQUE BRASIL / FRIPISA'),
    ('245', 'VALE DO GAVIÃO / PLANALTO / DOM SEVERINO'),
    ('402', 'SATÉLITE – PLANALTO ININGA'),
    ('403', 'SATÉLITE – DOM SEVERINO – CAMPOS SALES'),
    ('404', 'VILA BANDEIRANTE – DOM SEVERINO – CAMPOS SALES'),
    ('521', 'NOVA TERESINA – PEDRA MOLE'),
    ('522', 'VALE DO GAVIÃO – SÃO CRISTÓVÃO – VILA ISABEL'),
    ('360', 'MOCAMBINHO / BELA VISTA'),
    ('801', 'SANTA FÉ / BARÃO'),
    ('711', 'VAMOS VER O SOL / BARÃO'),
    ('625', 'EDUARDO COSTA / MIGUEL ROSA (SHOPPING)'),
    ('712', 'EDUARDO COSTA / BARÃO'),
    ('505', 'REDONDA – SÃO CRISTÓVÃO'),
    ('506', 'SÃO PAULO – SÃO CRISTÓVÃO'),
    ('507', 'JARDIM EUROPA – SÃO CRISTÓVÃO'),
    ('508', 'ALTO DA RESSUREIÇÃO – SÃO JOÃO – BOA ESPERANÇA'),
    ('510', 'PARQUE JUREMA – SÃO CRISTÓVÃO'),
    ('520', 'PEDRO BALZI'),
    ('601', 'REDONDA – MIGUEL ROSA – RODOVIÁRIA'),
    ('602', 'SÃO PAULO – MIGUEL ROSA – ANSELMO DIAS'),
    ('619', 'JARDIM EUROPA – MIGUEL ROSA – RODOVIÁRIA'),
    ('702', 'SÃO PAULO – BARÃO – RODOVIÁRIA'),
    ('710', 'ALTO DA RESSUREIÇÃO – BARÃO – ANSELMO DIAS')
) as v (codigo, nome)
where l.codigo = v.codigo;
