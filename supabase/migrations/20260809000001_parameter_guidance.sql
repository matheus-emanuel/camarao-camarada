-- Camarão Camarada — Orientações em linguagem simples para parâmetros que geram alerta
-- Reaproveita a coluna parameters.description (já existia, nunca era exibida ao cliente)
-- para explicar ao fazendeiro o que um resultado fora da faixa significa e o que fazer.

UPDATE parameters SET description =
  'Temperatura fora da faixa ideal reduz o crescimento e aumenta o estresse do camarão. Verifique a profundidade da lâmina d''água e os horários de aeração.'
  WHERE name = 'Temperatura';

UPDATE parameters SET description =
  'Oxigênio baixo pode causar estresse e mortalidade rapidamente. Ligue os aeradores imediatamente e reduza a ração até o nível normalizar.'
  WHERE name = 'Oxigênio Dissolvido';

UPDATE parameters SET description =
  'pH fora da faixa altera a toxicidade da amônia na água. Se estiver baixo, aplique calcário; se estiver alto, verifique excesso de algas no viveiro.'
  WHERE name = 'pH';

UPDATE parameters SET description =
  'Mudanças bruscas de salinidade estressam os camarões. Ajuste a renovação de água aos poucos, nunca de uma vez.'
  WHERE name = 'Salinidade';

UPDATE parameters SET description =
  'Alcalinidade baixa deixa o pH instável ao longo do dia. Aplique calcário para elevar e estabilizar.'
  WHERE name = 'Alcalinidade';

UPDATE parameters SET description =
  'Amônia acima do limite é tóxica, principalmente com pH ou temperatura altos. Reduza o arraçoamento e aumente a aeração e a renovação de água.'
  WHERE name = 'Amônia Total (TAN)';

UPDATE parameters SET description =
  'Nitrito em excesso prejudica o transporte de oxigênio no sangue do camarão. Aumente a aeração e reduza a densidade ou o arraçoamento.'
  WHERE name = 'Nitrito (NO₂⁻)';

UPDATE parameters SET description =
  'Nitrato elevado indica acúmulo de compostos nitrogenados no sistema. Faça uma renovação parcial de água ou sifonagem do fundo do viveiro.'
  WHERE name = 'Nitrato (NO₃⁻)';

UPDATE parameters SET description =
  'Sólidos suspensos fora da faixa afetam as brânquias dos camarões. Revise o manejo de bioflocos ou a taxa de renovação de água.'
  WHERE name = 'Sólidos Suspensos Totais';
