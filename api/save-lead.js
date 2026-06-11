// POST /api/save-lead
// Accepts: { name, email, phone, interest, region, sessionId }
// Saves to Notion Holly Leads DB + emails via Resend as fallback

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, interest, region, sessionId } = req.body || {};

  if (!name && !email) {
    return res.status(400).json({ error: 'Name or email required' });
  }

  const results = await Promise.allSettled([
    saveToNotion({ name, email, phone, interest, region, sessionId }),
    emailViaResend({ name, email, phone, interest, region }),
  ]);

  const notionOk = results[0].status === 'fulfilled';
  const emailOk = results[1].status === 'fulfilled';

  if (!notionOk) console.error('Notion save failed:', results[0].reason);
  if (!emailOk) console.error('Resend email failed:', results[1].reason);

  if (!notionOk && !emailOk) {
    return res.status(500).json({ error: 'Failed to save lead via any channel' });
  }

  return res.status(200).json({ success: true, notion: notionOk, email: emailOk });
}

async function saveToNotion({ name, email, phone, interest, region, sessionId }) {
  const token = process.env.NOTION_TOKEN_HOLLY || process.env.NOTION_TOKEN_DISPATCH;
  const dbId = process.env.NOTION_DB_HOLLY_LEADS;
  if (!token || !dbId) throw new Error('Notion not configured');

  const body = {
    parent: { database_id: dbId },
    properties: {
      Name: { title: [{ text: { content: name || 'Unknown' } }] },
      ...(email && { Email: { email } }),
      ...(phone && { Phone: { phone_number: phone } }),
      ...(interest && { Interest: { rich_text: [{ text: { content: interest.slice(0, 2000) } }] } }),
      ...(region && { Region: { select: { name: region } } }),
      Source: { select: { name: 'AI Chat Widget' } },
      ...(sessionId && { 'Session ID': { rich_text: [{ text: { content: sessionId } }] } }),
    },
  };

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(await res.text());
}

async function emailViaResend({ name, email, phone, interest, region }) {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.HOLLY_CONTACT_EMAIL || 'admin@yetigroove.com';
  if (!apiKey) throw new Error('RESEND_API_KEY not set');

  const html = `
    <h2>New Lead from Holly's AI Chat Widget</h2>
    <table>
      <tr><td><strong>Name:</strong></td><td>${name || 'Not provided'}</td></tr>
      <tr><td><strong>Email:</strong></td><td>${email || 'Not provided'}</td></tr>
      <tr><td><strong>Phone:</strong></td><td>${phone || 'Not provided'}</td></tr>
      <tr><td><strong>Region:</strong></td><td>${region || 'Not specified'}</td></tr>
      <tr><td><strong>Chat summary:</strong></td><td style="max-width:400px">${(interest || 'No summary').replace(/\|/g, '<br>')}</td></tr>
    </table>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Holly Leads <noreply@yetigroove.com>',
      to: [toEmail],
      subject: `New lead: ${name || email || 'Anonymous'} — Irish Hills real estate`,
      html,
    }),
  });

  if (!res.ok) throw new Error(await res.text());
}
