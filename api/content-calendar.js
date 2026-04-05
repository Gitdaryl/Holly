// CRUD operations for Holly Content Calendar
// GET: list entries (optional ?status=planned)
// POST: create new entry
// PATCH: update status

const NOTION_HEADERS = {
  'Authorization': `Bearer ${process.env.NOTION_TOKEN_DISPATCH}`,
  'Content-Type': 'application/json',
  'Notion-Version': '2022-06-28',
};

function richText(str) {
  return [{ type: 'text', text: { content: str || '' } }];
}

function parseEntry(page) {
  const p = page.properties;
  return {
    id: page.id,
    topic: p['Topic']?.title?.[0]?.plain_text || '',
    status: p['Status']?.select?.name || 'planned',
    targetKeyword: p['Target Keyword']?.rich_text?.[0]?.plain_text || '',
    keywordCluster: p['Keyword Cluster']?.select?.name || '',
    category: p['Category']?.select?.name || '',
    priority: p['Priority']?.select?.name || 'medium',
    notes: p['Notes']?.rich_text?.[0]?.plain_text || '',
    source: p['Source']?.select?.name || 'manual',
    publishedDate: p['Published Date']?.date?.start || null,
    articleLink: p['Article Link']?.url || null,
  };
}

export default async function handler(req, res) {
  const token = req.headers['x-admin-token'];
  if (!token || token !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET - list entries
  if (req.method === 'GET') {
    const { status } = req.query;
    const filter = status
      ? { property: 'Status', select: { equals: status } }
      : undefined;

    try {
      const response = await fetch(
        `https://api.notion.com/v1/databases/${process.env.NOTION_DB_HOLLY_CALENDAR}/query`,
        {
          method: 'POST',
          headers: NOTION_HEADERS,
          body: JSON.stringify({
            ...(filter ? { filter } : {}),
            sorts: [{ property: 'Priority', direction: 'descending' }],
            page_size: 50,
          }),
        }
      );
      const data = await response.json();
      return res.status(200).json({ entries: (data.results || []).map(parseEntry) });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST - create new topic
  if (req.method === 'POST') {
    const { topic, targetKeyword, keywordCluster, category, priority = 'medium', notes, source = 'manual' } = req.body || {};
    if (!topic) return res.status(400).json({ error: 'topic is required' });

    try {
      const response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: NOTION_HEADERS,
        body: JSON.stringify({
          parent: { database_id: process.env.NOTION_DB_HOLLY_CALENDAR },
          properties: {
            'Topic': { title: richText(topic) },
            'Status': { select: { name: 'planned' } },
            ...(targetKeyword ? { 'Target Keyword': { rich_text: richText(targetKeyword) } } : {}),
            ...(keywordCluster ? { 'Keyword Cluster': { select: { name: keywordCluster } } } : {}),
            ...(category ? { 'Category': { select: { name: category } } } : {}),
            'Priority': { select: { name: priority } },
            ...(notes ? { 'Notes': { rich_text: richText(notes) } } : {}),
            'Source': { select: { name: source } },
          },
        }),
      });
      const page = await response.json();
      return res.status(201).json({ success: true, entry: parseEntry(page) });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // PATCH - update entry status
  if (req.method === 'PATCH') {
    const { id, status } = req.body || {};
    if (!id || !status) return res.status(400).json({ error: 'id and status are required' });

    const validStatuses = ['planned', 'approved', 'writing', 'draft', 'published', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    }

    try {
      const response = await fetch(`https://api.notion.com/v1/pages/${id}`, {
        method: 'PATCH',
        headers: NOTION_HEADERS,
        body: JSON.stringify({ properties: { 'Status': { select: { name: status } } } }),
      });
      const page = await response.json();
      return res.status(200).json({ success: true, entry: parseEntry(page) });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
