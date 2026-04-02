import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { contractText, clientEmail, clientName, agentEmail, agentName } = body;

    const apiKey = process.env.SIGNWELL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'SignWell API key missing' }, { status: 500 });
    }

    const textContent = contractText || 'Contract';
    const base64Content = Buffer.from(textContent).toString('base64');

    const payload = {
      test_mode: false,
      draft: false,
      name: 'Contract HCP',
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      files: [{ name: 'contract.txt', base64_file_contents: base64Content }],
      recipients: [
        { id: '1', name: clientName || 'Client', email: clientEmail || '' },
      ],
    };

    const swRes = await fetch('https://www.signwell.com/api/v1/documents/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const swText = await swRes.text();
    console.log('[SignWell] status:', swRes.status, 'body:', swText);

    let swData: any = {};
    try { swData = JSON.parse(swText); } catch {}

    if (swRes.ok) {
      await supabase.from('contracts').update({
        status: 'trimis',
        signwell_document_id: swData?.id || null,
      }).eq('id', id);

      return NextResponse.json({ success: true, documentId: swData?.id });
    } else {
      return NextResponse.json({ error: swText }, { status: 500 });
    }
  } catch (err: any) {
    console.error('[trimite] crash:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
