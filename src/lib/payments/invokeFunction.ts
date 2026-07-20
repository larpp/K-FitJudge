import { supabase } from '../supabaseClient';

/**
 * supabase.functions.invoke()를 감싸서, 우리 엣지 함수가 실패 시 돌려주는
 * { error: string } 본문을 최대한 꺼내 에러 메시지로 사용한다.
 * (기본 FunctionsHttpError.message는 "non-2xx status code"라는 일반 문구뿐이라
 * 실제 원인을 보여주려면 error.context 응답 본문을 직접 파싱해야 한다.)
 */
export async function invokeFunction<T = unknown>(
  name: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });

  if (error) {
    let message = error.message;
    const context = (error as { context?: Response }).context;
    if (context && typeof context.json === 'function') {
      try {
        const parsed = await context.json();
        if (parsed?.error) message = parsed.error;
      } catch {
        // 응답 본문이 JSON이 아니면 기본 메시지를 그대로 사용한다.
      }
    }
    throw new Error(message);
  }

  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(String(data.error));
  }

  return data as T;
}
