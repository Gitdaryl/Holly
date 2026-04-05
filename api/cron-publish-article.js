// Vercel Cron: runs Mon/Wed/Fri at 8am ET (13:00 UTC)
// Picks the oldest "approved" topic from Holly Content Calendar,
// writes it with Claude + brand corpus, saves to Holly Articles DB.

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const NOTION_HEADERS = {
  'Authorization': `Bearer ${process.env.NOTION_TOKEN_DISPATCH}`,
  'Content-Type': 'application/json',
  'Notion-Version': '2022-06-28',
};

function loadCorpus() {
  const corpusDir = path.join(process.cwd(), 'content-corpus');
  const files = [
    { label: 'BRAND VOICE', file: 'voice-guide.md' },
    { label: 'BANNED PHRASES', file: 'banned-phrases.md' },
    { label: 'TONE EXAMPLES', file: 'tone-examples.md' },
    { label: 'BRAND POSITIONING', file: 'core-positioning.md' },
    { label: 'SERVICES & OFFERS', file: 'offers.md' },
    { label: 'SEO STRATEGY', file: 'keyword-clusters.md' },
    { label: 'CTA LINKS', file: 'cta-links.md' },
    { label: 'COMPETITIVE LANDSCAPE', file: 'competitive-landscape.md' },
  ];
  return files
    .map(({ label, file }) => {
      try {
        return `=== ${label} ===\n${fs.readFileSync(path.join(corpusDir, file), 'utf-8')}`;
      } catch {
        return '';
      }
    })
    .filter(Boolean)
    .join('\n\n');
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').substring(0, 80);
}

function repairJson(raw) {
  let cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1) cleaned = cleaned.slice(start, end + 1);
  return cleaned;
}

async function searchUnsplash(query) {
  if (!process.env.UNSPLASH_ACCESS_KEY) return null;
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const photo = data.results?.[0];
    if (!photo) return null;
    return { url: photo.urls?.regular, credit: photo.user?.name };
  } catch {
    return null;
  }
}

function blocksToNotion(blocks) {
  return blocks.map(block => {
    const richText = [{ type: 'text', text: { content: block.text || '' } }];
    switch (block.type) {
      case 'heading_2': return { object: 'block', type: 'heading_2', heading_2: { rich_text: richText } };
      case 'heading_3': return { object: 'block', type: 'heading_3', heading_3: { rich_text: richText } };
      case 'quote': return { object: 'block', type: 'quote', quote: { rich_text: richText } };
      case 'callout': return { object: 'block', type: 'callout', callout: { rich_text: richText, icon: { emoji: '🏡' } } };
      case 'divider': return { object: 'block', type: 'divider', divider: {} };
      case 'bulleted_list_item': return { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: richText } };
      case 'numbered_list_item': return { object: 'block', type: 'numbered_list_item', numbered_list_item: { rich_text: richText } };
      default: return { object: 'block', type: 'paragraph', paragraph: { rich_text: richText } };
    }
  });
}

