import { put } from '@vercel/blob'
import { todayISO } from './engage-store.js'

// Durable copy of every lead, written BEFORE Notion, email or SMS are tried.
// Layout: leads/_<kind>/<YYYY-MM-DD>/<stamp>-<uuid>.json  (kind: contact, chat,
// cma). Listing-attributed showing requests live under leads/<slug>/ instead.
// Returns the pathname, or null if Blob itself failed (logged, never thrown):
// the caller decides whether Notion/email can still make the request succeed.
export async function persistLead(kind, lead) {
  const receivedAt = new Date().toISOString()
  try {
    const stamp = receivedAt.replace(/[:.]/g, '-')
    const path = `leads/_${kind}/${todayISO()}/${stamp}-${crypto.randomUUID()}.json`
    await put(path, JSON.stringify({ kind, receivedAt, ...lead }, null, 2), {
      access: 'public', addRandomSuffix: false, contentType: 'application/json',
    })
    return path
  } catch (err) {
    console.error(`persistLead(${kind}) failed:`, err.message)
    return null
  }
}

// Persist a lead to the Holly Leads Notion DB. Every intake endpoint calls this
// BEFORE it tries to notify anyone, so a Resend outage never loses a lead.
export async function saveLeadToNotion({ name, email, phone, interest, region, source, sessionId }) {
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
      Source: { select: { name: source || 'Website' } },
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
