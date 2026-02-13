# Irish Hills Lakes — Holly Griewahn / Foundation Realty

Waterfront real estate site covering 58 lakes in Michigan's Irish Hills region.

## Quick Start

```bash
npm install
npm run dev
```

## Deploy to Vercel

1. Push this repo to GitHub
2. Connect to Vercel → Import Project
3. Framework: Vite → Deploy

Or use Vercel CLI:
```bash
npx vercel
```

## GHL Integration Points

- **AI Chat Widget**: Bottom-right FAB → connect to GHL AI chatbot
- **Booking Calendar**: All "Schedule" CTAs → embed GHL calendar widget
- **Property Listings**: Replace sample data with GHL CRM API feed
- **Lead Capture**: Form submissions route to GHL pipeline

## Structure

- `src/App.jsx` — Full single-page app (lake directory + individual lake pages)
- `public/images/` — Holly's cutout photo + Foundation Realty logo
- Amenity data for 3 proof-of-concept lakes (Devils Lake, Clark Lake, Vineyard Lake)

## To Add

- [ ] Remaining 48 lake amenity data
- [ ] Real property photos
- [ ] GHL calendar embed code
- [ ] GHL AI chatbot widget code
- [ ] Google Maps API key for interactive maps
- [ ] Lake aerial/drone photos for hero backgrounds
- [ ] Holly's YouTube/Facebook embed URLs
