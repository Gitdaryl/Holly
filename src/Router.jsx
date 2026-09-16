import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
        <Route path="/sold" element={<SoldPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/plan" element={<PlanPage />} />
        <Route path="/plan/:lake/:address" element={<PlanPage />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
}
