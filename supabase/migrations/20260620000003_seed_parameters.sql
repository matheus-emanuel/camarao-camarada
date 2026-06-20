-- Camarão Camarada — Seed: 25 Parâmetros de Qualidade da Água
-- Migration: 003_seed_parameters
-- Fonte: testes_camarao.md (Litopenaeus vannamei)

INSERT INTO parameters (name, unit, category, ref_min, ref_max, method, display_order) VALUES
  ('Temperatura',               '°C',          'campo',          22.5,  28.8,  'Termômetro digital / Sonda multiparamétrica',           1),
  ('Oxigênio Dissolvido',       'mg/L',        'campo',          5.0,   NULL,  'Oxímetro portátil / Método de Winkler',                 2),
  ('pH',                        NULL,          'campo',          7.5,   8.5,   'pHmetro / Método colorimétrico',                        3),
  ('Salinidade',                'ppt',         'campo',          10.0,  25.0,  'Refratômetro / Condutivímetro',                         4),
  ('Transparência',             'cm',          'campo',          NULL,  NULL,  'Disco de Secchi',                                       5),
  ('ORP',                       'mV',          'campo',          NULL,  NULL,  'Sonda ORP',                                             6),
  ('Condutividade',             'µS/cm',       'campo',          NULL,  NULL,  'Condutivímetro',                                        7),
  ('Alcalinidade',              'mg/L CaCO₃',  'laboratorio',    120.0, 220.0, 'Titulação ácido-base',                                  8),
  ('Dureza',                    'mg/L CaCO₃',  'laboratorio',    NULL,  NULL,  'Titulação com EDTA',                                    9),
  ('Amônia Total (TAN)',        'mg/L',        'laboratorio',    NULL,  1.0,   'Colorimetria / Espectrofotometria',                     10),
  ('Amônia Não Ionizada (NH₃)', 'mg/L',        'laboratorio',    NULL,  NULL,  'Cálculo a partir de TAN, pH e Temperatura',             11),
  ('Nitrito (NO₂⁻)',            'mg/L',        'laboratorio',    NULL,  20.0,  'Colorimetria',                                          12),
  ('Nitrato (NO₃⁻)',            'mg/L',        'laboratorio',    NULL,  200.0, 'Espectrofotometria / Colorimetria',                     13),
  ('Nitrogênio Total',          'mg/L',        'laboratorio',    NULL,  NULL,  'Método Kjeldahl',                                       14),
  ('Fosfato (PO₄³⁻)',           'mg/L',        'laboratorio',    NULL,  NULL,  'Colorimetria',                                          15),
  ('Fósforo Total',             'mg/L',        'laboratorio',    NULL,  NULL,  'Digestão química + colorimetria',                       16),
  ('Clorofila-a',               'µg/L',        'laboratorio',    NULL,  NULL,  'Extração em solvente + espectrofotometria',             17),
  ('Sólidos Suspensos Totais',  'mg/L',        'laboratorio',    300.0, 500.0, 'Filtração e secagem em estufa',                         18),
  ('DBO',                       'mg/L O₂',     'laboratorio',    NULL,  NULL,  'DBO₅',                                                  19),
  ('DQO',                       'mg/L O₂',     'laboratorio',    NULL,  NULL,  'Digestão química com oxidantes fortes',                 20),
  ('Vibrio spp.',               'UFC/mL',      'microbiologico', NULL,  NULL,  'Cultivo microbiológico / PCR',                          21),
  ('Coliformes',                'NMP/100mL',   'microbiologico', NULL,  NULL,  'Fermentação em tubos múltiplos / Membrana filtrante',   22),
  ('Bactérias Heterotróficas',  'UFC/mL',      'microbiologico', NULL,  NULL,  'Contagem em placas',                                    23),
  ('Metais Pesados',            'variável',    'contaminantes',  NULL,  NULL,  'ICP-OES / ICP-MS / Absorção atômica',                  24),
  ('Resíduos de Agrotóxicos',   'variável',    'contaminantes',  NULL,  NULL,  'Cromatografia GC-MS / LC-MS',                          25);
