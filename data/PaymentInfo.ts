import { Banknote, CircleDollarSign, CreditCard, Wallet } from 'lucide-react-native';
import { createElement } from 'react';

export type PaymentMethod = 'MCard' | 'Cash' | 'Credit/Debit' | 'Dining Dollars';

// 'MCard' is the underlying enum/DB value (tied to the physical M-Card), but
// the balance it represents is branded "Blue Bucks" everywhere on campus —
// display this label instead of the raw enum value.
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  MCard: 'Blue Bucks',
  Cash: 'Cash',
  'Credit/Debit': 'Credit/Debit',
  'Dining Dollars': 'Dining Dollars',
};

// Distinct accent color per payment method, used for the icon's background
// wherever it's shown (filter modal, location headers, location cards).
export const PAYMENT_METHOD_COLORS: Record<PaymentMethod, string> = {
  MCard: '#60A5FA',
  Cash: '#34D399',
  'Credit/Debit': '#A78BFA',
  'Dining Dollars': '#FBBF24',
};

const PAYMENT_METHOD_ICON_COMPONENTS: Record<PaymentMethod, typeof Wallet> = {
  MCard: Wallet,
  Cash: Banknote,
  'Credit/Debit': CreditCard,
  'Dining Dollars': CircleDollarSign,
};

export const getPaymentMethodIcon = (method: PaymentMethod, color: string, size = 16) =>
  createElement(PAYMENT_METHOD_ICON_COMPONENTS[method], { size, color, strokeWidth: 2 });

export const isPaymentMethod = (value: string): value is PaymentMethod =>
  value in PAYMENT_METHOD_LABELS;
