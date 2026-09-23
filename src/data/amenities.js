// ═══════════════════════════════════════════════════════════
// AMENITY DATA - Now keyed by REGION instead of individual lake
// Shared amenities apply to all lakes in a cluster
// ═══════════════════════════════════════════════════════════

export const amenityData = {
  'manitou-beach': {
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
      { name: 'ProMedica Hickman Hospital', type: 'Hospital / ER', distance: '14 mi' },
      { name: 'Adrian Urgent Care', type: 'Walk-in Clinic', distance: '14 mi' },
      { name: 'Addison Family Medicine', type: 'Primary Care', distance: '3 mi' },
    ],
    utilities: {
      water: 'Private well (most properties)', sewer: 'Septic system', electric: 'Consumers Energy',
      gas: 'Propane (no natural gas at lakefront)', internet: 'Comcast Xfinity, Frontier DSL, Starlink',
      garbage: 'Republic Services (curbside)', township: 'Rollin / Woodstock Township',
    },
    recreation: [
      { name: 'Devils Lake Yacht Club', type: 'Sailing / Social', distance: 'On lake' },
      { name: 'Devils Lake Golf Course', type: 'Golf', distance: '2 mi' },
      { name: 'Hidden Lake Gardens (MSU)', type: 'Botanical Garden', distance: '8 mi' },
      { name: 'Irish Hills Fun Center', type: 'Family Entertainment', distance: '12 mi' },
      { name: 'Walker Tavern Historic Site', type: 'Museum', distance: '15 mi' },
    ],
  },

  'clark-lake': {
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
    recreation: [
      { name: 'Clark Lake County Park', type: 'Beach / Picnic', distance: 'On lake' },
      { name: 'Michigan International Speedway', type: 'NASCAR Racing', distance: '10 mi' },
      { name: 'Cascades Falls Park', type: 'Waterfall / Park', distance: '14 mi' },
      { name: 'Ella Sharp Museum', type: 'Art / History', distance: '14 mi' },
    ],
  },

  'southern-lakes': {
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
      { name: 'ProMedica Hickman Hospital', type: 'Hospital / ER', distance: '18 mi' },
      { name: 'Sand Creek Family Practice', type: 'Primary Care', distance: '4 mi' },
    ],
    utilities: {
      water: 'Private well', sewer: 'Septic system', electric: 'Consumers Energy',
      gas: 'Propane only', internet: 'Frontier DSL, Starlink recommended',
      garbage: 'Republic Services', township: 'Madison / Woodstock Township',
    },
    recreation: [
      { name: 'Lake Hudson State Rec Area', type: 'Hiking / Camping', distance: '12 mi' },
      { name: 'Hidden Lake Gardens', type: 'Botanical Garden', distance: '10 mi' },
      { name: 'Adrian College events', type: 'Culture / Sports', distance: '18 mi' },
    ],
  },

  'onsted-hayes': {
    distances: [
      { to: 'Ann Arbor', miles: 37, time: '53 min' },
      { to: 'Detroit', miles: 80, time: '1 hr 25 min' },
      { to: 'Jackson', miles: 25, time: '30 min' },
      { to: 'Adrian', miles: 16, time: '22 min' },
      { to: 'Toledo, OH', miles: 55, time: '1 hr' },
    ],
    schools: [
      { name: 'Onsted Community Schools', type: 'K-12 District', distance: '2 mi', rating: '6/10' },
      { name: 'Lenawee Christian School', type: 'Private K-12', distance: '16 mi', rating: '8/10' },
    ],
    dining: [
      { name: 'Irish Hills Dairy Bar', type: 'Ice Cream / Casual', distance: '3 mi' },
      { name: "Jerry's Pub & Restaurant", type: 'Bar & Grill / Pizza', distance: '4 mi' },
      { name: 'Boot Jack Tavern', type: 'Bar & Grill', distance: '6 mi' },
      { name: "PB&J's BBQ", type: 'Barbecue', distance: '5 mi' },
    ],
    shopping: [
      { name: "Borchardts Market", type: 'Grocery', distance: '2 mi' },
      { name: 'Irish Hills Perky Pantry', type: 'Convenience', distance: '3 mi' },
      { name: 'Meijer (Adrian)', type: 'Grocery & General', distance: '16 mi' },
      { name: 'Walmart (Adrian)', type: 'General', distance: '16 mi' },
    ],
    medical: [
      { name: 'ProMedica Hickman Hospital', type: 'Hospital / ER', distance: '16 mi' },
      { name: 'Main Street Urgent Care (Adrian)', type: 'Walk-in Clinic', distance: '16 mi' },
    ],
    utilities: {
      water: 'Private well', sewer: 'Septic system', electric: 'Midwest Energy & Communications',
      gas: 'Propane (no natural gas)', internet: 'D&P Communications, Frontier, Starlink',
      garbage: 'Private hauler (contract)', township: 'Rollin Township',
    },
    recreation: [
      { name: 'W.J. Hayes State Park', type: 'Beach / Camping / Boat Launch', distance: '2 mi' },
      { name: 'Hidden Lake Gardens (MSU)', type: 'Botanical Garden', distance: '8 mi' },
      { name: 'Michigan International Speedway', type: 'NASCAR Racing', distance: '10 mi' },
      { name: 'Mystery Hill', type: 'Roadside Attraction', distance: '5 mi' },
    ],
  },

  'cambridge-corridor': {
    distances: [
      { to: 'Ann Arbor', miles: 40, time: '55 min' },
      { to: 'Detroit', miles: 75, time: '1 hr 20 min' },
      { to: 'Jackson', miles: 22, time: '28 min' },
      { to: 'Adrian', miles: 18, time: '25 min' },
      { to: 'Toledo, OH', miles: 52, time: '1 hr 5 min' },
    ],
    schools: [
      { name: 'Onsted Community Schools', type: 'K-12 District', distance: '4 mi', rating: '6/10' },
      { name: 'Columbia School District', type: 'K-12 District', distance: '10 mi', rating: '6/10' },
    ],
    dining: [
      { name: 'Irish Hills Dairy Bar', type: 'Ice Cream / Casual', distance: '3 mi' },
      { name: "Jerry's Pub & Restaurant", type: 'Lakeside Bar & Grill', distance: '6 mi' },
      { name: 'Artesian Wells Sports Tavern', type: 'Sports Bar & Patio', distance: '8 mi' },
      { name: "Shady's Tap Room", type: 'Irish Pub / Craft Beer', distance: '8 mi' },
      { name: 'Cherry Creek Cellars', type: 'Winery & Cafe', distance: '7 mi' },
    ],
    shopping: [
      { name: "Borchardts Market", type: 'Grocery', distance: '4 mi' },
      { name: 'Country Market (Brooklyn)', type: 'Grocery', distance: '8 mi' },
      { name: 'Downtown Brooklyn Shops', type: 'Boutiques & Antiques', distance: '8 mi' },
      { name: 'Meijer (Adrian)', type: 'Grocery & General', distance: '18 mi' },
    ],
    medical: [
      { name: 'ProMedica Hickman Hospital', type: 'Hospital / ER', distance: '18 mi' },
      { name: 'Henry Ford Jackson Hospital', type: 'Hospital', distance: '25 mi' },
      { name: 'Main Street Urgent Care (Adrian)', type: 'Walk-in Clinic', distance: '18 mi' },
    ],
    utilities: {
      water: 'Private well', sewer: 'Septic system', electric: 'Midwest Energy & Communications',
      gas: 'Propane (no natural gas)', internet: 'D&P Communications, Frontier fiber, Starlink',
      garbage: 'Private hauler (contract)', township: 'Cambridge Township',
    },
    recreation: [
      { name: 'Walker Tavern Historic State Park', type: 'Historic Site', distance: '0 mi' },
      { name: 'W.J. Hayes State Park', type: 'Beach / Camping', distance: '5 mi' },
      { name: 'Hidden Lake Gardens (MSU)', type: 'Botanical Garden', distance: '8 mi' },
      { name: 'Michigan International Speedway', type: 'NASCAR Racing', distance: '8 mi' },
      { name: 'Mystery Hill', type: 'Roadside Attraction', distance: '3 mi' },
      { name: 'Gauci Golf Resort', type: 'Golf', distance: '4 mi' },
    ],
  },

  'brooklyn-columbia': {
    distances: [
      { to: 'Ann Arbor', miles: 38, time: '51 min' },
      { to: 'Detroit', miles: 82, time: '1 hr 25 min' },
      { to: 'Jackson', miles: 15, time: '21 min' },
      { to: 'Adrian', miles: 22, time: '28 min' },
      { to: 'Toledo, OH', miles: 60, time: '1 hr 10 min' },
    ],
    schools: [
      { name: 'Columbia School District', type: 'K-12 District', distance: '2 mi', rating: '6/10' },
      { name: 'Napoleon Community Schools', type: 'K-12 District', distance: '10 mi', rating: '7/10' },
      { name: 'Jackson Christian School', type: 'Private K-12', distance: '15 mi', rating: '8/10' },
    ],
    dining: [
      { name: "Jerry's Pub & Restaurant", type: 'Lakeside Bar & Grill', distance: '3 mi' },
      { name: "Harold's Place", type: 'Bar & Grill', distance: '2 mi' },
      { name: 'Cherry Creek Cellars', type: 'Winery & Cafe', distance: '4 mi' },
      { name: 'Artesian Wells Sports Tavern', type: 'Sports Bar & Patio', distance: '2 mi' },
      { name: "Shady's Tap Room", type: 'Irish Pub / Craft Beer', distance: '1 mi' },
      { name: 'Brooklyn Big Boy', type: 'Family Restaurant', distance: '1 mi' },
    ],
    shopping: [
      { name: 'Country Market', type: 'Grocery', distance: '1 mi' },
      { name: 'Downtown Brooklyn Shops', type: 'Boutiques & Antiques', distance: '1 mi' },
      { name: 'Meijer (Jackson)', type: 'Grocery & General', distance: '15 mi' },
      { name: 'Walmart (Jackson)', type: 'General', distance: '15 mi' },
    ],
    medical: [
      { name: 'Trinity Health IHA Urgent Care', type: 'Urgent Care', distance: '2 mi' },
      { name: 'Henry Ford Jackson Hospital', type: 'Hospital', distance: '15 mi' },
      { name: 'Brooklyn Family Medicine', type: 'Primary Care', distance: '1 mi' },
    ],
    utilities: {
      water: 'Private well (village has municipal)', sewer: 'Septic (village has municipal)', electric: 'Consumers Energy',
      gas: 'DTE Energy (select areas)', internet: 'Comcast, Frontier, Starlink',
      garbage: 'Republic Services', township: 'Columbia Township',
    },
    recreation: [
      { name: 'Michigan International Speedway', type: 'NASCAR Racing', distance: '3 mi' },
      { name: 'Cherry Creek Cellars', type: 'Winery & Live Music', distance: '4 mi' },
      { name: "Hills' Heart of the Lakes Golf Course", type: 'Golf (18-hole)', distance: '2 mi' },
      { name: 'Cascades Falls Park', type: 'Waterfall / Park', distance: '15 mi' },
    ],
  },

  'jerome-somerset': {
    distances: [
      { to: 'Ann Arbor', miles: 50, time: '1 hr' },
      { to: 'Detroit', miles: 95, time: '1 hr 40 min' },
      { to: 'Jackson', miles: 22, time: '30 min' },
      { to: 'Hillsdale', miles: 12, time: '18 min' },
      { to: 'Toledo, OH', miles: 65, time: '1 hr 10 min' },
    ],
    schools: [
      { name: 'North Adams-Jerome Schools', type: 'K-12 District', distance: '3 mi', rating: '5/10' },
      { name: 'Hillsdale Community Schools', type: 'K-12 District', distance: '12 mi', rating: '6/10' },
      { name: 'Hillsdale Academy', type: 'Private K-12', distance: '12 mi', rating: '9/10' },
    ],
    dining: [
      { name: 'The Deck Down Under', type: 'Lakeside Bar & Grill', distance: '4 mi' },
      { name: 'Jerome Country Store', type: 'Deli / Convenience', distance: '1 mi' },
      { name: 'Downtown Hillsdale restaurants', type: 'Various', distance: '12 mi' },
    ],
    shopping: [
      { name: 'Jerome Country Market', type: 'General Store', distance: '1 mi' },
      { name: 'Walmart (Hillsdale)', type: 'Grocery & General', distance: '12 mi' },
      { name: 'Downtown Hillsdale', type: 'Shops & Boutiques', distance: '12 mi' },
    ],
    medical: [
      { name: 'Hillsdale Hospital', type: 'Hospital / ER', distance: '12 mi' },
      { name: 'ProMedica Hickman Hospital', type: 'Hospital / ER', distance: '19 mi' },
    ],
    utilities: {
      water: 'Private well', sewer: 'Septic system', electric: 'Consumers Energy',
      gas: 'Propane only', internet: 'Spectrum (96% coverage), Frontier, Starlink',
      garbage: 'Private hauler (contract)', township: 'Jefferson / Somerset Township',
    },
    recreation: [
      { name: 'McCourtie Park', type: 'Historic Park / Concrete Trees', distance: '4 mi' },
      { name: 'Bundy Hill Off Road Park', type: 'Off-Road / ATV', distance: '8 mi' },
      { name: 'Lake LeAnn', type: 'Private Lake Community', distance: '5 mi' },
      { name: 'Hillsdale College events', type: 'Culture / Sports', distance: '12 mi' },
    ],
  },

  'grass-lake-michigan-center': {
    distances: [
      { to: 'Ann Arbor', miles: 27, time: '30 min' },
      { to: 'Detroit', miles: 72, time: '1 hr 15 min' },
      { to: 'Jackson', miles: 10, time: '15 min' },
      { to: 'Lansing', miles: 40, time: '45 min' },
      { to: 'Toledo, OH', miles: 75, time: '1 hr 20 min' },
    ],
    schools: [
      { name: 'Grass Lake Community Schools', type: 'K-12 District', distance: '1 mi', rating: '7/10' },
      { name: 'East Jackson Community Schools', type: 'K-12 District', distance: '5 mi', rating: '5/10' },
      { name: 'Napoleon Community Schools', type: 'K-12 District', distance: '8 mi', rating: '7/10' },
    ],
    dining: [
      { name: 'Clear Lake Brewery', type: 'Brewpub', distance: '3 mi' },
      { name: 'Grass Lake Brewing Company', type: 'Brewpub', distance: '1 mi' },
      { name: 'The Juicy Tavern', type: 'Bar & Grill', distance: '4 mi' },
      { name: 'Downtown Grass Lake eateries', type: 'Various', distance: '1 mi' },
    ],
    shopping: [
      { name: "Frank's Shop-Rite", type: 'Grocery', distance: '1 mi' },
      { name: 'Grass Lake Village Shops', type: 'General', distance: '1 mi' },
      { name: 'Meijer (Jackson)', type: 'Grocery & General', distance: '10 mi' },
      { name: 'Jackson Crossing Mall', type: 'Mall', distance: '12 mi' },
    ],
    medical: [
      { name: 'Henry Ford Family Medicine', type: 'Primary Care', distance: '1 mi' },
      { name: 'Henry Ford Allegiance Health', type: 'Hospital', distance: '10 mi' },
      { name: 'Urgent Care - Jackson', type: 'Walk-in Clinic', distance: '10 mi' },
    ],
    utilities: {
      water: 'Municipal (village) / Private well (rural)', sewer: 'Municipal (village) / Septic (rural)', electric: 'Consumers Energy',
      gas: 'DTE Energy / Consumers Energy', internet: 'Comcast, Frontier, Starlink',
      garbage: 'Republic Services', township: 'Grass Lake Township / Leoni Township',
    },
    recreation: [
      { name: 'Waterloo Recreation Area', type: 'Hiking / Camping / Trails (20,000 acres)', distance: '5 mi' },
      { name: 'Michigan Center 7-Lake Chain', type: 'Boating / Fishing', distance: '3 mi' },
      { name: 'Cascades Falls Park', type: 'Waterfall / Park', distance: '10 mi' },
      { name: 'Ella Sharp Museum', type: 'Art / History', distance: '12 mi' },
    ],
  },

  'tecumseh-eastern': {
    distances: [
      { to: 'Ann Arbor', miles: 25, time: '35 min' },
      { to: 'Detroit', miles: 60, time: '1 hr 10 min' },
      { to: 'Jackson', miles: 38, time: '48 min' },
      { to: 'Adrian', miles: 12, time: '16 min' },
      { to: 'Toledo, OH', miles: 42, time: '50 min' },
    ],
    schools: [
      { name: 'Tecumseh Public Schools', type: 'K-12 District', distance: '1 mi', rating: '7/10' },
      { name: 'Lenawee Christian School', type: 'Private K-12', distance: '12 mi', rating: '8/10' },
    ],
    dining: [
      { name: 'Tecumseh Brewing Company', type: 'Brewpub', distance: 'Downtown' },
      { name: 'Basil Boys', type: 'Fast Casual Italian', distance: 'Downtown' },
      { name: "Salsaria's Mexican Restaurant", type: 'Mexican', distance: 'Downtown' },
      { name: 'Embers Bar & Grill', type: 'American', distance: 'Downtown' },
      { name: 'Pentamere Winery', type: 'Winery & Tasting Room', distance: 'Downtown' },
      { name: 'The British Tea Garden & Rooftop Cafe', type: 'British / Luncheon', distance: 'Downtown' },
      { name: "Sal's Italian Restaurant", type: 'Italian / Pizza', distance: 'Downtown' },
    ],
    shopping: [
      { name: "Busch's Fresh Food Market", type: 'Full Grocery', distance: '1.5 mi' },
      { name: "Jerry's Market", type: 'Grocery & Deli', distance: '0.5 mi' },
      { name: 'Downtown Tecumseh', type: '110+ Boutiques & Shops', distance: '0 mi' },
      { name: 'Kapnick Orchards', type: 'Farm Market (seasonal)', distance: '3 mi' },
      { name: 'Walmart / Meijer (Adrian)', type: 'Big Box', distance: '12 mi' },
    ],
    medical: [
      { name: 'Tecumseh Urgent Care', type: 'Walk-in Clinic', distance: '0.5 mi' },
      { name: 'ProMedica Health Specialists', type: 'Primary Care', distance: '0.5 mi' },
      { name: 'ProMedica Hickman Hospital', type: 'Hospital / ER', distance: '10 mi' },
    ],
    utilities: {
      water: 'Municipal (city) / Private well (township)', sewer: 'Municipal (city) / Septic (township)', electric: 'DTE Energy / Consumers Energy',
      gas: 'DTE Energy (MichCon)', internet: 'Frontier fiber (7 Gbps), D&P Communications, Starlink',
      garbage: 'Stevens Disposal & Recycling', township: 'Tecumseh Township',
    },
    recreation: [
      { name: 'Tecumseh Center for the Arts', type: 'Performing Arts (572 seats)', distance: '0.3 mi' },
      { name: 'Indian Crossing Trails', type: 'Trails / Kayak Launch (300+ acres)', distance: '1 mi' },
      { name: 'Art Trail Tecumseh', type: 'Outdoor Sculpture Exhibit', distance: '0 mi' },
      { name: 'River Raisin', type: 'Kayaking / Canoeing / Fishing', distance: '0 mi' },
      { name: 'Adams Park', type: 'Music in the Park / Events', distance: '0.1 mi' },
    ],
  },
};

