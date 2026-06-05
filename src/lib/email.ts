// Email Service - Sends order notifications, password resets, etc.
import { CONFIG } from './config';
import { supabase } from './supabase';
import { formatOrderNumberDisplay } from '@/utils/order-number';
import {
  wrapVironLabsEmail,
  emailCtaRow,
  emailCallout,
  emailDetailRow,
  emailOrderItemsTable,
  escapeHtml,
  type OrderItemRow,
} from './email-layout';

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/** Resend cannot be called from the browser (CORS). Production uses Supabase Edge Function `send-email`. */
async function sendViaEdgeFunction(data: EmailData): Promise<{ success: boolean; error?: string }> {
  const { data: res, error } = await supabase.functions.invoke('send-email', {
    body: {
      to: data.to,
      subject: data.subject,
      html: data.html,
      text: data.text,
    },
  });
  if (error) {
    return { success: false, error: error.message };
  }
  if (res && typeof res === 'object' && 'error' in res && (res as { error: unknown }).error) {
    return { success: false, error: String((res as { error: unknown }).error) };
  }
  return { success: true };
}

/** Dev-only: Vite proxies /api/resend/emails → api.resend.com with server-side Authorization. */
async function sendViaDevProxy(data: EmailData, fromEmail: string): Promise<{ success: boolean; error?: string }> {
  const response = await fetch('/api/resend/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: fromEmail,
      to: data.to,
      subject: data.subject,
      html: data.html,
      text: data.text,
    }),
  });
  if (!response.ok) {
    let message = `Resend HTTP ${response.status}`;
    try {
      const errBody = (await response.json()) as { message?: string };
      message = errBody.message || message;
    } catch {
      const text = await response.text();
      if (text) message = text.slice(0, 200);
    }
    return { success: false, error: message };
  }
  return { success: true };
}

async function queuePendingEmail(data: EmailData): Promise<{ success: boolean; error?: string }> {
  const { error: insertError } = await supabase.from('pending_emails').insert({
    to_email: data.to,
    subject: data.subject,
    html_content: data.html,
    text_content: data.text,
    status: 'pending',
  });
  if (insertError) {
    console.error('[email] pending_emails insert failed:', insertError.message);
    return { success: false, error: insertError.message };
  }
  return { success: true };
}

// Send email: Supabase Edge Function first (works from localhost + production — no browser→Resend CORS).
// Fallback in dev only: Vite proxy + VITE_RESEND_API_KEY if the function is not deployed yet.
export const sendEmail = async (data: EmailData): Promise<{ success: boolean; error?: string }> => {
  const apiKey = (CONFIG.RESEND_API_KEY || '').trim();
  const fromEmail = (CONFIG.FROM_EMAIL || '').trim();

  try {
    const edge = await sendViaEdgeFunction(data);
    if (edge.success) return edge;
    console.warn('[email] Edge function failed:', edge.error);

    if (import.meta.env.DEV && apiKey && apiKey !== 're_YOUR_KEY_HERE' && fromEmail) {
      const proxied = await sendViaDevProxy(data, fromEmail);
      if (proxied.success) return proxied;
      console.warn('[email] Dev proxy failed:', proxied.error);
    }

    return await queuePendingEmail(data);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[email] Send failed:', msg);
    return { success: false, error: msg };
  }
};

// Get email template from database (HTML only used when CONFIG.EMAIL_USE_SUPABASE_HTML_TEMPLATES is true)
export const getEmailTemplate = async (name: string): Promise<{ subject: string; html: string } | null> => {
  if (!CONFIG.EMAIL_USE_SUPABASE_HTML_TEMPLATES) {
    return null;
  }
  const { data, error } = await supabase
    .from('email_templates')
    .select('subject, html_content')
    .eq('name', name)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;

  return {
    subject: data.subject,
    html: data.html_content,
  };
};

