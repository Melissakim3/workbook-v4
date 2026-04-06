export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const model = body.model || '';

    // OpenAI 모델 여부 판단
    const isOpenAI = model.startsWith('gpt-') || model.startsWith('o1') || model.startsWith('o3');

    let apiUrl, headers;

    if (isOpenAI) {
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      };
      // OpenAI 형식으로 변환 (Anthropic messages → OpenAI messages)
      const openaiBody = {
        model: body.model,
        max_tokens: body.max_tokens || 4096,
        messages: body.messages
      };
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(openaiBody)
      });
      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({ error: data });
      }
      // OpenAI 응답을 Anthropic 형식으로 변환
      const text = data.choices?.[0]?.message?.content || '';
      return res.status(200).json({
        content: [{ type: 'text', text }]
      });
    } else {
      // Anthropic 모델
      apiUrl = 'https://api.anthropic.com/v1/messages';
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      };
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({ error: data });
      }
      return res.status(200).json(data);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
