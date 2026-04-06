export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    // 400 오류면 상세 내용 반환
    if (!response.ok) {
      return res.status(response.status).json({
        error: data,
        debug: {
          model: body.model,
          max_tokens: body.max_tokens,
          api_key_exists: !!process.env.ANTHROPIC_API_KEY
        }
      });
    }
    
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
