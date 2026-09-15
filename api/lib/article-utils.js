// Shared helpers for the article crons: brand corpus loading, Notion block
// conversion, and JSON repair for model output.
import fs from 'fs';
import path from 'path';

export const NOTION_HEADERS = {
  'Authorization': `Bearer ${process.env.NOTION_TOKEN_DISPATCH}`,
  'Content-Type': 'application/json',
  'Notion-Version': '2022-06-28',
};

export function loadCorpus() {
  const corpusDir = path.join(process.cwd(), 'content-corpus');
  const files = [
    { label: 'BRAND VOICE', file: 'voice-guide.md' },
    { label: 'BANNED PHRASES', file: 'banned-phrases.md' },
    { label: 'TONE EXAMPLES', file: 'tone-examples.md' },
    { label: 'BRAND POSITIONING', file: 'core-positioning.md' },
    { label: 'SERVICES & OFFERS', file: 'offers.md' },
    { label: 'CTA LINKS', file: 'cta-links.md' },
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

export function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').substring(0, 80);
}

export function repairJson(raw) {
  let cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1) cleaned = cleaned.slice(start, end + 1);
  return cleaned;
}

// Notion caps a rich_text item at 2000 chars; split long paragraphs.
function richText(text) {
  const chunks = [];
  let s = text || '';
  while (s.length > 2000) { chunks.push(s.slice(0, 2000)); s = s.slice(2000); }
  chunks.push(s);
  return chunks.map(content => ({ type: 'text', text: { content } }));
}

export function blocksToNotion(blocks) {
  return blocks.map(block => {
    const rich_text = richText(block.text);
    switch (block.type) {
      case 'heading_2': return { object: 'block', type: 'heading_2', heading_2: { rich_text } };
      case 'heading_3': return { object: 'block', type: 'heading_3', heading_3: { rich_text } };
      case 'quote': return { object: 'block', type: 'quote', quote: { rich_text } };
      case 'callout': return { object: 'block', type: 'callout', callout: { rich_text, icon: { emoji: '🏡' } } };
      case 'divider': return { object: 'block', type: 'divider', divider: {} };
      case 'bulleted_list_item': return { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text } };
      case 'numbered_list_item': return { object: 'block', type: 'numbered_list_item', numbered_list_item: { rich_text } };
      default: return { object: 'block', type: 'paragraph', paragraph: { rich_text } };
    }
  });
}

export function faqsToNotion(faqs) {
  if (!faqs?.length) return [];
  const out = [{ object: 'block', type: 'heading_2', heading_2: { rich_text: richText('Frequently Asked Questions') } }];
  for (const faq of faqs) {
    out.push({ object: 'block', type: 'heading_3', heading_3: { rich_text: richText(faq.question) } });
    out.push({ object: 'block', type: 'paragraph', paragraph: { rich_text: richText(faq.answer) } });
  }
  return out;
}

export async function findArticleBySlug(slug) {
  const res = await fetch(`https://api.notion.com/v1/databases/${process.env.NOTION_DB_HOLLY_ARTICLES}/query`, {
    method: 'POST',
    headers: NOTION_HEADERS,
    body: JSON.stringify({ filter: { property: 'Slug', rich_text: { equals: slug } }, page_size: 1 }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.results?.[0] || null;
}

export async function saveArticle({ article, slug, category, coverImageUrl, autonomous }) {
  const today = new Date().toISOString().split('T')[0];
  const children = [...blocksToNotion(article.blocks || []), ...faqsToNotion(article.faqs)];
  const res = await fetch('https://api.notion.com/v1/pages', {
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
        'Status': { select: { name: autonomous ? 'Published' : 'Draft' } },
        'AI Generated': { checkbox: true },
        'Blog Safe': { checkbox: autonomous },
        'Editors Note': { rich_text: [{ text: { content: article.editorsNote || '' } }] },
        ...(coverImageUrl ? { 'Cover Image URL': { url: coverImageUrl } } : {}),
        ...(autonomous ? { 'Published Date': { date: { start: today } } } : {}),
        ...(article.tags?.length ? { 'Tags': { multi_select: article.tags.map(t => ({ name: t })) } } : {}),
      },
      children,
    }),
  });
  if (!res.ok) throw new Error(`Notion save failed: ${await res.text()}`);
  const page = await res.json();
  return `https://notion.so/${page.id.replace(/-/g, '')}`;
}
