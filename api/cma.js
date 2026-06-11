// POST /api/cma
// Receives seller inquiry, emails Holly with all details via Resend
// Also saves to Notion Holly Leads DB as "CMA Request" source

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    address, region, type, beds, baths, sqft, yearBuilt,
    condition, timeline, extras, name, email, phone, notes,
  } = req.body || {};

  if (!address || !name) {
    return res.status(400).json({ error: 'Address and name are required' });
  }

  const results = await Promise.allSettled([
    emailViaResend({ address, region, type, beds, baths, sqft, yearBuilt, condition, timeline, extras, name, email, phone, notes }),
    saveToNotion({ address, region, type, timeline, name, email, phone, notes }),
  ]);

  const emailOk = results[0].status === 'fulfilled';
  const notionOk = results[1].status === 'fulfilled';

  if (!emailOk) console.error('CMA email failed:', results[0].reason);
  if (!notionOk) console.error('CMA Notion save failed:', results[1].reason);

  if (!emailOk && !notionOk) {
    return res.status(500).json({ error: 'Failed to process CMA request' });
  }

  return res.status(200).json({ success: true });
}

const CONDITION_LABELS = {
  excellent: 'Excellent - move-in ready, recently updated',
  good: 'Good - well maintained, minor updates needed',
  fair: 'Fair - functional but needs cosmetic work',
  'needs-work': 'Needs Work - major repairs or renovation needed',
};

const TIMELINE_LABELS = {
  asap: 'As Soon as Possible',
  '3-6': '3 to 6 Months',
  '6-12': '6 to 12 Months',
  exploring: 'Just Exploring',
};

const REGION_LABELS = {
  'brooklyn-columbia': 'Brooklyn / Lake Columbia',
  clarklake: 'Clark Lake',
  'devils-lake': "Devil's Lake",
  hayes: 'Hayes State Park',
  'loch-erin': 'Loch Erin',
  'manitou-beach': 'Manitou Beach / Round Lake',
  leann: 'Lake Leann',
  wamplers: 'Wamplers Lake',
  other: 'Other / Not Sure',
};

