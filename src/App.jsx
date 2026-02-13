import React, { useState, useEffect, useRef } from 'react';

// ═══ AMENITY & LOCATION DATA (Proof of Concept: 3 Lakes) ═══

const amenityData = {
  'devils-lake': {
    coordinates: { lat: 42.0678, lng: -84.2553 },
    distances: [
      { to: 'Ann Arbor', miles: 38, time: '45 min' },
      { to: 'Detroit', miles: 82, time: '1 hr 30 min' },
      { to: 'Jackson', miles: 22, time: '25 min' },
      { to: 'Lansing', miles: 52, time: '55 min' },
      { to: 'Toledo, OH', miles: 58, time: '1 hr 5 min' },
    ],
    schools: [
      { name: 'Addison Community Schools', type: 'K-12 District', distance: '3 mi', rating: '7/10' },
      { name: 'Onsted Community Schools', type: 'K-12 District', distance: '6 mi', rating: '6/10' },
      { name: 'St. Joseph Academy', type: 'Private K-8', distance: '8 mi', rating: '8/10' },
    ],
    dining: [
      { name: 'Devils Lake Yacht Club', type: 'Lakeside Dining', distance: 'On lake' },
      { name: 'Camel Bar & Grill', type: 'Bar & Grill', distance: '2 mi' },
      { name: 'The Iron Skillet', type: 'Family Restaurant', distance: '5 mi' },
      { name: "Hap's Pub", type: 'Pub & Pizza', distance: '4 mi' },
      { name: "McDonald's / Subway", type: 'Fast Food', distance: '6 mi' },
    ],
    shopping: [
      { name: 'Addison Village Shops', type: 'General', distance: '3 mi' },
      { name: 'Meijer (Adrian)', type: 'Grocery & General', distance: '14 mi' },
      { name: 'Walmart Supercenter', type: 'Grocery & General', distance: '14 mi' },
      { name: 'Downtown Adrian', type: 'Shops & Boutiques', distance: '14 mi' },
    ],
    medical: [
      { name: 'ProMedica Bixby Hospital', type: 'Hospital', distance: '14 mi' },
      { name: 'Henry Ford Health - Adrian', type: 'Urgent Care', distance: '15 mi' },
      { name: 'Addison Family Medicine', type: 'Primary Care', distance: '3 mi' },
    ],
    utilities: {
      water: 'Private well (most properties)', sewer: 'Septic system', electric: 'Consumers Energy',
      gas: 'Propane (no natural gas at lakefront)', internet: 'Comcast Xfinity, Frontier DSL, Starlink',
      garbage: 'Republic Services (curbside)', township: 'Rollin Township',
    },
    lakeRules: {
      hpRestrictions: 'None - all sports lake', fishingLicense: 'Michigan DNR license required',
      association: 'Devils Lake Property Owners Assoc', annualDues: '~$75/year',
      publicAccess: 'DNR public launch on south shore', wakeHours: '10 AM - sunset',
    },
    recreation: [
      { name: 'Devils Lake Yacht Club', type: 'Sailing / Social', distance: 'On lake' },
      { name: 'Hidden Lake Gardens (MSU)', type: 'Botanical Garden', distance: '8 mi' },
      { name: 'Irish Hills Fun Center', type: 'Family Entertainment', distance: '10 mi' },
      { name: 'Cambridge Junction Historic SP', type: 'State Park', distance: '7 mi' },
    ]
  },
  'clark-lake': {
    coordinates: { lat: 42.1175, lng: -84.3422 },
    distances: [
      { to: 'Ann Arbor', miles: 42, time: '50 min' },
      { to: 'Detroit', miles: 86, time: '1 hr 35 min' },
      { to: 'Jackson', miles: 15, time: '20 min' },
      { to: 'Lansing', miles: 48, time: '50 min' },
      { to: 'Toledo, OH', miles: 65, time: '1 hr 10 min' },
    ],
    schools: [
      { name: 'Columbia School District', type: 'K-12 District', distance: '2 mi', rating: '6/10' },
      { name: 'Grass Lake Community Schools', type: 'K-12 District', distance: '8 mi', rating: '7/10' },
      { name: 'Jackson Christian School', type: 'Private K-12', distance: '15 mi', rating: '8/10' },
    ],
    dining: [
      { name: 'The Venue at Clark Lake', type: 'Upscale Lakeside', distance: 'On lake' },
      { name: "Bucky's Lakeside Grill", type: 'Bar & Grill', distance: 'On lake' },
      { name: 'Clark Lake Spirits', type: 'Craft Bar', distance: '0.5 mi' },
      { name: "Jimmy's on the Lake", type: 'Casual Dining', distance: 'On lake' },
      { name: 'Westport Tap & Table', type: 'Gastropub', distance: '1 mi' },
    ],
    shopping: [
      { name: 'Brooklyn Village', type: 'Small Town Shops', distance: '5 mi' },
      { name: 'Meijer (Jackson)', type: 'Grocery & General', distance: '15 mi' },
      { name: 'Jackson Crossing Mall', type: 'Shopping Mall', distance: '18 mi' },
    ],
    medical: [
      { name: 'Henry Ford Jackson Hospital', type: 'Hospital', distance: '18 mi' },
      { name: 'IHA Brooklyn Family Medicine', type: 'Primary Care', distance: '5 mi' },
      { name: 'Concentra Urgent Care', type: 'Urgent Care', distance: '16 mi' },
    ],
    utilities: {
      water: 'Mix of township water & private well', sewer: 'Mix of township sewer & septic',
      electric: 'Consumers Energy', gas: 'DTE Energy natural gas (select areas)',
      internet: 'Comcast Xfinity, Frontier, Starlink', garbage: 'GFL Environmental (curbside)',
      township: 'Columbia Township',
    },
    lakeRules: {
      hpRestrictions: 'None - all sports lake', fishingLicense: 'Michigan DNR license required',
      association: 'Clark Lake Spirit Trail & multiple HOAs', annualDues: 'Varies $100-$400/year',
      publicAccess: 'Public launch at Eagle Point', wakeHours: '10 AM - sunset, slow no-wake in channels',
    },
    recreation: [
      { name: 'Clark Lake Golf Course', type: 'Golf', distance: '1 mi' },
      { name: 'Clark Lake Spirit Trail', type: 'Walking/Biking', distance: 'On lake' },
      { name: 'Michigan Intl Speedway', type: 'Racing / Events', distance: '8 mi' },
      { name: 'Watkins Lake State Park', type: 'Hiking / Nature', distance: '12 mi' },
    ]
  },
  'vineyard-lake': {
    coordinates: { lat: 42.0456, lng: -84.2150 },
    distances: [
      { to: 'Ann Arbor', miles: 35, time: '40 min' },
      { to: 'Detroit', miles: 78, time: '1 hr 25 min' },
      { to: 'Jackson', miles: 28, time: '30 min' },
      { to: 'Adrian', miles: 18, time: '22 min' },
      { to: 'Toledo, OH', miles: 50, time: '55 min' },
    ],
    schools: [
      { name: 'Sand Creek Community Schools', type: 'K-12 District', distance: '4 mi', rating: '6/10' },
      { name: 'Britton Deerfield Schools', type: 'K-12 District', distance: '7 mi', rating: '6/10' },
      { name: 'Adrian Public Schools', type: 'K-12 District', distance: '18 mi', rating: '5/10' },
    ],
    dining: [
      { name: 'The Vineyard Cafe', type: 'Casual Lakeside', distance: '1 mi' },
      { name: 'Blossom Heath Inn', type: 'American Bistro', distance: '6 mi' },
      { name: 'Pizza Hut / Subway', type: 'Fast Food', distance: '8 mi' },
    ],
    shopping: [
      { name: 'Sand Creek General Store', type: 'Convenience', distance: '4 mi' },
      { name: 'Meijer (Adrian)', type: 'Grocery & General', distance: '18 mi' },
      { name: 'Walmart (Adrian)', type: 'General', distance: '18 mi' },
    ],
    medical: [
      { name: 'ProMedica Bixby Hospital', type: 'Hospital', distance: '18 mi' },
      { name: 'Sand Creek Family Practice', type: 'Primary Care', distance: '4 mi' },
    ],
    utilities: {
      water: 'Private well', sewer: 'Septic system', electric: 'Consumers Energy',
      gas: 'Propane only', internet: 'Frontier DSL, Starlink recommended',
      garbage: 'Republic Services', township: 'Madison Township',
    },
    lakeRules: {
      hpRestrictions: 'None - all sports lake', fishingLicense: 'Michigan DNR license required',
      association: 'Vineyard Lake Association', annualDues: '~$50/year (voluntary)',
      publicAccess: 'Limited - private launches preferred', wakeHours: 'Sunrise - sunset',
    },
    recreation: [
      { name: 'Lake Hudson State Rec Area', type: 'Hiking / Camping', distance: '12 mi' },
      { name: 'Hidden Lake Gardens', type: 'Botanical Garden', distance: '10 mi' },
      { name: 'Adrian College events', type: 'Culture / Sports', distance: '18 mi' },
    ]
  }
};
// ─── LAKE DATA ───
const lakesData = {
  'devils-lake': {
    name: 'Devils Lake',
    slug: 'devils-lake',
    tagline: "Michigan's Premier Fishing Destination",
    description: "Devils Lake is Michigan's 4th deepest lake at 96 feet deep, spanning 630 pristine acres. Known for exceptional bass, bluegill, and perch fishing, this lake offers no horsepower restrictions and is home to the historic Devils Lake Yacht Club.",
    features: ['96 feet deep', '630 acres', 'World-class fishing', 'No HP restrictions', 'Active yacht club'],
    stats: { depth: '96 ft', acres: '630', avgPrice: '$475K', communities: '3' },
    seoTitle: 'Devils Lake Real Estate | Waterfront Homes | Holly Griewahn',
    highlights: ['Bass & bluegill fishing', 'Water skiing friendly', 'Year-round community', '90 min from Detroit'],
    gradient: 'linear-gradient(135deg, #1a3c4d 0%, #2d5016 50%, #1a4d6d 100%)'
  },
  'vineyard-lake': {
    name: 'Vineyard Lake',
    slug: 'vineyard-lake',
    tagline: 'Serene Waters, Endless Memories',
    description: 'Vineyard Lake offers 150 acres of tranquil water, perfect for families seeking a peaceful lakeside retreat. With sandy beaches and shallow waters ideal for children, this lake has been a favorite summer destination for generations.',
    features: ['150 acres', 'Sandy beaches', 'Family-friendly', 'Excellent swimming', 'Private feel'],
    stats: { depth: '45 ft', acres: '150', avgPrice: '$325K', communities: '2' },
    seoTitle: 'Vineyard Lake Properties | Lake Homes for Sale | Holly Griewahn',
    highlights: ['Perfect for families', 'Sandy bottom', 'Quiet atmosphere', 'Affordable pricing'],
    gradient: 'linear-gradient(135deg, #5a1a3e 0%, #4a7ba7 100%)'
  },
  'clark-lake': {
    name: 'Clark Lake',
    slug: 'clark-lake',
    tagline: 'The Crown Jewel of Irish Hills',
    description: 'Clark Lake is the largest lake in the Irish Hills region at 800+ acres, offering diverse recreational opportunities from sailing to jet skiing. With multiple marinas, restaurants, and a vibrant summer community, Clark Lake combines natural beauty with modern conveniences.',
    features: ['800+ acres', 'Multiple marinas', 'Lakeside dining', 'Sailing & skiing', 'Golf courses nearby'],
    stats: { depth: '85 ft', acres: '800', avgPrice: '$625K', communities: '5' },
    seoTitle: 'Clark Lake Real Estate | Luxury Waterfront Homes | Holly Griewahn',
    highlights: ['Largest in region', 'Active nightlife', 'Premium amenities', 'Investment opportunity'],
    gradient: 'linear-gradient(135deg, #1c2833 0%, #e84393 100%)'
  },
  'sand-lake': {
    name: 'Sand Lake',
    slug: 'sand-lake',
    tagline: 'Pure Michigan Simplicity',
    description: 'Sand Lake is a hidden gem offering 95 acres of pristine water with a sandy bottom perfect for swimming. This quiet, all-sports lake provides the perfect escape while remaining accessible to modern conveniences.',
    features: ['95 acres', 'Sandy bottom', 'All-sports', 'Low traffic', 'Natural shoreline'],
    stats: { depth: '38 ft', acres: '95', avgPrice: '$285K', communities: '1' },
    seoTitle: 'Sand Lake Michigan | Affordable Lake Homes | Holly Griewahn',
    highlights: ['Budget-friendly', 'Great swimming', 'Low boat traffic', 'Private setting'],
    gradient: 'linear-gradient(135deg, #b8956a 0%, #4a7ba7 100%)'
  },
  'round-lake': {
    name: 'Round Lake',
    slug: 'round-lake',
    tagline: 'Perfect Circle of Paradise',
    description: 'True to its name, Round Lake offers 180 acres of nearly circular perfection. Popular with kayakers and paddleboarders, this lake features calm waters and stunning sunset views from every shore.',
    features: ['180 acres', 'Circular shape', 'Kayaking paradise', 'Calm waters', 'Sunset views'],
    stats: { depth: '52 ft', acres: '180', avgPrice: '$395K', communities: '2' },
    seoTitle: 'Round Lake Properties | Waterfront Real Estate | Holly Griewahn',
    highlights: ['Paddle sports', 'Scenic views', 'Moderate pricing', 'Peaceful setting'],
    gradient: 'linear-gradient(135deg, #3a6d8c 0%, #2d5016 100%)'
  },
  'wampler-lake': {
    name: 'Wampler Lake',
    slug: 'wampler-lake',
    tagline: 'Where Tradition Meets Tranquility',
    description: 'Wampler Lake spans 280 acres and has been a cherished vacation spot since the early 1900s. With historic cottages alongside modern homes, this lake offers a unique blend of nostalgia and contemporary lake living.',
    features: ['280 acres', 'Historic community', 'All-sports lake', 'Public access', 'Family traditions'],
    stats: { depth: '67 ft', acres: '280', avgPrice: '$425K', communities: '3' },
    seoTitle: 'Wampler Lake Homes | Historic Lake Community | Holly Griewahn',
    highlights: ['Rich history', 'Multi-generational', 'Active community', 'Public beach access'],
    gradient: 'linear-gradient(135deg, #8c3a5a 0%, #1a4d6d 100%)'
  },
  'lake-columbia': {
    name: 'Lake Columbia',
    slug: 'lake-columbia',
    tagline: 'Exclusive Island Living',
    description: 'Lake Columbia is unique in the Irish Hills, featuring a private island accessible only to residents. This 500-acre lake offers an exclusive community feel with exceptional fishing and boating opportunities.',
    features: ['500 acres', 'Private island', 'Exclusive access', 'Trophy fishing', 'Gated community'],
    stats: { depth: '78 ft', acres: '500', avgPrice: '$750K', communities: '2' },
    seoTitle: 'Lake Columbia Real Estate | Luxury Island Living | Holly Griewahn',
    highlights: ['Private island', 'Luxury market', 'Trophy bass', 'Gated security'],
    gradient: 'linear-gradient(135deg, #1c2833 0%, #5a1a3e 100%)'
  },
  'pleasant-lake': {
    name: 'Pleasant Lake',
    slug: 'pleasant-lake',
    tagline: 'Simply Pleasant by Name and Nature',
    description: 'Pleasant Lake lives up to its name with 410 acres of friendly waters and a welcoming community. Known for excellent crappie fishing and family-oriented atmosphere, this lake is perfect for creating lasting memories.',
    features: ['410 acres', 'Crappie fishing', 'Family-focused', 'Community events', 'Multiple parks'],
    stats: { depth: '56 ft', acres: '410', avgPrice: '$365K', communities: '4' },
    seoTitle: 'Pleasant Lake Michigan | Family Lake Homes | Holly Griewahn',
    highlights: ['Great for kids', 'Community events', 'Affordable', 'Public parks'],
    gradient: 'linear-gradient(135deg, #4a7ba7 0%, #e84393 100%)'
  },
  'mud-lake': {
    name: 'Mud Lake',
    slug: 'mud-lake',
    tagline: "Nature's Best Kept Secret",
    description: "Don't let the name fool you—Mud Lake is a 120-acre nature lover's paradise with crystal-clear water and abundant wildlife. Perfect for those seeking privacy and a connection with nature.",
    features: ['120 acres', 'Wildlife haven', 'Crystal clear', 'Private settings', 'Nature preserve adjacent'],
    stats: { depth: '42 ft', acres: '120', avgPrice: '$265K', communities: '1' },
    seoTitle: 'Mud Lake Properties | Nature Retreat Homes | Holly Griewahn',
    highlights: ['Wildlife watching', 'Privacy', 'Value pricing', 'Natural beauty'],
    gradient: 'linear-gradient(135deg, #2d5016 0%, #3a6d8c 100%)'
  },
  'norvell-lake': {
    name: 'Norvell Lake',
    slug: 'norvell-lake',
    tagline: 'Adventure Awaits',
    description: 'Norvell Lake, at 225 acres, is surrounded by state recreation areas offering hiking, hunting, and endless outdoor activities. This lake attracts active families and outdoor enthusiasts year-round.',
    features: ['225 acres', 'State recreation area', 'Hiking trails', 'Hunting access', 'Year-round activities'],
    stats: { depth: '48 ft', acres: '225', avgPrice: '$335K', communities: '2' },
    seoTitle: 'Norvell Lake Homes | Outdoor Recreation Properties | Holly Griewahn',
    highlights: ['Outdoor recreation', 'State park access', 'Hunting/fishing', 'Active lifestyle'],
    gradient: 'linear-gradient(135deg, #1a4d6d 0%, #b8956a 100%)'
  }
};

