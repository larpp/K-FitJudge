const PAYPAL_SCRIPT_BASE = 'https://www.paypal.com/sdk/js';

// PayPal Buttons() 타입 전체를 선언하는 대신, 우리가 실제로 쓰는 최소 형태만 선언한다.
export interface PaypalButtonsConfig {
  createOrder: () => Promise<string>;
  onApprove: (data: { orderID: string }) => Promise<void>;
  onError?: (err: unknown) => void;
  onCancel?: () => void;
}

interface PaypalNamespace {
  Buttons: (config: PaypalButtonsConfig) => { render: (container: HTMLElement | string) => void };
}

declare global {
  interface Window {
    paypal?: PaypalNamespace;
  }
}

let scriptPromise: Promise<void> | null = null;
let loadedClientId: string | null = null;

export function loadPaypalScript(clientId: string, currency = 'USD'): Promise<void> {
  if (window.paypal && loadedClientId === clientId) return Promise.resolve();
  if (scriptPromise && loadedClientId === clientId) return scriptPromise;

  loadedClientId = clientId;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${PAYPAL_SCRIPT_BASE}?client-id=${encodeURIComponent(clientId)}&currency=${currency}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load PayPal SDK.'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}