// Property type labels and icons
export const propertyTypes = {
  lakefront: { label: 'Lakefront', description: 'Direct waterfront with private shoreline' },
  'lake-access': { label: 'Lake Access', description: 'Deeded access to the lake, short walk to water' },
  residential: { label: 'Residential', description: 'Village or subdivision homes' },
  rural: { label: 'Rural / Acreage', description: 'Country properties with land' },
  farm: { label: 'Farms & Barns', description: 'Agricultural properties, hobby farms, barns' },
  cottage: { label: 'Cottages', description: 'Seasonal or year-round cottages' },
  historic: { label: 'Historic Homes', description: 'Architecturally significant or period homes' },
  commercial: { label: 'Commercial', description: 'Inns, storefronts, and income properties' },
  land: { label: 'Land & Lots', description: 'Buildable lots and acreage' },
};

// Holly's active listings, pulled from her MLS feed (MiRealSource) on 2026-09-15.
// Each listing carries a stable `slug`: it keys every engagement blob and the
// seller report, so it must never change once a listing is live.
// listedOn (YYYY-MM-DD) drives days-on-market. sellerEmail opts the listing
// into the weekly seller report; null means no report is generated.
//
// When a listing sells, DO NOT delete it. Set status: 'sold', soldOn: 'YYYY-MM-DD',
// soldPrice: '$…' and leave everything else in place. The page flips to a
// "Sold in N days at X% of list" badge, joins /sold, and feeds the lake track
// record. Sold pages are the proof Holly texts before a listing appointment.
// Past sales from before this site existed can be added the same way with a
// minimal record (slug, title, address, lake, region, type, price, listedOn,
// soldOn, soldPrice, image optional).
// `image` is the card/hero cover; `photos` feeds the property-page gallery.
// `geo` is lat/lng from the US Census geocoder (public domain), used for the
// sold-pins map; a listing without geo simply has no pin.
// Photos live in /public/listings/<slug>/ so the site never depends on MLS CDN URLs.
const photoSet = (slug, n) => Array.from({ length: n }, (_, i) => `/listings/${slug}/${String(i + 1).padStart(2, '0')}.webp`);

