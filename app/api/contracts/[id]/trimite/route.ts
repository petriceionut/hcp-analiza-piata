import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 30;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json().catch(() => ({}));
    const { contractText, clientEmail, clientName } = body;

    if (!clientEmail) return NextResponse.json({ error: 'clientEmail is required' }, { status: 400 });

    const apiKey = process.env.SIGNWELL_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'SIGNWELL_API_KEY missing' }, { status: 500 });

    const base64Content = Buffer.from(contractText || 'Contract').toString('base64');

    const swRes = await fetch('https://www.signwell.com/api/v1/documents/', {
      method: 'POST',
      headers: { 'X-Api-Token': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        test_mode: false,
        draft: false,
        name: 'Contract HCP',
        due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        files: [{ name: 'contract.txt', base64_file_contents: base64Content }],
        recipients: [{ id: '1', name: clientName || 'Client', email: clientEmail }],
      }),
    });

    const swText = await swRes.text();
    console.log('[trimite] SignWell status:', swRes.status, swText.substring(0, 300));

    let swData: any = {};
    try { swData = JSON.parse(swText); } catch {}

    if (!swRes.ok) return NextResponse.json({ error: swText }, { status: 502 });

    try {
      await supabase.from('contracts').update({ status: 'trimis', signwell_document_id: swData?.id || null }).eq('id', params.id);
    } catch {}

    return NextResponse.json({ success: true, documentId: swData?.id });
  } catch (err: any) {
    console.error('[trimite] crash:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
