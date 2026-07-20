// fal.ai의 queue 기반 REST API로 Qwen-Image-Edit-2509(오픈소스, Apache-2.0)를 호출한다.
// 제출(POST) -> 상태 폴링(GET status_url) -> 결과 조회(GET response_url) 순서.
const FAL_SUBMIT_URL = 'https://queue.fal.run/fal-ai/qwen-image-edit-2509';
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 55000;

interface FalSubmitResponse {
  request_id: string;
  status_url: string;
  response_url: string;
}

interface FalStatusResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | string;
}

interface FalResultResponse {
  images?: { url: string }[];
  image?: { url: string };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function editImageWithFal(opts: {
  prompt: string;
  imageUrl: string;
  negativePrompt?: string;
}): Promise<string> {
  const falKey = Deno.env.get('FAL_KEY');
  if (!falKey) throw new Error('FAL_KEY_MISSING');

  const headers = {
    Authorization: `Key ${falKey}`,
    'Content-Type': 'application/json',
  };

  const submitRes = await fetch(FAL_SUBMIT_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt: opts.prompt,
      image_urls: [opts.imageUrl],
      negative_prompt: opts.negativePrompt ?? '',
      // 기본값(4)은 지시를 느슨하게 따라서 얼굴/배경까지 다시 그리는 경우가 많았다.
      // 값을 높여 프롬프트(=원본 보존 지시)를 더 엄격하게 따르게 한다.
      guidance_scale: 7.5,
    }),
  });
  if (!submitRes.ok) {
    const detail = await submitRes.text().catch(() => '');
    console.error('fal submit error', submitRes.status, detail.slice(0, 500));
    throw new Error('AI_PROVIDER_ERROR');
  }
  const submitted = (await submitRes.json()) as FalSubmitResponse;

  const startedAt = Date.now();
  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    await sleep(POLL_INTERVAL_MS);
    const statusRes = await fetch(submitted.status_url, { headers });
    if (!statusRes.ok) continue;
    const status = (await statusRes.json()) as FalStatusResponse;
    if (status.status === 'COMPLETED') {
      const resultRes = await fetch(submitted.response_url, { headers });
      if (!resultRes.ok) {
        console.error('fal result fetch error', resultRes.status);
        throw new Error('AI_PROVIDER_ERROR');
      }
      const result = (await resultRes.json()) as FalResultResponse;
      const url = result.images?.[0]?.url ?? result.image?.url;
      if (!url) {
        console.error('fal result missing image url', JSON.stringify(result).slice(0, 500));
        throw new Error('AI_PROVIDER_ERROR');
      }
      return url;
    }
  }

  throw new Error('AI_TIMEOUT');
}
