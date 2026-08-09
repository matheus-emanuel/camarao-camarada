-- Camarão Camarada — Descrições em linguagem simples para os parâmetros restantes
-- Complementa 20260809000001_parameter_guidance.sql, que só cobriu os 9 parâmetros
-- com ref_min/ref_max (os únicos capazes de disparar alerta). Estes 16 parâmetros
-- não geram alerta, mas ainda aparecem na tabela de resultados e merecem uma
-- explicação neutra do que medem, exibida como "Sobre este parâmetro" (não alerta).

UPDATE parameters SET description =
  'Mede a claridade da água com o disco de Secchi; indica a densidade de plâncton e a penetração de luz no viveiro.'
  WHERE name = 'Transparência';

UPDATE parameters SET description =
  'Indica o potencial de oxirredução da água, refletindo as condições de oxigenação e a atividade microbiana no fundo do viveiro.'
  WHERE name = 'ORP';

UPDATE parameters SET description =
  'Mede a capacidade da água de conduzir corrente elétrica, relacionada à concentração de sais e minerais dissolvidos.'
  WHERE name = 'Condutividade';

UPDATE parameters SET description =
  'Mede a concentração de cálcio e magnésio na água, importante para a formação do exoesqueleto do camarão.'
  WHERE name = 'Dureza';

UPDATE parameters SET description =
  'Fração tóxica da amônia total, calculada a partir do TAN, do pH e da temperatura; aumenta com pH e temperatura mais altos.'
  WHERE name = 'Amônia Não Ionizada (NH₃)';

UPDATE parameters SET description =
  'Soma de todas as formas de nitrogênio na água (orgânico e inorgânico), indicador geral de carga orgânica no sistema.'
  WHERE name = 'Nitrogênio Total';

UPDATE parameters SET description =
  'Forma de fósforo disponível para as algas; em excesso favorece o crescimento excessivo de fitoplâncton.'
  WHERE name = 'Fosfato (PO₄³⁻)';

UPDATE parameters SET description =
  'Soma de todas as formas de fósforo na água, indicador de carga orgânica e risco de eutrofização do viveiro.'
  WHERE name = 'Fósforo Total';

UPDATE parameters SET description =
  'Estima a densidade de fitoplâncton (algas) na água, usada para avaliar a produtividade primária do viveiro.'
  WHERE name = 'Clorofila-a';

UPDATE parameters SET description =
  'Mede o oxigênio consumido pela decomposição de matéria orgânica; valores altos indicam sobrecarga orgânica.'
  WHERE name = 'DBO';

UPDATE parameters SET description =
  'Mede o oxigênio necessário para oxidar quimicamente a matéria orgânica e inorgânica presente na água.'
  WHERE name = 'DQO';

UPDATE parameters SET description =
  'Contagem de bactérias do gênero Vibrio, associadas a doenças em camarões quando em concentração elevada.'
  WHERE name = 'Vibrio spp.';

UPDATE parameters SET description =
  'Indicador de contaminação fecal na água, relevante para a segurança sanitária do cultivo.'
  WHERE name = 'Coliformes';

UPDATE parameters SET description =
  'Contagem geral de bactérias heterotróficas na água, usada para monitorar a carga microbiana do sistema.'
  WHERE name = 'Bactérias Heterotróficas';

UPDATE parameters SET description =
  'Concentração de metais como cobre, zinco e chumbo, que podem ser tóxicos ao camarão mesmo em baixas doses.'
  WHERE name = 'Metais Pesados';

UPDATE parameters SET description =
  'Detecta resíduos de defensivos agrícolas na água, relevantes para a segurança alimentar do produto final.'
  WHERE name = 'Resíduos de Agrotóxicos';
