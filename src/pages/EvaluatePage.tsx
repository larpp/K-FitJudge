import { useEffect, useRef, useState } from 'react';
import StepProgress from '../components/evaluate/StepProgress';
import UploadStep from '../components/evaluate/UploadStep';
import TpoStep from '../components/evaluate/TpoStep';
import IntentStep, { type StyleIntent } from '../components/evaluate/IntentStep';
import AnalyzingStep from '../components/evaluate/AnalyzingStep';
import ResultStep from '../components/evaluate/ResultStep';
import LimitReachedStep from '../components/evaluate/LimitReachedStep';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../auth/AuthProvider';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { tpoOptions, type TpoOption } from '../data/tpoOptions';
import { samplePhotoDataUrl } from '../data/samplePhoto';
import { generateMockResult, type MockResult } from '../data/mockScoring';
import { resizeImageToDataUrl } from '../lib/image/resizeImage';
import { invokeFunction } from '../lib/payments/invokeFunction';
import './EvaluatePage.css';

type Step = 'upload' | 'tpo' | 'intent' | 'analyzing' | 'result' | 'limit';

const STEP_ORDER: Step[] = ['upload', 'tpo', 'intent', 'analyzing'];

interface EvaluateResponse extends MockResult {
  id: string;
}

const AI_ERROR_CODES = new Set([
  'AI_PROVIDER_ERROR',
  'AI_PARSE_ERROR',
  'AI_TIMEOUT',
  'INVALID_PAYLOAD',
  'HF_TOKEN_MISSING',
]);

export default function EvaluatePage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('upload');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSample, setIsSample] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [tpo, setTpo] = useState<TpoOption['key'] | null>(null);
  const [intent, setIntent] = useState<StyleIntent | null>(null);
  const [result, setResult] = useState<MockResult | null>(null);
  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const [limitError, setLimitError] = useState<{ isQuota: boolean; detail?: string } | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const persistPromiseRef = useRef<Promise<EvaluateResponse> | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const setPhotoUrl = (url: string | null, sample: boolean, file: File | null = null) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (url && !sample) objectUrlRef.current = url;
    setPreviewUrl(url);
    setIsSample(sample);
    setPhotoFile(file);
  };

  const handleFileSelect = (file: File) => setPhotoUrl(URL.createObjectURL(file), false, file);
  const handleUseSample = () => setPhotoUrl(samplePhotoDataUrl, true);
  const handleClearPhoto = () => setPhotoUrl(null, false);

  const handleReset = () => {
    setPhotoUrl(null, false);
    setTpo(null);
    setIntent(null);
    setResult(null);
    setEvaluationId(null);
    setLimitError(null);
    setStep('upload');
  };

  const selectedTpoOption = tpo ? tpoOptions.find((o) => o.key === tpo) ?? null : null;
  const selectedTpoLabel = selectedTpoOption
    ? locale === 'ko'
      ? selectedTpoOption.labelKo
      : selectedTpoOption.labelEn
    : '';

  const handleStartAnalyzing = () => {
    if (!selectedTpoOption || !intent) return;

    const persistPromise = (async (): Promise<EvaluateResponse> => {
      // Supabase/AI 백엔드가 설정되지 않은 로컬 환경에서는 데모용 목업 채점으로 대체한다.
      if (!isSupabaseConfigured) {
        const mock = generateMockResult(selectedTpoOption, intent, locale, Date.now());
        return { ...mock, id: '' };
      }

      // 샘플 사진은 실제 옷차림이 아니라 데모 일러스트라 AI 채점 대상이 될 수 없다.
      // 대신 기존 목업 채점을 그대로 서버에 저장만 한다.
      if (isSample) {
        const mock = generateMockResult(selectedTpoOption, intent, locale, Date.now());
        return invokeFunction<EvaluateResponse>('evaluate-photo', {
          tpo: selectedTpoOption.key,
          intent,
          sample: true,
          mockResult: mock,
        });
      }

      if (!photoFile) throw new Error('INVALID_PAYLOAD');
      const { dataUrl, blob } = await resizeImageToDataUrl(photoFile);

      let photoPath: string | undefined;
      if (user) {
        const path = `${user.id}/${crypto.randomUUID()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('evaluation-photos')
          .upload(path, blob, { contentType: 'image/jpeg' });
        if (!uploadError) photoPath = path;
      }

      return invokeFunction<EvaluateResponse>('evaluate-photo', {
        tpo: selectedTpoOption.key,
        intent,
        imageDataUrl: dataUrl,
        photoPath,
      });
    })();
    // handleViewResult awaits this later (once the analyzing animation finishes), which can be
    // several seconds after the request actually settles. Attach a no-op catch immediately so the
    // browser doesn't flag it as an unhandled rejection in the meantime; the real handling still
    // happens below when we await persistPromiseRef.current.
    persistPromise.catch(() => {});
    persistPromiseRef.current = persistPromise;
    setStep('analyzing');
  };

  const handleViewResult = async () => {
    try {
      const response = await persistPromiseRef.current;
      if (!response) throw new Error('AI_PROVIDER_ERROR');
      setResult(response);
      setEvaluationId(response.id || null);
      setStep('result');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isQuota = message === 'LIMIT_REACHED';
      setLimitError({
        isQuota,
        detail: isQuota ? undefined : AI_ERROR_CODES.has(message) ? t.evaluate.limit.aiErrorDesc : message,
      });
      setStep('limit');
    }
  };

  return (
    <div className="container evaluate-page">
      {step !== 'result' && step !== 'limit' && (
        <StepProgress labels={t.evaluate.stepLabels} currentIndex={STEP_ORDER.indexOf(step)} />
      )}

      {step === 'upload' && (
        <UploadStep
          previewUrl={previewUrl}
          isSample={isSample}
          onFileSelect={handleFileSelect}
          onUseSample={handleUseSample}
          onClear={handleClearPhoto}
          onNext={() => setStep('tpo')}
        />
      )}

      {step === 'tpo' && (
        <TpoStep
          selected={tpo}
          onSelect={setTpo}
          onBack={() => setStep('upload')}
          onNext={() => setStep('intent')}
        />
      )}

      {step === 'intent' && (
        <IntentStep
          selected={intent}
          onSelect={setIntent}
          onBack={() => setStep('tpo')}
          onNext={handleStartAnalyzing}
        />
      )}

      {step === 'analyzing' && (
        <AnalyzingStep tpoLabel={selectedTpoLabel} onReset={handleReset} onViewResult={handleViewResult} />
      )}

      {step === 'limit' && (
        <LimitReachedStep
          isQuotaError={limitError?.isQuota ?? false}
          errorDetail={limitError?.detail}
          onReset={handleReset}
        />
      )}

      {step === 'result' && result && selectedTpoOption && intent && previewUrl && (
        <ResultStep
          result={result}
          tpo={selectedTpoOption}
          intent={intent}
          previewUrl={previewUrl}
          evaluationId={evaluationId}
          isSample={isSample}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