// ─── SAMPLE PROPERTIES ───
const propertiesData = [
  { id: 1, lake: 'devils-lake', price: '$599,900', address: '15300 Rome Road', beds: 3, baths: 2, sqft: '1,931', status: 'Active', type: 'lakefront' },
  { id: 2, lake: 'devils-lake', price: '$315,000', address: '6700 Hallenbeck Highway', beds: 2, baths: 1, sqft: '1,200', status: 'Contract', type: 'waterfront' },
  { id: 3, lake: 'devils-lake', price: '$449,000', address: '201 Lakeview Drive', beds: 4, baths: 3, sqft: '2,400', status: 'Active', type: 'lakefront' },
  { id: 4, lake: 'vineyard-lake', price: '$275,000', address: '1456 Vineyard Shore', beds: 2, baths: 2, sqft: '1,400', status: 'Active', type: 'lakefront' },
  { id: 5, lake: 'vineyard-lake', price: '$325,000', address: '892 Lake View Court', beds: 3, baths: 2, sqft: '1,650', status: 'Active', type: 'waterfront' },
  { id: 6, lake: 'clark-lake', price: '$875,000', address: '4521 North Shore Drive', beds: 5, baths: 4, sqft: '3,800', status: 'Active', type: 'lakefront' },
  { id: 7, lake: 'clark-lake', price: '$625,000', address: '789 Marina Boulevard', beds: 4, baths: 3, sqft: '2,900', status: 'Pending', type: 'lakefront' },
  { id: 8, lake: 'clark-lake', price: '$525,000', address: '1234 Sunset Point', beds: 3, baths: 2, sqft: '2,200', status: 'Active', type: 'waterfront' },
  { id: 9, lake: 'sand-lake', price: '$245,000', address: '567 Sandy Beach Road', beds: 2, baths: 1, sqft: '1,100', status: 'Active', type: 'lakefront' },
  { id: 10, lake: 'sand-lake', price: '$295,000', address: '890 Lakeside Lane', beds: 3, baths: 2, sqft: '1,500', status: 'Active', type: 'waterfront' },
  { id: 11, lake: 'round-lake', price: '$385,000', address: '234 Circle Drive', beds: 3, baths: 2, sqft: '1,800', status: 'Active', type: 'lakefront' },
  { id: 12, lake: 'round-lake', price: '$425,000', address: '678 Round Shore', beds: 3, baths: 3, sqft: '2,100', status: 'Active', type: 'lakefront' },
];

