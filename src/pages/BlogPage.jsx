import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import HeroVideo from '../components/HeroVideo';
import SiteNav from '../components/SiteNav';

const CATEGORIES = ['All', 'Lake Living', 'Real Estate Tips', 'Area Guide', 'Seasonal', 'Buyer Education', 'Community'];

function formatDate(dateStr) {
  if (!dateStr) return '';
  // Date-only strings parse as UTC midnight, which is the previous evening in Michigan.
  const d = new Date(dateStr.length === 10 ? `${dateStr}T12:00:00` : dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function ArticleCard({ article, featured = false }) {
  return (
    <Link
      to={`/blog/${article.slug}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <article
        className="article-card"
        style={{
          background: 'white',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid #e8e4df',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Cover Image */}
        <div
          style={{
            height: featured ? '320px' : '220px',
            background: article.coverImage
              ? `url(${article.coverImage}) center/cover no-repeat`
              : 'linear-gradient(135deg, #1a2332, #2c4a6e)',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          {/* Category pill */}
          <div style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
            <span style={{
              background: 'rgba(232,67,147,0.9)',
              color: 'white',
              padding: '0.3rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}>
              {article.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: featured ? '1.6rem' : '1.2rem',
            fontWeight: 700,
            color: '#1a2332',
            marginBottom: '0.75rem',
            lineHeight: 1.35,
          }}>
            {article.title}
          </h2>

          <p style={{
            fontSize: '0.92rem',
            color: '#4a5568',
            lineHeight: 1.7,
            marginBottom: '1rem',
            flex: 1,
          }}>
            {article.excerpt}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
            <span style={{ fontSize: '0.8rem', color: '#6b7a8d' }}>
              {formatDate(article.publishedDate)}
            </span>
            <span style={{
              fontSize: '0.82rem',
              color: '#e84393',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}>
              Read more →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function BlogPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    fetch('/api/holly-articles')
      .then(r => r.json())
      .then(data => { setArticles(data.articles || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = activeCategory === 'All'
    ? articles
    : articles.filter(a => a.category === activeCategory);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div style={{ minHeight: '100vh', background: '#faf9f7', fontFamily: "'Inter', sans-serif" }}>

      {/* Nav */}
      <SiteNav transparent active="blog" />

      {/* Hero */}
      <div style={{
        height: '50vh', minHeight: '380px',
        background: 'linear-gradient(135deg, #1a2332 0%, #2c4a6e 50%, #1a3a4a 100%)',
        display: 'flex', alignItems: 'flex-end',
        padding: '0 2rem 3rem',
        position: 'relative', overflow: 'hidden',
      }}>
        <HeroVideo video="/regions/blog/hero.mp4" poster="/regions/blog/poster.webp" gradient="linear-gradient(135deg, #1a2332 0%, #2c4a6e 50%, #1a3a4a 100%)" dim={0.35} />
        <div style={{ maxWidth: '800px', position: 'relative', zIndex: 1 }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Irish Hills Lakes
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: '1rem' }}>
            Lake Life, Local Knowledge
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.75)', fontWeight: 300, maxWidth: '560px' }}>
            Tips, guides, and stories about buying, selling, and living on the water in Michigan's Irish Hills.
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div style={{ background: 'white', borderBottom: '1px solid #e8e4df', position: 'sticky', top: '65px', zIndex: 50 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingTop: '1rem', paddingBottom: '1rem' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '20px',
                border: activeCategory === cat ? '2px solid #1a2332' : '1px solid #e8e4df',
                background: activeCategory === cat ? '#1a2332' : 'white',
                color: activeCategory === cat ? 'white' : '#4a5568',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 2rem' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7a8d' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏡</div>
            <p>Loading articles…</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7a8d' }}>
            <p style={{ fontSize: '1.1rem' }}>No articles yet in this category.</p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Check back soon - Holly's publishing regularly.</p>
          </div>
        )}

        {!loading && featured && (
          <div style={{ marginBottom: '3rem' }}>
            <ArticleCard article={featured} featured={true} />
          </div>
        )}

        {!loading && rest.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}>
            {rest.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </main>

      {/* Footer CTA */}
      <div style={{ background: '#1a2332', padding: '4rem 2rem', textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1rem' }}>Ready to find your lake?</p>
        <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'white', fontSize: '2rem', marginBottom: '1.5rem' }}>
          Talk to Holly
        </h2>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="tel:5174033413" style={{ padding: '0.8rem 2rem', background: '#e84393', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
            (517) 403-3413
          </a>
          <Link to="/" style={{ padding: '0.8rem 2rem', background: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.2)' }}>
            Browse All 58 Lakes →
          </Link>
        </div>
      </div>

      <style>{`
        .article-card:hover { transform: translateY(-6px); box-shadow: 0 20px 50px rgba(26,35,50,0.12); }
      `}</style>
    </div>
  );
}
