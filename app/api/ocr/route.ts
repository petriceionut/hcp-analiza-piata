import { NextRequest, NextResponse } from 'next/server';
import { createSign } from 'node:crypto';

export async function POST(request: NextRequest) {
  try {
    // ── 1. Parse file ────────────────────────────────────────────────────────
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    // ── 2. Parse credentials ─────────────────────────────────────────────────
    const rawCreds = process.env.GOOGLE_VISION_CREDENTIALS;
    if (!rawCreds) {
      console.error('[OCR] GOOGLE_VISION_CREDENTIALS env variable is not set');
      return NextResponse.json(
        { error: 'OCR service not configured' },
        { status: 503 }
      );
    }

    let credentials: Record<string, string>;
    try {
      credentials = JSON.parse(rawCreds);
    } catch (parseErr) {
      console.error('[OCR] Failed to parse GOOGLE_VISION_CREDENTIALS JSON:', parseErr);
      return NextResponse.json(
        { error: 'OCR service misconfigured' },
        { status: 503 }
      );
    }

    if (!credentials.client_email || !credentials.private_key) {
      console.error('[OCR] Credentials missing client_email or private_key');
      return NextResponse.json(
        { error: 'OCR service misconfigured' },
        { status: 503 }
      );
    }

    // ── 3. Obtain OAuth2 access token ────────────────────────────────────────
    let access_token: string;
    try {
      const jwt = createJWT(credentials);

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok || !tokenData.access_token) {
        console.error('[OCR] OAuth token request failed:', {
          status: tokenResponse.status,
          error: tokenData.error,
          error_description: tokenData.error_description,
        });
        return NextResponse.json(
          { error: 'OCR authentication failed' },
          { status: 502 }
        );
      }

      access_token = tokenData.access_token;
    } catch (authErr) {
      console.error('[OCR] Exception during OAuth token fetch:', authErr);
      return NextResponse.json(
        { error: 'OCR authentication error', details: authErr instanceof Error ? authErr.message : String(authErr) },
        { status: 502 }
      );
    }

    // ── 4. Call Google Vision API ────────────────────────────────────────────
    const visionResponse = await fetch(
      'https://vision.googleapis.com/v1/images:annotate',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64 },
              features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
            },
          ],
        }),
      }
    );

    const visionData = await visionResponse.json();

    if (!visionResponse.ok) {
      console.error('[OCR] Vision API error:', {
        status: visionResponse.status,
        error: visionData.error,
      });
      return NextResponse.json(
        { error: 'Vision API request failed', details: visionData.error?.message },
        { status: 502 }
      );
    }

    // Vision can return per-request errors inside responses[]
    const responseItem = visionData.responses?.[0];
    if (responseItem?.error) {
      console.error('[OCR] Vision API per-request error:', responseItem.error);
      return NextResponse.json(
        { error: 'Vision API could not process image', details: responseItem.error.message },
        { status: 422 }
      );
    }

    const text: string = responseItem?.fullTextAnnotation?.text ?? '';

    console.log(`[OCR] Extracted ${text.length} characters from file "${file.name}"`);

    return NextResponse.json({ text, success: true });
  } catch (error) {
    console.error('[OCR] Unexpected error:', error);
    return NextResponse.json(
      { error: 'OCR failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// ── JWT helpers ───────────────────────────────────────────────────────────────

function normalizePem(raw: string): string {
  // Vercel (and other platforms) can store the private_key with literal \n
  // sequences instead of real newlines — handle all variants:
  //   1. Already has real newlines  → fine as-is
  //   2. Escaped \\n from double-serialised JSON → unescape once first
  //   3. Literal \n (single backslash + n) → replace with real newline
  return raw
    .replace(/\\\\n/g, '\n')  // \\n  → real newline (double-escaped)
    .replace(/\\n/g, '\n')    // \n   → real newline (single-escaped)
    .trim();
}

function createJWT(credentials: Record<string, string>): string {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-vision',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');

  const signingInput = `${encode(header)}.${encode(payload)}`;

  // Use node:crypto createSign — accepts PEM directly, no manual DER conversion
  const pem = normalizePem(credentials.private_key);
  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  const signature = signer.sign(pem, 'base64url');

  return `${signingInput}.${signature}`;
}
