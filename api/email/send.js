async function parseBody(request) {
  if (request.body && typeof request.body === 'object') return request.body;

  let raw = '';
  for await (const chunk of request) raw += chunk;

  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = await parseBody(request);
    const { to, subject, body: emailBody } = body || {};

    if (!to || !subject || !emailBody) {
      return response.status(400).json({ error: 'to, subject and body are required' });
    }

    if (!process.env.RESEND_API_KEY) {
      return response.status(200).json({
        demo: true,
        message: 'Email service is in demo mode. Add RESEND_API_KEY and EMAIL_FROM in Vercel to send real emails.'
      });
    }

    const from = process.env.EMAIL_FROM || 'OS Legal <noreply@os-legal.net>';

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text: emailBody
      })
    });

    const resultText = await resendResponse.text();
    let result;

    try {
      result = JSON.parse(resultText);
    } catch {
      result = { raw: resultText };
    }

    if (!resendResponse.ok) {
      return response.status(500).json({
        error: result?.message || result?.error || 'Email provider failed',
        details: result
      });
    }

    return response.status(200).json({ sent: true, result });
  } catch (error) {
    return response.status(500).json({ error: error.message || 'Failed to send email' });
  }
}