// Send order confirmation email
export const sendOrderConfirmation = async (
  to: string,
  orderData: {
    order_number: string;
    total: number;
    items: any[];
    shipping_address: string;
  }
): Promise<{ ok: boolean; error?: string }> => {
  const displayOrderNo = formatOrderNumberDisplay(orderData.order_number);
  const template = await getEmailTemplate('order_confirmation');
  
  const itemRows: OrderItemRow[] =
    Array.isArray(orderData.items) && orderData.items.length > 0
      ? orderData.items.map((it: { name?: string; dosage?: unknown; quantity?: number; price?: number }) => ({
          name: it.name || 'Item',
          dosage: String(it.dosage ?? ''),
          quantity: it.quantity ?? 0,
          lineTotal: `£${(((it.price ?? 0) as number) * (it.quantity ?? 0)).toFixed(2)}`,
        }))
      : [];

  const on = escapeHtml(displayOrderNo);
  const tot = escapeHtml(orderData.total.toFixed(2));
  const ship = escapeHtml(orderData.shipping_address || '—');

  const defaultBody = `
    <p style="margin:0 0 8px;text-align:center;color:#9CA3AF;font-size:14px;">We’ve received your order and reserved your items.</p>
    ${emailCallout(
      `<span style="font-size:13px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.12em;">Amount due</span><br>
       <span style="font-size:32px;font-weight:800;color:#2ED1B4;letter-spacing:-0.02em;">£${tot}</span><br>
       <span style="font-size:13px;color:#F4F6FA;">Order <strong style="color:#F4F6FA;font-family:ui-monospace,Menlo,Consolas,monospace;">${on}</strong></span>`,
      'info'
    )}
    ${itemRows.length ? emailOrderItemsTable(itemRows) : ''}
    <p style="margin:18px 0 6px;text-align:center;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#9CA3AF;">Ship to</p>
    <p style="margin:0 0 22px;text-align:center;font-size:14px;color:#F4F6FA;line-height:1.55;">${ship}</p>
    <p style="margin:0 0 10px;text-align:center;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#9CA3AF;">Bank transfer (UK Faster Payments)</p>
    <p style="margin:0 0 14px;text-align:center;font-size:13px;color:#9CA3AF;">Transfer the <strong style="color:#F4F6FA;">exact</strong> amount above using the details below.</p>
    ${emailDetailRow('Sort code', CONFIG.BANK_DETAILS.SORT_CODE)}
    ${emailDetailRow('Account number', CONFIG.BANK_DETAILS.ACCOUNT_NUMBER)}
    ${emailDetailRow('Account name', CONFIG.BANK_DETAILS.ACCOUNT_NAME)}
    ${emailDetailRow('Bank', CONFIG.BANK_DETAILS.BANK_NAME, false)}
    ${emailCallout(
      `<strong style="color:#FBBF24;">Payment reference (required):</strong><br>
       <span style="font-size:20px;font-weight:800;font-family:ui-monospace,Menlo,Consolas,monospace;color:#F4F6FA;letter-spacing:0.04em;">${on}</span><br>
       <span style="font-size:13px;color:#9CA3AF;margin-top:8px;display:inline-block;">Use this exact code so we can match your payment to your order.</span>`,
      'warn'
    )}
    <p style="margin:22px 0 0;text-align:center;font-size:13px;color:#9CA3AF;line-height:1.55;">We dispatch within <strong style="color:#F4F6FA;">24 hours</strong> of cleared funds.</p>
  `;

  let html = template?.html
    ? template.html
    : wrapVironLabsEmail({
        preheader: `Viron Labs order ${displayOrderNo} — £${orderData.total.toFixed(2)} due`,
        headline: 'Order confirmed',
        subline: 'Next step: complete your bank transfer using the details below.',
        bodyHtml: defaultBody,
      });
  
  // Replace placeholders (display without legacy PEP- prefix)
  html = html
    .replace(/{order_number}/g, displayOrderNo)
    .replace(/{total}/g, orderData.total.toFixed(2))
    .replace(/{shipping_address}/g, orderData.shipping_address || '—')
    .replace(/{sort_code}/g, CONFIG.BANK_DETAILS.SORT_CODE)
    .replace(/{account}/g, CONFIG.BANK_DETAILS.ACCOUNT_NUMBER)
    .replace(/{account_name}/g, CONFIG.BANK_DETAILS.ACCOUNT_NAME)
    .replace(/{bank_name}/g, CONFIG.BANK_DETAILS.BANK_NAME);
  
  const subject = (template?.subject || 'Your Viron Labs Order Confirmation - #{order_number}')
    .replace(/{order_number}/g, displayOrderNo);
  
  const result = await sendEmail({ to, subject, html });

  // Mark email as sent in order
  if (result.success) {
    const { error: updateErr } = await supabase
      .from('orders')
      .update({ confirmation_email_sent: true })
      .eq('order_number', orderData.order_number);
    if (updateErr) {
      console.warn('[email] Order confirmation sent but DB flag update failed:', updateErr.message);
    }
  }

  return { ok: result.success, error: result.error };
};

