import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import BlogPage from './pages/BlogPage.jsx';
import ArticlePage from './pages/ArticlePage.jsx';
import ListingsPage from './pages/ListingsPage.jsx';
import PropertyPage from './pages/PropertyPage.jsx';
import LakePage from './pages/LakePage.jsx';
import CMAPage from './pages/CMAPage.jsx';

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/blog/:slug" element={<ArticlePage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/listings" element={<ListingsPage />} />
        <Route path="/property/:id" element={<PropertyPage />} />
        <Route path="/lakes/:slug" element={<LakePage />} />
        <Route path="/cma" element={<CMAPage />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
}
