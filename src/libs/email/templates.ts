// Starter templates for the backstage email composer.
//
// Real, usable copy in the GrantBridge voice — no invented grants, amounts,
// dates, names or statistics. The "new grants" template links to the live
// grants directory instead of naming grants, and carries one clearly-marked
// line for the admin to replace with that week's real new grants before
// sending.
import { getURL } from '@/utils/get-url';

// Starter templates for the backstage email composer.
//
// Real, usable copy in the GrantBridge voice — no invented grants, amounts,
// dates, names or statistics. The "new grants" template links to the live
// grants directory instead of naming grants, and carries one clearly-marked
// line for the admin to replace with that week's real new grants before
// sending. Links follow NEXT_PUBLIC_SITE_URL (getURL), so they stay correct
// when the real domain is bought.
export type EmailTemplate = {
  key: string;
  name: string;
  subject: string;
  body: string;
};

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    key: 'welcome',
    name: 'Welcome',
    subject: 'Welcome to GrantBridge Africa — find the grants you qualify for',
    body: `<p>Hello,</p>
<p>Welcome to GrantBridge Africa. You signed up to hear about grants open to African organisations — and that is exactly what this list is for.</p>
<p>Here is what you can do right now:</p>
<ul>
<li><a href="${getURL('/quiz')}">Take the 10-step quiz</a> — tell us about your organisation and we will match you with the grants you actually qualify for.</li>
<li><a href="${getURL('/grants')}">Browse all open grants</a> — every listing is checked against the funder's own page.</li>
<li><a href="${getURL('/dashboard')}">Open your dashboard</a> — save grants, track deadlines, and draft applications.</li>
</ul>
<p>We only email when there is something worth your time: new grants, closing deadlines, and the occasional announcement. No spam, and you can unsubscribe at any time.</p>
<p>— The GrantBridge Africa team</p>`,
  },
  {
    key: 'new-grants',
    name: 'New grants this week',
    subject: 'New grants open to African organisations this week',
    body: `<p>Hello,</p>
<p>New grants opened this week for African organisations. Here are the ones worth a look:</p>
<p><strong>[Replace this line with this week's real new grants — name, amount and deadline for each, copied from the grants directory.]</strong></p>
<p><a href="${getURL('/grants')}">Browse all open grants</a> — every listing is checked against the funder's own page, with the deadline and the official application link.</p>
<p>If one fits your organisation, take the quiz and we will check your eligibility and draft the application with you.</p>
<p>— The GrantBridge Africa team</p>`,
  },
  {
    key: 'announcement',
    name: 'Announcement',
    subject: 'An update from GrantBridge Africa',
    body: `<p>Hello,</p>
<p>We have an update to share with you:</p>
<p><strong>[Write the announcement here — what changed, and what it means for your organisation.]</strong></p>
<p>Questions? Reply to this email or write to us at info@grantbridgeafrica.com — we read every message.</p>
<p>— The GrantBridge Africa team</p>`,
  },
];
