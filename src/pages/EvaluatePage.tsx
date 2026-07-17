import { useEffect, useMemo, useRef, useState } from 'react';
import StepProgress from '../components/evaluate/StepProgress';
import UploadStep from '../components/evaluate/UploadStep';
import TpoStep from '../components/evaluate/TpoStep';
import IntentStep, { type StyleIntent } from '../components/evaluate/IntentStep';
import AnalyzingStep from '../components/evaluate/AnalyzingStep';
import ResultStep from '../components/evaluate/ResultStep';
import { useI18n } from '../i18n/I18nProvider';
import { tpoOptions, type TpoOption } from '../data/tpoOptions';
import { samplePhotoDataUrl } from '../data/samplePhoto';
import { generateMockResult } from '../data/mockScoring';
import './EvaluatePage.css';

type Step = 'upload' | 'tpo' | 'intent' | 'analyzing' | 'result';

const STEP_ORDER: Step[] = ['upload', 'tpo', 'intent', 'analyzing'];

export default function EvaluatePage() {
  const { t, locale } = useI18n();
  const [step, setStep] = useState<Step>('upload');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSample, setIsSample] = useState(false);
  const [tpo, setTpo] = useState<TpoOption['key'] | null>(null);
  const [intent, setIntent] = useState<StyleIntent | null>(null);
  const [runId, setRunId] = useState(0);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const setPhotoUrl = (url: string | null, sample: boolean) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (url && !sample) objectUrlRef.current = url;
    setPreviewUrl(url);
    setIsSample(sample);
  };

  const handleFileSelect = (file: File) => setPhotoUrl(URL.createObjectURL(file), false);
  const handleUseSample = () => setPhotoUrl(samplePhotoDataUrl, true);
  const handleClearPhoto = () => setPhotoUrl(null, false);

  const handleReset = () => {
    setPhotoUrl(null, false);
    setTpo(null);
    setIntent(null);
    setStep('upload');
  };

  const selectedTpoOption = tpo ? tpoOptions.find((o) => o.key === tpo) ?? null : null;
  const selectedTpoLabel = selectedTpoOption
    ? locale === 'ko'
      ? selectedTpoOption.labelKo
      : selectedTpoOption.labelEn
    : '';

  const mockResult = useMemo(() => {
    if (!selectedTpoOption || !intent) return null;
    return generateMockResult(selectedTpoOption, intent, locale, runId);
  }, [selectedTpoOption, intent, locale, runId]);

  return (
    <div className="container evaluate-page">
      {step !== 'result' && (
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
          onNext={() => {
            setRunId((id) => id + 1);
            setStep('analyzing');
          }}
        />
      )}

      {step === 'analyzing' && (
        <AnalyzingStep
          tpoLabel={selectedTpoLabel}
          onReset={handleReset}
          onViewResult={() => setStep('result')}
        />
      )}

      {step === 'result' && mockResult && selectedTpoOption && intent && previewUrl && (
        <ResultStep
          result={mockResult}
          tpo={selectedTpoOption}
          intent={intent}
          previewUrl={previewUrl}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
