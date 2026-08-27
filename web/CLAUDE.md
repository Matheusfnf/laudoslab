# Proativa Lab — Sistema de Laudos e Produção

## ⛔ REGRA ABSOLUTA: Banco de dados

**NUNCA mexer em nada do banco de dados sem autorização explícita do Matheus, pedida e concedida na conversa.**

Isso cobre:

- Criar, editar ou apagar qualquer arquivo `*.sql` deste repositório.
- Escrever ou sugerir a execução de `DROP`, `DELETE`, `TRUNCATE`, `ALTER TABLE` ou alteração de policy RLS.
- Rodar qualquer coisa contra o Supabase via CLI (`supabase`, `psql`) ou script.
- Alterar código de aplicação que apague ou sobrescreva dados em massa
  (ex.: um `.delete()` sem `.eq()`, um `update` sem filtro).

Como proceder quando uma tarefa precisar de mudança no banco:

1. Parar antes de escrever o arquivo.
2. Explicar o que precisa mudar e por quê.
3. Esperar o "pode fazer" explícito.
4. Só então escrever o `.sql` — sempre aditivo (`CREATE TABLE IF NOT EXISTS`,
   `ADD COLUMN IF NOT EXISTS`), nunca destrutivo.

Os scripts `.sql` são migrações rodadas **manualmente** no SQL Editor do Supabase.
Escrever o arquivo não aplica nada — mas o arquivo é o registro do schema, então
ele não muda sem autorização também.

Reforço técnico: `.claude/settings.json` tem regras `permissions.ask` que fazem
qualquer Edit/Write em `*.sql` pedir confirmação.

## O que é o projeto

App interno do laboratório Proativa Lab. Dois módulos:

- **Laudos** — laudos microbiológicos de controle de qualidade. Cria a partir de
  foto do laudo analítico (Gemini extrai os dados), edita, gera PDF e QR Code
  para consulta pública.
- **Produção** — Kanban de pedidos → itens → lotes, com certificado de CQ por lote.

## Stack

- Next.js 16.1.6 (App Router, Turbopack), React 19, JavaScript puro (sem TypeScript)
- Supabase (Postgres + Auth + Storage), acessado direto do cliente via `@/lib/supabase`
- Gemini 2.5 Flash em `src/app/api/parse-report/route.js` (única rota de API)
- Estilo: CSS inline + `globals.css`; Tailwind 4 instalado mas quase não usado
- PDF: `html2pdf.js` / `html2canvas` no browser. Ícones: `lucide-react`

## Mapa

| Rota | Arquivo |
|---|---|
| `/` | `src/app/page.js` — hub dos módulos |
| `/laudos` | lista por mês, com filtros |
| `/laudos/modificados` | dashboard de laudos alterados |
| `/create`, `/edit/[id]` | formulário de laudo (os dois maiores arquivos, ~1.4k linhas cada) |
| `/report/[id]`, `/report/[id]/label` | visualização e etiqueta com QR |
| `/p/[id]` | **rota pública** do QR — sem login (tratada à parte no layout) |
| `/clients` | cadastro de clientes |
| `/producao` | Kanban (~1.5k linhas) |
| `/producao/certificado/[id]` | certificado de CQ do lote |
| `/relatorios` | relatório de produção por período/cliente |

Templates de PDF em `src/components/`: `ReportPDFTemplate` (micro),
`SeedReportPDFTemplate`, `RootReportPDFTemplate`, `SoilReportPDFTemplate`,
`CertificatePDFTemplate`.

## Tabelas

`reports` · `microorganisms` · `report_images` · `clients` ·
`production_orders` · `production_order_items` · `production_batches` ·
`production_certificates` · `certificate_microorganisms` ·
`certificate_physicochemical` · `catalog_products` · `allowed_emails`

Um laudo tem `report_type` (`micro` | `seed` | `soil` | `root`); os tipos não-micro
guardam os resultados em `matrix_results` (JSONB). Cadastro é restrito por
whitelist: um trigger em `auth.users` valida contra `allowed_emails`.

Produto de produção tem **dois eixos independentes** em `catalog_products`:

- `category` — classe comercial: `cepa` | `metabolito` | `meio_cultura`.
  Os "Ativador X MB" são `metabolito`. Meio de cultura são dois produtos fixos,
  siglas `BAC` e `FUN`.
- `type` — grupo biológico: `bacteria` | `fungus` | `other`. Continua valendo
  para cepa e metabólito; meio de cultura usa `other` e o campo é escondido na UI.

A classe é copiada para `production_order_items.product_category` no momento do
pedido, para o item não mudar de classe se o catálogo for reclassificado depois.
Na etiqueta impressa, `meio_cultura` sai como `MEIO DE CULTURA {sigla}`; o resto
sai como `ATIVADOR {sigla}`.

## Convenções

- Interface toda em **português do Brasil**.
- Comentários e nomes de variáveis: código em inglês, comentários em português —
  siga o que já está no arquivo que você está editando.
- Estilo inline com objetos JS é o padrão da casa. Não migre para Tailwind sem pedir.
- Usar as imagens de `../inspirações/` como referência visual (regra em `.agents/rules/design.md`).

## Rodar

```bash
npm run dev
```
