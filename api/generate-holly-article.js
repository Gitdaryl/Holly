import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
        const content = fs.readFileSync(path.join(corpusDir, file), 'utf-8');
        return `=== ${label} ===\n${content}`;
      } catch {
        return `=== ${label} ===\n[File not found: ${file}]`;
      }
    })
    .join('\n\n');
}

function buildSystemPrompt(corpus, publishedSlugs = []) {
  const internalLinks = publishedSlugs.length
    ? `=== INTERNAL LINKING ===\nLink to 2-3 of these existing articles where natural:\n${publishedSlugs.map(s => `- /blog/${s}`).join('\n')}`
    : '';

  return `You are a professional content writer for Holly Griewahn, a real estate agent specializing in Irish Hills Lakes, Michigan.

${corpus}

${internalLinks}

=== CONTENT RULES ===
1. Write at a 7th-8th grade reading level - accessible, never dumbed down
2. Short paragraphs - 2-3 sentences max
3. Use H2 and H3 subheadings as questions where possible (GEO optimization)
4. Include 3-5 FAQs at the end in Q&A format
5. End with one natural CTA using the CTA Links provided
6. Minimum 1000 words, target 1200-1500
7. Never use any banned phrases
8. Write in Holly's warm, knowledgeable, local voice
9. Every article should feel like it was written by someone who knows these lakes personally
10. No generic national real estate advice - everything must be specific to Irish Hills / Lenawee County / Michigan

=== RESPONSE FORMAT ===
Return ONLY valid JSON with this exact structure:
{
  "title": "Article title - specific, not clickbait (8-12 words)",
  "slug": "url-friendly-slug-no-special-chars",
  "excerpt": "One compelling sentence max 160 chars - makes someone want to read more",
  "editorsNote": "1-2 sentences from Holly's personal perspective on this topic - conversational, first person",
  "category": "one of: Lake Living, Real Estate Tips, Area Guide, Seasonal, Buyer Education, Community",
  "tags": ["tag1", "tag2", "tag3"],
  "coverImageQuery": "3-4 word Unsplash search query for a beautiful cover image (e.g. 'Michigan lake dock', 'autumn lake cottage')",
  "blocks": [
    { "type": "paragraph", "text": "..." },
    { "type": "heading_2", "text": "..." },
    { "type": "quote", "text": "..." },
    { "type": "bulleted_list_item", "text": "..." },
    { "type": "callout", "text": "..." }
  ],
  "faqs": [
    { "question": "...", "answer": "..." }
  ]
}

Block types: paragraph, heading_2, heading_3, quote, callout, divider, bulleted_list_item, numbered_list_item
- heading_2: major section breaks (use as questions)
- heading_3: sub-points within sections
- quote: one memorable line or piece of Holly's local wisdom
- callout: one "Holly's take" aside - use sparingly
- divider: major section transitions`;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 80);
}

function repairJson(raw) {
  // Strip markdown fences
  let cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  // Find the outermost JSON object
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
    return {
      url: photo.urls?.regular || photo.urls?.full,
      credit: photo.user?.name || 'Unsplash',
      photographerUrl: photo.user?.links?.html,
      photoPageUrl: photo.links?.html,
    };
  } catch {
    return null;
  }
}

function blocksToNotion(blocks) {
  return blocks.map(block => {
    const richText = [{ type: 'text', text: { content: block.text || '' } }];
    switch (block.type) {
      case 'paragraph':
        return { object: 'block', type: 'paragraph', paragraph: { rich_text: richText } };
      case 'heading_2':
        return { object: 'block', type: 'heading_2', heading_2: { rich_text: richText } };
      case 'heading_3':
        return { object: 'block', type: 'heading_3', heading_3: { rich_text: richText } };
      case 'quote':
        return { object: 'block', type: 'quote', quote: { rich_text: richText } };
      case 'callout':
        return { object: 'block', type: 'callout', callout: { rich_text: richText, icon: { emoji: '🏡' } } };
      case 'divider':
        return { object: 'block', type: 'divider', divider: {} };
      case 'bulleted_list_item':
        return { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: richText } };
      case 'numbered_list_item':
        return { object: 'block', type: 'numbered_list_item', numbered_list_item: { rich_text: richText } };
      default:
        return { object: 'block', type: 'paragraph', paragraph: { rich_text: richText } };
    }
  });
}

