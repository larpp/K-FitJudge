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
import { supabase } from '../lib/supabaseClient';
import { tpoOptions, type TpoOption } from '../data/tpoOptions';
import { samplePhotoDataUrl } from '../data/samplePhoto';
import { generateMockResult, type MockResult } from '../data/mockScoring';
import { invokeFunction } from '../lib/payments/invokeFunction';
import './EvaluatePage.css';

type Step = 'upload' | 'tpo' | 'intent' | 'analyzing' | 'result' | 'limit';

const STEP_ORDER: Step[] = ['upload', 'tpo', 'intent', 'analyzing'];

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
  const [limitError, setLimitError] = useState<{ isQuota: boolean; detail?: string } | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const persistPromiseRef = useRef<Promise<unknown> | null>(null);

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
    const freshResult = generateMockResult(selectedTpoOption, intent, locale, Date.now());
    setResult(freshResult);

    const persistPromise = (async () => {
      let photoPath: string | undefined;
      // 샘플 사진은 실제 사진이 아니므로 저장하지 않는다.
      if (user && photoFile && !isSample) {
        const ext = photoFile.name.split('.').pop() || 'jpg';
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('evaluation-photos')
          .upload(path, photoFile);
        if (!uploadError) photoPath = path;
      }
      return invokeFunction('record-evaluation', {
        tpo: selectedTpoOption.key,
        intent,
        overall: freshResult.overall,
        categories: freshResult.categories,
        strengths: freshResult.strengths,
        improvements: freshResult.improvements,
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
      await persistPromiseRef.current;
      setStep('result');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setLimitError({ isQuota: message === 'LIMIT_REACHED', detail: message });
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
          onReset={handleReset}
        />
      )}
    </div>
  );
}
