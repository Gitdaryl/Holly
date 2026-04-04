// ═══════════════════════════════════════════════════════════
// INDIVIDUAL LAKE DATA - Corrected from Michigan DNR,
// local real estate sources, and verified acreage
// ═══════════════════════════════════════════════════════════

export const lakes = {
  // ── MANITOU BEACH CLUSTER ──
  'devils-lake': {
    name: 'Devils Lake',
    slug: 'devils-lake',
    region: 'manitou-beach',
    acres: 1300,
    depth: 63,
    type: 'all-sports',
    access: 'public',
    tagline: 'Largest lake in Lenawee County',
    description: 'Devils Lake is the largest inland lake in southern lower Michigan, spanning approximately 1,300 acres with depths to 63 feet. Connected to Round Lake via a navigable channel, the two lakes combine for over 1,800 acres of water. Known for exceptional bass, bluegill, and perch fishing. Home to the historic Devils Lake Yacht Club.',
    features: ['~1,300 acres', '63 ft deep', 'Connected to Round Lake', 'No HP restrictions', 'DNR boat launch', 'Yacht club'],
    fishSpecies: ['Largemouth bass', 'Bluegill', 'Perch', 'Northern pike', 'Walleye'],
    association: 'Devils Lake Property Owners Association',
    annualDues: '~$75/year',
    wakeHours: '10 AM – sunset',
    avgPrice: '$475K',
  },
  'round-lake-manitou': {
    name: 'Round Lake (Manitou Beach)',
    slug: 'round-lake-manitou',
    region: 'manitou-beach',
    acres: 500,
    depth: null,
    type: 'all-sports',
    access: 'public',
    tagline: 'Connected to Devils Lake via channel',
    description: 'The larger of Lenawee County\'s two Round Lakes, this approximately 500-acre lake connects to Devils Lake through a navigable channel. Together they form the Manitou Beach lake system - over 1,800 acres of combined surface water.',
    features: ['~500 acres', 'Channel to Devils Lake', 'Part of 1,800-acre system', 'All-sports'],
    fishSpecies: ['Largemouth bass', 'Bluegill', 'Crappie'],
    avgPrice: '$350K',
  },

  // ── ONSTED & HAYES CLUSTER ──
  'wamplers-lake': {
    name: 'Wamplers Lake',
    slug: 'wamplers-lake',
    region: 'onsted-hayes',
    acres: 780,
    depth: 39,
    type: 'all-sports',
    access: 'public',
    tagline: 'State park lake with 780 acres of recreation',
    description: 'Wamplers Lake stretches across the Jackson and Lenawee County line, spanning 780 acres with depths to 39 feet. W.J. Hayes State Park encompasses 654 acres along its shores with a modern campground, large swimming beach, two boat launches, fishing pier, and trails. One of the most popular recreation lakes in southern Michigan.',
    features: ['780 acres', '39 ft deep', 'Hayes State Park', 'All-sports', 'Two boat launches', 'Fishing pier'],
    fishSpecies: ['Largemouth bass', 'Crappie', 'Bluegill', 'Northern pike'],
    association: null,
    wakeHours: 'Sunrise – sunset',
    avgPrice: '$345K',
  },
  'round-lake-hayes': {
    name: 'Round Lake (Hayes State Park)',
    slug: 'round-lake-hayes',
    region: 'onsted-hayes',
    acres: 100,
    depth: null,
    type: 'no-wake',
    access: 'public',
    tagline: 'Peaceful no-wake lake surrounded by state park',
    description: 'The smaller Round Lake - 100 acres of calm, no-wake water completely surrounded by W.J. Hayes State Park. Connected to Wamplers Lake via a channel navigable by smaller boats. A favorite for pan fishing, kayaking, and canoeing.',
    features: ['100 acres', 'No-wake', 'Surrounded by state park', 'Channel to Wamplers', 'Pan fishing'],
    fishSpecies: ['Bluegill', 'Crappie', 'Perch'],
    avgPrice: '$225K',
  },

  // ── CAMBRIDGE & US-12 CORRIDOR ──
  'sand-lake': {
    name: 'Sand Lake',
    slug: 'sand-lake',
    region: 'cambridge-corridor',
    acres: 440,
    depth: 53,
    type: 'all-sports',
    access: 'public',
    tagline: 'Crystal clear water and wooded shorelines',
    description: 'Sand Lake is a 440-acre all-sports lake in the heart of the Irish Hills, reaching 53 feet at its deepest point. Located just south of Wamplers Lake along US-12, it offers stunning water clarity, wooded shorelines, and a tight-knit community. Neighboring Evans Lake is just minutes away.',
    features: ['440 acres', '53 ft deep', 'Crystal clear water', 'All-sports', 'Sandy bottom', 'Wooded shoreline'],
    fishSpecies: ['Largemouth bass', 'Bluegill', 'Northern pike', 'Perch'],
    association: 'Sand Lake Property Owners Association',
    avgPrice: '$310K',
  },
  'evans-lake': {
    name: 'Evans Lake',
    slug: 'evans-lake',
    region: 'cambridge-corridor',
    acres: 201,
    depth: 42,
    type: 'all-sports',
    access: 'public',
    tagline: 'Stunning sunsets and wooded shorelines',
    description: 'Evans Lake is a 201-acre all-sports lake nestled in the Irish Hills, reaching 42 feet deep. Neighboring Sand Lake along the US-12 corridor, these two lakes offer stunning water and wooded shorelines that captivate visitors and residents alike. Beautiful westward-facing sunsets and excellent panfish fishing.',
    features: ['201 acres', '42 ft deep', 'All-sports', 'Amazing sunsets', 'Wooded shoreline'],
    fishSpecies: ['Largemouth bass', 'Bluegill', 'Crappie', 'Perch'],
    avgPrice: '$265K',
  },
  'allen-lake': {
    name: 'Allen Lake',
    slug: 'allen-lake',
    region: 'cambridge-corridor',
    acres: 63,
    depth: 45,
    type: 'all-sports',
    access: 'public',
    tagline: 'Small lake, surprisingly deep',
    description: 'Allen Lake is a 63-acre lake with a surprising 45-foot maximum depth. Accessed via a boat launch on US-12, this smaller lake offers a quiet alternative to the larger lakes in the corridor with good fishing and affordable lakefront.',
    features: ['63 acres', '45 ft deep', 'US-12 boat launch', 'Quiet', 'Affordable'],
    fishSpecies: ['Bluegill', 'Bass', 'Perch'],
    avgPrice: '$195K',
  },
  'loch-erin': {
    name: 'Loch Erin',
    slug: 'loch-erin',
    region: 'cambridge-corridor',
    acres: 622,
    depth: 13,
    type: 'all-sports',
    access: 'private',
    tagline: 'Private planned community with 622 acres',
    description: 'Loch Erin is a man-made, private lake community spanning 622 acres in Cambridge and Franklin Townships. Built since the 1980s with modern homes, the shallow all-sports lake (max 13 ft) supports kayaking, water skiing, boating, and fishing. The Property Owners Association maintains community standards and shared amenities.',
    features: ['622 acres', 'Private / POA', 'Man-made', 'Modern homes', 'All-sports', 'Shallow (13 ft max)'],
    fishSpecies: ['Bluegill', 'Bass', 'Crappie'],
    association: 'Loch Erin Property Owners Association',
    avgPrice: '$325K',
  },

  // ── CLARK LAKE ──
  'clark-lake': {
    name: 'Clark Lake',
    slug: 'clark-lake',
    region: 'clark-lake',
    acres: 550,
    depth: 45,
    type: 'all-sports',
    access: 'public',
    tagline: 'Community spirit on the water',
    description: 'Clark Lake is a vibrant 550-acre all-sports lake with the strongest community identity in the Irish Hills. The annual Spirit Festival, active social scene, county park beach, and proximity to Jackson (just 12 miles) make it a perennial favorite. Known for bass, pike, walleye, and bluegill fishing.',
    features: ['550 acres', '45 ft deep', 'All-sports', 'Spirit Festival', 'County park beach', '12 mi to Jackson'],
    fishSpecies: ['Largemouth bass', 'Northern pike', 'Walleye', 'Bluegill', 'Crappie'],
    association: 'Clark Lake Spirit Foundation',
    annualDues: '~$100/year',
    wakeHours: '11 AM – 6:30 PM',
    avgPrice: '$385K',
  },

  // ── BROOKLYN & LAKE COLUMBIA ──
  'lake-columbia': {
    name: 'Lake Columbia',
    slug: 'lake-columbia',
    region: 'brooklyn-columbia',
    acres: 920,
    depth: 50,
    type: 'all-sports',
    access: 'private',
    tagline: 'Largest private lake in Michigan',
    description: 'Lake Columbia is the largest private lake in Michigan at approximately 920 acres. This prestigious gated community in Columbia Township features a private golf course, clubhouse, marina, and some of the finest waterfront estates in the region. HOA manages roads, amenities, and lake access.',
    features: ['920 acres', '50 ft deep', 'Private / Gated', 'Golf course', 'Clubhouse', 'Marina'],
    fishSpecies: ['Largemouth bass', 'Bluegill', 'Crappie', 'Northern pike'],
    association: 'Lake Columbia Property Owners Association',
    avgPrice: '$525K',
  },
  'pleasant-lake': {
    name: 'Pleasant Lake',
    slug: 'pleasant-lake',
    region: 'brooklyn-columbia',
    acres: 264,
    depth: null,
    type: 'all-sports',
    access: 'public',
    tagline: 'Calm waters and wooded privacy',
    description: 'Pleasant Lake lives up to its name with 264 acres of calm waters in northern Jackson County. Surrounded by mature hardwood forests, it\'s a favorite for kayaking, canoeing, and peaceful lakeside living. Nearby Brooklyn village provides shops, dining, and daily essentials.',
    features: ['264 acres', 'Wooded setting', 'Kayak-friendly', 'Calm waters', 'Near Brooklyn village'],
    fishSpecies: ['Largemouth bass', 'Bluegill', 'Perch'],
    avgPrice: '$310K',
  },

  // ── JEROME & SOMERSET ──
  'lake-leann': {
    name: 'Lake LeAnn',
    slug: 'lake-leann',
    region: 'jerome-somerset',
    acres: 200,
    depth: 35,
    type: 'all-sports',
    access: 'private',
    tagline: 'Resort-style private lake community',
    description: 'Lake LeAnn is a 200-acre private lake community near Jerome featuring resort-style amenities including a community pool, tennis courts, marina, and beach. The Property Owners Association ensures well-maintained properties and facilities. An excellent value for families seeking amenity-rich lake living.',
    features: ['200 acres', '35 ft deep', 'Private / POA', 'Pool & tennis', 'Marina', 'Community beach'],
    fishSpecies: ['Largemouth bass', 'Bluegill', 'Crappie'],
    association: 'Lake LeAnn Property Owners Association',
    avgPrice: '$285K',
  },
  'farwell-lake': {
    name: 'Farwell Lake',
    slug: 'farwell-lake',
    region: 'jerome-somerset',
    acres: 213,
    depth: 52,
    type: 'all-sports',
    access: 'public',
    tagline: 'Deep fishing lake near Cement City',
    description: 'Farwell Lake is a 213-acre lake in Jackson County reaching 52 feet deep - excellent for fishing. Located near Cement City and the Hillsdale County border, it offers affordable lakefront with a neighborly feel. Yes, there\'s another Round Lake adjacent - the third one in the Irish Hills.',
    features: ['213 acres', '52 ft deep', 'All-sports', 'Great fishing', 'Affordable', 'Near Cement City'],
    fishSpecies: ['Largemouth bass', 'Bluegill', 'Perch', 'Northern pike'],
    avgPrice: '$245K',
  },
  'round-lake-farwell': {
    name: 'Round Lake (Farwell)',
    slug: 'round-lake-farwell',
    region: 'jerome-somerset',
    acres: null,
    depth: null,
    type: 'all-sports',
    access: 'public',
    tagline: 'The third Round Lake - near Farwell Lake',
    description: 'The third Round Lake in the Irish Hills area, adjacent to Farwell Lake near Cement City. A smaller, quieter lake with affordable waterfront. Because apparently the Irish Hills can\'t get enough Round Lakes.',
    features: ['Adjacent to Farwell Lake', 'Quiet', 'Affordable'],
    fishSpecies: ['Bluegill', 'Bass'],
    avgPrice: '$185K',
  },

  // ── SOUTHERN LAKES ──
  'vineyard-lake': {
    name: 'Vineyard Lake',
    slug: 'vineyard-lake',
    region: 'southern-lakes',
    acres: 150,
    depth: 35,
    type: 'all-sports',
    access: 'public',
    tagline: 'Sandy beaches and family-friendly waters',
    description: 'Vineyard Lake offers 150 acres of tranquil water in southern Lenawee County. Sandy beaches and gradual entry make it ideal for families with young children. A summer favorite for generations, with affordable lakefront that\'s becoming increasingly hard to find.',
    features: ['150 acres', '35 ft deep', 'All-sports', 'Sandy beaches', 'Family-friendly', 'Affordable'],
    fishSpecies: ['Largemouth bass', 'Bluegill', 'Perch'],
    association: 'Vineyard Lake Association',
    annualDues: '~$50/year (voluntary)',
    avgPrice: '$295K',
  },
  'iron-lake': {
    name: 'Iron Lake',
    slug: 'iron-lake',
    region: 'southern-lakes',
    acres: 78,
    depth: 63,
    type: 'all-sports',
    access: 'public',
    tagline: 'Small but deep - serious fishing lake',
    description: 'Iron Lake is a compact 78-acre lake that punches above its weight with 63 feet of depth - as deep as Devils Lake. Home to black crappie, bluegill, and northern pike, it\'s a hidden gem for anglers who prefer less boat traffic.',
    features: ['78 acres', '63 ft deep', 'Great fishing', 'Low traffic', 'Affordable'],
    fishSpecies: ['Black crappie', 'Bluegill', 'Northern pike'],
    avgPrice: '$225K',
  },
  'posey-lake': {
    name: 'Posey Lake',
    slug: 'posey-lake',
    region: 'southern-lakes',
    acres: null,
    depth: null,
    type: 'all-sports',
    access: 'public',
    tagline: 'Southern Irish Hills retreat',
    description: 'Posey Lake marks the southern boundary of Holly\'s Irish Hills territory. A quieter lake with affordable waterfront and a laid-back community feel, close to Adrian for shopping and medical services.',
    features: ['Southern Irish Hills', 'Quiet community', 'Affordable', 'Close to Adrian'],
    fishSpecies: ['Bass', 'Bluegill'],
    avgPrice: '$195K',
  },

  // ── GRASS LAKE & MICHIGAN CENTER ──
  'grass-lake': {
    name: 'Grass Lake',
    slug: 'grass-lake',
    region: 'grass-lake-michigan-center',
    acres: null,
    depth: null,
    type: 'all-sports',
    access: 'public',
    tagline: 'Small-town charm with I-94 commuter access',
    description: 'Grass Lake village sits along the I-94 corridor in northern Jackson County, offering small-town living with easy commuter access to both Jackson and Ann Arbor. The lake and surrounding area provide affordable lakefront and residential properties in a growing community.',
    features: ['I-94 access', 'Village amenities', 'Commuter-friendly', 'Growing community'],
    fishSpecies: ['Bass', 'Bluegill', 'Perch'],
    avgPrice: '$250K',
  },
  'wolf-lake': {
    name: 'Wolf Lake (Michigan Center Chain)',
    slug: 'wolf-lake',
    region: 'grass-lake-michigan-center',
    acres: null,
    depth: null,
    type: 'all-sports',
    access: 'public',
    tagline: 'Four interconnected lakes - miles of water',
    description: 'The Wolf Lake Chain of Lakes at Michigan Center connects four lakes for miles of navigable water. A popular boating and fishing destination in northern Jackson County with a mix of year-round homes and seasonal cottages.',
    features: ['Chain of 4 lakes', 'Miles of navigable water', 'Boating & fishing', 'Michigan Center community'],
    fishSpecies: ['Largemouth bass', 'Bluegill', 'Northern pike', 'Walleye'],
    avgPrice: '$275K',
  },
};

