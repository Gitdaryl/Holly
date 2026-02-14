import React, { useState, useEffect, useRef } from 'react';

// ═══════════════════════════════════════════════════════════
// AMENITY & LOCATION DATA (Proof of Concept: 3 Lakes)
// ═══════════════════════════════════════════════════════════

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
      { name: 'Irish Hills Fun Center', type: 'Family Entertainment', distance: '12 mi' },
      { name: 'Walker Tavern Historic Site', type: 'Museum', distance: '15 mi' },
    ]
  },
  'clark-lake': {
    coordinates: { lat: 42.1192, lng: -84.3478 },
    distances: [
      { to: 'Ann Arbor', miles: 42, time: '50 min' },
      { to: 'Detroit', miles: 88, time: '1 hr 35 min' },
      { to: 'Jackson', miles: 12, time: '18 min' },
      { to: 'Lansing', miles: 45, time: '50 min' },
      { to: 'Toledo, OH', miles: 65, time: '1 hr 10 min' },
    ],
    schools: [
      { name: 'Columbia School District', type: 'K-12 District', distance: '2 mi', rating: '6/10' },
      { name: 'Napoleon Community Schools', type: 'K-12 District', distance: '8 mi', rating: '7/10' },
      { name: 'Jackson Christian School', type: 'Private K-12', distance: '12 mi', rating: '8/10' },
    ],
    dining: [
      { name: 'The Blue Heron', type: 'Lakeside Bar & Grill', distance: 'On lake' },
      { name: 'Kentucky Fried Chicken', type: 'Fast Food', distance: '5 mi' },
      { name: 'Brooklyn Diner', type: 'Family Restaurant', distance: '6 mi' },
      { name: 'Irish Hills area restaurants', type: 'Various', distance: '8-15 mi' },
    ],
    shopping: [
      { name: 'Brooklyn Village Shops', type: 'General', distance: '6 mi' },
      { name: 'Meijer (Jackson)', type: 'Grocery & General', distance: '12 mi' },
      { name: 'Walmart (Jackson)', type: 'General', distance: '12 mi' },
      { name: 'Jackson Crossing Mall', type: 'Mall', distance: '14 mi' },
    ],
    medical: [
      { name: 'Henry Ford Allegiance Health', type: 'Hospital', distance: '12 mi' },
      { name: 'Brooklyn Family Medicine', type: 'Primary Care', distance: '6 mi' },
      { name: 'Urgent Care - Jackson', type: 'Urgent Care', distance: '12 mi' },
    ],
    utilities: {
      water: 'Private well', sewer: 'Septic system', electric: 'Consumers Energy',
      gas: 'DTE Energy (select areas)', internet: 'Comcast, Frontier, Starlink',
      garbage: 'Republic Services', township: 'Columbia Township',
    },
    lakeRules: {
      hpRestrictions: 'None - all sports lake', fishingLicense: 'Michigan DNR license required',
      association: 'Clark Lake Spirit Foundation', annualDues: '~$100/year',
      publicAccess: 'County park with boat launch', wakeHours: '11 AM - 6:30 PM',
    },
    recreation: [
      { name: 'Clark Lake County Park', type: 'Beach / Picnic', distance: 'On lake' },
      { name: 'Michigan International Speedway', type: 'NASCAR Racing', distance: '10 mi' },
      { name: 'Cascades Falls Park', type: 'Waterfall / Park', distance: '14 mi' },
      { name: 'Ella Sharp Museum', type: 'Art / History', distance: '14 mi' },
    ]
  },
  'vineyard-lake': {
    coordinates: { lat: 41.9750, lng: -84.1680 },
    distances: [
      { to: 'Ann Arbor', miles: 45, time: '55 min' },
      { to: 'Detroit', miles: 90, time: '1 hr 40 min' },
      { to: 'Jackson', miles: 30, time: '35 min' },
      { to: 'Adrian', miles: 18, time: '25 min' },
      { to: 'Toledo, OH', miles: 50, time: '55 min' },
    ],
    schools: [
      { name: 'Sand Creek Community Schools', type: 'K-12 District', distance: '4 mi', rating: '6/10' },
      { name: 'Adrian Public Schools', type: 'K-12 District', distance: '18 mi', rating: '5/10' },
      { name: 'Lenawee Christian School', type: 'Private K-12', distance: '16 mi', rating: '8/10' },
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

// ═══════════════════════════════════════════════════════════
// LAKE DIRECTORY DATA
// ═══════════════════════════════════════════════════════════

const lakesData = {
  'devils-lake': {
    name: 'Devils Lake', slug: 'devils-lake',
    tagline: "Michigan's Premier Fishing Destination",
    description: "Devils Lake is Michigan's 4th deepest lake at 96 feet deep, spanning 630 pristine acres. Known for exceptional bass, bluegill, and perch fishing, this lake offers no horsepower restrictions and is home to the historic Devils Lake Yacht Club.",
    features: ['96 feet deep', '630 acres', 'World-class fishing', 'No HP restrictions', 'Active yacht club'],
    stats: { depth: '96 ft', acres: '630', avgPrice: '$475K', communities: '3' },
    highlights: ['Bass & bluegill fishing', 'Water skiing friendly', 'Year-round community', '90 min from Detroit'],
    gradient: 'linear-gradient(135deg, #1a3c4d 0%, #2d5016 50%, #1a4d6d 100%)'
  },
  'clark-lake': {
    name: 'Clark Lake', slug: 'clark-lake',
    tagline: 'Community Spirit on the Water',
    description: 'Clark Lake is a vibrant 550-acre lake known for its strong community spirit and the annual Clark Lake Spirit Festival. Just minutes from Jackson, it offers the perfect blend of lake living and city convenience.',
    features: ['550 acres', 'Active social scene', 'Close to Jackson', 'Great fishing', 'NASCAR nearby'],
    stats: { depth: '45 ft', acres: '550', avgPrice: '$385K', communities: '2' },
    highlights: ['Spirit Festival', 'Year-round activities', 'MIS racing nearby', 'County park beach'],
    gradient: 'linear-gradient(135deg, #2d3a4a 0%, #1a4d3a 50%, #2d4a6d 100%)'
  },
  'vineyard-lake': {
    name: 'Vineyard Lake', slug: 'vineyard-lake',
    tagline: 'Serene Waters, Endless Memories',
    description: 'Vineyard Lake offers 150 acres of tranquil water, perfect for families seeking a peaceful lakeside retreat. With sandy beaches and shallow waters ideal for children, this lake has been a favorite summer destination for generations.',
    features: ['150 acres', 'Sandy beaches', 'Family-friendly', 'Quiet atmosphere', 'Affordable'],
    stats: { depth: '35 ft', acres: '150', avgPrice: '$295K', communities: '1' },
    highlights: ['Peaceful setting', 'Great for kids', 'Sandy bottom', 'Affordable lakefront'],
    gradient: 'linear-gradient(135deg, #3a2d4a 0%, #4d3a1a 50%, #2d4a3a 100%)'
  },
  'sand-lake': {
    name: 'Sand Lake', slug: 'sand-lake',
    tagline: 'Crystal Clear & Family Friendly',
    description: 'Sand Lake is a 120-acre gem known for its crystal-clear water and sandy bottom. A favorite among families with young children, this quiet lake offers excellent swimming and a close-knit community feel.',
    features: ['120 acres', 'Crystal clear water', 'Sandy bottom', 'Family-oriented', 'Quiet'],
    stats: { depth: '30 ft', acres: '120', avgPrice: '$265K', communities: '1' },
    highlights: ['Clear water swimming', 'Safe for kids', 'Tight-knit community', 'Affordable entry'],
    gradient: 'linear-gradient(135deg, #4a3a2d 0%, #2d4a4a 50%, #3a4a2d 100%)'
  },
  'round-lake': {
    name: 'Round Lake', slug: 'round-lake',
    tagline: 'Hidden Gem of the Irish Hills',
    description: 'Round Lake is a quiet 85-acre retreat offering the most affordable lakefront properties in the Irish Hills. Perfect for those seeking solitude and natural beauty without the crowds.',
    features: ['85 acres', 'Most affordable', 'Secluded', 'Great fishing', 'Natural beauty'],
    stats: { depth: '25 ft', acres: '85', avgPrice: '$195K', communities: '1' },
    highlights: ['Budget-friendly', 'Peaceful retreat', 'Good fishing', 'Low boat traffic'],
    gradient: 'linear-gradient(135deg, #2d4a3a 0%, #4a2d3a 50%, #2d3a4a 100%)'
  },
  'wampler-lake': {
    name: 'Wampler Lake', slug: 'wampler-lake',
    tagline: 'Where Adventure Meets Relaxation',
    description: 'Wampler Lake spans 250 acres and connects to the chain of lakes through a navigable channel. Known for both fishing and water sports, this lake appeals to active families who want it all.',
    features: ['250 acres', 'Connected waterways', 'Water sports', 'Good fishing', 'Active community'],
    stats: { depth: '40 ft', acres: '250', avgPrice: '$345K', communities: '2' },
    highlights: ['Connected to chain', 'Water skiing', 'Active social scene', 'Year-round living'],
    gradient: 'linear-gradient(135deg, #3a2d3a 0%, #2d4a2d 50%, #4a3a2d 100%)'
  },
  'lake-columbia': {
    name: 'Lake Columbia', slug: 'lake-columbia',
    tagline: 'The Crown Jewel of Irish Hills',
    description: 'Lake Columbia is the largest private lake in Michigan at 920 acres. This prestigious community features a private golf course, clubhouse, and some of the finest waterfront estates in the region.',
    features: ['920 acres', 'Largest private lake', 'Golf course', 'Clubhouse', 'Premium estates'],
    stats: { depth: '50 ft', acres: '920', avgPrice: '$525K', communities: '4' },
    highlights: ['Private golf course', 'Gated community', 'Premium properties', 'Full-service clubhouse'],
    gradient: 'linear-gradient(135deg, #1a2d4a 0%, #4a1a2d 50%, #2d4a1a 100%)'
  },
  'lake-leann': {
    name: 'Lake LeAnn', slug: 'lake-leann',
    tagline: 'Resort-Style Lake Living',
    description: 'Lake LeAnn is a 200-acre private lake community featuring resort-style amenities including pools, tennis courts, and a marina. The association-managed community ensures well-maintained properties and facilities.',
    features: ['200 acres', 'Private community', 'Resort amenities', 'Marina', 'Pool & tennis'],
    stats: { depth: '35 ft', acres: '200', avgPrice: '$285K', communities: '1' },
    highlights: ['Resort amenities', 'Community pool', 'Tennis courts', 'Well-maintained'],
    gradient: 'linear-gradient(135deg, #4a2d1a 0%, #1a4a2d 50%, #2d1a4a 100%)'
  },
  'pleasant-lake': {
    name: 'Pleasant Lake', slug: 'pleasant-lake',
    tagline: 'Timeless Lakeside Charm',
    description: 'Pleasant Lake lives up to its name with 175 acres of calm waters surrounded by mature hardwood forests. A favorite for kayaking and canoeing, this lake offers a slower pace of life.',
    features: ['175 acres', 'Wooded setting', 'Kayak-friendly', 'Calm waters', 'Natural shoreline'],
    stats: { depth: '28 ft', acres: '175', avgPrice: '$310K', communities: '1' },
    highlights: ['Kayaking paradise', 'Wooded privacy', 'Calm waters', 'Beautiful sunsets'],
    gradient: 'linear-gradient(135deg, #2d3a2d 0%, #3a2d4a 50%, #4a4a2d 100%)'
  },
  'evans-lake': {
    name: 'Evans Lake', slug: 'evans-lake',
    tagline: 'Peaceful Waters, Perfect Sunsets',
    description: 'Evans Lake is a serene 100-acre lake offering beautiful westward-facing sunsets and excellent panfish fishing. The quiet community and natural shoreline make it ideal for nature lovers.',
    features: ['100 acres', 'Amazing sunsets', 'Great fishing', 'Natural shoreline', 'Quiet community'],
    stats: { depth: '22 ft', acres: '100', avgPrice: '$225K', communities: '1' },
    highlights: ['Stunning sunsets', 'Panfish haven', 'Natural beauty', 'Affordable'],
    gradient: 'linear-gradient(135deg, #4a3a3a 0%, #2d2d4a 50%, #3a4a3a 100%)'
  },
};

// ═══════════════════════════════════════════════════════════
// SAMPLE PROPERTY DATA
// ═══════════════════════════════════════════════════════════

const propertiesData = [
  { id: 1, lake: 'devils-lake', type: 'lakefront', title: 'Lakefront Colonial', price: '$549,000', beds: 4, baths: 3, sqft: '2,800', description: '80ft of sandy frontage with private dock', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 2, lake: 'devils-lake', type: 'lakefront', title: 'Modern Lake Retreat', price: '$425,000', beds: 3, baths: 2, sqft: '2,200', description: 'Updated kitchen, panoramic lake views', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 3, lake: 'devils-lake', type: 'lake-access', title: 'Charming Cape Cod', price: '$289,000', beds: 3, baths: 2, sqft: '1,600', description: 'Deeded lake access, 2-minute walk to beach', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: 4, lake: 'clark-lake', type: 'lakefront', title: 'Waterfront Bungalow', price: '$375,000', beds: 3, baths: 2, sqft: '1,800', description: '60ft frontage, updated dock & seawall', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { id: 5, lake: 'clark-lake', type: 'lakefront', title: 'Premium Lake Estate', price: '$625,000', beds: 5, baths: 4, sqft: '3,400', description: '120ft frontage, in-ground pool, guest house', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { id: 6, lake: 'vineyard-lake', type: 'lakefront', title: 'Cozy Lake Cottage', price: '$249,000', beds: 2, baths: 1, sqft: '1,100', description: 'Perfect starter lake home, sandy beach', gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { id: 7, lake: 'vineyard-lake', type: 'lake-access', title: 'Family Ranch Home', price: '$195,000', beds: 3, baths: 2, sqft: '1,400', description: 'Shared beach access, large fenced yard', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
];

const testimonials = [
  { quote: "Holly found us the perfect lakefront home on Devils Lake. Her knowledge of every lake in the area is unmatched.", name: "The Peterson Family", lake: "Devils Lake" },
  { quote: "We were from out of state and Holly made the entire process seamless. She knows every detail about these lakes.", name: "Mark & Susan Chen", lake: "Clark Lake" },
  { quote: "Holly's expertise saved us from buying a property with hidden issues. She's not just a realtor, she's a lake expert.", name: "The Williams Family", lake: "Vineyard Lake" },
];

// ═══════════════════════════════════════════════════════════
// ICONS LIBRARY
// ═══════════════════════════════════════════════════════════

const Icons = {
  home: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  waves: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>,
  fish: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6z"/><path d="M18 12v.5"/><path d="M16 17.93a9.77 9.77 0 010-11.86"/><path d="M2 12h4"/></svg>,
  arrow: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  back: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  phone: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  mail: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  star: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  chat: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  quote: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="rgba(255,255,255,0.08)"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>,
  school: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  utensils: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>,
  shoppingBag: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  medical: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  wrench: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
  anchor: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0020 0h-3"/></svg>,
  car: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>,
  map: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  compass: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>,
};

// ═══════════════════════════════════════════════════════════
// REUSABLE COMPONENTS
// ═══════════════════════════════════════════════════════════

function AmenitySection({ title, icon, items, type }) {
  if (type === 'list') {
    return (
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a2332', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {icon} {title}
        </h3>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#f8f7f5', borderRadius: '10px', border: '1px solid #e8e4df' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1a2332' }}>{item.name}</div>
                <div style={{ fontSize: '0.78rem', color: '#6b7a8d' }}>{item.type}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.82rem', color: '#e84393', fontWeight: 600 }}>{item.distance}</div>
                {item.rating && <div style={{ fontSize: '0.72rem', color: '#6b7a8d' }}>{item.rating}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'grid') {
    return (
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a2332', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {icon} {title}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {Object.entries(items).map(([key, value]) => (
            <div key={key} style={{ padding: '0.75rem 1rem', background: '#f8f7f5', borderRadius: '10px', border: '1px solid #e8e4df' }}>
              <div style={{ fontSize: '0.72rem', color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>{key}</div>
              <div style={{ fontSize: '0.85rem', color: '#1a2332', fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

function LakeMap({ lake, amenities }) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const { lat, lng } = amenities.coordinates;

  if (isMobile) {
    return (
      <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid #e8e4df' }}>
        <div style={{ height: '300px', background: 'linear-gradient(135deg, #1a2332, #2c3e50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'white', gap: '0.75rem' }}>
          <Icons.map />
          <span style={{ fontSize: '1rem', fontWeight: 600 }}>{lake.name}</span>
          <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{lat.toFixed(4)}N, {(lng * -1).toFixed(4)}W</span>
          <a href={`https://www.google.com/maps/@${lat},${lng},13z`} target="_blank" rel="noopener noreferrer" style={{ marginTop: '0.5rem', padding: '0.5rem 1.2rem', background: 'rgba(255,255,255,0.15)', borderRadius: '8px', color: 'white', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 500, border: '1px solid rgba(255,255,255,0.2)' }}>
            Open in Google Maps
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid #e8e4df' }}>
      <div style={{ height: '400px', position: 'relative' }}>
        <iframe
          title={`${lake.name} Map`}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps/embed/v1/view?key=&center=${lat},${lng}&zoom=13&maptype=satellite`}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a2332, #2c3e50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'white', gap: '0.75rem' }}>
          <Icons.map />
          <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>{lake.name}</span>
          <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>{lat.toFixed(4)}N, {(lng * -1).toFixed(4)}W</span>
          <a href={`https://www.google.com/maps/@${lat},${lng},13z`} target="_blank" rel="noopener noreferrer" style={{ marginTop: '0.5rem', padding: '0.6rem 1.5rem', background: 'rgba(255,255,255,0.15)', borderRadius: '8px', color: 'white', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500, border: '1px solid rgba(255,255,255,0.2)', transition: 'all 0.3s ease' }}>
            Open in Google Maps
          </a>
          <p style={{ fontSize: '0.72rem', opacity: 0.4, marginTop: '0.5rem' }}>Add Google Maps API key for interactive map</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN APPLICATION COMPONENT
// ═══════════════════════════════════════════════════════════

export default function IrishHillsLakes() {
  const [currentView, setCurrentView] = useState('directory');
  const [activeFilter, setActiveFilter] = useState('all');
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [activeAmenityTab, setActiveAmenityTab] = useState('schools');

  const currentLake = currentView !== 'directory' ? lakesData[currentView] : null;
  const currentProperties = currentView !== 'directory' ? propertiesData.filter(p => p.lake === currentView) : [];
  const filteredProperties = activeFilter === 'all' ? currentProperties : currentProperties.filter(p => p.type === activeFilter);
  const filteredLakes = Object.values(lakesData).filter(lake =>
    lake.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lake.tagline.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navigateToLake = (slug) => {
    setCurrentView(slug);
    setActiveFilter('all');
    setActiveAmenityTab('schools');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToDirectory = () => {
    setCurrentView('directory');
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ═══ STYLES ═══
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:wght@300;400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes gentleFloat { 0%, 100% { transform: translateY(0) scaleX(-1); } 50% { transform: translateY(-6px) scaleX(-1); } }
    @keyframes ripple { 0% { transform: scale(1); opacity: 0.4; } 100% { transform: scale(2.5); opacity: 0; } }
    @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
    .lake-card { transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); }
    .lake-card:hover { transform: translateY(-10px); box-shadow: 0 30px 60px rgba(26,35,50,0.12); }
    .lake-card:hover .lake-card-cta { background: #1a2332; color: #faf9f7; letter-spacing: 1.5px; }
    .property-card { transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); }
    .property-card:hover { transform: translateY(-8px); box-shadow: 0 25px 50px rgba(26,35,50,0.15); }
  `;

  // ═══ LAKE DETAIL PAGE ═══
  const LakeDetailPage = () => {
    if (!currentLake) return null;
    const amenities = amenityData[currentView];
    const amenityTabs = amenities ? [
      { id: 'schools', label: 'Schools', icon: <Icons.school /> },
      { id: 'dining', label: 'Dining', icon: <Icons.utensils /> },
      { id: 'shopping', label: 'Shopping', icon: <Icons.shoppingBag /> },
      { id: 'medical', label: 'Medical', icon: <Icons.medical /> },
      { id: 'utilities', label: 'Utilities', icon: <Icons.wrench /> },
      { id: 'lakeRules', label: 'Lake Rules', icon: <Icons.anchor /> },
      { id: 'recreation', label: 'Recreation', icon: <Icons.compass /> },
      { id: 'distances', label: 'Commute', icon: <Icons.car /> },
    ] : [];

    return (
      <div style={{ minHeight: '100vh', background: '#faf9f7' }}>
        {/* Lake Hero */}
        <div style={{ height: '50vh', minHeight: '400px', position: 'relative', background: currentLake.gradient, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.08) 0%, transparent 50%)' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div style={{ textAlign: 'center', maxWidth: '800px' }}>
              <button onClick={navigateToDirectory} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '2rem', transition: 'all 0.3s ease' }}>
                <Icons.back /> All Lakes
              </button>
              <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, color: 'white', marginBottom: '1rem', fontFamily: "'Playfair Display', serif" }}>{currentLake.name}</h1>
              <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.4rem)', color: 'rgba(255,255,255,0.85)', fontWeight: 300 }}>{currentLake.tagline}</p>
            </div>
          </div>
        </div>

        {/* Lake Stats Bar */}
        <div style={{ background: '#1a2332', padding: '1.5rem 2rem' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', textAlign: 'center' }}>
            {Object.entries(currentLake.stats).map(([key, val]) => (
              <div key={key}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#e84393' }}>{val}</div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>{key === 'avgPrice' ? 'Avg Price' : key}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Lake Content */}
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 2rem' }}>
          {/* Description */}
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: 600, color: '#1a2332', marginBottom: '1rem' }}>About {currentLake.name}</h2>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#4a5568' }}>{currentLake.description}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1.5rem' }}>
              {currentLake.features.map((f, i) => (
                <span key={i} style={{ padding: '0.4rem 0.8rem', background: '#f0eee9', borderRadius: '6px', fontSize: '0.82rem', color: '#6b7a8d', fontWeight: 500 }}>{f}</span>
              ))}
            </div>
          </div>

          {/* Amenities Section */}
          {amenities && (
            <div style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: 600, color: '#1a2332', marginBottom: '1.5rem' }}>Neighborhood & Amenities</h2>

              {/* Amenity Tabs */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
                {amenityTabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveAmenityTab(tab.id)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px',
                    border: activeAmenityTab === tab.id ? '2px solid #e84393' : '1px solid #e8e4df',
                    background: activeAmenityTab === tab.id ? 'rgba(232,67,147,0.08)' : 'white',
                    color: activeAmenityTab === tab.id ? '#e84393' : '#6b7a8d',
                    cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.3s ease'
                  }}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Amenity Content */}
              {activeAmenityTab === 'schools' && <AmenitySection title="Schools" icon={<Icons.school />} items={amenities.schools} type="list" />}
              {activeAmenityTab === 'dining' && <AmenitySection title="Dining" icon={<Icons.utensils />} items={amenities.dining} type="list" />}
              {activeAmenityTab === 'shopping' && <AmenitySection title="Shopping" icon={<Icons.shoppingBag />} items={amenities.shopping} type="list" />}
              {activeAmenityTab === 'medical' && <AmenitySection title="Medical" icon={<Icons.medical />} items={amenities.medical} type="list" />}
              {activeAmenityTab === 'utilities' && <AmenitySection title="Utilities & Services" icon={<Icons.wrench />} items={amenities.utilities} type="grid" />}
              {activeAmenityTab === 'lakeRules' && <AmenitySection title="Lake Rules & Info" icon={<Icons.anchor />} items={amenities.lakeRules} type="grid" />}
              {activeAmenityTab === 'recreation' && <AmenitySection title="Recreation" icon={<Icons.compass />} items={amenities.recreation} type="list" />}
              {activeAmenityTab === 'distances' && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a2332', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Icons.car /> Commute Distances
                  </h3>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {amenities.distances.map((d, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#f8f7f5', borderRadius: '10px', border: '1px solid #e8e4df' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1a2332' }}>{d.to}</div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.85rem', color: '#e84393', fontWeight: 600 }}>{d.miles} mi</span>
                          <span style={{ fontSize: '0.78rem', color: '#6b7a8d', marginLeft: '0.5rem' }}>{d.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No amenity data message */}
          {!amenities && (
            <div style={{ marginBottom: '3rem', padding: '2rem', background: '#f8f7f5', borderRadius: '14px', border: '1px solid #e8e4df', textAlign: 'center' }}>
              <Icons.map />
              <p style={{ color: '#6b7a8d', marginTop: '0.5rem' }}>Detailed amenity data coming soon for {currentLake.name}.</p>
              <p style={{ color: '#e84393', fontWeight: 600, fontSize: '0.9rem', marginTop: '0.5rem' }}>Call Holly for the inside scoop!</p>
            </div>
          )}

          {/* Map */}
          {amenities && (
            <div style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: 600, color: '#1a2332', marginBottom: '1.5rem' }}>Location</h2>
              <LakeMap lake={currentLake} amenities={amenities} />
            </div>
          )}

          {/* Properties */}
          {currentProperties.length > 0 && (
            <div style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: 600, color: '#1a2332', marginBottom: '1.5rem' }}>Available Properties</h2>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {['all', 'lakefront', 'lake-access'].map(f => (
                  <button key={f} onClick={() => setActiveFilter(f)} style={{
                    padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                    border: activeFilter === f ? '2px solid #e84393' : '1px solid #e8e4df',
                    background: activeFilter === f ? 'rgba(232,67,147,0.08)' : 'white',
                    color: activeFilter === f ? '#e84393' : '#6b7a8d', transition: 'all 0.3s ease'
                  }}>
                    {f === 'all' ? 'All' : f === 'lakefront' ? 'Lakefront' : 'Lake Access'}
                  </button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {filteredProperties.map(prop => (
                  <div key={prop.id} className="property-card" style={{ background: 'white', borderRadius: '14px', overflow: 'hidden', border: '1px solid #e8e4df', cursor: 'pointer' }}>
                    <div style={{ height: '160px', background: prop.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icons.home />
                    </div>
                    <div style={{ padding: '1.25rem' }}>
                      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#e84393', marginBottom: '0.25rem' }}>{prop.price}</div>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1a2332', marginBottom: '0.5rem' }}>{prop.title}</div>
                      <div style={{ fontSize: '0.82rem', color: '#6b7a8d', marginBottom: '0.75rem' }}>{prop.description}</div>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                        <span>{prop.beds} bed</span><span>{prop.baths} bath</span><span>{prop.sqft} sqft</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact CTA */}
          <div style={{ background: 'linear-gradient(135deg, #1a2332, #2c3e50)', borderRadius: '16px', padding: '3rem 2rem', textAlign: 'center', color: 'white' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: 600, marginBottom: '0.75rem' }}>Interested in {currentLake.name}?</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>Holly has 30+ years of expertise on this lake. Get the inside scoop.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: '#e84393', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                <Icons.phone /> Call Holly
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                <Icons.mail /> Email Holly
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ═══ DIRECTORY PAGE ═══
  const DirectoryPage = () => (
    <div style={{ minHeight: '100vh', background: '#faf9f7' }}>
      {/* Hero Section */}
      <div style={{ height: '85vh', position: 'relative', background: 'linear-gradient(135deg, #0f2940 0%, #1a3a52 50%, #0f2940 100%)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)' }} />

        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3rem', maxWidth: '1200px', width: '100%' }}>
            {/* Left: Text */}
            <div style={{ flex: 1, textAlign: 'left', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <img src="/images/foundation-logo.png" alt="Foundation Realty" style={{ height: '40px' }} />
              </div>
              <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '1rem', letterSpacing: '-0.02em', fontFamily: "'Playfair Display', serif" }}>
                Holly Griewahn
              </h1>
             <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.5rem)', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 300 }}>
                Holly Griewahn | Foundation Realty
              </p>
              <p style={{ fontSize: '1rem', color: '#e84393', fontWeight: 600, marginBottom: '2rem' }}>
                Serving 58 Lakes Across Michigan's Irish Hills
              </p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button onClick={() => document.getElementById('lake-grid')?.scrollIntoView({ behavior: 'smooth' })} style={{ padding: '0.85rem 2rem', background: '#e84393', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 8px 30px rgba(232,67,147,0.3)' }}>
                  Explore Lakes <Icons.arrow />
                </button>
                <button style={{ padding: '0.85rem 2rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '10px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icons.phone /> Call Holly
                </button>
              </div>
            </div>

            {/* Right: Holly's Photo */}
           <div style={{ flex: '0 0 auto', display: 'none', paddingLeft: '1rem' }} className="holly-photo-container">
              <img src="/images/holly-cutout.png" alt="Holly Griewahn - Lake Property Specialist" style={{
                height: '500px', maxHeight: '70vh', objectFit: 'contain', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))',
                WebkitTransform: 'scaleX(1)', transform: 'scaleX(1)'
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Lake Grid */}
      <section id="lake-grid" style={{ padding: '5rem 2rem', background: '#faf9f7' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', fontWeight: 600, color: '#1a2332', marginBottom: '0.75rem' }}>Explore Our Lakes</h2>
            <div style={{ width: '40px', height: '3px', background: '#e84393', margin: '0 auto 1.5rem', borderRadius: '2px' }} />
            <div style={{ maxWidth: '400px', margin: '0 auto', position: 'relative' }}>
              <Icons.search />
              <input type="text" placeholder="Search lakes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{
                width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '10px', border: '1px solid #e8e4df',
                fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit'
              }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
            {filteredLakes.map((lake, i) => (
              <div key={lake.slug} className="lake-card" onClick={() => navigateToLake(lake.slug)} style={{
                background: 'white', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer',
                border: '1px solid #e8e4df', animation: `fadeUp 0.6s ease-out ${i * 0.08}s both`, opacity: 0
              }}>
                <div style={{ height: '180px', background: lake.gradient, position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {Object.entries(lake.stats).slice(0, 3).map(([key, val]) => (
                      <span key={key} style={{ padding: '0.25rem 0.6rem', background: 'rgba(255,255,255,0.2)', borderRadius: '6px', fontSize: '0.72rem', color: 'white', fontWeight: 600, backdropFilter: 'blur(4px)' }}>{val}</span>
                    ))}
                  </div>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1a2332', marginBottom: '0.25rem' }}>{lake.name}</h3>
                  <p style={{ fontSize: '0.85rem', color: '#6b7a8d', marginBottom: '1rem', fontStyle: 'italic' }}>{lake.tagline}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '1rem' }}>
                    {lake.features.slice(0, 3).map((f, j) => (
                      <div key={j} style={{ padding: '0.25rem 0.6rem', background: '#f0eee9', borderRadius: '6px', fontSize: '0.72rem', color: '#6b7a8d', fontWeight: 500 }}>{f}</div>
                    ))}
                  </div>
                  {amenityData[lake.slug] && (
                    <div style={{ fontSize: '0.72rem', color: '#e84393', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Icons.car /> {amenityData[lake.slug].distances[0].miles} mi to {amenityData[lake.slug].distances[0].to}
                    </div>
                  )}
                  <div className="lake-card-cta" style={{ padding: '0.75rem', borderRadius: '10px', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', border: '2px solid #1a2332', color: '#1a2332', transition: 'all 0.4s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    View Details <Icons.arrow />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredLakes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>No lakes match "{searchQuery}"</p>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '6rem 2rem', background: '#1a2332', color: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', fontWeight: 600, marginBottom: '0.75rem' }}>What Clients Say</h2>
            <div style={{ width: '40px', height: '3px', background: '#e84393', margin: '0 auto', borderRadius: '2px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {testimonials.map((t, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', padding: '2.5rem 2rem', border: '1px solid rgba(255,255,255,0.06)', position: 'relative', animation: `fadeUp 0.6s ease-out ${i * 0.15}s both`, opacity: 0 }}>
                <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem' }}><Icons.quote /></div>
                <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem', fontStyle: 'italic', position: 'relative' }}>"{t.quote}"</p>
                <div>
                  <div style={{ fontWeight: 600, color: 'white' }}>{t.name}</div>
                  <div style={{ fontSize: '0.82rem', color: '#e84393' }}>{t.lake}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );

  // ═══ MAIN RETURN ═══
  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, sans-serif", color: '#1a2332', minHeight: '100vh', background: '#faf9f7' }}>
      <style>{css}{`
        @media (min-width: 900px) {
          .holly-photo-container { display: block !important; }
        }
      `}</style>

      {/* Navigation */}
      <nav style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 1000, transition: 'all 0.4s ease',
        background: scrolled ? 'rgba(250,249,247,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(26,35,50,0.08)' : '1px solid transparent',
        padding: scrolled ? '0.75rem 2rem' : '1.25rem 2rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={navigateToDirectory}>
            <img src="/images/foundation-logo.png" alt="Foundation Realty" style={{ height: '32px' }} />
            <span style={{ fontWeight: 700, fontSize: '1rem', color: scrolled ? '#1a2332' : 'white', transition: 'color 0.4s ease' }}>Holly Griewahn | Lake Specialist</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <a href="tel:5551234567" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: scrolled ? '#e84393' : 'white', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem', transition: 'color 0.4s ease' }}>
              <Icons.phone /> (555) 123-4567
            </a>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      {currentView === 'directory' ? <DirectoryPage /> : <LakeDetailPage />}

      {/* Footer */}
      <footer style={{ background: '#0f1923', padding: '4rem 2rem 2rem', color: '#94a3b8' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <img src="/images/foundation-logo.png" alt="Foundation Realty" style={{ height: '32px' }} />
              <span style={{ fontWeight: 700, color: 'white', fontSize: '1rem' }}>Foundation Realty</span>
            </div>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1rem' }}>
              Holly Griewahn brings 30+ years of lake expertise to every transaction. Specializing in waterfront properties across 58 lakes in Michigan's Irish Hills.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <a href="tel:5551234567" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#e84393', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>
                <Icons.phone /> (555) 123-4567
              </a>
            </div>
          </div>
          <div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", color: 'white', marginBottom: '1rem', fontSize: '1.2rem' }}>Quick Links</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {['About Holly', 'Available Properties', 'Lake Guide', 'Contact'].map(link => (
                <a key={link} href="#" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.3s ease' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#e84393'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                >{link}</a>
              ))}
            </div>
          </div>
        </div>
        <div style={{ paddingTop: '2rem', borderTop: '1px solid rgba(232,67,147,0.2)', textAlign: 'center', fontSize: '0.9rem' }}>
          <p>&copy; 2025 Holly Griewahn | Foundation Realty | Irish Hills Lakes</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>All listings and information deemed reliable but not guaranteed.</p>
        </div>
      </footer>

      {/* GHL Chat Widget Placeholder */}
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
