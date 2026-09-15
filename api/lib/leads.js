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
