import { useEffect, useState } from 'react';
import Icon from '../ui/Icon';
import Button from '../ui/Button';
import { useI18n } from '../../i18n/I18nProvider';
import './evaluate-shared.css';
import './AnalyzingStep.css';

interface AnalyzingStepProps {
  tpoLabel: string;
  onReset: () => void;
  onViewResult: () => void;
}

const STEP_DELAY_MS = 900;

export default function AnalyzingStep({ tpoLabel, onReset, onViewResult }: AnalyzingStepProps) {
  const { t } = useI18n();
  const steps = t.evaluate.analyzing.steps.map((s) => s.replace('{tpo}', tpoLabel));
  const [completedCount, setCompletedCount] = useState(0);
  const done = completedCount >= steps.length;

  useEffect(() => {
    if (done) return;
    const timer = setTimeout(() => setCompletedCount((c) => c + 1), STEP_DELAY_MS);
    return () => clearTimeout(timer);
  }, [completedCount, done]);

  const progress = Math.min(100, (completedCount / steps.length) * 100);

  return (
    <div className="analyzing-step">
      <div className={`analyzing-step__badge ${done ? '' : 'is-pulsing'}`}>
        <Icon name={done ? 'check' : 'sparkle'} />
      </div>

      {done ? (
        <>
          <h1 className="analyzing-done__title">{t.evaluate.analyzing.doneTitle}</h1>
          <p className="analyzing-done__subtitle">{t.evaluate.analyzing.doneSubtitle}</p>
        </>
      ) : (
        <>
          <h1>{t.evaluate.analyzing.title}</h1>
          <p className="evaluate-step__subtitle">{t.evaluate.analyzing.subtitle}</p>
        </>
      )}

      <div className="analyzing-progress">
        <div className="analyzing-progress__fill" style={{ width: `${progress}%` }} />
      </div>

      <ol className="analyzing-list">
        {steps.map((label, i) => {
          const isDone = i < completedCount;
          const isActive = i === completedCount;
          return (
            <li
              key={label}
              className={`analyzing-list__item ${isDone ? 'is-done' : ''} ${isActive ? 'is-active' : ''}`}
            >
              <span className="analyzing-list__dot">{isDone && <Icon name="check" />}</span>
              {label}
            </li>
          );
        })}
      </ol>

      {done && (
        <div className="evaluate-step__actions">
          <Button variant="ghost" onClick={onReset}>
            {t.evaluate.analyzing.resetButton}
          </Button>
          <Button size="lg" onClick={onViewResult}>
            {t.evaluate.analyzing.viewResultButton}
            <Icon name="chevronRight" size={18} />
          </Button>
        </div>
      )}
    </div>
  );
}