// Send payment received email
export const sendPaymentReceived = async (
  to: string,
  orderData: { order_number: string; total: number }
): Promise<boolean> => {
  const displayOrderNo = formatOrderNumberDisplay(orderData.order_number);
  const template = await getEmailTemplate('payment_received');

  const on = escapeHtml(displayOrderNo);
  const tot = escapeHtml(orderData.total.toFixed(2));
  const defaultBody = `
    ${emailCallout(
      `<span style="font-size:13px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.12em;">Payment received</span><br>
       <span style="font-size:15px;color:#F4F6FA;">Order <strong style="font-family:ui-monospace,Menlo,Consolas,monospace;">${on}</strong></span><br>
       <span style="font-size:28px;font-weight:800;color:#34D399;margin-top:6px;display:inline-block;">£${tot}</span>`,
      'success'
    )}
    <p style="margin:8px 0 0;text-align:center;font-size:15px;color:#9CA3AF;line-height:1.6;">Your order is now <strong style="color:#F4F6FA;">being prepared</strong>. We aim to ship within <strong style="color:#F4F6FA;">24 hours</strong>.</p>
    <p style="margin:16px 0 0;text-align:center;font-size:14px;color:#9CA3AF;">You’ll get a separate email with <strong style="color:#2ED1B4;">tracking</strong> as soon as it leaves our facility.</p>
  `;

  const html = (template?.html
    ? template.html
    : wrapVironLabsEmail({
        preheader: `We received your payment for order ${displayOrderNo}`,
        headline: 'Payment received',
        subline: 'Thank you — we’re on it.',
        bodyHtml: defaultBody,
      }))
    .replace(/{order_number}/g, displayOrderNo)
    .replace(/{total}/g, orderData.total.toFixed(2));
  
  const subject = (template?.subject || 'Payment Received - Order #{order_number}')
    .replace(/{order_number}/g, displayOrderNo);
  
  const result = await sendEmail({ to, subject, html });
  
  if (result.success) {
    await supabase.from('orders')
      .update({ payment_email_sent: true })
      .eq('order_number', orderData.order_number);
  }
  
  return result.success;
};

// Send order shipped email
export const sendOrderShipped = async (
  to: string,
  orderData: { order_number: string; tracking_number: string; tracking_carrier?: string }
): Promise<boolean> => {
  const displayOrderNo = formatOrderNumberDisplay(orderData.order_number);
  const template = await getEmailTemplate('order_shipped');
  const trackingUrl = `https://royalmail.com/mypost/track/#/details/${encodeURIComponent(orderData.tracking_number)}`;
  const carrier = orderData.tracking_carrier || 'Royal Mail';
  const on = escapeHtml(displayOrderNo);
  const tn = escapeHtml(orderData.tracking_number);
  const cr = escapeHtml(carrier);

  const defaultBody = `
    <p style="margin:0 0 16px;text-align:center;font-size:15px;color:#9CA3AF;">Your parcel is on the way.</p>
    ${emailCallout(
      `<span style="font-size:12px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.12em;">Tracking</span><br>
       <span style="font-size:20px;font-weight:800;font-family:ui-monospace,Menlo,Consolas,monospace;color:#2ED1B4;letter-spacing:0.03em;">${tn}</span><br>
       <span style="font-size:13px;color:#9CA3AF;margin-top:8px;display:inline-block;">Carrier: <strong style="color:#F4F6FA;">${cr}</strong></span>`,
      'info'
    )}
    ${emailCtaRow(trackingUrl, 'Track shipment')}
    <p style="margin:18px 0 0;text-align:center;font-size:13px;color:#9CA3AF;line-height:1.55;">Typical delivery: <strong style="color:#F4F6FA;">2–4 business days</strong> (Express) or <strong style="color:#F4F6FA;">5–8</strong> (Standard).</p>
    <p style="margin:10px 0 0;text-align:center;font-size:13px;color:#9CA3AF;">Order <strong style="color:#F4F6FA;font-family:ui-monospace,Menlo,Consolas,monospace;">${on}</strong></p>
  `;

  const html = (template?.html
    ? template.html
    : wrapVironLabsEmail({
        preheader: `Your Viron Labs order ${displayOrderNo} has shipped`,
        headline: 'Shipped',
        subline: 'Use your tracking number to follow delivery.',
        bodyHtml: defaultBody,
      }))
    .replace(/{order_number}/g, displayOrderNo)
    .replace(/{tracking_number}/g, orderData.tracking_number)
    .replace(/{tracking_carrier}/g, carrier)
    .replace(/{tracking_url}/g, trackingUrl);
  
  const subject = (template?.subject || 'Your Order Has Shipped - #{order_number}')
    .replace(/{order_number}/g, displayOrderNo);
  
  const result = await sendEmail({ to, subject, html });
  
  if (result.success) {
    await supabase.from('orders')
      .update({ shipped_email_sent: true })
      .eq('order_number', orderData.order_number);
  }
  
  return result.success;
};