async function getPublishedSlugs() {
  try {
    const res = await fetch(
      `https://api.notion.com/v1/databases/${process.env.NOTION_DB_HOLLY_ARTICLES}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NOTION_TOKEN_DISPATCH}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          filter: { property: 'Blog Safe', checkbox: { equals: true } },
          page_size: 20,
        }),
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.results
      .map(p => p.properties['Slug']?.rich_text?.[0]?.plain_text)
      .filter(Boolean);
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers['x-admin-token'];
  if (!token || token !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { topic, category = 'Lake Living', notes = '', targetKeyword = '' } = req.body || {};
  if (!topic) return res.status(400).json({ error: 'topic is required' });

  try {
    const corpus = loadCorpus();
    const publishedSlugs = await getPublishedSlugs();
    const systemPrompt = buildSystemPrompt(corpus, publishedSlugs);

    const userPrompt = `Write an article about: ${topic}
Category: ${category}
${targetKeyword ? `Target keyword: ${targetKeyword}` : ''}
${notes ? `Additional notes: ${notes}` : ''}

Remember: Holly's warm, local, knowledgeable voice. Irish Hills Lakes specific. No generic real estate content.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    let article;
    try {
      const cleaned = repairJson(message.content[0].text);
      article = JSON.parse(cleaned);
    } catch {
      console.error('JSON parse failed:', message.content[0].text.slice(0, 500));
      return res.status(500).json({ error: 'AI response could not be parsed', raw: message.content[0].text.slice(0, 500) });
    }

    const slug = article.slug || slugify(article.title);

    // Get cover image from Unsplash
    let coverImageUrl = null;
    let unsplashPhoto = null;
    if (article.coverImageQuery) {
      unsplashPhoto = await searchUnsplash(article.coverImageQuery);
      if (unsplashPhoto) coverImageUrl = unsplashPhoto.url;
    }

    // Build FAQ blocks
    const faqBlocks = [];
    if (article.faqs?.length) {
      faqBlocks.push({ object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: 'Frequently Asked Questions' } }] } });
      for (const faq of article.faqs) {
        faqBlocks.push({ object: 'block', type: 'heading_3', heading_3: { rich_text: [{ type: 'text', text: { content: faq.question } }] } });
        faqBlocks.push({ object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: faq.answer } }] } });
      }
    }

    const notionBlocks = [...blocksToNotion(article.blocks || []), ...faqBlocks];

    const coverSuggestion = unsplashPhoto
      ? `${article.coverImageQuery} | unsplash: ${unsplashPhoto.credit} | ${unsplashPhoto.photographerUrl} | ${unsplashPhoto.photoPageUrl}`
      : (article.coverImageQuery || '');

    // Save to Notion
    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN_DISPATCH}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: process.env.NOTION_DB_HOLLY_ARTICLES },
        properties: {
          'Title': { title: [{ text: { content: article.title } }] },
          'Slug': { rich_text: [{ text: { content: slug } }] },
          'Excerpt': { rich_text: [{ text: { content: article.excerpt || '' } }] },
          'Category': { select: { name: article.category || category } },
          'Author': { rich_text: [{ text: { content: 'Holly Griewahn' } }] },
          'Status': { select: { name: 'Draft' } },
          'AI Generated': { checkbox: true },
          'Blog Safe': { checkbox: false },
          'Editors Note': { rich_text: [{ text: { content: article.editorsNote || '' } }] },
          'Cover Image Suggestion': { rich_text: [{ text: { content: coverSuggestion } }] },
          ...(coverImageUrl ? { 'Cover Image URL': { url: coverImageUrl } } : {}),
          ...(article.tags?.length ? { 'Tags': { multi_select: article.tags.map(t => ({ name: t })) } } : {}),
        },
        children: notionBlocks,
      }),
    });

    if (!notionRes.ok) {
      const err = await notionRes.text();
      console.error('Notion save failed:', err);
      return res.status(500).json({ error: 'Failed to save to Notion', details: err });
    }

    const notionPage = await notionRes.json();

    return res.status(200).json({
      success: true,
      title: article.title,
      slug,
      excerpt: article.excerpt,
      editorsNote: article.editorsNote,
      coverImage: coverImageUrl,
      unsplashPhoto: unsplashPhoto || null,
      notionUrl: `https://notion.so/${notionPage.id.replace(/-/g, '')}`,
      notionId: notionPage.id,
    });
  } catch (err) {
    console.error('generate-holly-article error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