export const propertiesData = [
  {
    id: 1, slug: '7296-walnut-hill-road-manitou-beach', mls: '50212587', geo: { lat: 41.99993, lng: -84.29065 },
    region: 'manitou-beach', lake: 'devils-lake', type: 'lakefront',
    title: '7296 Walnut Hill Road', address: '7296 Walnut Hill Road, Manitou Beach, MI 49253',
    price: '$849,000', beds: 4, baths: 3, sqft: '1,700', yearBuilt: 1942,
    summary: 'Fully renovated 2021 Devils Lake retreat with walkout basement and a finished barn',
    description: "Welcome to your Devils Lake retreat! This beautifully updated 4-bedroom, 3-bathroom home offers the perfect blend of modern amenities, functional living space, and the lake lifestyle you've been dreaming about. Completely renovated in 2021, this move-in-ready home features stylish finishes, updated mechanicals, and a thoughtfully designed layout that provides plenty of room for family and guests. The spacious main living areas are ideal for entertaining, while the walkout basement offers additional living space, easy outdoor access, and endless possibilities for recreation, a home office, or guest accommodations. Storage and parking are abundant with ample driveway space, attached storage options, and a large barn perfect for boats, lake toys, vehicles, workshop space, or hobby enthusiasts. The barn has been finished into additional entertaining space with a split unit for AC and heat. Located in the heart of Manitou Beach, you'll enjoy easy access to all that the Irish Hills has to offer, including boating, fishing, dining, local events, and charming lakeside attractions.",
    image: '/listings/7296-walnut-hill-road-manitou-beach/01.webp', photos: photoSet('7296-walnut-hill-road-manitou-beach', 8),
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: '2026-08-06', status: 'active', sellerName: null, sellerEmail: null,
  },
  {
    id: 2, slug: '4834-round-lake-highway-devils-lake', mls: '50208730', geo: { lat: 41.99975, lng: -84.28091 },
    region: 'manitou-beach', lake: 'devils-lake', type: 'lakefront',
    title: '4834 Round Lake Highway', address: '4834 Round Lake Highway, Manitou Beach, MI 49253',
    price: '$549,900', beds: 3, baths: 1, sqft: '709', yearBuilt: 1940,
    summary: 'Turnkey furnished lakefront cottage on all-sports Devils Lake, pontoon and dock included',
    description: "Welcome to 4834 Round Lake Hwy in beautiful Manitou Beach on all-sports Devils Lake! This charming lakefront retreat offers breathtaking water views, endless opportunities for lake living, and the perfect place to relax and make lifelong memories. Featuring 3 bedrooms and 1 bathroom, this cozy cottage blends classic lake charm with everything you need to start enjoying summer immediately. The home is efficiently heated and cooled with a mini-split system. Being sold fully furnished and turnkey, this property is truly move-in ready: just bring your suitcase and start enjoying lake life! Everything stays, including a 2003 Sweetwater pontoon boat and a 2024 aluminum Ultimate dock system. This property also offers a strong rental history, creating excellent investment potential for those seeking a vacation rental, weekend getaway, or income-producing lakefront property. Conveniently located near local restaurants, entertainment, golf courses, and the charm of Manitou Beach.",
    image: '/listings/4834-round-lake-highway-devils-lake/01.webp', photos: photoSet('4834-round-lake-highway-devils-lake', 8),
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: '2026-09-04', status: 'active', sellerName: null, sellerEmail: null,
  },
  {
    id: 3, slug: 'devils-lake-inn-103-walnut-street', mls: '50210955', geo: { lat: 41.97079, lng: -84.30954 },
    region: 'manitou-beach', lake: null, type: 'commercial',
    title: 'Devils Lake Inn', address: '103 Walnut Street, Manitou Beach, MI 49253',
    price: '$325,000', beds: null, baths: null, sqft: '2,006', yearBuilt: 1900,
    summary: 'Turn-key boutique inn in the walkable heart of Manitou Beach, with leased retail space',
    description: "Turn-Key Boutique Inn Opportunity in the Heart of Manitou Beach. Welcome to Devils Lake Inn, a rare investment opportunity located in the heart of Manitou Beach, often referred to as the \"Saugatuck of the Irish Hills.\" Nestled within a charming walkable village filled with local shops, restaurants, galleries, and year-round recreation, this established boutique inn offers the perfect blend of hospitality and small-town lake living. The property features beautifully designed custom-themed guest suites with upscale finishes, modern conveniences, and thoughtfully curated decor that has created a loyal following of repeat visitors. The sale includes the established business website, all furniture, decor, bedding, and appliances, allowing the next owner to seamlessly continue operations from day one. In addition, the building includes a retail space currently leased on a month-to-month basis. 103 Walnut Street can also be purchased together with the neighboring Devils Lake Inn Too at 175 Walnut Street (see MLS# 50197252).",
    image: '/listings/devils-lake-inn-103-walnut-street/01.webp', photos: photoSet('devils-lake-inn-103-walnut-street', 8),
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: '2026-08-17', status: 'active', sellerName: null, sellerEmail: null,
  },
  {
    id: 4, slug: 'devils-lake-inn-too-175-walnut-street', mls: '50210959', geo: { lat: 41.97079, lng: -84.30829 },
    region: 'manitou-beach', lake: null, type: 'commercial',
    title: 'Devils Lake Inn Too', address: '175 Walnut Street, Manitou Beach, MI 49253',
    price: '$325,000', beds: null, baths: null, sqft: '2,128', yearBuilt: 1920,
    summary: 'Operating boutique inn steps from Devils Lake, with a separate leased apartment',
    description: "Introducing Devils Lake Inn Too, a fully operational boutique hospitality property located in the heart of Manitou Beach, known as the \"Saugatuck of the Irish Hills.\" Just steps from Devils Lake, local restaurants, boutiques, galleries, and year-round entertainment, this unique property offers an incredible opportunity to own a thriving hospitality business in a premier lake community. The property features beautifully appointed custom-themed guest suites designed with upscale finishes and modern amenities. In addition, the building includes a separate apartment leased through September 2026, providing immediate rental income and future flexibility for an owner-occupant, manager's quarters, or additional rental opportunity. The sale includes the established website, all furniture, decor, bedding, and appliances. 175 Walnut Street is also available as part of a package with the neighboring Devils Lake Inn at 103 Walnut Street (see MLS# 50197252). Sale does not include lawnmower or personal items located in the shed.",
    image: '/listings/devils-lake-inn-too-175-walnut-street/01.webp', photos: photoSet('devils-lake-inn-too-175-walnut-street', 8),
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: '2026-09-15', status: 'active', sellerName: null, sellerEmail: null,
  },
  {
    id: 5, slug: 'devils-lake-inns-portfolio-walnut-street', mls: '50197252', geo: { lat: 41.97079, lng: -84.30829 },
    region: 'manitou-beach', lake: null, type: 'commercial',
    title: 'Devils Lake Inn + Inn Too (Both Properties)', address: '103 & 175 Walnut Street, Manitou Beach, MI 49253',
    price: '$625,000', beds: null, baths: null, sqft: '4,134', yearBuilt: 1920,
    summary: 'Two operating boutique inns sold together: six themed suites, retail space, and an apartment',
    description: "A rare, turn-key hospitality opportunity in the heart of Manitou Beach, often referred to as the \"Saugatuck of the Irish Hills.\" This offering includes two fully operational boutique inns: Devils Lake Inn (103 Walnut St) and Devils Lake Inn Too (175 Walnut St). Located in the walkable village setting surrounded by shops, restaurants, galleries, and year-round recreation. Together, the properties feature six custom-themed guest suites, a retail space (month-to-month lease), and a separate apartment currently rented through September 2026, providing immediate income with future owner-occupant or rental flexibility. The sale includes both properties, established website, and all furniture, decor, bedding, and appliances, making this a true turn-key business. Ideal for investors or owner-operators seeking a proven hospitality asset in one of Southern Michigan's most desirable lake communities. Sale does not include lawnmower or personal items in the shed.",
    image: '/listings/devils-lake-inns-portfolio-walnut-street/01.webp', photos: photoSet('devils-lake-inns-portfolio-walnut-street', 8),
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: '2026-04-16', status: 'active', sellerName: null, sellerEmail: null,
  },
  {
    id: 6, slug: '10314-ferris-court-lake-somerset', mls: '50204928', geo: { lat: 42.04923, lng: -84.38773 },
    region: 'jerome-somerset', lake: null, type: 'land',
    title: '10314 Ferris Court', address: '10314 Ferris Court, Somerset, MI 49233',
    price: '$48,900', beds: null, baths: null, sqft: null, lot: '1.76 acres (4 lots)', yearBuilt: null,
    summary: '1.76 acres across four lots with association access and boating privileges on Lake Somerset',
    description: "Build your dream home on 1.76 acres (4 lots) with association access on Lake Somerset with boating privileges! Enjoy the association parks, playgrounds, fireworks, picnics, and so much more.",
    image: '/listings/10314-ferris-court-lake-somerset/01.webp', photos: photoSet('10314-ferris-court-lake-somerset', 8),
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: null, status: 'active', sellerName: null, sellerEmail: null,
  },

  // Closed sales Jan-Sep 2026, imported from Holly's Paragon "Sales Detail" export
  // (Board LCAR, as of 2026-09-16). The export carries sale price, close date,
  // DOM (list to pending) and which side(s) Holly represented. It does not carry
  // list price (so % of list stays hidden until a Paragon report with Original
  // List Price is supplied), photos (an aerial rendered from the address stands
  // in until Holly supplies listing photos she has rights to), or beds/baths.
  // `lake` is set only where the street is unambiguous lake frontage; the rest
  // stay null until Holly confirms. `side`: 'list' | 'buyer' | 'both'.
  {
    id: 7, slug: '4108-woodland-avenue-manitou-beach', mls: '50220406', geo: { lat: 41.98914, lng: -84.28144 },
    region: 'manitou-beach', lake: 'devils-lake', type: 'lakefront',
    title: '4108 Woodland Avenue', address: '4108 Woodland Avenue, Manitou Beach, MI',
    price: null, beds: null, baths: null, sqft: null, yearBuilt: null,
    summary: null, description: null, image: null, photos: [],
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: null, status: 'sold', soldOn: '2026-08-31', soldPrice: '$810,000', dom: 0, side: 'both',
    sellerName: null, sellerEmail: null,
  },
  {
    id: 8, slug: '1100-elm-block-street-manitou-beach', mls: '50203243',
    region: 'manitou-beach', lake: null, type: null,
    title: '1100 Elm Block Street', address: '1100 Elm Block Street, Manitou Beach, MI',
    price: null, beds: null, baths: null, sqft: null, yearBuilt: null,
    summary: null, description: null, image: null, photos: [],
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: null, status: 'sold', soldOn: '2026-08-28', soldPrice: '$75,000', dom: 29, side: 'list',
    sellerName: null, sellerEmail: null,
  },
  {
    id: 9, slug: '295-ridgeway-drive-brooklyn', mls: '50213639', geo: { lat: 42.06613, lng: -84.17038 },
    region: 'brooklyn-columbia', lake: 'lake-columbia', type: 'lakefront',
    title: '295 Ridgeway Drive', address: '295 Ridgeway Drive, Brooklyn, MI',
    price: null, beds: null, baths: null, sqft: null, yearBuilt: null,
    summary: null, description: null, image: null, photos: [],
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: null, status: 'sold', soldOn: '2026-08-26', soldPrice: '$310,000', dom: 46, side: 'list',
    sellerName: null, sellerEmail: null,
  },
  {
    id: 10, slug: '1140-n-posey-lake-highway-hudson', mls: '50219424', geo: { lat: 41.9025, lng: -84.29214 },
    region: 'southern-lakes', lake: 'posey-lake', type: 'lakefront',
    title: '1140 N Posey Lake Highway', address: '1140 N Posey Lake Highway, Hudson, MI',
    price: null, beds: null, baths: null, sqft: null, yearBuilt: null,
    summary: null, description: null, image: null, photos: [],
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: null, status: 'sold', soldOn: '2026-08-20', soldPrice: '$560,000', dom: 0, side: 'both',
    sellerName: null, sellerEmail: null,
  },
  {
    id: 11, slug: '746-saint-joseph-street-adrian', mls: '50214685', geo: { lat: 41.90195, lng: -84.04778 },
    region: 'tecumseh-eastern', lake: null, type: null,
    title: '746 Saint Joseph Street', address: '746 Saint Joseph Street, Adrian, MI',
    price: null, beds: null, baths: null, sqft: null, yearBuilt: null,
    summary: null, description: null, image: null, photos: [],
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: null, status: 'sold', soldOn: '2026-08-12', soldPrice: '$215,000', dom: 1, side: 'list',
    sellerName: null, sellerEmail: null,
  },
  {
    id: 12, slug: '3493-round-lake-highway-manitou-beach', mls: '50208484', geo: { lat: 41.98142, lng: -84.27726 },
    region: 'manitou-beach', lake: 'devils-lake', type: 'lakefront',
    title: '3493 Round Lake Highway', address: '3493 Round Lake Highway, Manitou Beach, MI',
    price: null, beds: null, baths: null, sqft: null, yearBuilt: null,
    summary: null, description: null, image: null, photos: [],
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: null, status: 'sold', soldOn: '2026-08-07', soldPrice: '$1,100,000', dom: 45, side: 'list',
    sellerName: null, sellerEmail: null,
  },
  {
    id: 13, slug: '2892-round-lake-highway-manitou-beach', mls: '50210087', geo: { lat: 41.97429, lng: -84.28205 },
    region: 'manitou-beach', lake: 'devils-lake', type: 'lakefront',
    title: '2892 Round Lake Highway', address: '2892 Round Lake Highway, Manitou Beach, MI',
    price: null, beds: null, baths: null, sqft: null, yearBuilt: null,
    summary: null, description: null, image: null, photos: [],
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: null, status: 'sold', soldOn: '2026-07-24', soldPrice: '$1,050,000', dom: 29, side: 'list',
    sellerName: null, sellerEmail: null,
  },
  {
    id: 14, slug: '786-brookview-drive-hudson', mls: '50209350', geo: { lat: 41.86535, lng: -84.33662 },
    region: 'southern-lakes', lake: null, type: null,
    title: '786 Brookview Drive', address: '786 Brookview Drive, Hudson, MI',
    price: null, beds: null, baths: null, sqft: null, yearBuilt: null,
    summary: null, description: null, image: null, photos: [],
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: null, status: 'sold', soldOn: '2026-07-21', soldPrice: '$215,000', dom: 6, side: 'list',
    sellerName: null, sellerEmail: null,
  },
  {
    id: 15, slug: '1220-round-lake-highway-manitou-beach', mls: '50204028', geo: { lat: 41.96702, lng: -84.28566 },
    region: 'manitou-beach', lake: 'devils-lake', type: 'lakefront',
    title: '1220 Round Lake Highway', address: '1220 Round Lake Highway, Manitou Beach, MI',
    price: null, beds: null, baths: null, sqft: null, yearBuilt: null,
    summary: null, description: null, image: null, photos: [],
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: null, status: 'sold', soldOn: '2026-07-10', soldPrice: '$600,000', dom: 81, side: 'list',
    sellerName: null, sellerEmail: null,
  },
  {
    id: 16, slug: '392-egan-highway-brooklyn', mls: '50209635', geo: { lat: 42.06834, lng: -84.16389 },
    region: 'brooklyn-columbia', lake: null, type: null,
    title: '392 Egan Highway', address: '392 Egan Highway, Brooklyn, MI',
    price: null, beds: null, baths: null, sqft: null, yearBuilt: null,
    summary: null, description: null, image: null, photos: [],
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: null, status: 'sold', soldOn: '2026-07-07', soldPrice: '$332,000', dom: 7, side: 'both',
    sellerName: null, sellerEmail: null,
  },
  {
    id: 17, slug: '3940-round-lake-highway-manitou-beach', mls: '50210318', geo: { lat: 41.98637, lng: -84.28075 },
    region: 'manitou-beach', lake: 'devils-lake', type: 'lakefront',
    title: '3940 Round Lake Highway', address: '3940 Round Lake Highway, Manitou Beach, MI',
    price: null, beds: null, baths: null, sqft: null, yearBuilt: null,
    summary: null, description: null, image: null, photos: [],
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: null, status: 'sold', soldOn: '2026-06-26', soldPrice: '$275,000', dom: 1, side: 'list',
    sellerName: null, sellerEmail: null,
  },
  {
    id: 18, slug: '250-sunset-drive-hudson', mls: '50203069', geo: { lat: 41.91052, lng: -84.35018 },
    region: 'southern-lakes', lake: null, type: null,
    title: '250 Sunset Drive', address: '250 Sunset Drive, Hudson, MI',
    price: null, beds: null, baths: null, sqft: null, yearBuilt: null,
    summary: null, description: null, image: null, photos: [],
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: null, status: 'sold', soldOn: '2026-06-26', soldPrice: '$399,000', dom: 86, side: 'buyer',
    sellerName: null, sellerEmail: null,
  },
  {
    id: 19, slug: '17059-south-street-hudson', mls: '50207686', geo: { lat: 41.91024, lng: -84.32473 },
    region: 'southern-lakes', lake: null, type: null,
    title: '17059 South Street', address: '17059 South Street, Hudson, MI',
    price: null, beds: null, baths: null, sqft: null, yearBuilt: null,
    summary: null, description: null, image: null, photos: [],
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: null, status: 'sold', soldOn: '2026-06-25', soldPrice: '$129,900', dom: 1, side: 'both',
    sellerName: null, sellerEmail: null,
  },
  {
    id: 20, slug: '5480-pleasant-valley-road-manitou-beach', mls: '50207661', geo: { lat: 41.96001, lng: -84.27052 },
    region: 'manitou-beach', lake: null, type: null,
    title: '5480 Pleasant Valley Road', address: '5480 Pleasant Valley Road, Manitou Beach, MI',
    price: null, beds: null, baths: null, sqft: null, yearBuilt: null,
    summary: null, description: null, image: null, photos: [],
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: null, status: 'sold', soldOn: '2026-06-17', soldPrice: '$752,550', dom: 3, side: 'list',
    sellerName: null, sellerEmail: null,
  },
  {
    id: 21, slug: '9254-cherry-point-road-manitou-beach', mls: '50203225', geo: { lat: 41.98039, lng: -84.30355 },
    region: 'manitou-beach', lake: 'devils-lake', type: 'lakefront',
    title: '9254 Cherry Point Road', address: '9254 Cherry Point Road, Manitou Beach, MI',
    price: null, beds: null, baths: null, sqft: null, yearBuilt: null,
    summary: null, description: null, image: null, photos: [],
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: null, status: 'sold', soldOn: '2026-06-15', soldPrice: '$810,000', dom: 32, side: 'both',
    sellerName: null, sellerEmail: null,
  },
  {
    id: 22, slug: '151-n-lakeview-boulevard-manitou-beach', mls: '50203244', geo: { lat: 41.968, lng: -84.30831 },
    region: 'manitou-beach', lake: null, type: null,
    title: '151 N Lakeview Boulevard', address: '151 N Lakeview Boulevard, Manitou Beach, MI',
    price: null, beds: null, baths: null, sqft: null, yearBuilt: null,
    summary: null, description: null, image: null, photos: [],
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: null, status: 'sold', soldOn: '2026-05-22', soldPrice: '$175,900', dom: 20, side: 'list',
    sellerName: null, sellerEmail: null,
  },
  {
    id: 23, slug: '4630-woerner-road-manitou-beach', mls: '50203300', geo: { lat: 41.95741, lng: -84.27503 },
    region: 'manitou-beach', lake: null, type: null,
    title: '4630 Woerner Road', address: '4630 Woerner Road, Manitou Beach, MI',
    price: null, beds: null, baths: null, sqft: null, yearBuilt: null,
    summary: null, description: null, image: null, photos: [],
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: null, status: 'sold', soldOn: '2026-05-22', soldPrice: '$750,000', dom: 46, side: 'buyer',
    sellerName: null, sellerEmail: null,
  },
  {
    id: 24, slug: '10291-glencoe-road-jerome', mls: '50190682', geo: { lat: 42.04848, lng: -84.43864 },
    region: 'jerome-somerset', lake: null, type: null,
    title: '10291 Glencoe Road', address: '10291 Glencoe Road, Jerome, MI',
    price: null, beds: null, baths: null, sqft: null, yearBuilt: null,
    summary: null, description: null, image: null, photos: [],
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: null, status: 'sold', soldOn: '2026-05-18', soldPrice: '$285,000', dom: 174, side: 'both',
    sellerName: null, sellerEmail: null,
  },
  {
    id: 25, slug: '1244-van-sickle-drive-hillsdale', mls: '50194580', geo: { lat: 41.80942, lng: -84.63649 },
    region: 'jerome-somerset', lake: null, type: null,
    title: '1244 Van sickle Drive', address: '1244 Van sickle Drive, Hillsdale, MI',
    price: null, beds: null, baths: null, sqft: null, yearBuilt: null,
    summary: null, description: null, image: null, photos: [],
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: null, status: 'sold', soldOn: '2026-05-11', soldPrice: '$285,000', dom: 143, side: 'list',
    sellerName: null, sellerEmail: null,
  },
  {
    id: 26, slug: '11360-w-ferndale-drive-manitou-beach', mls: '50201525', geo: { lat: 41.97385, lng: -84.28162 },
    region: 'manitou-beach', lake: null, type: null,
    title: '11360 W Ferndale Drive', address: '11360 W Ferndale Drive, Manitou Beach, MI',
    price: null, beds: null, baths: null, sqft: null, yearBuilt: null,
    summary: null, description: null, image: null, photos: [],
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: null, status: 'sold', soldOn: '2026-05-11', soldPrice: '$344,000', dom: 56, side: 'list',
    sellerName: null, sellerEmail: null,
  },
  {
    id: 27, slug: '6700-hallenbeck-highway-manitou-beach', mls: '50168279', geo: { lat: 41.98284, lng: -84.26658 },
    region: 'manitou-beach', lake: null, type: null,
    title: '6700 Hallenbeck Highway', address: '6700 Hallenbeck Highway, Manitou Beach, MI',
    price: null, beds: null, baths: null, sqft: null, yearBuilt: null,
    summary: null, description: null, image: null, photos: [],
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: null, status: 'sold', soldOn: '2026-05-08', soldPrice: '$275,000', dom: 385, side: 'list',
    sellerName: null, sellerEmail: null,
  },
  {
    id: 28, slug: '792-meadowbrook-drive-hudson', mls: '50200406', geo: { lat: 41.86534, lng: -84.33513 },
    region: 'southern-lakes', lake: null, type: null,
    title: '792 Meadowbrook Drive', address: '792 Meadowbrook Drive, Hudson, MI',
    price: null, beds: null, baths: null, sqft: null, yearBuilt: null,
    summary: null, description: null, image: null, photos: [],
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: null, status: 'sold', soldOn: '2026-04-16', soldPrice: '$233,000', dom: 23, side: 'buyer',
    sellerName: null, sellerEmail: null,
  },
  {
    id: 29, slug: '12677-us-223-highway-manitou-beach', mls: '50199327', geo: { lat: 41.97511, lng: -84.23997 },
    region: 'manitou-beach', lake: null, type: null,
    title: '12677 US-223 Highway', address: '12677 US-223 Highway, Manitou Beach, MI',
    price: null, beds: null, baths: null, sqft: null, yearBuilt: null,
    summary: null, description: null, image: null, photos: [],
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: null, status: 'sold', soldOn: '2026-03-16', soldPrice: '$85,000', dom: 15, side: 'list',
    sellerName: null, sellerEmail: null,
  },
  {
    id: 30, slug: '14401-limerick-lane-somerset', mls: '50197126', geo: { lat: 42.05564, lng: -84.37393 },
    region: 'jerome-somerset', lake: null, type: null,
    title: '14401 Limerick Lane', address: '14401 Limerick Lane, Somerset, MI',
    price: null, beds: null, baths: null, sqft: null, yearBuilt: null,
    summary: null, description: null, image: null, photos: [],
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: null, status: 'sold', soldOn: '2026-02-04', soldPrice: '$243,000', dom: 7, side: 'list',
    sellerName: null, sellerEmail: null,
  },
  {
    id: 31, slug: '236-s-steer-street-addison', mls: '50183053', geo: { lat: 41.98355, lng: -84.35226 },
    region: 'manitou-beach', lake: null, type: null,
    title: '236 S Steer Street', address: '236 S Steer Street, Addison, MI',
    price: null, beds: null, baths: null, sqft: null, yearBuilt: null,
    summary: null, description: null, image: null, photos: [],
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: null, status: 'sold', soldOn: '2026-01-30', soldPrice: '$222,500', dom: 151, side: 'list',
    sellerName: null, sellerEmail: null,
  },
  {
    id: 32, slug: '2262-heatherwood-drive-adrian', mls: '50197910', geo: { lat: 41.91489, lng: -84.06271 },
    region: 'tecumseh-eastern', lake: null, type: null,
    title: '2262 Heatherwood Drive', address: '2262 Heatherwood Drive, Adrian, MI',
    price: null, beds: null, baths: null, sqft: null, yearBuilt: null,
    summary: null, description: null, image: null, photos: [],
    gradient: 'linear-gradient(135deg, #1c2b29 0%, #237168 100%)',
    listedOn: null, status: 'sold', soldOn: '2026-01-20', soldPrice: '$38,600', dom: 0, side: 'buyer',
    sellerName: null, sellerEmail: null,
  },
];

