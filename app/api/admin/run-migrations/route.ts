/**
 * One-time migration endpoint.
 * Hit POST /api/admin/run-migrations once to create the signature_requests table.
 *
 * Requires SUPABASE_ACCESS_TOKEN env var — generate at:
 * https://app.supabase.com/account/tokens
 *
 * Blocked in production unless ADMIN_SECRET header matches ADMIN_SECRET env var.
 */
import { NextResponse } from 'next/server'

const MIGRATIONS = [
  // v1 — create signature_requests table
  `
  CREATE TABLE IF NOT EXISTS signature_requests (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id   UUID        NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    token         UUID        UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    client_email  TEXT        NOT NULL,
    client_name   TEXT        NOT NULL,
    contract_text TEXT        NOT NULL,
    status        TEXT        NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'signed', 'semnat_client', 'semnat_complet')),
    signed_at     TIMESTAMPTZ,
    signer_ip     TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS signature_requests_token_idx
    ON signature_requests(token);
  CREATE INDEX IF NOT EXISTS signature_requests_contract_id_idx
    ON signature_requests(contract_id);
  `,
  // v2 — add agent signing columns (safe to run even if columns already exist)
  `
  ALTER TABLE signature_requests
    ADD COLUMN IF NOT EXISTS device_info       TEXT,
    ADD COLUMN IF NOT EXISTS pdf_url           TEXT,
    ADD COLUMN IF NOT EXISTS agent_signed_at   TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS agent_ip          TEXT,
    ADD COLUMN IF NOT EXISTS agent_device_info TEXT;
  `,
  // Ensure the status constraint covers all states (drop+recreate idempotently)
  `
  ALTER TABLE signature_requests
    DROP CONSTRAINT IF EXISTS signature_requests_status_check;
  ALTER TABLE signature_requests
    ADD CONSTRAINT signature_requests_status_check
    CHECK (status IN ('pending', 'signed', 'semnat_client', 'semnat_complet'));
  `,
]

export async function POST(request: Request) {
  // Simple secret guard so this can't be called by random visitors
  const secret = request.headers.get('x-admin-secret')
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const accessToken = process.env.SUPABASE_ACCESS_TOKEN
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!accessToken || !supabaseUrl) {
    return NextResponse.json(
      {
        error: 'Missing env vars',
        needed: 'SUPABASE_ACCESS_TOKEN and NEXT_PUBLIC_SUPABASE_URL',
        sql: MIGRATIONS.join('\n'),
      },
      { status: 500 }
    )
  }

  // Extract project ref from https://<ref>.supabase.co
  const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)
  if (!match) {
    return NextResponse.json({ error: 'Cannot parse project ref from NEXT_PUBLIC_SUPABASE_URL' }, { status: 500 })
  }
  const projectRef = match[1]

  const results: { sql: string; ok: boolean; error?: string }[] = []

  for (const sql of MIGRATIONS) {
    const res = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql.trim() }),
      }
    )

    if (res.ok) {
      results.push({ sql: sql.trim().slice(0, 60) + '…', ok: true })
    } else {
      const body = await res.text()
      results.push({ sql: sql.trim().slice(0, 60) + '…', ok: false, error: body })
    }
  }

  const allOk = results.every((r) => r.ok)
  return NextResponse.json(
    { success: allOk, results },
    { status: allOk ? 200 : 207 }
  )
}