// Human-readable labels for the internal `status` column.
const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Awaiting Payment',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

// Short copy next to the status — one sentence the customer actually wants to read.
const ORDER_STATUS_DESCRIPTIONS: Record<string, string> = {
  pending_payment: 'We’re waiting for your payment to land. Once it does, we move to preparing your order.',
  processing: 'Payment confirmed — your order is being prepared for dispatch.',
  shipped: 'Your order has left our facility and is on its way.',
  delivered: 'Your order has arrived.',
  cancelled: 'This order has been cancelled. If that’s unexpected, reply to this email and we’ll sort it out.',
};

// Send an on-demand order-tracking-status email.
// Triggered when a user looks up their order on /track-order — emails a clean summary of
// where the order is right now, including the tracking number if the order has shipped.
export const sendOrderTrackingUpdate = async (
  to: string,
  order: {
    order_number: string;
    status: string;
    payment_status?: string | null;
    tracking_number?: string | null;
    shipping_method?: string | null;
    total?: number | null;
  },
): Promise<{ ok: boolean; error?: string }> => {
  const displayOrderNo = formatOrderNumberDisplay(order.order_number);
  const statusKey = (order.status || '').toLowerCase();
  const statusLabel = ORDER_STATUS_LABELS[statusKey] || order.status || 'In Progress';
  const statusDesc =
    ORDER_STATUS_DESCRIPTIONS[statusKey] || 'Here’s the latest on your order.';

  const on = escapeHtml(displayOrderNo);
  const stLabel = escapeHtml(statusLabel);
  const stDesc = escapeHtml(statusDesc);
  const site = CONFIG.SITE_URL.replace(/\/$/, '');
  const trackUrl = `${site}/track-order?order=${encodeURIComponent(displayOrderNo)}&email=${encodeURIComponent(to)}`;

  // Build a tracking-number callout only when we actually have one.
  const trackingBlock = order.tracking_number
    ? emailCallout(
        `<span style="font-size:12px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.12em;">Tracking Number</span><br>
         <span style="font-size:18px;font-weight:800;font-family:ui-monospace,Menlo,Consolas,monospace;color:#2ED1B4;letter-spacing:0.03em;">${escapeHtml(order.tracking_number)}</span>${
          order.shipping_method
            ? `<br><span style="font-size:12px;color:#9CA3AF;margin-top:6px;display:inline-block;">via <strong style="color:#F4F6FA;">${escapeHtml(order.shipping_method)}</strong></span>`
            : ''
        }`,
        'info',
      )
    : '';

  // Status-tinted callout colour map.
  const calloutVariant: 'success' | 'info' | 'warn' =
    statusKey === 'delivered'
      ? 'success'
      : statusKey === 'cancelled'
        ? 'warn'
        : 'info';

  const defaultBody = `
    ${emailCallout(
      `<span style="font-size:13px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.12em;">Status</span><br>
       <span style="font-size:22px;font-weight:800;color:#F4F6FA;">${stLabel}</span><br>
       <span style="font-size:14px;color:#9CA3AF;margin-top:6px;display:inline-block;line-height:1.55;">${stDesc}</span>`,
      calloutVariant,
    )}
    ${trackingBlock}
    <p style="margin:18px 0 0;text-align:center;font-size:13px;color:#9CA3AF;">Order <strong style="color:#F4F6FA;font-family:ui-monospace,Menlo,Consolas,monospace;">${on}</strong></p>
    ${emailCtaRow(trackUrl, 'View latest status')}
    <p style="margin:14px 0 0;text-align:center;font-size:12px;color:#6B7280;line-height:1.55;">You’re receiving this because someone looked up this order on our tracking page. If that wasn’t you, you can safely ignore this email.</p>
  `;

  const template = await getEmailTemplate('order_tracking_update');
  const html = (template?.html
    ? template.html
    : wrapVironLabsEmail({
        preheader: `Order ${displayOrderNo} — ${statusLabel}`,
        headline: 'Order update',
        subline: 'Here’s the latest on your Viron Labs order.',
        bodyHtml: defaultBody,
      }))
    .replace(/{order_number}/g, displayOrderNo)
    .replace(/{status}/g, statusLabel)
    .replace(/{tracking_number}/g, order.tracking_number || '')
    .replace(/{track_url}/g, trackUrl);

  const subject = (template?.subject || 'Your Viron Labs order status — #{order_number}').replace(
    /{order_number}/g,
    displayOrderNo,
  );

  const result = await sendEmail({ to, subject, html });
  return { ok: result.success, error: result.error };
};

