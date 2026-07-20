// Hugging Face Inference Providers 라우터(OpenAI 호환 chat completions)를 호출한다.
// 모델은 provider 접미사 없이 넘겨서(예: "Qwen/Qwen3-VL-8B-Instruct") 라우터가 가용한
// provider를 알아서 고르게 한다.
const HF_ROUTER_URL = 'https://router.huggingface.co/v1/chat/completions';

export async function callHfVisionChat(opts: {
  model: string;
  systemPrompt: string;
  userText: string;
  imageDataUrl: string;
}): Promise<string> {
  const hfToken = Deno.env.get('HF_TOKEN');
  if (!hfToken) throw new Error('HF_TOKEN_MISSING');

  const res = await fetch(HF_ROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${hfToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model,
      temperature: 0.4,
      max_tokens: 1400,
      messages: [
        { role: 'system', content: opts.systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: opts.userText },
            { type: 'image_url', image_url: { url: opts.imageDataUrl } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('HF router error', res.status, detail.slice(0, 500));
    throw new Error('AI_PROVIDER_ERROR');
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    console.error('HF router empty content', JSON.stringify(data).slice(0, 500));
    throw new Error('AI_PROVIDER_ERROR');
  }
  return content;
}