// Testimonials come live from Google (api/reviews.js); no canned quotes on the site.
export const blogPosts = [
  { id: 1, slug: 'buying-lakefront-michigan', title: 'What to Know Before Buying Lakefront in Michigan', excerpt: 'From septic inspections to seawall conditions, here are the top things every lake buyer needs to check before making an offer.', date: 'Feb 10, 2025', category: 'Buyer Tips', readTime: '5 min read' },
  { id: 2, slug: 'devils-lake-fishing-guide', title: 'The Complete Fishing Guide to Devils Lake', excerpt: "Devils Lake is the largest lake in Lenawee County and home to trophy bass, bluegill, and perch. Here's everything you need to know.", date: 'Jan 28, 2025', category: 'Lake Guides', readTime: '7 min read' },
  { id: 3, slug: 'irish-hills-market-update', title: 'Irish Hills Property Market Update: Winter 2025', excerpt: 'Property inventory remains tight heading into spring across lakes, rural, and village markets. Here are the numbers.', date: 'Jan 15, 2025', category: 'Market Updates', readTime: '4 min read' },
  { id: 4, slug: 'septic-systems-101', title: 'Septic Systems 101: What Every Country Homeowner Should Know', excerpt: 'Most lake and rural properties run on septic. Learn how they work, maintenance schedules, and warning signs of trouble.', date: 'Jan 5, 2025', category: 'Homeowner Tips', readTime: '6 min read' },
  { id: 5, slug: 'best-lakes-for-families', title: 'Top 5 Irish Hills Lakes for Families with Kids', excerpt: 'Sandy beaches, shallow entry, calm waters - these are the lakes where young families thrive.', date: 'Dec 20, 2024', category: 'Lake Guides', readTime: '5 min read' },
  { id: 6, slug: 'winter-lake-home-prep', title: 'Winterizing Your Lake Home: A Complete Checklist', excerpt: "Closing up for winter? Don't skip these critical steps to protect your investment from freeze damage.", date: 'Dec 8, 2024', category: 'Homeowner Tips', readTime: '4 min read' },
  { id: 7, slug: 'tecumseh-hidden-gem', title: 'Why Tecumseh Is Southeast Michigan\'s Best-Kept Secret', excerpt: 'A walkable downtown, thriving arts scene, and country living minutes away. Here\'s why buyers are discovering Tecumseh.', date: 'Nov 20, 2024', category: 'Area Guides', readTime: '5 min read' },
  { id: 8, slug: 'farm-property-guide', title: 'Buying Rural Property in the Irish Hills: What You Need to Know', excerpt: 'Well water, pole barns, land surveys, and zoning - the rural buyer\'s guide to southeast Michigan.', date: 'Nov 5, 2024', category: 'Buyer Tips', readTime: '6 min read' },
];
