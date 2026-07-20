const TOSS_SCRIPT_SRC = 'https://js.tosspayments.com/v1/payment';

interface TossPaymentsInstance {
  requestPayment: (method: string, options: Record<string, unknown>) => Promise<void>;
}

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => TossPaymentsInstance;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTossScript(): Promise<void> {
  if (window.TossPayments) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = TOSS_SCRIPT_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Toss Payments SDK.'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

interface RequestTossPaymentInput {
  orderId: string;
  amount: number;
  orderName: string;
  customerName?: string;
}

/** 결제창으로 이동한다(성공/실패 시 successUrl·failUrl로 리다이렉트됨). */
export async function requestTossPayment(input: RequestTossPaymentInput) {
  const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY;
  if (!clientKey) throw new Error('VITE_TOSS_CLIENT_KEY is not set.');

  await loadTossScript();
  const tossPayments = window.TossPayments!(clientKey);
  await tossPayments.requestPayment('카드', {
    amount: input.amount,
    orderId: input.orderId,
    orderName: input.orderName,
    customerName: input.customerName,
    successUrl: `${window.location.origin}/payment/toss/success`,
    failUrl: `${window.location.origin}/payment/toss/fail`,
  });
}