// Welcome email after successful sign-up (Supabase may also send a separate confirm link)
export const sendSignUpWelcome = async (to: string, name: string): Promise<boolean> => {
  const displayName = (name || '').trim() || 'there';
  const template = await getEmailTemplate('signup_welcome');
  const site = CONFIG.SITE_URL.replace(/\/$/, '');
  const nm = escapeHtml(displayName);

  const defaultBody = `
    <p style="margin:0 0 16px;text-align:center;font-size:16px;color:#F4F6FA;">Hi <strong>${nm}</strong>,</p>
    <p style="margin:0 0 18px;text-align:center;font-size:15px;color:#9CA3AF;line-height:1.65;">Your Viron Labs account is ready. Earn rewards on purchases, track orders from your dashboard, and enjoy a faster checkout next time.</p>
    ${emailCtaRow(site + '/', 'Shop Viron Labs')}
    ${emailCallout(
      `<span style="font-size:13px;color:#9CA3AF;">If you received a <strong style="color:#F4F6FA;">separate email</strong> to confirm your address, open it and tap the link to verify your account.</span>`,
      'info'
    )}
  `;

  const html = (template?.html
    ? template.html
    : wrapVironLabsEmail({
        preheader: `Welcome to Viron Labs, ${displayName}`,
        headline: 'Welcome aboard',
        subline: 'Premium peptides, rewards, and support — all in one place.',
        bodyHtml: defaultBody,
      }))
    .replace(/{name}/g, displayName)
    .replace(/{site_url}/g, CONFIG.SITE_URL);

  const subject =
    (template?.subject || 'Welcome to Viron Labs').replace(/{name}/g, displayName);

  const result = await sendEmail({ to, subject, html });
  return result.success;
};

// Send password reset email
export const sendPasswordReset = async (
  to: string,
  resetUrl: string
): Promise<boolean> => {
  const template = await getEmailTemplate('password_reset');

  const defaultBody = `
    <p style="margin:0 0 14px;text-align:center;font-size:15px;color:#9CA3AF;line-height:1.6;">We received a request to reset the password for your Viron Labs account.</p>
    ${emailCtaRow(resetUrl, 'Reset password')}
    ${emailCallout(
      `<span style="font-size:13px;color:#9CA3AF;">This link expires in <strong style="color:#FBBF24;">1 hour</strong>. If you didn’t ask for a reset, you can ignore this email — your password will stay the same.</span>`,
      'warn'
    )}
  `;

  const html = (template?.html ? template.html : wrapVironLabsEmail({
    preheader: 'Reset your Viron Labs password',
    headline: 'Password reset',
    subline: 'Use the button below to choose a new password.',
    bodyHtml: defaultBody,
  })).replace(/{reset_url}/g, resetUrl);
  
  const result = await sendEmail({
    to,
    subject: 'Reset Your Viron Labs Password',
    html,
  });
  
  return result.success;
};