// ═══════════════════════════════════════════════════════════
// SEARCH INDEX - Maps every lake name (including alternates)
// to its region for smart search routing
// ═══════════════════════════════════════════════════════════

export const lakeSearchIndex = {};
Object.values(lakes).forEach(lake => {
  lakeSearchIndex[lake.name.toLowerCase()] = lake.region;
  // Add slug-based lookup
  lakeSearchIndex[lake.slug] = lake.region;
});

// Add common alternate names
lakeSearchIndex['round lake'] = null; // disambiguation needed
lakeSearchIndex['devils'] = 'manitou-beach';
lakeSearchIndex['wamplers'] = 'onsted-hayes';
lakeSearchIndex['wampler'] = 'onsted-hayes';
lakeSearchIndex['columbia'] = 'brooklyn-columbia';
lakeSearchIndex['leann'] = 'jerome-somerset';
lakeSearchIndex['le ann'] = 'jerome-somerset';
lakeSearchIndex['loch erin'] = 'cambridge-corridor';
lakeSearchIndex['sand'] = 'cambridge-corridor';
lakeSearchIndex['clark'] = 'clark-lake';
lakeSearchIndex['vineyard'] = 'southern-lakes';
lakeSearchIndex['grass'] = 'grass-lake-michigan-center';
lakeSearchIndex['wolf'] = 'grass-lake-michigan-center';
lakeSearchIndex['tecumseh'] = 'tecumseh-eastern';
lakeSearchIndex['farwell'] = 'jerome-somerset';
lakeSearchIndex['farwell lake'] = 'jerome-somerset';
lakeSearchIndex['posey'] = 'southern-lakes';
lakeSearchIndex['iron'] = 'southern-lakes';
lakeSearchIndex['allen'] = 'cambridge-corridor';
lakeSearchIndex['evans'] = 'cambridge-corridor';
lakeSearchIndex['pleasant'] = 'brooklyn-columbia';
