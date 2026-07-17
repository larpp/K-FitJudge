import Icon from '../ui/Icon';
import Button from '../ui/Button';
import { useI18n } from '../../i18n/I18nProvider';
import { tpoOptions, type TpoOption } from '../../data/tpoOptions';
import './evaluate-shared.css';
import './TpoStep.css';

interface TpoStepProps {
  selected: TpoOption['key'] | null;
  onSelect: (key: TpoOption['key']) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function TpoStep({ selected, onSelect, onBack, onNext }: TpoStepProps) {
  const { t, locale } = useI18n();

  return (
    <div className="tpo-step">
      <h1>{t.evaluate.tpo.title}</h1>
      <p className="evaluate-step__subtitle">{t.evaluate.tpo.subtitle}</p>

      <div className="tpo-grid">
        {tpoOptions.map((opt) => (
          <button
            key={opt.key}
            type="button"
            className={`tpo-card ${selected === opt.key ? 'is-selected' : ''}`}
            onClick={() => onSelect(opt.key)}
            aria-pressed={selected === opt.key}
          >
            <div className="tpo-card__icon">
              <Icon name={opt.icon} size={20} />
            </div>
            <div className="tpo-card__label">{locale === 'ko' ? opt.labelKo : opt.labelEn}</div>
            <div className="tpo-card__desc">{locale === 'ko' ? opt.descKo : opt.descEn}</div>
          </button>
        ))}
      </div>

      <div className="evaluate-step__actions">
        <Button variant="ghost" onClick={onBack}>
          {t.evaluate.back}
        </Button>
        <Button size="lg" disabled={!selected} onClick={onNext}>
          {t.evaluate.tpo.nextButton}
          <Icon name="chevronRight" size={18} />
        </Button>
      </div>
    </div>
  );
}