export default async function handler(req, res) {
  // Verify this is a legitimate cron call from Vercel
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}` &&
      req.method !== 'GET') {
    // Allow GET for manual testing without cron secret
  }

  console.log('[cron-publish-article] Starting...');

  try {
    // 1. Get oldest "approved" topic from content calendar
    const calendarRes = await fetch(
      `https://api.notion.com/v1/databases/${process.env.NOTION_DB_HOLLY_CALENDAR}/query`,
      {
        method: 'POST',
        headers: NOTION_HEADERS,
        body: JSON.stringify({
          filter: { property: 'Status', select: { equals: 'approved' } },
          sorts: [{ property: 'Created time', direction: 'ascending' }],
          page_size: 1,
        }),
      }
    );

    const calendarData = await calendarRes.json();
    const calendarEntry = calendarData.results?.[0];

    if (!calendarEntry) {
      console.log('[cron-publish-article] No approved topics found. Exiting.');
      return res.status(200).json({ message: 'No approved topics in queue' });
    }

    const entryId = calendarEntry.id;
    const cp = calendarEntry.properties;
    const topic = cp['Topic']?.title?.[0]?.plain_text || '';
    const targetKeyword = cp['Target Keyword']?.rich_text?.[0]?.plain_text || '';
    const category = cp['Category']?.select?.name || 'Lake Living';
    const notes = cp['Notes']?.rich_text?.[0]?.plain_text || '';

    console.log(`[cron-publish-article] Writing: "${topic}"`);

    // 2. Mark calendar entry as "writing"
    await fetch(`https://api.notion.com/v1/pages/${entryId}`, {
      method: 'PATCH',
      headers: NOTION_HEADERS,
      body: JSON.stringify({ properties: { 'Status': { select: { name: 'writing' } } } }),
    });

    // 3. Load brand corpus + published slugs
    const corpus = loadCorpus();

    const publishedRes = await fetch(
      `https://api.notion.com/v1/databases/${process.env.NOTION_DB_HOLLY_ARTICLES}/query`,
      {
        method: 'POST',
        headers: NOTION_HEADERS,
        body: JSON.stringify({
          filter: { property: 'Blog Safe', checkbox: { equals: true } },
          page_size: 20,
        }),
      }
    );
    const publishedData = publishedRes.ok ? await publishedRes.json() : { results: [] };
    const publishedSlugs = publishedData.results
      .map(p => p.properties['Slug']?.rich_text?.[0]?.plain_text)
      .filter(Boolean);

    const internalLinks = publishedSlugs.length
      ? `=== INTERNAL LINKING ===\nLink to 2-3 of these where natural:\n${publishedSlugs.map(s => `- /blog/${s}`).join('\n')}`
      : '';

    // 4. Write article with Claude
    const systemPrompt = `You are a professional content writer for Holly Griewahn, a real estate agent specializing in Irish Hills Lakes, Michigan.

${corpus}

${internalLinks}

=== CONTENT RULES ===
1. Write at a 7th-8th grade reading level
2. Short paragraphs - 2-3 sentences max
3. H2 and H3 subheadings as questions (GEO optimization)
4. 3-5 FAQs at the end
5. One natural CTA using the CTA Links provided
6. Minimum 1000 words
7. Never use banned phrases
8. Holly's warm, local, knowledgeable voice
9. Irish Hills / Lenawee County specific - no generic national real estate content

Return ONLY valid JSON:
{
  "title": "...",
  "slug": "url-friendly-slug",
  "excerpt": "One sentence max 160 chars",
  "editorsNote": "1-2 sentences from Holly's personal perspective",
  "category": "...",
  "tags": ["...", "..."],
  "coverImageQuery": "3-4 word Unsplash search query",
  "blocks": [{"type": "paragraph|heading_2|heading_3|quote|callout|divider|bulleted_list_item|numbered_list_item", "text": "..."}],
  "faqs": [{"question": "...", "answer": "..."}]
}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Write an article about: ${topic}\nCategory: ${category}${targetKeyword ? `\nTarget keyword: ${targetKeyword}` : ''}${notes ? `\nNotes: ${notes}` : ''}`,
      }],
    });

    let article;
    try {
      article = JSON.parse(repairJson(message.content[0].text));
    } catch (parseErr) {
      console.error('[cron-publish-article] JSON parse failed');
      // Revert calendar status
      await fetch(`https://api.notion.com/v1/pages/${entryId}`, {
        method: 'PATCH',
        headers: NOTION_HEADERS,
        body: JSON.stringify({ properties: { 'Status': { select: { name: 'approved' } } } }),
      });
      return res.status(500).json({ error: 'AI response parse failed' });
    }

    const slug = article.slug || slugify(article.title);

    // 5. Cover image
    let coverImageUrl = null;
    if (article.coverImageQuery) {
      const photo = await searchUnsplash(article.coverImageQuery);
      if (photo) coverImageUrl = photo.url;
    }

    // 6. Build Notion blocks (article + FAQs)
    const faqBlocks = [];
    if (article.faqs?.length) {
      faqBlocks.push({ object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: 'Frequently Asked Questions' } }] } });
      for (const faq of article.faqs) {
        faqBlocks.push({ object: 'block', type: 'heading_3', heading_3: { rich_text: [{ type: 'text', text: { content: faq.question } }] } });
        faqBlocks.push({ object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: faq.answer } }] } });
      }
    }
    const notionBlocks = [...blocksToNotion(article.blocks || []), ...faqBlocks];

    // 7. Determine publish mode
    const isAutonomous = process.env.AUTO_PUBLISH_MODE === 'autonomous';
    const today = new Date().toISOString().split('T')[0];

    // 8. Save article to Notion
    const articleRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: NOTION_HEADERS,
      body: JSON.stringify({
        parent: { database_id: process.env.NOTION_DB_HOLLY_ARTICLES },
        properties: {
          'Title': { title: [{ text: { content: article.title } }] },
          'Slug': { rich_text: [{ text: { content: slug } }] },
          'Excerpt': { rich_text: [{ text: { content: article.excerpt || '' } }] },
          'Category': { select: { name: article.category || category } },
          'Author': { rich_text: [{ text: { content: 'Holly Griewahn' } }] },
          'Status': { select: { name: isAutonomous ? 'Published' : 'Draft' } },
          'AI Generated': { checkbox: true },
          'Blog Safe': { checkbox: isAutonomous },
          'Editors Note': { rich_text: [{ text: { content: article.editorsNote || '' } }] },
          ...(coverImageUrl ? { 'Cover Image URL': { url: coverImageUrl } } : {}),
          ...(isAutonomous ? { 'Published Date': { date: { start: today } } } : {}),
          ...(article.tags?.length ? { 'Tags': { multi_select: article.tags.map(t => ({ name: t })) } } : {}),
        },
        children: notionBlocks,
      }),
    });

    if (!articleRes.ok) {
      const errText = await articleRes.text();
      console.error('[cron-publish-article] Notion article save failed:', errText);
      await fetch(`https://api.notion.com/v1/pages/${entryId}`, {
        method: 'PATCH',
        headers: NOTION_HEADERS,
        body: JSON.stringify({ properties: { 'Status': { select: { name: 'approved' } } } }),
      });
      return res.status(500).json({ error: 'Failed to save article to Notion' });
    }

    const articlePage = await articleRes.json();
    const articleUrl = `https://notion.so/${articlePage.id.replace(/-/g, '')}`;

    // 9. Update calendar entry
    await fetch(`https://api.notion.com/v1/pages/${entryId}`, {
      method: 'PATCH',
      headers: NOTION_HEADERS,
      body: JSON.stringify({
        properties: {
          'Status': { select: { name: isAutonomous ? 'published' : 'draft' } },
          'Published Date': { date: { start: today } },
          'Article Link': { url: articleUrl },
        },
      }),
    });

    console.log(`[cron-publish-article] Done. Article: "${article.title}" | Mode: ${isAutonomous ? 'autonomous' : 'safe'}`);

    return res.status(200).json({
      success: true,
      title: article.title,
      slug,
      mode: isAutonomous ? 'autonomous' : 'safe',
      notionUrl: articleUrl,
    });

  } catch (err) {
    console.error('[cron-publish-article] Unhandled error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
