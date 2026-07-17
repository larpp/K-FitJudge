import Icon from '../ui/Icon';
import Button from '../ui/Button';
import { useI18n } from '../../i18n/I18nProvider';
import './evaluate-shared.css';
import './IntentStep.css';

export type StyleIntent = 'classic' | 'experimental';

interface IntentStepProps {
  selected: StyleIntent | null;
  onSelect: (intent: StyleIntent) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function IntentStep({ selected, onSelect, onBack, onNext }: IntentStepProps) {
  const { t } = useI18n();

  return (
    <div className="intent-step">
      <h1>{t.evaluate.intent.title}</h1>
      <p className="evaluate-step__subtitle">{t.evaluate.intent.subtitle}</p>

      <div className="intent-grid">
        <button
          type="button"
          className={`intent-card ${selected === 'classic' ? 'is-selected' : ''}`}
          onClick={() => onSelect('classic')}
          aria-pressed={selected === 'classic'}
        >
          <div className="intent-card__icon">
            <Icon name="shield" size={22} />
          </div>
          <div className="intent-card__title">{t.evaluate.intent.classicTitle}</div>
          <div className="intent-card__desc">{t.evaluate.intent.classicDesc}</div>
        </button>

        <button
          type="button"
          className={`intent-card ${selected === 'experimental' ? 'is-selected' : ''}`}
          onClick={() => onSelect('experimental')}
          aria-pressed={selected === 'experimental'}
        >
          <div className="intent-card__icon">
            <Icon name="sparkle" size={22} />
          </div>
          <div className="intent-card__title">{t.evaluate.intent.experimentalTitle}</div>
          <div className="intent-card__desc">{t.evaluate.intent.experimentalDesc}</div>
        </button>
      </div>

      <div className="evaluate-step__actions">
        <Button variant="ghost" onClick={onBack}>
          {t.evaluate.back}
        </Button>
        <Button size="lg" disabled={!selected} onClick={onNext}>
          {t.evaluate.intent.nextButton}
          <Icon name="sparkle" size={18} />
        </Button>
      </div>
    </div>
  );
}
