import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../auth/AuthProvider';
import { requestTossPayment } from '../lib/payments/toss';
import { loadPaypalScript } from '../lib/payments/paypal';
import { invokeFunction } from '../lib/payments/invokeFunction';
import './PricingPage.css';

type PaymentMethod = 'toss' | 'paypal';

export default function PricingPage() {
  const { t, locale } = useI18n();
  const { user, refreshProfile } = useAuth();
  const p = t.pricing;

  const [method, setMethod] = useState<PaymentMethod>(locale === 'ko' ? 'toss' : 'paypal');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paypalDone, setPaypalDone] = useState(false);
  const paypalContainerRef = useRef<HTMLDivElement>(null);

  const isPro = user?.plan === 'pro';

  const handleTossSubscribe = async () => {
    setError(null);
    setProcessing(true);
    try {
      const data = await invokeFunction<{ orderId: string; amount: number; orderName: string }>(
        'toss-create-order',
      );
      await requestTossPayment({
        orderId: data.orderId,
        amount: data.amount,
        orderName: data.orderName,
        customerName: user?.name,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (method !== 'paypal' || !user || isPro) return;
    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    if (!clientId) {
      setError('VITE_PAYPAL_CLIENT_ID is not set.');
      return;
    }

    let cancelled = false;
    setError(null);

    loadPaypalScript(clientId, 'USD')
      .then(() => {
        if (cancelled || !paypalContainerRef.current || !window.paypal) return;
        paypalContainerRef.current.innerHTML = '';
        window.paypal
          .Buttons({
            createOrder: async () => {
              const data = await invokeFunction<{ id: string }>('paypal-create-order');
              return data.id;
            },
            onApprove: async (approveData) => {
              try {
                await invokeFunction('paypal-capture-order', { orderId: approveData.orderID });
                await refreshProfile();
                setPaypalDone(true);
              } catch (err) {
                setError(err instanceof Error ? err.message : t.payment.paypalErrorFallback);
              }
            },
            onError: (err) => setError(err instanceof Error ? err.message : String(err)),
          })
          .render(paypalContainerRef.current);
      })
      .catch((err) => setError(err.message));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, user, isPro]);

  const renderProAction = () => {
    if (!user) {
      return (
        <div className="pricing-login-required">
          <p>{p.loginRequired}</p>
          <Link to="/login">
            <Button block>{p.loginCta}</Button>
          </Link>
        </div>
      );
    }

    if (isPro || paypalDone) {
      return (
        <span className="badge badge-green pricing-active-badge">
          <Icon name="check" size={14} />
          {p.proActiveBadge}
        </span>
      );
    }

    return (
      <div className="pricing-method">
        <div className="pricing-method__tabs">
          <button
            type="button"
            className={method === 'toss' ? 'is-active' : ''}
            onClick={() => setMethod('toss')}
          >
            {p.methodToss}
          </button>
          <button
            type="button"
            className={method === 'paypal' ? 'is-active' : ''}
            onClick={() => setMethod('paypal')}
          >
            {p.methodPaypal}
          </button>
        </div>

        {method === 'toss' ? (
          <Button block onClick={handleTossSubscribe} disabled={processing}>
            {processing ? p.processing : p.plans[1].cta}
          </Button>
        ) : (
          <div ref={paypalContainerRef} className="pricing-paypal-container" />
        )}

        {error && <p className="pricing-error">{error}</p>}
      </div>
    );
  };

  return (
    <div className="pricing-page">
      <h1>{p.title}</h1>
      <p className="pricing-page__subtitle">{p.subtitle}</p>

      <div className="pricing-grid">
        <div className="card pricing-plan">
          <div className="pricing-plan__name">{p.plans[0].name}</div>
          <div className="pricing-plan__price">
            <strong>{p.plans[0].price}</strong>
            <span>/ {p.plans[0].period}</span>
          </div>
          <ul className="pricing-plan__features">
            {p.plans[0].features.map((f) => (
              <li key={f}>
                <Icon name="check" size={16} />
                {f}
              </li>
            ))}
          </ul>
          <Button variant="outline" disabled block>
            {p.plans[0].cta}
          </Button>
        </div>

        <div className="card pricing-plan is-highlighted">
          <div className="pricing-plan__name">{p.plans[1].name}</div>
          <div className="pricing-plan__price">
            <strong>{method === 'paypal' ? p.plans[1].priceUsd : p.plans[1].price}</strong>
            <span>/ {p.plans[1].period}</span>
          </div>
          <ul className="pricing-plan__features">
            {p.plans[1].features.map((f) => (
              <li key={f}>
                <Icon name="check" size={16} />
                {f}
              </li>
            ))}
          </ul>
          {renderProAction()}
        </div>
      </div>

      <p className="pricing-page__note">{p.note}</p>
    </div>
  );
}