// ─── SOCIAL CONTENT PLACEHOLDERS ───
const socialContent = [
  { type: 'youtube', title: '5 Things to Know Before Buying Lakefront', description: 'Holly breaks down the must-knows for first-time lake buyers in the Irish Hills region.', platform: 'YouTube' },
  { type: 'facebook', title: 'Just Listed: Stunning Clark Lake Home', description: 'Tour this gorgeous 4-bed lakefront with private dock and panoramic views.', platform: 'Facebook' },
  { type: 'youtube', title: 'Irish Hills Market Update — Winter 2026', description: "What's happening with lake home prices? Holly shares the latest data and trends.", platform: 'YouTube' },
  { type: 'facebook', title: 'Community Spotlight: Devils Lake Yacht Club', description: "A look inside one of Michigan's most storied lake communities.", platform: 'Facebook' },
];

// ─── TESTIMONIALS ───
const testimonials = [
  { quote: "Holly found us the perfect lakefront home on Devils Lake. Her knowledge of every lake in the area is unmatched.", name: "Michael & Sarah T.", lake: "Devils Lake" },
  { quote: "We looked at 12 different lakes before Holly helped us realize Clark Lake was the one. Best decision we ever made.", name: "The Andersons", lake: "Clark Lake" },
  { quote: "As out-of-state buyers, Holly was our eyes, ears, and trusted guide through the entire process.", name: "Jennifer R.", lake: "Wampler Lake" },
];

// ─── SVG ICONS ───
const Icons = {
  water: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/><path d="M2 18c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/></svg>,
  home: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  phone: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>,
  calendar: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  chat: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  play: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  arrow: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  back: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  mapPin: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  bed: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 012 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>,
  bath: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16a1 1 0 011 1v3a4 4 0 01-4 4H7a4 4 0 01-4-4v-3a1 1 0 011-1z"/><path d="M6 12V5a2 2 0 012-2h3"/></svg>,
  ruler: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.3 15.3a2.4 2.4 0 010 3.4l-2.6 2.6a2.4 2.4 0 01-3.4 0L2.7 8.7a2.4 2.4 0 010-3.4l2.6-2.6a2.4 2.4 0 013.4 0z"/></svg>,
  check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  quote: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" opacity="0.15"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zm12 0c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>,
  facebook: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  youtube: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
  school: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1 2 3 6 3s6-2 6-3v-5"/></svg>,
  utensils: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>,
  shoppingBag: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  medical: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  wrench: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
  anchor: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0020 0h-3"/></svg>,
  car: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>,
  tree: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14l3-3.5L16.5 7 20 3H4l3.5 4L4 10.5 7 14l-3 3h16l-3-3z"/><line x1="12" y1="22" x2="12" y2="13"/></svg>,
  map: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
};

