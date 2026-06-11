// POST /api/save-lead
// Accepts: { name, email, phone, interest, region, sessionId }
// Saves to Notion "Holly Leads" database

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, interest, region, sessionId } = req.body || {};

  if (!name && !email) {
    return res.status(400).json({ error: 'Name or email required' });
  }

  const token = process.env.NOTION_TOKEN_HOLLY;
  const dbId = process.env.NOTION_DB_HOLLY_LEADS;

  if (!token || !dbId) {
    console.error('Notion lead DB not configured (NOTION_TOKEN_HOLLY / NOTION_DB_HOLLY_LEADS)');
    return res.status(500).json({ error: 'Lead storage not configured' });
  }

  try {
    const body = {
      parent: { database_id: dbId },
      properties: {
        Name: { title: [{ text: { content: name || 'Unknown' } }] },
        Email: email ? { email } : undefined,
        Phone: phone ? { phone_number: phone } : undefined,
        Interest: interest ? { rich_text: [{ text: { content: interest } }] } : undefined,
        Region: region ? { rich_text: [{ text: { content: region } }] } : undefined,
        Source: { select: { name: 'AI Chat Widget' } },
        'Session ID': sessionId ? { rich_text: [{ text: { content: sessionId } }] } : undefined,
        Date: { date: { start: new Date().toISOString() } },
      },
    };

    // Remove undefined props
    for (const key of Object.keys(body.properties)) {
      if (body.properties[key] === undefined) delete body.properties[key];
    }

    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify(body),
    });

    if (!notionRes.ok) {
      const err = await notionRes.text();
      console.error('Notion lead save failed:', err);
      return res.status(500).json({ error: 'Failed to save lead' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('save-lead error:', err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
}
