import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { coverFor } from '../lib/cover';
import { soldStats, soldBadge, fmtPrice } from '../lib/listing-stats';

// Interactive map of Holly's sales. Pink pins are the current page's focus
// (a lake's sales), grey pins are the rest of the year. Hover a pin for the
// aerial, address, price and badge; click for a card with a link. Esri satellite
// tiles, free with attribution, no Google key involved.

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function pin(color, size) {
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(26,35,50,0.35)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    tooltipAnchor: [0, -size],
    popupAnchor: [0, -size],
  });
}

function card(p, withLink) {
  const s = soldStats(p);
  const cover = coverFor(p, { w: 320, h: 200 });
  const price = s ? fmtPrice(s.soldPrice) || p.price : p.price;
  const line = s ? soldBadge(p) : 'For sale';
  return `
    <div style="width:220px;font-family:'DM Sans',system-ui,sans-serif;color:#1a2332">
      ${cover ? `<div style="height:110px;border-radius:10px;background:url('${cover}') center/cover;margin-bottom:8px"></div>` : ''}
      <div style="font-weight:700;font-size:14px;line-height:1.3">${esc(p.title)}</div>
      <div style="font-size:12px;color:#6b7a8d">${esc((p.address || '').split(', ')[1] || '')}</div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:6px;gap:8px">
        <span style="font-family:'Playfair Display',serif;font-weight:800;font-size:17px">${esc(price)}</span>
        <span style="font-size:11px;font-weight:700;color:${s ? '#1a2332' : '#e84393'};background:${s ? '#f0eee9' : 'rgba(232,67,147,0.1)'};padding:3px 8px;border-radius:20px;white-space:nowrap">${esc(line)}</span>
      </div>
      ${withLink ? `<a href="/property/${p.slug}" style="display:block;margin-top:8px;text-align:center;background:#e84393;color:white;text-decoration:none;font-weight:700;font-size:12px;padding:7px;border-radius:8px">See this sale</a>` : ''}
    </div>`;
}

export default function SoldMap({ highlight = [], others = [], caption, height = 380 }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current, { scrollWheelZoom: false, attributionControl: true });
    // Esri topo by default (clean, lakes blue); satellite on
    // a toggle for when the shoreline is the point. All Esri, free, no key.
    const light = L.layerGroup([
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', { attribution: 'Map &copy; Esri, HERE, Garmin, OpenStreetMap contributors', maxZoom: 19 }),
    ]);
    const sat = L.layerGroup([
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics', maxZoom: 19 }),
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, opacity: 0.9 }),
    ]);
    light.addTo(map);
    let onSat = false;
    const toggle = L.control({ position: 'topright' });
    toggle.onAdd = () => {
      const btn = L.DomUtil.create('button');
      btn.textContent = 'Satellite';
      btn.style.cssText = 'margin-top:44px;background:white;border:1px solid #e8e4df;border-radius:20px;padding:6px 12px;font:600 12px "DM Sans",system-ui,sans-serif;color:#1a2332;cursor:pointer;box-shadow:0 2px 6px rgba(26,35,50,0.12)';
      L.DomEvent.disableClickPropagation(btn);
      btn.onclick = () => {
        onSat = !onSat;
        if (onSat) { map.removeLayer(light); sat.addTo(map); btn.textContent = 'Map'; }
        else { map.removeLayer(sat); light.addTo(map); btn.textContent = 'Satellite'; }
      };
      return btn;
    };
    toggle.addTo(map);

    const add = (p, color, size) => {
      if (!p.geo) return null;
      const m = L.marker([p.geo.lat, p.geo.lng], { icon: pin(color, size) }).addTo(map);
      // Card above the pin normally, below it when the pin sits near the top
      // edge, so the aerial thumbnail is never clipped. Registered before
      // bindTooltip so it runs before Leaflet opens the tooltip.
      m.on('mouseover', () => {
        const y = map.latLngToContainerPoint(m.getLatLng()).y;
        const t = m.getTooltip();
        if (t) { t.options.direction = y < 240 ? 'bottom' : 'top'; t.options.offset = y < 240 ? [0, size + 6] : [0, 0]; }
      });
      m.bindTooltip(card(p, false), { direction: 'top', opacity: 1, className: 'hg-tip' });
      m.bindPopup(card(p, true), { closeButton: true, className: 'hg-pop' });
      return m;
    };
    const greys = others.map((p) => add(p, '#c3cad6', 16)).filter(Boolean);
    const pinks = highlight.map((p) => add(p, '#e84393', 22)).filter(Boolean);

    const focus = pinks.length ? pinks : greys;
    if (focus.length) {
      const bounds = L.featureGroup(focus).getBounds();
      map.fitBounds(bounds.pad(0.35), { maxZoom: pinks.length === 1 ? 14 : 13 });
    } else {
      map.setView([41.98, -84.28], 10);
    }
    // Scroll zoom only once the visitor has clicked into the map, so the page
    // does not hijack the wheel while they read.
    map.on('click', () => map.scrollWheelZoom.enable());
    map.on('mouseout', () => map.scrollWheelZoom.disable());

    return () => map.remove();
  }, [highlight, others]);

  return (
    <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e8e4df', marginBottom: '1.25rem', background: '#f5f2ec' }}>
      <style>{`
        .hg-tip { background: white; border: 1px solid #e8e4df; border-radius: 12px; box-shadow: 0 8px 24px rgba(26,35,50,0.15); padding: 10px; }
        .hg-tip::before { border-top-color: white; border-bottom-color: white; }
        .hg-pop .leaflet-popup-content-wrapper { border-radius: 12px; padding: 4px; }
        .hg-pop .leaflet-popup-content { margin: 10px; }
        .leaflet-container { font-family: inherit; }
      `}</style>
      <div ref={ref} style={{ height, width: '100%' }} />
      {caption && (
        <div style={{ position: 'absolute', left: '0.9rem', top: '0.8rem', zIndex: 500, background: 'rgba(26,35,50,0.9)', color: 'white', fontSize: '0.75rem', fontWeight: 700, padding: '0.35rem 0.7rem', borderRadius: '20px', pointerEvents: 'none' }}>{caption}</div>
      )}
      <div style={{ position: 'absolute', right: '0.9rem', top: '0.8rem', zIndex: 500, background: 'rgba(255,255,255,0.92)', color: '#6b7a8d', fontSize: '0.68rem', fontWeight: 600, padding: '0.3rem 0.6rem', borderRadius: '20px', pointerEvents: 'none' }}>Hover a pin · click for details</div>
    </div>
  );
}