// Send affiliate discount confirmation to customer
export const sendAffiliateDiscountEmail = async (
  to: string,
  data: { order_number: string; code: string; discount_percent: number; discount_amount: number; total: number }
): Promise<boolean> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #22C55E;">Discount Applied!</h1>
      <p>You used referral code <strong style="font-size: 18px; color: #22C55E;">${data.code}</strong> on your order.</p>
      <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
        <p><strong>Order:</strong> #${data.order_number}</p>
        <p><strong>Discount:</strong> ${data.discount_percent}% off (−£${data.discount_amount.toFixed(2)})</p>
        <p><strong>Order Total:</strong> £${data.total.toFixed(2)}</p>
      </div>
      <p>Thanks for shopping with Viron Labs!</p>
    </div>
  `;

  const result = await sendEmail({
    to,
    subject: `Discount Applied — Order #${data.order_number}`,
    html,
  });
  return result.success;
};

// Send commission notification to promoter
export const sendPromoterCommissionEmail = async (
  to: string,
  data: { promoter_name: string; order_number: string; commission: number; total_credit: number }
): Promise<boolean> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #22C55E;">You Earned a Commission! 🎉</h1>
      <p>Hey ${data.promoter_name},</p>
      <p>Great news — someone used your referral code!</p>
      <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
        <p><strong>Order #:</strong> ${data.order_number}</p>
        <p><strong>Your Commission:</strong> <span style="font-size: 20px; color: #22C55E; font-weight: bold;">£${data.commission.toFixed(2)}</span></p>
        <p><strong>Total Store Credit:</strong> £${data.total_credit.toFixed(2)}</p>
      </div>
      <p>Your commission has been added to your store credit. You can use it at checkout or view it in your Promoter Dashboard.</p>
      <a href="${CONFIG.SITE_URL || 'https://vironlabs.com'}/promoter" style="display: inline-block; background: #22C55E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 10px; font-weight: bold;">View Dashboard</a>
    </div>
  `;

  const result = await sendEmail({
    to,
    subject: `You earned £${data.commission.toFixed(2)} — Order #${data.order_number}`,
    html,
  });
  return result.success;
};

// Send abandoned cart reminder
export const sendAbandonedCart = async (
  to: string,
  cartData: { items: any[]; checkoutUrl: string }
): Promise<boolean> => {
  const rows: OrderItemRow[] = cartData.items.map((item: { name?: string; dosage?: unknown; quantity?: number; price?: number }) => ({
    name: String(item.name ?? 'Item'),
    dosage: String(item.dosage ?? ''),
    quantity: item.quantity ?? 0,
    lineTotal: `£${((item.price ?? 0) * (item.quantity ?? 0)).toFixed(2)}`,
  }));

  const checkout = cartData.checkoutUrl;
  const defaultBody = `
    <p style="margin:0 0 8px;text-align:center;font-size:15px;color:#9CA3AF;">Your cart still has great research products waiting.</p>
    <p style="margin:0 0 18px;text-align:center;font-size:15px;color:#F4F6FA;line-height:1.55;">Complete checkout in one tap — stock moves fast on popular lines.</p>
    ${emailOrderItemsTable(rows)}
    ${emailCtaRow(checkout, 'Complete order')}
    <p style="margin:18px 0 0;text-align:center;font-size:13px;color:#9CA3AF;">Need help? <a href="mailto:${escapeHtml(CONFIG.SUPPORT_EMAIL)}" style="color:#2ED1B4;text-decoration:none;font-weight:600;">${escapeHtml(CONFIG.SUPPORT_EMAIL)}</a></p>
  `;

  const html = wrapVironLabsEmail({
    preheader: 'Your Viron Labs cart is waiting',
    headline: 'Still thinking it over?',
    subline: 'Your items are saved — finish when you’re ready.',
    bodyHtml: defaultBody,
  });
  
  const result = await sendEmail({
    to,
    subject: 'Don\'t Forget Your Items!',
    html,
  });
  
  return result.success;
};
