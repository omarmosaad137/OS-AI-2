export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });
  try {
    const { prompt, context } = request.body || {};
    if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
      return response.status(200).json({ text: ['Demo AI draft:', '', prompt || '', '', context || '', '', 'Add GEMINI_API_KEY or OPENAI_API_KEY in Vercel to enable live AI.'].join('\n') });
    }
    const finalPrompt = ['You are OS Legal AI for a UAE law firm. Draft professionally and do not invent legal citations.', '', 'Context:', context || '', '', 'Request:', prompt || ''].join('\n');
    if (process.env.GEMINI_API_KEY) {
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;
      const r = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ contents:[{ role:'user', parts:[{ text: finalPrompt }]}] }) });
      const data = await r.json();
      const text = data.candidates?.flatMap(c => c.content?.parts || []).map(p => p.text || '').join('\n') || data.error?.message || 'No text returned.';
      return response.status(200).json({ text });
    }
    const r = await fetch('https://api.openai.com/v1/responses', { method:'POST', headers:{ Authorization:`Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type':'application/json'}, body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-5.2', input: finalPrompt }) });
    const data = await r.json();
    return response.status(200).json({ text: data.output_text || data.error?.message || 'No text returned.' });
  } catch (e) { return response.status(200).json({ text: e.message || 'AI error' }); }
}