async function emailViaResend({ address, region, type, beds, baths, sqft, yearBuilt, condition, timeline, extras, name, email, phone, notes }) {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.HOLLY_CONTACT_EMAIL || 'admin@yetigroove.com';
  if (!apiKey) throw new Error('RESEND_API_KEY not set');

  const extrasStr = Array.isArray(extras) && extras.length > 0 ? extras.join(', ') : 'None noted';

  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color: #1a2332;">
      <div style="background: linear-gradient(135deg, #1a2332, #2c3e50); padding: 2rem; border-radius: 12px 12px 0 0; color: white;">
        <h1 style="margin: 0; font-size: 1.4rem;">New CMA Request</h1>
        <p style="margin: 0.5rem 0 0; opacity: 0.7; font-size: 0.9rem;">What's My Home Worth form</p>
      </div>
      <div style="border: 1px solid #e8e4df; border-top: none; border-radius: 0 0 12px 12px; padding: 2rem;">

        <h2 style="font-size: 1rem; color: #e84393; margin: 0 0 1rem;">Contact Info</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">
          <tr><td style="padding: 0.4rem 0; color: #6b7a8d; width: 140px;"><strong>Name</strong></td><td style="padding: 0.4rem 0;">${name}</td></tr>
          <tr><td style="padding: 0.4rem 0; color: #6b7a8d;"><strong>Email</strong></td><td style="padding: 0.4rem 0;">${email || 'Not provided'}</td></tr>
          <tr><td style="padding: 0.4rem 0; color: #6b7a8d;"><strong>Phone</strong></td><td style="padding: 0.4rem 0;">${phone || 'Not provided'}</td></tr>
        </table>

        <h2 style="font-size: 1rem; color: #e84393; margin: 0 0 1rem; padding-top: 1rem; border-top: 1px solid #f0ece8;">Property Details</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">
          <tr><td style="padding: 0.4rem 0; color: #6b7a8d; width: 140px;"><strong>Address</strong></td><td style="padding: 0.4rem 0;"><strong>${address}</strong></td></tr>
          <tr><td style="padding: 0.4rem 0; color: #6b7a8d;"><strong>Area</strong></td><td style="padding: 0.4rem 0;">${REGION_LABELS[region] || region || 'Not specified'}</td></tr>
          <tr><td style="padding: 0.4rem 0; color: #6b7a8d;"><strong>Type</strong></td><td style="padding: 0.4rem 0;">${type || 'Not specified'}</td></tr>
          <tr><td style="padding: 0.4rem 0; color: #6b7a8d;"><strong>Beds / Baths</strong></td><td style="padding: 0.4rem 0;">${beds || '?'} bed / ${baths || '?'} bath</td></tr>
          <tr><td style="padding: 0.4rem 0; color: #6b7a8d;"><strong>Sq Ft</strong></td><td style="padding: 0.4rem 0;">${sqft || 'Not provided'}</td></tr>
          <tr><td style="padding: 0.4rem 0; color: #6b7a8d;"><strong>Year Built</strong></td><td style="padding: 0.4rem 0;">${yearBuilt || 'Not provided'}</td></tr>
          <tr><td style="padding: 0.4rem 0; color: #6b7a8d;"><strong>Condition</strong></td><td style="padding: 0.4rem 0;">${CONDITION_LABELS[condition] || condition || 'Not specified'}</td></tr>
          <tr><td style="padding: 0.4rem 0; color: #6b7a8d;"><strong>Features</strong></td><td style="padding: 0.4rem 0;">${extrasStr}</td></tr>
        </table>

        <h2 style="font-size: 1rem; color: #e84393; margin: 0 0 1rem; padding-top: 1rem; border-top: 1px solid #f0ece8;">Selling Intent</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">
          <tr><td style="padding: 0.4rem 0; color: #6b7a8d; width: 140px;"><strong>Timeline</strong></td><td style="padding: 0.4rem 0;">${TIMELINE_LABELS[timeline] || timeline || 'Not specified'}</td></tr>
          ${notes ? `<tr><td style="padding: 0.4rem 0; color: #6b7a8d; vertical-align: top;"><strong>Notes</strong></td><td style="padding: 0.4rem 0;">${notes}</td></tr>` : ''}
        </table>

        <div style="background: #f7f3f0; border-radius: 10px; padding: 1rem; font-size: 0.85rem; color: #6b7a8d;">
          Reply to this email to respond to the seller, or call ${phone || 'them'} directly.
        </div>
      </div>
    </div>
  `;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Holly Site <noreply@yetigroove.com>',
      to: [toEmail],
      reply_to: email || undefined,
      subject: `CMA Request: ${address} - ${name}`,
      html,
    }),
  });

  if (!r.ok) throw new Error(await r.text());
}

async function saveToNotion({ address, region, type, timeline, name, email, phone, notes }) {
  const token = process.env.NOTION_TOKEN_HOLLY || process.env.NOTION_TOKEN_DISPATCH;
  const dbId = process.env.NOTION_DB_HOLLY_LEADS;
  if (!token || !dbId) throw new Error('Notion not configured');

  const interest = [
    `CMA Request for: ${address}`,
    type ? `Type: ${type}` : '',
    REGION_LABELS[region] ? `Area: ${REGION_LABELS[region]}` : '',
    TIMELINE_LABELS[timeline] ? `Timeline: ${TIMELINE_LABELS[timeline]}` : '',
    notes ? `Notes: ${notes}` : '',
  ].filter(Boolean).join(' | ');

  const body = {
    parent: { database_id: dbId },
    properties: {
      Name: { title: [{ text: { content: name } }] },
      ...(email && { Email: { email } }),
      ...(phone && { Phone: { phone_number: phone } }),
      Interest: { rich_text: [{ text: { content: interest.slice(0, 2000) } }] },
      ...(region && { Region: { select: { name: REGION_LABELS[region] || region } } }),
      Source: { select: { name: 'CMA Request' } },
    },
  };

  const r = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify(body),
  });

  if (!r.ok) throw new Error(await r.text());
}
