// Service-order emails (Step 6). All sends are no-ops until RESEND_API_KEY is
// set (Step 8) — nothing here may break checkout or the webhook.
import { BRAND } from '@/config/brand';
import { getResendClient } from '@/libs/resend/resend-client';

// One shared mailbox (owner decision 2026-11-11): admin notifications land
// in info@, the same mailbox as contact, support and careers.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? BRAND.contact.email;
const FROM = process.env.RESEND_FROM_EMAIL ?? 'GrantBridge Africa <onboarding@resend.dev>';

function canSend(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

async function send(to: string, subject: string, text: string) {
  if (!canSend()) return;
  try {
    await getResendClient().emails.send({ from: FROM, to, subject, text });
  } catch (e) {
    console.error('Service-order email failed:', (e as Error).message);
  }
}

export async function notifyAdminNewOrder(order: { id: string; package: string | null; amount_paid_cents: number | null }) {
  const amount = order.amount_paid_cents ? `$${(order.amount_paid_cents / 100).toFixed(2)}` : 'amount unknown';
  await send(
    ADMIN_EMAIL,
    `New ${order.package ?? 'service'} order — ${amount}`,
    `A new service order was paid.\n\nOrder: ${order.id}\nPackage: ${order.package ?? '—'}\nAmount: ${amount}\n\nOpen it in the back office: /admin/orders/${order.id}`
  );
}

export async function notifyAdminIntakeComplete(order: { id: string; package: string | null }) {
  await send(
    ADMIN_EMAIL,
    `Intake complete — order ${order.id.slice(0, 8)}`,
    `The client completed the intake form for their ${order.package ?? 'service'} order.\n\nOpen it in the back office: /admin/orders/${order.id}`
  );
}

export async function notifyClient(order: { id: string }, clientEmail: string, subject: string, text: string) {
  await send(clientEmail, subject, `${text}\n\nYour order: /orders/${order.id}`);
}
