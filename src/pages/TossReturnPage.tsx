import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../auth/AuthProvider';
import { invokeFunction } from '../lib/payments/invokeFunction';
import './TossReturnPage.css';

type Status = 'checking' | 'success' | 'fail';

export default function TossReturnPage() {
  const { t } = useI18n();
  const { refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const pay = t.payment;

  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const failMessage = searchParams.get('message');

  const [status, setStatus] = useState<Status>(paymentKey && orderId && amount ? 'checking' : 'fail');
  const [errorText, setErrorText] = useState<string | null>(failMessage);

  useEffect(() => {
    if (!(paymentKey && orderId && amount)) return;

    invokeFunction('toss-confirm', { paymentKey, orderId, amount: Number(amount) })
      .then(async () => {
        await refreshProfile();
        setStatus('success');
      })
      .catch((err) => {
        setErrorText(err instanceof Error ? err.message : String(err));
        setStatus('fail');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentKey, orderId, amount]);

  return (
    <div className="container">
      <div className="card toss-return">
        <div className={`toss-return__icon is-${status === 'checking' ? 'pending' : status}`}>
          <Icon name={status === 'fail' ? 'close' : status === 'success' ? 'check' : 'sparkle'} size={24} />
        </div>

        {status === 'checking' && <h1>{pay.tossCheckingTitle}</h1>}

        {status === 'success' && (
          <>
            <h1>{pay.tossSuccessTitle}</h1>
            <p>{pay.tossSuccessDesc}</p>
            <div className="toss-return__actions">
              <Link to="/mypage">
                <Button>{pay.goToMypage}</Button>
              </Link>
            </div>
          </>
        )}

        {status === 'fail' && (
          <>
            <h1>{pay.tossFailTitle}</h1>
            <p>{errorText || pay.tossFailDescFallback}</p>
            <div className="toss-return__actions">
              <Link to="/pricing">
                <Button variant="outline">{pay.backToPricing}</Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
