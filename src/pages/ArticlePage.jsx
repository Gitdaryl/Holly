import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function ArticleBlock({ block }) {
  const baseP = { fontSize: '1.08rem', color: '#2d3748', lineHeight: 1.85, marginBottom: '1.4rem' };

  switch (block.type) {
    case 'p':
      return <p style={baseP}>{block.text}</p>;
    case 'h1':
      return <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', fontWeight: 700, color: '#1a2332', margin: '2.5rem 0 1rem' }}>{block.text}</h1>;
    case 'h2':
      return <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.65rem', fontWeight: 700, color: '#1a2332', margin: '2.5rem 0 1rem', lineHeight: 1.3 }}>{block.text}</h2>;
    case 'h3':
      return <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1a2332', margin: '2rem 0 0.75rem' }}>{block.text}</h3>;
    case 'quote':
      return (
        <blockquote style={{
          borderLeft: '4px solid #e84393',
          paddingLeft: '1.5rem',
          margin: '2rem 0',
          color: '#4a5568',
          fontStyle: 'italic',
          fontSize: '1.15rem',
          lineHeight: 1.7,
        }}>
          {block.text}
        </blockquote>
      );
    case 'callout':
      return (
        <div style={{
          background: 'rgba(232,67,147,0.06)',
          border: '1px solid rgba(232,67,147,0.2)',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          margin: '2rem 0',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{block.icon || '🏡'}</span>
          <p style={{ ...baseP, marginBottom: 0, color: '#1a2332' }}>{block.text}</p>
        </div>
      );
    case 'divider':
      return <hr style={{ border: 'none', borderTop: '1px solid #e8e4df', margin: '2.5rem 0' }} />;
    case 'ul':
      return (
        <ul style={{ margin: '1rem 0 1.5rem 1.5rem', color: '#2d3748' }}>
          {block.items.map((item, i) => (
            <li key={i} style={{ fontSize: '1.05rem', lineHeight: 1.75, marginBottom: '0.5rem' }}>{item}</li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol style={{ margin: '1rem 0 1.5rem 1.5rem', color: '#2d3748' }}>
          {block.items.map((item, i) => (
            <li key={i} style={{ fontSize: '1.05rem', lineHeight: 1.75, marginBottom: '0.5rem' }}>{item}</li>
          ))}
        </ol>
      );
    case 'image':
      return (
        <figure style={{ margin: '2rem 0' }}>
          <img src={block.url} alt={block.caption || ''} style={{ width: '100%', borderRadius: '12px', display: 'block' }} />
          {block.caption && (
            <figcaption style={{ textAlign: 'center', fontSize: '0.82rem', color: '#6b7a8d', marginTop: '0.5rem' }}>{block.caption}</figcaption>
          )}
        </figure>
      );
    default:
      return null;
  }
}

export default function ArticlePage() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetch(`/api/holly-articles?slug=${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(data => {
        if (data.article) { setArticle(data.article); }
        else { setError('Article not found'); }
        setLoading(false);
      })
      .catch(() => { setError('Failed to load article'); setLoading(false); });
  }, [slug]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (article) document.title = `${article.title} | Holly Griewahn`;
    return () => { document.title = 'Holly Griewahn - Foundation Realty'; };
  }, [article]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf9f7' }}>
        <div style={{ textAlign: 'center', color: '#6b7a8d' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏡</div>
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf9f7', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ fontSize: '3rem' }}>🌊</div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#1a2332' }}>Article not found</h2>
        <Link to="/blog" style={{ color: '#e84393', fontWeight: 600, textDecoration: 'none' }}>← Back to Blog</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#faf9f7', fontFamily: "'Inter', sans-serif" }}>

      {/* Nav */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(250,249,247,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid #e8e4df' : 'none',
        transition: 'all 0.4s ease',
        padding: '1rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ color: scrolled ? '#1a2332' : 'white', fontWeight: 700, fontSize: '0.95rem' }}>Holly Griewahn</span>
        </Link>
        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link to="/" style={{ color: scrolled ? '#4a5568' : 'rgba(255,255,255,0.85)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>Lakes</Link>
          <Link to="/blog" style={{ color: scrolled ? '#4a5568' : 'rgba(255,255,255,0.85)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>Blog</Link>
          <a href="tel:5174033413" style={{ background: '#e84393', color: 'white', padding: '0.45rem 1.1rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}>
            Call Holly
          </a>
        </nav>
      </header>

      {/* Hero */}
      <div style={{
        height: '60vh', minHeight: '420px',
        background: article.coverImage
          ? `linear-gradient(to bottom, rgba(26,35,50,0.3) 0%, rgba(26,35,50,0.7) 100%), url(${article.coverImage}) center/cover no-repeat`
          : 'linear-gradient(135deg, #1a2332 0%, #2c4a6e 100%)',
        display: 'flex', alignItems: 'flex-end',
        padding: '0 2rem 3rem',
      }}>
        <div style={{ maxWidth: '780px' }}>
          <Link to="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.82rem', marginBottom: '1.5rem', fontWeight: 600 }}>
            ← Back to Blog
          </Link>
          <div style={{ marginBottom: '0.75rem' }}>
            <span style={{ background: 'rgba(232,67,147,0.9)', color: 'white', padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              {article.category}
            </span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: '1rem' }}>
            {article.title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem' }}>By {article.author}</span>
            {article.publishedDate && (
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>{formatDate(article.publishedDate)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Article Body */}
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '3rem 2rem' }}>

        {/* Excerpt / Lead */}
        {article.excerpt && (
          <p style={{
            fontSize: '1.25rem', color: '#4a5568', lineHeight: 1.7, marginBottom: '2.5rem',
            fontStyle: 'italic', borderBottom: '1px solid #e8e4df', paddingBottom: '2rem',
            fontFamily: "'Playfair Display', serif",
          }}>
            {article.excerpt}
          </p>
        )}

        {/* Article Content */}
        <div>
          {(article.content || []).map((block, i) => (
            <ArticleBlock key={i} block={block} />
          ))}
        </div>

        {/* Editor's Note */}
        {article.editorsNote && (
          <div style={{
            background: '#f8f7f5', border: '1px solid #e8e4df', borderRadius: '14px',
            padding: '1.5rem 2rem', margin: '3rem 0',
          }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#6b7a8d', marginBottom: '0.5rem' }}>
              Holly's Note
            </p>
            <p style={{ fontSize: '1rem', color: '#1a2332', lineHeight: 1.7, fontStyle: 'italic', margin: 0 }}>
              {article.editorsNote}
            </p>
          </div>
        )}

        {/* Tags */}
        {article.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '2rem 0' }}>
            {article.tags.map(tag => (
              <span key={tag} style={{ padding: '0.3rem 0.75rem', background: '#f0eee9', borderRadius: '20px', fontSize: '0.78rem', color: '#6b7a8d', fontWeight: 500 }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* CTA Card */}
        <div style={{
          background: 'linear-gradient(135deg, #1a2332, #2c4a6e)',
          borderRadius: '16px', padding: '2.5rem', margin: '3rem 0', textAlign: 'center',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Questions about Irish Hills Lakes?
          </p>
          <h3 style={{ fontFamily: "'Playfair Display', serif", color: 'white', fontSize: '1.6rem', marginBottom: '1.5rem', lineHeight: 1.3 }}>
            Talk to Holly - 30+ years of local expertise
          </h3>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="tel:5174033413" style={{ padding: '0.75rem 1.75rem', background: '#e84393', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
              (517) 403-3413
            </a>
            <Link to="/" style={{ padding: '0.75rem 1.75rem', background: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.2)' }}>
              Browse Lakes →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
