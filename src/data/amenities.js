// ═══════════════════════════════════════════════════════════
// AMENITY DATA — Now keyed by REGION instead of individual lake
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
};

// Sample properties (will be replaced by MLS feed)
export const propertiesData = [
  { id: 1, region: 'manitou-beach', lake: 'devils-lake', type: 'lakefront', title: 'Lakefront Colonial', price: '$549,000', beds: 4, baths: 3, sqft: '2,800', description: '80ft of sandy frontage with private dock on Devils Lake', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 2, region: 'manitou-beach', lake: 'devils-lake', type: 'lakefront', title: 'Modern Lake Retreat', price: '$425,000', beds: 3, baths: 2, sqft: '2,200', description: 'Updated kitchen, panoramic Devils Lake views', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 3, region: 'manitou-beach', lake: 'devils-lake', type: 'lake-access', title: 'Charming Cape Cod', price: '$289,000', beds: 3, baths: 2, sqft: '1,600', description: 'Deeded lake access, 2-minute walk to beach', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: 4, region: 'clark-lake', lake: 'clark-lake', type: 'lakefront', title: 'Waterfront Bungalow', price: '$375,000', beds: 3, baths: 2, sqft: '1,800', description: '60ft frontage, updated dock & seawall', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { id: 5, region: 'clark-lake', lake: 'clark-lake', type: 'lakefront', title: 'Premium Lake Estate', price: '$625,000', beds: 5, baths: 4, sqft: '3,400', description: '120ft frontage, in-ground pool, guest house', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { id: 6, region: 'southern-lakes', lake: 'vineyard-lake', type: 'lakefront', title: 'Cozy Lake Cottage', price: '$249,000', beds: 2, baths: 1, sqft: '1,100', description: 'Perfect starter lake home, sandy beach', gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { id: 7, region: 'southern-lakes', lake: 'vineyard-lake', type: 'lake-access', title: 'Family Ranch Home', price: '$195,000', beds: 3, baths: 2, sqft: '1,400', description: 'Shared beach access, large fenced yard', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { id: 8, region: 'jerome-somerset', lake: null, type: 'farm', title: 'Historic Farmstead on 15 Acres', price: '$325,000', beds: 4, baths: 2, sqft: '2,400', description: 'Restored farmhouse, barn, pasture, and pond', gradient: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)' },
  { id: 9, region: 'tecumseh-eastern', lake: null, type: 'historic', title: 'Victorian in Downtown Tecumseh', price: '$289,000', beds: 3, baths: 2, sqft: '2,100', description: 'Beautifully restored, walkable to shops and dining', gradient: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)' },
  { id: 10, region: 'tecumseh-eastern', lake: null, type: 'rural', title: '10-Acre Country Retreat', price: '$275,000', beds: 3, baths: 2, sqft: '1,800', description: 'Private setting, pole barn, woods and meadow', gradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)' },
];

export const testimonials = [
  { quote: "Holly found us the perfect lakefront home on Devils Lake. Her knowledge of every lake in the area is unmatched.", name: "The Peterson Family", location: "Devils Lake" },
  { quote: "We were from out of state and Holly made the entire process seamless. She knows every detail about these communities.", name: "Mark & Susan Chen", location: "Clark Lake" },
  { quote: "Holly's expertise saved us from buying a property with hidden issues. She's not just a realtor, she's the Irish Hills authority.", name: "The Williams Family", location: "Vineyard Lake" },
  { quote: "We wanted a farmstead, not lakefront, and Holly knew every back road and property in the area. Found us exactly what we wanted.", name: "The Garcia Family", location: "Jerome" },
];

export const blogPosts = [
  { id: 1, slug: 'buying-lakefront-michigan', title: 'What to Know Before Buying Lakefront in Michigan', excerpt: 'From septic inspections to seawall conditions, here are the top things every lake buyer needs to check before making an offer.', date: 'Feb 10, 2025', category: 'Buyer Tips', readTime: '5 min read' },
  { id: 2, slug: 'devils-lake-fishing-guide', title: 'The Complete Fishing Guide to Devils Lake', excerpt: "Devils Lake is the largest lake in Lenawee County and home to trophy bass, bluegill, and perch. Here's everything you need to know.", date: 'Jan 28, 2025', category: 'Lake Guides', readTime: '7 min read' },
  { id: 3, slug: 'irish-hills-market-update', title: 'Irish Hills Property Market Update: Winter 2025', excerpt: 'Property inventory remains tight heading into spring across lakes, rural, and village markets. Here are the numbers.', date: 'Jan 15, 2025', category: 'Market Updates', readTime: '4 min read' },
  { id: 4, slug: 'septic-systems-101', title: 'Septic Systems 101: What Every Country Homeowner Should Know', excerpt: 'Most lake and rural properties run on septic. Learn how they work, maintenance schedules, and warning signs of trouble.', date: 'Jan 5, 2025', category: 'Homeowner Tips', readTime: '6 min read' },
  { id: 5, slug: 'best-lakes-for-families', title: 'Top 5 Irish Hills Lakes for Families with Kids', excerpt: 'Sandy beaches, shallow entry, calm waters — these are the lakes where young families thrive.', date: 'Dec 20, 2024', category: 'Lake Guides', readTime: '5 min read' },
  { id: 6, slug: 'winter-lake-home-prep', title: 'Winterizing Your Lake Home: A Complete Checklist', excerpt: "Closing up for winter? Don't skip these critical steps to protect your investment from freeze damage.", date: 'Dec 8, 2024', category: 'Homeowner Tips', readTime: '4 min read' },
  { id: 7, slug: 'tecumseh-hidden-gem', title: 'Why Tecumseh Is Southeast Michigan\'s Best-Kept Secret', excerpt: 'A walkable downtown, thriving arts scene, and country living minutes away. Here\'s why buyers are discovering Tecumseh.', date: 'Nov 20, 2024', category: 'Area Guides', readTime: '5 min read' },
  { id: 8, slug: 'farm-property-guide', title: 'Buying Rural Property in the Irish Hills: What You Need to Know', excerpt: 'Well water, pole barns, land surveys, and zoning — the rural buyer\'s guide to southeast Michigan.', date: 'Nov 5, 2024', category: 'Buyer Tips', readTime: '6 min read' },
];
