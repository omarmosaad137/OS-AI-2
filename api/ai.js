function extractOutputText(data) {
  if (data.output_text) return data.output_text;

  if (Array.isArray(data.output)) {
    return data.output
      .flatMap((item) => Array.isArray(item.content) ? item.content : [])
      .map((content) => content.text || content.output_text || '')
      .filter(Boolean)
      .join('\n');
  }

  return '';
}

async function parseBody(request) {
  if (request.body && typeof request.body === 'object') return request.body;
  if (request.body && typeof request.body === 'string') {
    try { return JSON.parse(request.body); } catch { return {}; }
  }

  let raw = '';
  for await (const chunk of request) raw += chunk;
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = await parseBody(request);
    const { prompt, mode, context } = body || {};

    if (!prompt && !context) {
      return response.status(400).json({ error: 'Prompt or context is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return response.status(200).json({
        demo: true,
        text: [
          'Demo AI response.',
          '',
          'Add OPENAI_API_KEY in Vercel Environment Variables to enable live AI.',
          '',
          `Mode: ${mode || 'general'}`,
          '',
          'Prompt:',
          prompt || '',
          '',
          'Context:',
          context || ''
        ].join('\n')
      });
    }

    const aiPrompt = [
      'You are OS Legal AI, an internal legal drafting assistant for a UAE law firm.',
      'Draft in clear professional legal English unless Arabic is requested.',
      'Do not invent case law, article numbers, court decisions, or facts.',
      'If a legal citation is needed but not provided, say that it must be verified.',
      'Keep outputs practical, structured, and suitable for a lawyer to review.',
      '',
      `Mode: ${mode || 'general'}`,
      '',
      'Context:',
      context || '',
      '',
      'User request:',
      prompt || ''
    ].join('\n');

    const model = process.env.OPENAI_MODEL || 'gpt-5.2';

    const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        input: aiPrompt,
        max_output_tokens: 1800
      })
    });

    const rawText = await openaiResponse.text();
    let data;

    try {
      data = JSON.parse(rawText);
    } catch {
      data = { raw: rawText };
    }

    if (!openaiResponse.ok) {
      const message =
        data?.error?.message ||
        data?.message ||
        rawText ||
        'OpenAI API request failed.';

      return response.status(200).json({
        error: 'OpenAI API request failed',
        text: [
          'AI configuration error.',
          '',
          message,
          '',
          'Checklist:',
          '1. Confirm OPENAI_API_KEY is added in Vercel Environment Variables.',
          '2. Redeploy after adding or changing the key.',
          '3. Confirm the key has access to the selected model.',
          `4. Current model: ${model}`,
          '5. Optionally set OPENAI_MODEL in Vercel Environment Variables.'
        ].join('\n')
      });
    }

    const text = extractOutputText(data) || 'No text returned by the model.';
    return response.status(200).json({ text, model });
  } catch (error) {
    return response.status(200).json({
      error: error.message || 'AI request failed',
      text: [
        'AI server function error.',
        '',
        error.message || 'Unknown error',
        '',
        'Check the Vercel Function Logs for /api/ai.'
      ].join('\n')
    });
  }
}
