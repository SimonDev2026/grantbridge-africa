// GET /api/cron/alerts — daily alerts cron (GitHub Actions, 07:00 UTC).
// Protected by CRON_SECRET: the caller must send
// Authorization: Bearer <CRON_SECRET>. If the secret is not configured the
// route fails closed — alerts never run unprotected.
import { sendDeadlineReminders, sendWeeklyDigest } from '@/features/alerts/send';

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ error: 'CRON_SECRET is not configured' }, { status: 503 });
  }
  const auth = req.headers.get('authorization') ?? '';
  if (auth !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const [reminders, digest] = await Promise.all([sendDeadlineReminders(), sendWeeklyDigest()]);
  return Response.json({ ok: true, ...reminders, ...digest });
}