// ═══ AMENITY SECTION COMPONENT ═══
function AmenitySection({ title, icon, items }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
        {icon}
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a2332' }}>{title}</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {items.map((item, i) => (
          <div 
            key={i} 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              padding: '0.75rem 1rem',
              background: '#faf9f7',
              borderRadius: '8px',
              border: '1px solid #e8e4df'
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1a2332' }}>
                {item.name}
              </div>
              {item.type && (
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  {item.type}
                </div>
              )}
              {item.rating && (
                <div style={{ fontSize: '0.75rem', color: '#e84393', marginTop: '0.2rem', fontWeight: 500 }}>
                  ★ {item.rating}
                </div>
              )}
            </div>
            <div style={{ 
              fontSize: '0.8rem', 
              color: '#6b7a8d',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              marginLeft: '1rem'
            }}>
              {item.distance}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══ LAKE MAP COMPONENT ═══
function LakeMap({ lake, amenities }) {
  return (
    <div style={{
      width: '100%',
      height: '400px',
      background: 'linear-gradient(135deg, #e8e4df 0%, #f5f3f0 100%)',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #e8e4df',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        opacity: 0.3
      }} />
      <div style={{ textAlign: 'center', zIndex: 1, padding: '2rem' }}>
        <div style={{
          width: '60px',
          height: '60px',
          background: 'white',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          boxShadow: '0 4px 12px rgba(26,35,50,0.1)',
          border: '2px solid #e84393'
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e84393" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a2332', marginBottom: '0.5rem' }}>
          {lake.name}
        </h4>
        <p style={{ fontSize: '0.85rem', color: '#6b7a8d', marginBottom: '1rem' }}>
          {amenities.coordinates.lat.toFixed(4)}°N, {Math.abs(amenities.coordinates.lng).toFixed(4)}°W
        </p>
        <div style={{
          display: 'inline-block',
          background: 'rgba(232,67,147,0.1)',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: '#6b7a8d'
        }}>
          📍 Interactive map coming soon
        </div>
      </div>
    </div>
  );
}

```jsx
// ═══ AMENITY SECTION COMPONENT ═══
function AmenitySection({ title, icon, items }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
        {icon}
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a2332' }}>{title}</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {items.map((item, i) => (
          <div 
            key={i} 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              padding: '0.75rem 1rem',
              background: '#faf9f7',
              borderRadius: '8px',
              border: '1px solid #e8e4df'
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1a2332' }}>
                {item.name}
              </div>
              {item.type && (
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  {item.type}
                </div>
              )}
              {item.rating && (
                <div style={{ fontSize: '0.75rem', color: '#e84393', marginTop: '0.2rem', fontWeight: 500 }}>
                  ★ {item.rating}
                </div>
              )}
            </div>
            <div style={{ 
              fontSize: '0.8rem', 
              color: '#6b7a8d',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              marginLeft: '1rem'
            }}>
              {item.distance}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══ LAKE MAP COMPONENT ═══
function LakeMap({ lake, amenities }) {
  return (
    <div style={{
      width: '100%',
      height: '400px',
      background: 'linear-gradient(135deg, #e8e4df 0%, #f5f3f0 100%)',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #e8e4df',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Map placeholder background pattern */}
      <div style={{
  position: 'absolute',
  inset: 0,
  background: 'rgba(156, 146, 172, 0.03)',
  opacity: 0.3
      }} />
      
      {/* Center content */}
      <div style={{ 
        textAlign: 'center', 
        zIndex: 1,
        padding: '2rem'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          background: 'white',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          boxShadow: '0 4px 12px rgba(26,35,50,0.1)',
          border: '2px solid #e84393'
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e84393" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        
        <h4 style={{ 
          fontSize: '1.1rem', 
          fontWeight: 700, 
          color: '#1a2332',
          marginBottom: '0.5rem'
        }}>
          {lake.name}
        </h4>
        
        <p style={{ 
          fontSize: '0.85rem', 
          color: '#6b7a8d',
          marginBottom: '1rem'
        }}>
          {amenities.coordinates.lat.toFixed(4)}°N, {Math.abs(amenities.coordinates.lng).toFixed(4)}°W
        </p>
        
        <div style={{
          display: 'inline-block',
          background: 'rgba(232,67,147,0.1)',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: '#6b7a8d'
        }}>
          📍 Interactive map coming soon
        </div>
      </div>
    </div>
  );
}

// ═══ MAIN COMPONENT ═══
export default function IrishHillsLakes() {
```

## Where to Add This

**In your code file, find this line:**
```jsx
export default function IrishHillsLakes() {
```

**Add the two components ABOVE that line.**

The complete order should be:
1. Imports
2. Data (amenityData, lakesData, etc.)
3. Icons
4. **AmenitySection component** ← ADD HERE
5. **LakeMap component** ← ADD HERE
6. `export default function IrishHillsLakes()` ← Main component starts

## What These Components Do

### AmenitySection
- Displays lists of amenities (schools, dining, shopping, etc.)
- Shows name, type, rating, and distance
- Styled with the same design system

### LakeMap
- Placeholder for future map integration (Google Maps, Leaflet, or Mapbox)
- Shows coordinates and lake name
- Displays "Interactive map coming soon" message

## After Adding These

Save the file and refresh. You should now see:
- ✅ Devils Lake detail page works
- ✅ Clark Lake detail page works  
- ✅ Vineyard Lake detail page works
- ✅ Amenity sections display properly
- ✅ Map placeholder shows

## Next Steps (Future Enhancement)

When you're ready to add a real map, you can integrate:
- **Google Maps** (requires API key)
- **Leaflet** (free, open source)
- **Mapbox** (freemium)

I can help you with that integration when you're ready!

---

## Complete Component Code (Copy-Paste Ready)

```jsx
// ═══ AMENITY SECTION COMPONENT ═══
function AmenitySection({ title, icon, items }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
        {icon}
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a2332' }}>{title}</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {items.map((item, i) => (
          <div 
            key={i} 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              padding: '0.75rem 1rem',
              background: '#faf9f7',
              borderRadius: '8px',
              border: '1px solid #e8e4df'
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1a2332' }}>
                {item.name}
              </div>
              {item.type && (
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  {item.type}
                </div>
              )}
              {item.rating && (
                <div style={{ fontSize: '0.75rem', color: '#e84393', marginTop: '0.2rem', fontWeight: 500 }}>
                  ★ {item.rating}
                </div>
              )}
            </div>
            <div style={{ 
              fontSize: '0.8rem', 
              color: '#6b7a8d',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              marginLeft: '1rem'
            }}>
              {item.distance}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══ LAKE MAP COMPONENT ═══
function LakeMap({ lake, amenities }) {
  return (
    <div style={{
      width: '100%',
      height: '400px',
      background: 'linear-gradient(135deg, #e8e4df 0%, #f5f3f0 100%)',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #e8e4df',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        opacity: 0.3
      }} />
      
      <div style={{ textAlign: 'center', zIndex: 1, padding: '2rem' }}>
        <div style={{
          width: '60px',
          height: '60px',
          background: 'white',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          boxShadow: '0 4px 12px rgba(26,35,50,0.1)',
          border: '2px solid #e84393'
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e84393" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        
        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a2332', marginBottom: '0.5rem' }}>
          {lake.name}
        </h4>
        
        <p style={{ fontSize: '0.85rem', color: '#6b7a8d', marginBottom: '1rem' }}>
          {amenities.coordinates.lat.toFixed(4)}°N, {Math.abs(amenities.coordinates.lng).toFixed(4)}°W
        </p>
        
        <div style={{
          display: 'inline-block',
          background: 'rgba(232,67,147,0.1)',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: '#6b7a8d'
        }}>
          📍 Interactive map coming soon
        </div>
      </div>
    </div>
  );
}

// ═══ MAIN COMPONENT ═══
export default function IrishHillsLakes() {
  const [currentView, setCurrentView] = useState('directory');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeAmenityTab, setActiveAmenityTab] = useState('overview');

  const currentLake = currentView !== 'directory' ? lakesData[currentView] : null;
  const currentAmenities = currentView !== 'directory' ? amenityData[currentView] : null;
  const currentProperties = currentView !== 'directory' ? propertiesData.filter(p => p.lake === currentView) : [];
  const filteredProperties = activeFilter === 'all' ? currentProperties : currentProperties.filter(p => p.type === activeFilter);
  const filteredLakes = Object.values(lakesData).filter(lake =>
    lake.name.toLowerCase().includes(searchQuery.toLowerCase()) || lake.tagline.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { setActiveAmenityTab('overview'); }, [currentView]);

  const navigateToLake = (slug) => { setCurrentView(slug); setActiveFilter('all'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const navigateToDirectory = () => { setCurrentView('directory'); setSearchQuery(''); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const amenityTabs = [
    { id: 'overview', label: 'Overview', icon: <Icons.map /> },
    { id: 'schools', label: 'Schools', icon: <Icons.school /> },
    { id: 'dining', label: 'Dining', icon: <Icons.utensils /> },
    { id: 'shopping', label: 'Shopping', icon: <Icons.shopping /> },
    { id: 'medical', label: 'Medical', icon: <Icons.medical /> },
    { id: 'utilities', label: 'Utilities', icon: <Icons.wrench /> },
    { id: 'lake-rules', label: 'Lake Rules', icon: <Icons.anchor /> },
    { id: 'recreation', label: 'Recreation', icon: <Icons.tree /> },
  ];
  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, sans-serif", color: '#1a2332', minHeight: '100vh', background: '#faf9f7' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes gentleFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes hollyFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
        .holly-hero-wrap { animation: fadeUp 1.2s ease-out 0.4s both; }
        @media (max-width: 900px) { .holly-hero-wrap { display: none !important; } }
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(2.5); opacity: 0; }
        }

        .lake-card {
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .lake-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 30px 60px rgba(26,35,50,0.12);
        }
        .lake-card:hover .lake-card-cta {
          background: #1a2332;
          color: #faf9f7;
          letter-spacing: 1.5px;
        }
        .property-card {
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .property-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 50px rgba(26,35,50,0.12);
        }
        .nav-btn:hover {
          background: rgba(255,255,255,0.25) !important;
        }
        .cta-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(26,35,50,0.25);
        }
        .cta-secondary:hover {
          background: rgba(255,255,255,0.2) !important;
        }
        .social-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px rgba(26,35,50,0.1);
        }
        .stat-pill {
          animation: fadeUp 0.6s ease-out both;
        }
        .highlight-card:hover {
          border-color: #e84393;
          background: #fff;
        }
        .amenity-tab { transition: all 0.3s ease; cursor: pointer; }
        .amenity-tab:hover { background: #f5f3f0 !important; }
        .distance-chip { transition: all 0.3s ease; }
        .distance-chip:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(26,35,50,0.1); }
        .amenity-tabs-row { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .amenity-grid-desktop { display: grid; }
        @media (max-width: 768px) { .amenity-grid-desktop { grid-template-columns: 1fr !important; } .distance-row { grid-template-columns: repeat(2, 1fr) !important; } }
        ::selection {
          background: rgba(192, 89, 110, 0.2);
        }
        @media (max-width: 768px) {
          .hero-title { font-size: 2.5rem !important; }
          .hero-subtitle { font-size: 1rem !important; }
          .section-title { font-size: 2rem !important; }
          .nav-desktop { display: none !important; }
        }
      `}</style>

      {/* ═══ NAVIGATION ═══ */}
      <nav style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 1000,
        background: scrolled ? 'rgba(26,35,50,0.97)' : 'rgba(26,35,50,0.6)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        padding: scrolled ? '0.7rem 0' : '1rem 0',
        transition: 'all 0.4s ease',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : 'none'
      }}>
        <div style={{
          maxWidth: '1400px', margin: '0 auto', padding: '0 2rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div onClick={navigateToDirectory} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src="/images/foundation-logo.png" alt="Foundation Realty" style={{ height: '34px', width: 'auto' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{
                fontFamily: "'Playfair Display', serif", fontSize: '1.3rem',
                fontWeight: 600, color: 'white', lineHeight: 1.1
              }}>Holly Griewahn</span>
              <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '2px', textTransform: 'uppercase' }}>Lake Specialist</span>
            </div>
          </div>

          <div className="nav-desktop" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button className="nav-btn" onClick={navigateToDirectory} style={{
              background: currentView === 'directory' ? 'rgba(255,255,255,0.15)' : 'transparent',
              border: '1.5px solid rgba(255,255,255,0.2)', color: 'white',
              padding: '0.5rem 1.2rem', borderRadius: '8px', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.3s ease'
            }}>All Lakes</button>

            {currentView !== 'directory' && (
              <div style={{
                color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', padding: '0.5rem 1rem',
                background: 'rgba(255,255,255,0.08)', borderRadius: '8px',
                display: 'flex', alignItems: 'center', gap: '0.4rem'
              }}>
                <Icons.mapPin /> {currentLake?.name}
              </div>
            )}

            <a href="tel:5174033413" style={{
              background: '#e84393', color: 'white', border: 'none',
              padding: '0.55rem 1.3rem', borderRadius: '8px', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.3s ease',
              display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none'
            }}>
              <Icons.phone /> 517-403-3413
            </a>
          </div>
        </div>
      </nav>

      {/* ═══════════════ DIRECTORY VIEW ═══════════════ */}
      {currentView === 'directory' && (
        <div style={{ paddingTop: '0' }}>

          {/* ─── HERO ─── */}
          <section style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', textAlign: 'center',
            position: 'relative', overflow: 'hidden',
            background: '#1a2332', color: 'white', padding: '6rem 2rem'
          }}>
            {/* Atmospheric layers */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, #0d1520 0%, #1a3040 30%, #2a4a5a 55%, #4a7060 75%, #1a2332 100%)',
              opacity: 0.95
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse 120% 60% at 50% 80%, rgba(74,112,96,0.3), transparent)',
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(circle at 20% 30%, rgba(232,67,147,0.12), transparent 50%)',
            }} />
            {/* Subtle horizon line */}
            <div style={{
              position: 'absolute', bottom: '28%', left: 0, right: 0, height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)'
            }} />
            {/* Noise texture overlay */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.03,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: '128px'
            }} />

            <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '0 1 500px', animation: 'fadeUp 1s ease-out', textAlign: 'left' }}>
              <div style={{
                fontSize: '0.75rem', fontWeight: 600, letterSpacing: '5px',
                textTransform: 'uppercase', marginBottom: '1.5rem',
                color: 'rgba(255,255,255,0.5)'
              }}>Southern Michigan's Irish Hills Region</div>

              <h1 className="hero-title" style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(2.8rem, 7vw, 5rem)',
                fontWeight: 600, marginBottom: '1.5rem', lineHeight: 1.05,
                letterSpacing: '-0.02em'
              }}>
                58 Lakes.<br />
                <span style={{ fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.75)' }}>One Expert.</span>
              </h1>

              <p className="hero-subtitle" style={{
                fontSize: '1.15rem', color: 'rgba(255,255,255,0.65)',
                maxWidth: '600px', margin: '0 0 3rem', lineHeight: 1.7, fontWeight: 300
              }}>
                With 30+ years serving the Irish Hills lake communities, Holly Griewahn knows every cove, every community, and every opportunity on the water.
              </p>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                <button className="cta-primary" onClick={() => document.getElementById('lakes-grid')?.scrollIntoView({ behavior: 'smooth' })} style={{
                  padding: '1rem 2.2rem', background: '#e84393', color: 'white',
                  border: 'none', borderRadius: '10px', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.3s ease',
                  display: 'flex', alignItems: 'center', gap: '0.6rem'
                }}>
                  Explore Lakes <Icons.arrow />
                </button>
                <button className="cta-secondary" onClick={() => alert('GHL Booking Calendar integration — opens scheduling widget')} style={{
                  padding: '1rem 2.2rem', background: 'rgba(255,255,255,0.08)',
                  color: 'white', border: '1.5px solid rgba(255,255,255,0.2)',
                  borderRadius: '10px', cursor: 'pointer', fontWeight: 500,
                  fontSize: '0.95rem', transition: 'all 0.3s ease',
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  backdropFilter: 'blur(10px)'
                }}>
                  <Icons.calendar /> Book a Consultation
                </button>
              </div>

              {/* Quick stats */}
              <div style={{
                display: 'flex', gap: '3rem', justifyContent: 'flex-start', marginTop: '4rem',
                flexWrap: 'wrap'
              }}>
                {[
                  { value: '58', label: 'Lakes' },
                  { value: '30+', label: 'Years Experience' },
                  { value: '$265K–$875K', label: 'Price Range' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center', animation: `fadeUp 0.8s ease-out ${0.3 + i * 0.15}s both` }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '0.3rem' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

              {/* Holly's floating cutout photo - flipped to face left into the text */}
<div className="holly-hero-wrap" style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center', opacity: 0 }}>
  <img
    src="/images/holly-cutout.png"
    alt="Holly Griewahn - Irish Hills Lake Specialist"
    style={{
      height: 'clamp(350px, 50vh, 520px)',
      width: 'auto',
      animation: 'hollyFloat 6s ease-in-out infinite',
      filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))',
      objectFit: 'contain',
      marginBottom: '-2rem',
      transform: 'scaleX(-1)', // ← ADD THIS LINE to flip the image horizontally
    }}
  />
</div>
            </div>

            {/* Scroll indicator */}
            <div style={{
              position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
              animation: 'gentleFloat 3s ease-in-out infinite', opacity: 0.4
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
            </div>
          </section>

          {/* ─── LAKE DIRECTORY ─── */}
          <section id="lakes-grid" style={{ padding: '6rem 2rem', background: '#faf9f7' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                <h2 className="section-title" style={{
                  fontFamily: "'Playfair Display', serif", fontSize: '2.8rem',
                  color: '#1a2332', marginBottom: '1rem', fontWeight: 600, letterSpacing: '-0.02em'
                }}>Explore Irish Hills Lakes</h2>
                <p style={{ color: '#6b7a8d', fontSize: '1.05rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
                  Click any lake to see detailed information and current listings
                </p>

                {/* Search bar */}
                <div style={{
                  maxWidth: '440px', margin: '0 auto', position: 'relative'
                }}>
                  <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                    <Icons.search />
                  </div>
                  <input
                    type="text"
                    placeholder="Search lakes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%', padding: '0.9rem 1rem 0.9rem 2.8rem',
                      border: '2px solid #e8e4df', borderRadius: '12px',
                      fontSize: '0.95rem', background: 'white', outline: 'none',
                      color: '#1a2332', transition: 'border-color 0.3s ease',
                      fontFamily: "'DM Sans', sans-serif"
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#e84393'}
                    onBlur={(e) => e.target.style.borderColor = '#e8e4df'}
                  />
                </div>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem'
              }}>
                {filteredLakes.map((lake, idx) => (
                  <div key={lake.slug} className="lake-card" onClick={() => navigateToLake(lake.slug)}
                    style={{
                      background: 'white', borderRadius: '16px', overflow: 'hidden',
                      boxShadow: '0 4px 20px rgba(26,35,50,0.06)', cursor: 'pointer',
                      animation: `fadeUp 0.5s ease-out ${idx * 0.07}s both`, opacity: 0,
                      border: '1px solid rgba(26,35,50,0.06)'
                    }}>
                    <div style={{
                      height: '200px', background: lake.gradient,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', position: 'relative', overflow: 'hidden'
                    }}>
                      {/* Subtle animated overlay */}
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'radial-gradient(circle at 30% 60%, rgba(255,255,255,0.08), transparent 60%)'
                      }} />
                      <div style={{ textAlign: 'center', zIndex: 1, padding: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem', opacity: 0.7 }}>
                          <Icons.water />
                        </div>
                        <h3 style={{
                          fontFamily: "'Playfair Display', serif", fontSize: '1.8rem',
                          fontWeight: 600, marginBottom: '0.4rem', letterSpacing: '-0.01em'
                        }}>{lake.name}</h3>
                        <p style={{ fontSize: '0.85rem', opacity: 0.75, fontWeight: 300 }}>{lake.tagline}</p>
                      </div>
                    </div>

                    <div style={{ padding: '1.5rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>Size</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1a2332' }}>{lake.stats.acres} acres</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>Avg Price</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1a2332' }}>{lake.stats.avgPrice}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem' }}>
                        {lake.features.slice(0, 3).map((feature, i) => (
                          <div key={i} style={{
                            background: '#f5f3f0', padding: '0.35rem 0.75rem',
                            borderRadius: '6px', fontSize: '0.75rem', color: '#6b7a8d', fontWeight: 500
                          }}>{feature}</div>
                        ))}
                      </div>

                      <div className="lake-card-cta" style={{
                        padding: '0.75rem', borderRadius: '10px', textAlign: 'center',
                        fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.5px',
                        border: '2px solid #1a2332', color: '#1a2332',
                        transition: 'all 0.4s ease', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: '0.5rem'
                      }}>
                        View Details <Icons.arrow />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredLakes.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                  <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>No lakes match "{searchQuery}" — try a different search.</p>
                </div>
              )}
            </div>
          </section>

          {/* ─── TESTIMONIALS ─── */}
          <section style={{ padding: '6rem 2rem', background: '#1a2332', color: 'white' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                <h2 style={{
                  fontFamily: "'Playfair Display', serif", fontSize: '2.5rem',
                  fontWeight: 600, marginBottom: '0.75rem', letterSpacing: '-0.02em'
                }}>What Clients Say</h2>
                <div style={{ width: '40px', height: '3px', background: '#e84393', margin: '0 auto', borderRadius: '2px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {testimonials.map((t, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.04)', borderRadius: '16px',
                    padding: '2.5rem 2rem', border: '1px solid rgba(255,255,255,0.06)',
                    position: 'relative', animation: `fadeUp 0.6s ease-out ${i * 0.15}s both`, opacity: 0
                  }}>
                    <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem' }}>
                      <Icons.quote />
                    </div>
                    <p style={{
                      fontSize: '1.05rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.8)',
                      marginBottom: '1.5rem', fontStyle: 'italic', position: 'relative'
                    }}>"{t.quote}"</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.15rem' }}>{t.lake}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ─── SOCIAL / CONTENT HUB ─── */}
          <section style={{ padding: '6rem 2rem', background: '#f5f3f0' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                <h2 className="section-title" style={{
                  fontFamily: "'Playfair Display', serif", fontSize: '2.5rem',
                  color: '#1a2332', marginBottom: '0.75rem', fontWeight: 600, letterSpacing: '-0.02em'
                }}>Lake Living Tips & Updates</h2>
                <p style={{ color: '#6b7a8d', fontSize: '1rem' }}>
                  Follow Holly on social media for market insights, lake tours, and community highlights
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {socialContent.map((item, i) => (
                  <div key={i} className="social-card" style={{
                    background: 'white', borderRadius: '14px', overflow: 'hidden',
                    boxShadow: '0 2px 12px rgba(26,35,50,0.05)', cursor: 'pointer',
                    transition: 'all 0.4s ease', border: '1px solid rgba(26,35,50,0.04)',
                    animation: `fadeUp 0.5s ease-out ${i * 0.1}s both`, opacity: 0
                  }}>
                    {/* Video/post thumbnail placeholder */}
                    <div style={{
                      height: '180px', position: 'relative',
                      background: item.type === 'youtube'
                        ? 'linear-gradient(135deg, #1a2332, #2c3e50)'
                        : 'linear-gradient(135deg, #1a3a5c, #2a5a8c)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {item.type === 'youtube' && (
                        <div style={{
                          width: '56px', height: '56px', borderRadius: '50%',
                          background: 'rgba(255,255,255,0.15)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          backdropFilter: 'blur(10px)', border: '2px solid rgba(255,255,255,0.2)'
                        }}>
                          <Icons.play />
                        </div>
                      )}
                      {item.type === 'facebook' && (
                        <div style={{ opacity: 0.5, color: 'white' }}><Icons.facebook /></div>
                      )}
                      <div style={{
                        position: 'absolute', top: '0.75rem', left: '0.75rem',
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        background: 'rgba(0,0,0,0.4)', padding: '0.3rem 0.7rem',
                        borderRadius: '6px', fontSize: '0.7rem', color: 'white', fontWeight: 500
                      }}>
                        {item.type === 'youtube' ? <Icons.youtube /> : <Icons.facebook />}
                        {item.platform}
                      </div>
                    </div>

                    <div style={{ padding: '1.25rem' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1a2332', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                        {item.title}
                      </h4>
                      <p style={{ fontSize: '0.82rem', color: '#6b7a8d', lineHeight: 1.6 }}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  In production, these cards embed live YouTube videos and Facebook posts via Holly's social feeds.
                </p>
              </div>
            </div>
          </section>

          {/* ─── CTA / BOOKING ─── */}
          <section style={{
            padding: '6rem 2rem', position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg, #1a2332 0%, #2c3e50 50%, #e84393 100%)',
            color: 'white', textAlign: 'center'
          }}>
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.05,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: '128px'
            }} />
            <div style={{ maxWidth: '700px', margin: '0 auto', position: 'relative' }}>
              <h2 style={{
                fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 5vw, 3rem)',
                marginBottom: '1rem', fontWeight: 600, letterSpacing: '-0.02em'
              }}>Ready to Find Your Lake?</h2>
              <p style={{ fontSize: '1.05rem', marginBottom: '2.5rem', opacity: 0.8, lineHeight: 1.7, fontWeight: 300 }}>
                Schedule a personal consultation with Holly to explore available properties and find the perfect waterfront home for your family.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="cta-primary" onClick={() => alert('GHL Booking Calendar — opens scheduling widget')} style={{
                  padding: '1rem 2.2rem', background: 'white', color: '#1a2332',
                  border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '0.95rem',
                  cursor: 'pointer', transition: 'all 0.3s ease',
                  display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                  <Icons.calendar /> Schedule Consultation
                </button>
                <a href="tel:5174033413" className="cta-secondary" style={{
                  padding: '1rem 2.2rem', background: 'rgba(255,255,255,0.1)',
                  color: 'white', border: '1.5px solid rgba(255,255,255,0.25)',
                  borderRadius: '10px', fontWeight: 500, fontSize: '0.95rem',
                  cursor: 'pointer', transition: 'all 0.3s ease', textDecoration: 'none',
                  display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                  <Icons.phone /> Call 517-403-3413
                </a>
              </div>
            </div>
          </section>
        </div>
      )}


      {/* ═══════════════ INDIVIDUAL LAKE VIEW ═══════════════ */}
      {currentView !== 'directory' && currentLake && (
        <div>
          {/* LAKE HERO */}
          <section style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', background: currentLake.gradient, color: 'white', padding: '8rem 2rem 5rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% 100%, rgba(0,0,0,0.3), transparent)' }} />
            <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
              <button onClick={navigateToDirectory} style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)', color: 'white', padding: '0.5rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, marginBottom: '2.5rem', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Icons.back /> All Lakes</button>
              <div style={{ maxWidth: '800px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '1rem', opacity: 0.5, animation: 'fadeUp 0.6s ease-out both' }}>Irish Hills Lake Property</div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(3rem, 7vw, 4.5rem)', fontWeight: 600, marginBottom: '1rem', lineHeight: 1.05, animation: 'fadeUp 0.7s ease-out 0.1s both', opacity: 0 }}>{currentLake.name}</h1>
                <p style={{ fontSize: '1.25rem', fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 400, marginBottom: '1.5rem', animation: 'fadeUp 0.7s ease-out 0.2s both', opacity: 0 }}>{currentLake.tagline}</p>
                <p style={{ fontSize: '1.05rem', lineHeight: 1.8, maxWidth: '650px', fontWeight: 300, animation: 'fadeUp 0.7s ease-out 0.3s both', opacity: 0 }}>{currentLake.description}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', maxWidth: '650px', marginTop: '3rem' }}>
                {[{ label: 'Max Depth', value: currentLake.stats.depth }, { label: 'Lake Size', value: currentLake.stats.acres + ' ac' }, { label: 'Avg Price', value: currentLake.stats.avgPrice }, { label: 'Communities', value: currentLake.stats.communities }].map((stat, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', animation: `fadeUp 0.6s ease-out ${0.4 + idx * 0.1}s both`, opacity: 0 }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.55, letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: '0.4rem' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ─── DISTANCE CHIPS ─── */}
          {currentAmenities && (
            <section style={{ padding: '3rem 2rem', background: 'white', borderBottom: '1px solid #e8e4df' }}>
              <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                  <Icons.car />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1a2332' }}>Distance From {currentLake.name}</h3>
                </div>
                <div className="distance-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  {currentAmenities.distances.map((d, i) => (
                    <div key={i} className="distance-chip" style={{ background: '#faf9f7', border: '1.5px solid #e8e4df', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#1a2332' }}>{d.to}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.1rem' }}>{d.time} drive</div>
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e84393', background: 'rgba(232,67,147,0.08)', padding: '0.3rem 0.7rem', borderRadius: '8px' }}>{d.miles} mi</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ─── MAP + AMENITIES ─── */}
          {currentAmenities && (
            <section style={{ padding: '4rem 2rem', background: '#faf9f7' }}>
              <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                  <h2 className="section-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', color: '#1a2332', marginBottom: '0.75rem', fontWeight: 600 }}>Neighborhood & Amenities</h2>
                  <p style={{ color: '#6b7a8d', fontSize: '1rem' }}>Everything you need to know about living on {currentLake.name}</p>
                </div>
                <div className="amenity-tabs-row" style={{ display: 'flex', gap: '0.4rem', marginBottom: '2rem', flexWrap: 'wrap', background: 'white', padding: '0.4rem', borderRadius: '14px', border: '1px solid #e8e4df', boxShadow: '0 2px 8px rgba(26,35,50,0.04)' }}>
                  {amenityTabs.map(tab => (
                    <button key={tab.id} className="amenity-tab" onClick={() => setActiveAmenityTab(tab.id)} style={{ padding: '0.65rem 1.1rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: activeAmenityTab === tab.id ? '#1a2332' : 'transparent', color: activeAmenityTab === tab.id ? 'white' : '#6b7a8d', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif" }}>
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>
                <div className="amenity-grid-desktop" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
                  <div style={{ position: 'sticky', top: '100px' }}>
                    <LakeMap lake={currentLake} amenities={currentAmenities} />
                    <div style={{ marginTop: '1rem', padding: '1rem 1.25rem', background: 'white', borderRadius: '12px', border: '1px solid #e8e4df', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ color: '#e84393' }}><Icons.mapPin /></div>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1a2332' }}>{currentAmenities.utilities.township}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{currentAmenities.coordinates.lat.toFixed(4)}N, {(currentAmenities.coordinates.lng * -1).toFixed(4)}W</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', border: '1px solid #e8e4df' }}>
                    {activeAmenityTab === 'overview' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <AmenitySection title="Schools Nearby" icon={<Icons.school />} items={currentAmenities.schools} />
                        <AmenitySection title="Dining" icon={<Icons.utensils />} items={currentAmenities.dining.slice(0, 3)} />
                        <AmenitySection title="Lake Rules" icon={<Icons.anchor />} items={[
                          { name: 'HP Restrictions', distance: currentAmenities.lakeRules.hpRestrictions },
                          { name: 'Association', distance: currentAmenities.lakeRules.association },
                          { name: 'Public Access', distance: currentAmenities.lakeRules.publicAccess },
                        ]} />
                      </div>
                    )}
                    {activeAmenityTab === 'schools' && (
  <AmenitySection title="Schools & Education" icon={<Icons.school />} items={currentAmenities.schools} />
)}

{activeAmenityTab === 'dining' && (
  <AmenitySection title="Restaurants & Dining" icon={<Icons.utensils />} items={currentAmenities.dining} />
)}

{activeAmenityTab === 'shopping' && (
  <AmenitySection title="Shopping & Grocery" icon={<Icons.shopping />} items={currentAmenities.shopping} />
)}

{activeAmenityTab === 'medical' && (
  <AmenitySection title="Medical & Healthcare" icon={<Icons.medical />} items={currentAmenities.medical} />
)}

{activeAmenityTab === 'utilities' && (
  <AmenitySection
    title="Utilities & Services"
    icon={<Icons.wrench />}
    items={Object.entries(currentAmenities.utilities).map(([k, v]) => ({
      name: k,
      distance: v
    }))}
  />
)}

{activeAmenityTab === 'lake-rules' && (
  <AmenitySection
    title="Lake Rules & Regulations"
    icon={<Icons.anchor />}
    items={Object.entries(currentAmenities.lakeRules).map(([k, v]) => ({
      name: k,
      distance: v
    }))}
  />
)}

{activeAmenityTab === 'recreation' && (
  <AmenitySection title="Recreation & Activities" icon={<Icons.tree />} items={currentAmenities.recreation} />
)}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* NO AMENITY DATA NOTICE */}
          {!currentAmenities && (
            <section style={{ padding: '3rem 2rem', background: '#faf9f7' }}>
              <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '16px', border: '2px dashed #e8e4df' }}>
                <div style={{ color: '#e84393', marginBottom: '1rem' }}><Icons.map /></div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: '#1a2332', marginBottom: '0.5rem' }}>Neighborhood Data Coming Soon</h3>
                <p style={{ color: '#6b7a8d', fontSize: '0.95rem', lineHeight: 1.7 }}>
                  Full amenity details, map view, and proximity data for {currentLake.name} are being compiled. 
                  Contact Holly directly for neighborhood information.
                </p>
              </div>
            </section>
          )}

          {/* HIGHLIGHTS */}
          <section style={{ padding: '5rem 2rem', background: 'white' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: '#1a2332', marginBottom: '2.5rem', textAlign: 'center', fontWeight: 600 }}>Why Choose {currentLake.name}?</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                {currentLake.highlights.map((h, i) => (
                  <div key={i} className="highlight-card" style={{ padding: '1.5rem', borderRadius: '12px', textAlign: 'center', border: '2px solid #e8e4df', transition: 'all 0.3s ease' }}>
                    <div style={{ color: '#e84393', marginBottom: '0.75rem' }}><Icons.check /></div>
                    <div style={{ color: '#1a2332', fontWeight: 600, fontSize: '0.9rem' }}>{h}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* PROPERTIES */}
          <section style={{ padding: '5rem 2rem', background: '#faf9f7' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <h2 className="section-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', color: '#1a2332', marginBottom: '0.75rem', fontWeight: 600 }}>Available Properties</h2>
                <p style={{ color: '#6b7a8d', fontSize: '1rem' }}>{currentProperties.length} listing{currentProperties.length !== 1 ? 's' : ''} on {currentLake.name}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
                {[{ label: 'All', filter: 'all' }, { label: 'Lakefront', filter: 'lakefront' }, { label: 'Waterfront', filter: 'waterfront' }].map(btn => (
                  <button key={btn.filter} onClick={() => setActiveFilter(btn.filter)} style={{
                    padding: '0.6rem 1.4rem', background: activeFilter === btn.filter ? '#1a2332' : 'white',
                    border: '2px solid', borderColor: activeFilter === btn.filter ? '#1a2332' : '#e8e4df',
                    borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
                    color: activeFilter === btn.filter ? 'white' : '#6b7a8d', fontSize: '0.85rem'
                  }}>{btn.label}</button>
                ))}
              </div>
              {filteredProperties.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
                  {filteredProperties.map((property, idx) => (
                    <div key={property.id} className="property-card" onClick={() => alert(`GHL Integration: Full listing for ${property.address}`)} style={{
                      background: 'white', borderRadius: '16px', overflow: 'hidden',
                      boxShadow: '0 4px 20px rgba(26,35,50,0.06)', cursor: 'pointer',
                      border: '1px solid rgba(26,35,50,0.06)', animation: `fadeUp 0.4s ease-out ${idx * 0.08}s both`, opacity: 0
                    }}>
                      <div style={{ height: '220px', background: currentLake.gradient, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icons.home /> Photo placeholder</div>
                        <div style={{
                          position: 'absolute', top: '1rem', right: '1rem',
                          background: property.status === 'Active' ? '#1a2332' : property.status === 'Contract' ? '#b8956a' : '#6b7a8d',
                          color: 'white', padding: '0.35rem 0.85rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600
                        }}>{property.status}</div>
                      </div>
                      <div style={{ padding: '1.5rem' }}>
                        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1a2332', marginBottom: '0.3rem' }}>{property.price}</div>
                        <div style={{ color: '#6b7a8d', marginBottom: '1.25rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Icons.mapPin /> {property.address}</div>
                        <div style={{ display: 'flex', gap: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e8e4df', fontSize: '0.82rem', color: '#6b7a8d' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Icons.bed /> {property.beds} bd</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Icons.bath /> {property.baths} ba</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Icons.ruler /> {property.sqft} sqft</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '16px' }}>
                  <p style={{ color: '#94a3b8' }}>No properties match this filter.</p>
                </div>
              )}
            </div>
          </section>

          {/* LAKE CTA */}
          <section style={{ padding: '5rem 2rem', background: 'linear-gradient(135deg, #1a2332, #2c3e50)', color: 'white', textAlign: 'center' }}>
            <div style={{ maxWidth: '700px', margin: '0 auto' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 5vw, 2.8rem)', marginBottom: '1rem', fontWeight: 600 }}>Interested in {currentLake.name}?</h2>
              <p style={{ fontSize: '1.05rem', marginBottom: '2.5rem', opacity: 0.7, lineHeight: 1.7, fontWeight: 300 }}>Let Holly schedule a personal tour and share insider knowledge about living on {currentLake.name}.</p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
<button
  className="cta-primary"
  onClick={() => alert('GHL Booking Calendar')}
  style={{
    padding: '1rem 2rem',
    background: '#e84393',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer'
  }}
>
  <Icons.calendar /> Schedule a Tour
</button>

<a
  href="tel:5174033413"
  className="cta-secondary"
  style={{
    padding: '1rem 2rem',
    background: 'rgba(255,255,255,0.08)',
    color: 'white',
    border: '1.5px solid rgba(255,255,255,0.2)',
    borderRadius: '10px',
    fontWeight: 500,
    fontSize: '0.95rem',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  }}
>
  <Icons.phone /> Call Holly
</a>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ═══ FOOTER ═══ */}
      <footer style={{ background: '#0d1520', color: 'white', padding: '4rem 2rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.3rem' }}>Holly Griewahn</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1rem' }}>Foundation Realty</div>
              <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>Serving 58 lakes across Southern Michigan's Irish Hills with 30+ years of waterfront expertise.</p>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1rem', color: 'rgba(255,255,255,0.5)' }}>Contact</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                <a href="tel:5174033413" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icons.phone /> 517-403-3413</a>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icons.home /> Irish Hills, Michigan</div>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1rem', color: 'rgba(255,255,255,0.5)' }}>Connect</div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}><Icons.facebook /></div>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}><Icons.youtube /></div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)' }}>&copy; 2026 Holly Griewahn | Foundation Realty</p>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.25)' }}>Powered by GHL &middot; Hosted on Vercel</p>
          </div>
        </div>
      </footer>

      {/* ═══ GHL AI CHAT WIDGET ═══ */}
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999 }}>
        {chatOpen && (
          <div style={{ width: '360px', height: '480px', background: 'white', borderRadius: '16px', boxShadow: '0 20px 60px rgba(26,35,50,0.2)', marginBottom: '1rem', overflow: 'hidden', border: '1px solid rgba(26,35,50,0.08)', animation: 'fadeUp 0.3s ease-out' }}>
            <div style={{ background: '#1a2332', color: 'white', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Chat with Holly's AI</div>
                <div style={{ fontSize: '0.72rem', opacity: 0.6, marginTop: '0.15rem' }}>Powered by GHL AI</div>
              </div>
              <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1, opacity: 0.6 }}>&times;</button>
            </div>
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100% - 60px)', color: '#6b7a8d', textAlign: 'center' }}>
              <Icons.chat />
              <p style={{ marginTop: '1rem', fontSize: '0.9rem', lineHeight: 1.6 }}>In production, this connects to your <strong>GHL AI chatbot</strong> — answering questions, qualifying leads, and booking appointments 24/7.</p>
            </div>
          </div>
        )}
        <button onClick={() => setChatOpen(!chatOpen)} style={{
          width: '60px', height: '60px', borderRadius: '50%', background: '#e84393', color: 'white',
          border: 'none', cursor: 'pointer', boxShadow: '0 8px 30px rgba(232,67,147,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden'
        }}>
          {!chatOpen && <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid #e84393', animation: 'ripple 2s ease-out infinite' }} />}
          {chatOpen ? <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>&times;</span> : <Icons.chat />}
        </button>
      </div>
    </div>
  );
}
