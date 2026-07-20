import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import Button from '../ui/Button';
import { useI18n } from '../../i18n/I18nProvider';
import './evaluate-shared.css';
import './LimitReachedStep.css';

interface LimitReachedStepProps {
  isQuotaError: boolean;
  errorDetail?: string | null;
  onReset: () => void;
}

export default function LimitReachedStep({ isQuotaError, errorDetail, onReset }: LimitReachedStepProps) {
  const { t } = useI18n();
  const l = t.evaluate.limit;

  return (
    <div className="limit-step">
      <div className="limit-step__icon">
        <Icon name={isQuotaError ? 'bag' : 'close'} size={26} />
      </div>
      <h1>{isQuotaError ? l.title : l.genericErrorTitle}</h1>
      {isQuotaError ? <p>{l.desc}</p> : errorDetail && <p>{errorDetail}</p>}

      <div className="evaluate-step__actions">
        <Button variant="ghost" onClick={onReset}>
          {l.resetCta}
        </Button>
        {isQuotaError && (
          <Link to="/pricing">
            <Button size="lg">{l.upgradeCta}</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
