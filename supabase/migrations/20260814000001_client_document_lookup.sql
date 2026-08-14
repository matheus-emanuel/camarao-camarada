-- Camarão Camarada — Busca de cliente por e-mail ou CPF/CNPJ
-- Migration: client_document_lookup
--
-- Parte da feature de acesso sem senha (CLIENT_PASSWORDLESS_ACCESS): o
-- cliente digita e-mail OU CPF/CNPJ em /login, e o backend precisa
-- encontrar a linha correspondente em `clients` independente de o
-- `document` estar salvo com ou sem máscara (ex.: "123.456.789-00" vs
-- "12345678900"). `document_digits` é uma coluna gerada (sempre em sync
-- com `document`, sem precisar de backfill manual) usada como chave de
-- busca. O índice único garante que dois clientes não colidam no mesmo
-- CPF/CNPJ normalizado.

ALTER TABLE clients
  ADD COLUMN document_digits TEXT
  GENERATED ALWAYS AS (regexp_replace(COALESCE(document, ''), '\D', '', 'g')) STORED;

CREATE UNIQUE INDEX idx_clients_document_digits
  ON clients (document_digits)
  WHERE document_digits <> '';

CREATE INDEX idx_clients_email_lower
  ON clients (lower(email));
