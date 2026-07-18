/** Stripe Elements client helper. */
import { requestOrThrow } from '@/lib/api/client';

export type StripeCartItem = {
  product_id?: string;
  dosage_id?: string;
  name: string;
  dosage?: string;
  price: number;
  quantity: number;
  is_free?: boolean;
};

export type CreateStripeSessionRequest = {
  customer_email: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_phone?: string;
  shipping_address: string;
  shipping_suburb: string;
  shipping_state: string;
  shipping_postcode: string;
  shipping_method: string;
  shipping_cost: number;
  subtotal: number;
  discount_amount?: number;
  points_redeemed?: number;
  total: number;
  currency?: 'sek';
  age_verified?: boolean;
  customer_notes?: string;
  affiliate_code?: string | null;
  discount_code?: string | null;
  user_id?: string | null;
  items: StripeCartItem[];
};

export type CreateStripePaymentIntentResponse = {
  client_secret: string;
  payment_intent_id: string;
  order_number: string;
  order_id: string;
};

export async function createStripePaymentIntent(
  payload: CreateStripeSessionRequest
): Promise<CreateStripePaymentIntentResponse> {
  return requestOrThrow<CreateStripePaymentIntentResponse>({
    method: 'POST',
    path: '/api/payments/stripe/payment-intent',
    body: payload,
  });
}
