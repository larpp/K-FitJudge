import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';
import { useI18n } from '../i18n/I18nProvider';
import './PricingPage.css';

export default function PricingPage() {
  const { t } = useI18n();
  const p = t.pricing;

  return (
    <div className="pricing-page">
      <span className="pricing-page__badge">
        <Icon name="bag" size={14} />
        {p.badge}
      </span>
      <h1>{p.title}</h1>
      <p className="pricing-page__subtitle">{p.subtitle}</p>

      <div className="pricing-grid">
        {p.plans.map((plan) => (
          <div key={plan.name} className={`card pricing-plan ${plan.highlighted ? 'is-highlighted' : ''}`}>
            <div className="pricing-plan__name">{plan.name}</div>
            <div className="pricing-plan__price">
              <strong>{plan.price}</strong>
              <span>/ {plan.period}</span>
            </div>
            <ul className="pricing-plan__features">
              {plan.features.map((f) => (
                <li key={f}>
                  <Icon name="check" size={16} />
                  {f}
                </li>
              ))}
            </ul>
            <Button variant={plan.highlighted ? 'primary' : 'outline'} disabled block>
              {plan.cta}
            </Button>
          </div>
        ))}
      </div>

      <p className="pricing-page__note">{p.note}</p>
    </div>
  );
}
