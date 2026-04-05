// Converts a Notion rich_text array to a plain string
function richTextToString(richTextArr) {
  if (!richTextArr || !richTextArr.length) return '';
  return richTextArr.map(t => t.plain_text).join('');
}

// Converts Notion blocks to a simple content array the frontend can render
function parseBlocks(blocks) {
  const content = [];
  let listBuffer = [];
  let listType = null;

  const flushList = () => {
    if (listBuffer.length) {
      content.push({ type: listType, items: [...listBuffer] });
      listBuffer = [];
      listType = null;
    }
  };

  for (const block of blocks) {
    const type = block.type;
    if (type === 'bulleted_list_item' || type === 'numbered_list_item') {
      const newListType = type === 'bulleted_list_item' ? 'ul' : 'ol';
      if (listType && listType !== newListType) flushList();
      listType = newListType;
      listBuffer.push(richTextToString(block[type]?.rich_text));
      continue;
    }
    flushList();
    if (type === 'paragraph') {
      const text = richTextToString(block.paragraph?.rich_text);
      if (text) content.push({ type: 'p', text });
    } else if (type === 'heading_1') {
      content.push({ type: 'h1', text: richTextToString(block.heading_1?.rich_text) });
    } else if (type === 'heading_2') {
      content.push({ type: 'h2', text: richTextToString(block.heading_2?.rich_text) });
    } else if (type === 'heading_3') {
      content.push({ type: 'h3', text: richTextToString(block.heading_3?.rich_text) });
    } else if (type === 'quote') {
      content.push({ type: 'quote', text: richTextToString(block.quote?.rich_text) });
    } else if (type === 'callout') {
      content.push({
        type: 'callout',
        text: richTextToString(block.callout?.rich_text),
        icon: block.callout?.icon?.emoji || '💡',
      });
    } else if (type === 'divider') {
      content.push({ type: 'divider' });
    } else if (type === 'image') {
      const url = block.image?.file?.url || block.image?.external?.url || null;
      const caption = richTextToString(block.image?.caption);
      if (url) content.push({ type: 'image', url, caption });
    }
  }
  flushList();
  return content;
}

const NOTION_HEADERS = {
  'Authorization': `Bearer ${process.env.NOTION_TOKEN_DISPATCH}`,
  'Content-Type': 'application/json',
  'Notion-Version': '2022-06-28',
};

export default async function handler(req, res) {
  const slug = req.query?.slug;

  // Single article by slug - includes full content blocks
  if (slug) {
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    try {
      const queryRes = await fetch(
        `https://api.notion.com/v1/databases/${process.env.NOTION_DB_HOLLY_ARTICLES}/query`,
        {
          method: 'POST',
          headers: NOTION_HEADERS,
          body: JSON.stringify({
            filter: { property: 'Slug', rich_text: { equals: slug } },
            page_size: 1,
          }),
        }
      );

      const queryData = await queryRes.json();
      const page = queryData.results?.[0] || null;
      if (!page) return res.status(404).json({ error: 'Article not found' });

      const blocksRes = await fetch(
        `https://api.notion.com/v1/blocks/${page.id}/children?page_size=100`,
        { headers: NOTION_HEADERS }
      );
      const blocksData = blocksRes.ok ? await blocksRes.json() : { results: [] };

      const p = page.properties;
      const article = {
        id: page.id,
        title: richTextToString(p['Title']?.title),
        slug: richTextToString(p['Slug']?.rich_text) || page.id,
        excerpt: richTextToString(p['Excerpt']?.rich_text),
        category: p['Category']?.select?.name || 'Lake Living',
        author: richTextToString(p['Author']?.rich_text) || 'Holly Griewahn',
        coverImage: p['Cover Image URL']?.url || null,
        publishedDate: p['Published Date']?.date?.start || null,
        tags: p['Tags']?.multi_select?.map(t => t.name) || [],
        aiGenerated: p['AI Generated']?.checkbox || false,
        editorsNote: richTextToString(p['Editors Note']?.rich_text) || null,
        content: parseBlocks(blocksData.results || []),
      };

      return res.status(200).json({ article });
    } catch (err) {
      console.error('holly-articles single error:', err.message);
      return res.status(500).json({ error: 'Failed to load article' });
    }
  }

  // Article list - Blog Safe only
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
  try {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${process.env.NOTION_DB_HOLLY_ARTICLES}/query`,
      {
        method: 'POST',
        headers: NOTION_HEADERS,
        body: JSON.stringify({
          filter: { property: 'Blog Safe', checkbox: { equals: true } },
          sorts: [{ property: 'Published Date', direction: 'descending' }],
        }),
      }
    );

    if (!response.ok) {
      console.error('Notion articles query failed:', await response.text());
      return res.status(200).json({ articles: [] });
    }

    const data = await response.json();
    const articles = data.results
      .map(page => {
        const p = page.properties;
        return {
          id: page.id,
          title: richTextToString(p['Title']?.title),
          slug: richTextToString(p['Slug']?.rich_text) || page.id,
          excerpt: richTextToString(p['Excerpt']?.rich_text),
          category: p['Category']?.select?.name || 'Lake Living',
          author: richTextToString(p['Author']?.rich_text) || 'Holly Griewahn',
          coverImage: p['Cover Image URL']?.url || null,
          publishedDate: p['Published Date']?.date?.start || null,
          tags: p['Tags']?.multi_select?.map(t => t.name) || [],
        };
      })
      .filter(a => a.title);

    return res.status(200).json({ articles });
  } catch (err) {
    console.error('holly-articles list error:', err.message);
    return res.status(200).json({ articles: [] });
  }
}
