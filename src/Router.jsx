import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { pageview, track } from './lib/track.js';
import Tour from './components/Tour.jsx';
import ChatWidget from './components/ChatWidget.jsx';
import BrokerNotice from './components/BrokerNotice.jsx';
import MobileActionBar from './components/MobileActionBar.jsx';
import App from './App.jsx';
import BlogPage from './pages/BlogPage.jsx';
import ArticlePage from './pages/ArticlePage.jsx';
import ListingsPage from './pages/ListingsPage.jsx';
import PropertyPage from './pages/PropertyPage.jsx';
import LakePage from './pages/LakePage.jsx';
import CMAPage from './pages/CMAPage.jsx';
import SoldPage from './pages/SoldPage.jsx';
import PlanPage from './pages/PlanPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import MarketPage from './pages/MarketPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import SellPage from './pages/SellPage.jsx';
import EventsPage from './pages/EventsPage.jsx';
import HollyYetiPage from './pages/HollyYetiPage.jsx';

// While Holly is signed in, every public page keeps a way back to her desk.
// Without it, one tap into her own site from the desk is a dead end on a phone.
function DeskChip() {
  const { pathname } = useLocation();
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    try { setSignedIn(Boolean(localStorage.getItem('hg-admin-session'))); } catch { /* ignore */ }
  }, [pathname]);
  if (!signedIn || /^\/(admin|plan)(\/|$)/.test(pathname)) return null;
  return (
    <>
      <style>{`@media (max-width: 600px) { .hg-desk-chip { bottom: 5.25rem !important; } }`}</style>
      <a href="/admin" className="hg-desk-chip" style={{
        position: 'fixed', left: '1.25rem', bottom: '1.5rem', zIndex: 998,
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        background: '#1a554e', color: 'white', textDecoration: 'none',
        padding: '0.55rem 0.95rem', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 700,
        fontFamily: "'Inter', system-ui, sans-serif", boxShadow: '0 6px 20px rgba(10,38,35,0.28)',
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Your desk
      </a>
    </>
  );
}

// Page views on every route change, plus taps on phone, text and review links.
function Tracker() {
  const { pathname } = useLocation();
  useEffect(() => { pageview(pathname); }, [pathname]);
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      const h = a.getAttribute('href') || '';
      if (h.startsWith('tel:')) track('call');
      else if (h.startsWith('sms:')) track('text');
      else if (h.includes('writereview')) track('review');
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
  return null;
}

// /regions/<slug> exists as a prerendered, crawlable page; humans get the
// interactive region view the app already has.
function RegionRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/?region=${slug}`} replace />;
}

export default function Router() {
  return (
    <BrowserRouter>
      <Tracker />
      <Tour />
      <DeskChip />
      <MobileActionBar />
      <ChatWidget />
      <Routes>
        <Route path="/blog/:slug" element={<ArticlePage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/listings" element={<ListingsPage />} />
        <Route path="/property/:id" element={<PropertyPage />} />
        <Route path="/lakes/:slug" element={<LakePage />} />
        <Route path="/cma" element={<CMAPage />} />
        <Route path="/sold" element={<SoldPage />} />
        <Route path="/regions/:slug" element={<RegionRedirect />} />
        <Route path="/market" element={<MarketPage />} />
        <Route path="/market/:slug" element={<MarketPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/plan" element={<PlanPage />} />
        <Route path="/plan/:lake/:address" element={<PlanPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/sell" element={<SellPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/holly-yeti" element={<HollyYetiPage />} />
        <Route path="/*" element={<App />} />
      </Routes>
      <BrokerNotice />
    </BrowserRouter>
  );
}
