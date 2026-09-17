import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { pageview, track } from './lib/track.js';
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
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
}
