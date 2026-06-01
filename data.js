// Devil's Lake State Park — consolidated trip data
// Site G3 (Group Camp), June 18-22, 2026

const TRIP = {
  name: "Devil's Lake Family Camping",
  site: "Group Camp Site G3",
  dates: "June 18–22, 2026",
  startDate: "2026-06-18",
  endDate: "2026-06-22",
  parkAddress: "S5975 Park Rd, Baraboo, WI 53913",
  parkPhone: "608-356-8301",
  // Exact coordinates for Group Camp Site G3
  coords: { lat: 43.40955652, lon: -89.71321280 },
};

const PARK = {
  about:
    "Devil's Lake State Park is Wisconsin's most-visited state park — a 360-acre spring-fed lake ringed by 500-foot quartzite bluffs, with 29+ miles of trails, two sand beaches, a Nature Center, and rock-climbing on some of the best quartzite in the Midwest.",
  bullets: [
    "29+ miles of hiking trails across 16 named trails",
    "Two sandy swim beaches: North Shore and South Shore",
    "Boat, kayak, SUP, and paddleboat rentals at both shores",
    "Nature Center with hands-on kids' exploration room",
    "Quartzite-bluff rock climbing (advanced; guides available)",
    "Sections of the National Ice Age Trail pass through",
  ],
};

const CAMPSITE = {
  name: "Group Camp Site G3",
  amenities: [
    { icon: "tree",     title: "Heavily wooded", detail: "Lots of shade. Ground is dirt and leaves — pack tarps for under tents." },
    { icon: "restroom", title: "Pit toilets at site", detail: "Right at the loop." },
    { icon: "shower",   title: "Modern showers and flush restrooms", detail: "A short walk from the site." },
    { icon: "drop",     title: "Water pump on the loop", detail: "Haul water back to your site in jugs." },
    { icon: "walk",     title: "15-minute walk to South Shore beach", detail: "Via the Group Camp Trail." },
    { icon: "flame",    title: "Fire ring and picnic tables", detail: "Standard at group sites. Bring chairs." },
    { icon: "car",      title: "Parking on the loop", detail: "Carry gear in from the lot." },
  ],
  cell: {
    summary:
      "Spotty at G3 because the dense tree cover blocks signal. You'll get bars near the beaches and on top of the bluffs.",
    carriers: [
      { name: "Verizon", strength: "Best", note: "Usually has at least 1–2 bars at the campsite." },
      { name: "AT&T", strength: "OK", note: "Usable in open areas (beaches, bluff tops)." },
      { name: "T-Mobile", strength: "Weakest", note: "Often no signal at G3 — head to higher ground." },
    ],
  },
};

// Trail photos sourced from Wikimedia Commons — actual Devil's Lake imagery,
// not Midwest-shaped stock guesses.
// Use Wikimedia's Special:FilePath endpoint (hotlink-stable, returns a sized
// image). Direct /thumb/ URLs 400 for these files, so don't use them.
const _WC = (file, width) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${file}?width=${width}`;
const TRAIL_PHOTOS = {
  boulders:    _WC("Devils_Lake_Boulders.jpg", 800),
  eastBluff:   _WC("East_Bluff.jpg", 800),
  beach:       _WC("Devil%27s_Lake_Beach.jpg", 800),
  doorway:     _WC("Devil%27sDoorway.JPG", 600),
  natureCtr:   _WC("Devil%27s_Lake_SP_Nature_Center_P7180261.jpg", 600),
};

const TRAILS = [
  {
    id: "tumbled-rock",
    name: "Tumbled Rock Trail",
    length: "~1 mi",
    difficulty: "Easy",
    kidAges: "Best for ages 3–5",
    description:
      "Northern half is paved and stroller-friendly. Runs along the base of the West Bluff with big quartzite boulders to gawk at. Easiest trail in the park.",
    photo: TRAIL_PHOTOS.boulders,
  },
  {
    id: "grottoes",
    name: "Grottoes Trail",
    length: "Short, level",
    difficulty: "Easy",
    kidAges: "All ages",
    description:
      "Fine-gravel path along the base of the East Bluff. Connects the Balanced Rock, Potholes, and CCC trails so you can pick how far you want to go.",
    photo: TRAIL_PHOTOS.doorway,
  },
  {
    id: "west-shore",
    name: "West Shore Trail",
    length: "Lakeside",
    difficulty: "Easy",
    kidAges: "Ages 4+",
    description:
      "Gentle lakeside trail. A bit rocky in spots but manageable for steady-on-their-feet kids. Great views of the East Bluff across the water.",
    photo: TRAIL_PHOTOS.eastBluff,
  },
  {
    id: "south-shore-boardwalk",
    name: "South Shore Boardwalk",
    length: "Short",
    difficulty: "Easy",
    kidAges: "All ages, stroller OK",
    description:
      "Fully accessible boardwalk and paved paths around the South Shore day-use area. Perfect after-dinner walk.",
    photo: TRAIL_PHOTOS.beach,
  },
  {
    id: "group-camp",
    name: "Group Camp Trail",
    length: "~15 min walk",
    difficulty: "Easy",
    kidAges: "All ages",
    description:
      "The trail that connects your G3 campsite to the South Shore. You'll walk this several times — beach trips, ice cream runs, etc.",
    photo: TRAIL_PHOTOS.natureCtr,
  },
  {
    id: "balanced-rock-potholes",
    name: "Balanced Rock + Potholes",
    length: "~1 mi loop",
    difficulty: "Moderate (steep)",
    kidAges: "Ages 7–8 with adult help",
    description:
      "Iconic stairway climb up the south face of the East Bluff. Hand-over-hand in sections. Not for the 3–5 crowd, but older kids love the achievement.",
    photo: TRAIL_PHOTOS.doorway,
  },
];

const WATER = {
  concessionPhone: "608-356-3381",
  hours: "Daily 10 AM – 6 PM, Memorial Day through Labor Day",
  returnNote: "All rentals must be back by 5:45 PM. Outgoing rentals stop at 5:00 PM.",
  deposit: "$100 refundable deposit + valid ID required",
  pricing: [
    { item: "Single kayak", price: "$17 / hr" },
    { item: "Double kayak", price: "$25 / hr" },
    { item: "Stand-up paddleboard (SUP)", price: "Ask at concession" },
    { item: "Paddleboat", price: "Ask at concession" },
    { item: "Guided kayak tour (Nature Center)", price: "$25 single / $45 double" },
  ],
  locations: "Rentals available at both North Shore and South Shore concession buildings.",
};

const ACTIVITIES_AT_PARK = [
  {
    id: "beaches",
    title: "Swim Beaches",
    icon: "🏖️",
    description:
      "Two sandy beaches — North Shore and South Shore — both lifeguarded in summer. South Shore has the playground and is closer to your campsite.",
  },
  {
    id: "nature-center",
    title: "Nature Center",
    icon: "🦋",
    description:
      "Hands-on displays plus a kids' exploration room with puzzles, mystery boxes, and games. Great rainy-hour backup.",
  },
  {
    id: "climbing",
    title: "Rock Climbing",
    icon: "🧗",
    description:
      "Quartzite bluffs — some of the best climbing in the Midwest. Advanced. Several guide services in Baraboo can take adults + older kids out with proper gear.",
  },
  {
    id: "fishing",
    title: "Fishing",
    icon: "🎣",
    description:
      "Lake holds bass, panfish, walleye, and pike. WI fishing license required for 16+. Pier on the south shore.",
  },
  {
    id: "playground",
    title: "Playground",
    icon: "🛝",
    description:
      "Right by the South Shore beach, with flush toilets next to it. Perfect for the 3–5 year-olds.",
  },
];

const NEARBY = [
  {
    id: "circus-world",
    title: "Circus World Museum",
    distance: "2 mi from park",
    address: "550 Water St, Baraboo, WI 53913",
    description:
      "Historic Ringling Bros. winter quarters. Big-top shows in summer, vintage circus wagons, animal demos. Ages 3–8 love it.",
    photoQuery: "circus-tent",
    kidAppeal: "★★★★★",
  },
  {
    id: "mid-continent-railway",
    title: "Mid-Continent Railway Museum",
    distance: "~8 mi (North Freedom)",
    address: "E8948 Diamond Hill Rd, North Freedom, WI 53951",
    description: "Working steam-era trains. Ride a real coach behind a historic locomotive.",
    photoQuery: "steam-train",
    kidAppeal: "★★★★★",
  },
  {
    id: "crane-foundation",
    title: "International Crane Foundation",
    distance: "~10 mi",
    address: "E11376 Shady Lane Rd, Baraboo, WI 53913",
    description: "Only place on earth where you can see all 15 crane species. Walking trails through the exhibits.",
    photoQuery: "crane-bird",
    kidAppeal: "★★★★",
  },
  {
    id: "wisconsin-dells",
    title: "Wisconsin Dells",
    distance: "~30 min north",
    address: "Wisconsin Dells, WI",
    description:
      "Waterpark Capital of the World. Original Wisconsin Ducks (amphibious tours), Wisconsin Deer Park, indoor/outdoor waterparks. Great rainy-day fallback.",
    photoQuery: "wisconsin-dells",
    kidAppeal: "★★★★★",
  },
  {
    id: "vilas-zoo",
    title: "Henry Vilas Zoo",
    distance: "~1 hr (Madison)",
    address: "702 S Randall Ave, Madison, WI 53715",
    description: "Free admission. Solid mid-sized zoo with primates, big cats, kids' zoo. Worth the drive on a rain day.",
    photoQuery: "zoo-animals",
    kidAppeal: "★★★★",
  },
  {
    id: "al-ringling-theatre",
    title: "Al Ringling Theatre",
    distance: "~3 mi (downtown Baraboo)",
    address: "136 4th Ave, Baraboo, WI 53913",
    description: "1915 historic theatre — 'America's Prettiest Playhouse.' Check the marquee for family-friendly shows.",
    photoQuery: "historic-theatre",
    kidAppeal: "★★★",
  },
];

const EAT_SHOP = {
  grocery: [
    {
      name: "Ice Age Campground Store",
      blurb: "Inside the park — ice, basic groceries, cold drinks, beer, firewood. Most convenient for forgotten items.",
      address: "Between Northern Lights & Ice Age Campgrounds, Devil's Lake State Park",
      phone: null,
      hours: "Seasonal, daily",
    },
    {
      name: "Pierce's Express Market",
      blurb: "Gas + groceries + fresh produce + locally sourced products. Closest combined fuel/grocery stop.",
      address: "Baraboo, WI",
      phone: null,
      hours: "Daily 4 AM – midnight",
      highlight: true,
    },
    {
      name: "Walmart Supercenter",
      blurb: "Big-box groceries, low prices, everything else you forgot.",
      address: "921 WI-136, Baraboo, WI 53913",
      phone: "608-355-9300",
      hours: "Daily 6 AM – 11 PM (check)",
    },
    {
      name: "Baraboo Fresh Market",
      blurb: "Local grocer in downtown Baraboo.",
      address: "Downtown Baraboo, WI",
      phone: null,
      hours: "Daily",
    },
  ],
  gas: [
    {
      name: "Pierce's Express Market",
      blurb: "Closest gas to the park. Grocery + fuel in one stop. Open 4 AM – midnight.",
      address: "Baraboo, WI",
      phone: null,
      hours: "Daily 4 AM – midnight",
      highlight: true,
    },
    {
      name: "Note: no fuel inside the park",
      blurb: "Fill up before you arrive. Closest stations are along Hwy 123 / Hwy 136 in Baraboo.",
      address: null,
      phone: null,
      hours: null,
      info: true,
    },
  ],
  butcher: [
    {
      name: "The Meat Market – Baraboo",
      blurb: "Full-service butcher in Baraboo. Formerly Mueller's Meat Market — local since 1989.",
      address: "Baraboo, WI",
      phone: null,
      hours: "Mon–Sat",
    },
    {
      name: "Straka Meats",
      blurb: "Old-school butcher in Plain, WI (~20 min west). Famous for hickory-smoked sausages and brats. Worth the drive.",
      address: "1019 Cedar St, Plain, WI 53577",
      phone: "608-546-2851",
      hours: "Mon–Sat",
      highlight: true,
    },
  ],
  drinks: [
    {
      name: "Driftless Glen Distillery",
      blurb:
        "Craft whiskey distillery with rack-house tours, riverside patio restaurant, and — important — a kids' menu. Bring the whole family.",
      address: "300 Water St, Baraboo, WI 53913",
      phone: "608-356-3019",
      hours: "Open daily, hours vary",
      highlight: true,
      kidFriendly: true,
    },
    {
      name: "Balanced Rock Winery",
      blurb: "Wine tasting, shareable apps, live music on weekends. Minutes from Devil's Lake.",
      address: "1065 Walnut St, Baraboo, WI 53913",
      phone: "608-356-9463",
      hours: "Check website",
    },
    {
      name: "Tumbled Rock Brewery & Kitchen",
      blurb: "Brewpub right near the park entrance. Wood-fired pizza, family-friendly.",
      address: "S5718 WI-136, Baraboo, WI 53913",
      phone: "608-355-3700",
      hours: "Daily lunch + dinner",
      kidFriendly: true,
    },
  ],
};

const SAFETY = {
  hospitals: [
    {
      name: "SSM Health St. Clare Hospital",
      role: "Closest 24/7 ER",
      distance: "~5 mi from G3",
      phone: "608-356-1400",
      address: "707 14th St, Baraboo, WI 53913",
      primary: true,
    },
    {
      name: "Sauk Prairie Hospital",
      role: "24/7 ER (alternative)",
      distance: "Prairie du Sac",
      phone: "608-643-3311",
      address: "260 26th St, Prairie du Sac, WI 53578",
    },
    {
      name: "Reedsburg Area Medical Center",
      role: "24/7 ER (alternative)",
      distance: "Reedsburg",
      phone: "608-888-2696",
      address: "2000 N Dewey Ave, Reedsburg, WI 53959",
    },
    {
      name: "Aspirus Divine Savior Hospital",
      role: "24/7 ER (alternative)",
      distance: "Portage",
      phone: "608-742-4131",
      address: "2817 New Pinery Rd, Portage, WI 53901",
    },
  ],
  parkContacts: [
    { name: "Park HQ / Ranger Station", phone: "608-356-8301" },
  ],
  kidSafety: [
    "Stay back from bluff edges — the drops are 500 feet and unfenced.",
    "Tick and mosquito check after every hike. June is peak season.",
    "Water shoes on the rocky lake bottom — slippery quartzite under the sand.",
    "Swim only at the lifeguarded beaches (North Shore and South Shore).",
    "Buddy system at the campsite — kids in pairs, adults in eyeline.",
    "Each kid gets a glowstick or headlamp at dusk — easy to spot in the woods.",
  ],
  weather: {
    summary: "June averages: high 79°F / low 56°F / 5.58 in rain (wettest month of the year here).",
    nwsUrl: "https://forecast.weather.gov/MapClick.php?lat=43.4096&lon=-89.7132",
  },
};

// Photos — curated Unsplash IDs. These resolve directly through images.unsplash.com.
// loading="lazy" applied in app.js.
const PHOTOS = {
  hero: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=70",
  // gallery — 6 photos for the Park tab
  gallery: [
    {
      url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=70",
      caption: "Quartzite bluffs over the lake",
    },
    {
      url: "https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&w=800&q=70",
      caption: "Forest campsite under tall pines",
    },
    {
      url: "https://images.unsplash.com/photo-1496545672447-f699b503d270?auto=format&fit=crop&w=800&q=70",
      caption: "Sand beach + lake",
    },
    {
      url: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=800&q=70",
      caption: "Family hike on a forest trail",
    },
    {
      url: "https://images.unsplash.com/photo-1502780402662-acc01917cf6e?auto=format&fit=crop&w=800&q=70",
      caption: "Kayaks on calm water",
    },
    {
      url: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=800&q=70",
      caption: "Marshmallows over a campfire",
    },
  ],
  // Per-card photos keyed by photoQuery in trails/attractions
  byQuery: {
    "tumbled-rock": "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=600&q=70",
    "grottoes": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=70",
    "lakeside": "https://images.unsplash.com/photo-1500964757637-c85e8a162699?auto=format&fit=crop&w=600&q=70",
    "boardwalk": "https://images.unsplash.com/photo-1418985991508-e47386d96a71?auto=format&fit=crop&w=600&q=70",
    "forest-trail": "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=70",
    "balanced-rock": "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=600&q=70",
    "circus-tent": "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=600&q=70",
    "steam-train": "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=600&q=70",
    "crane-bird": "https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=600&q=70",
    "wisconsin-dells": "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=600&q=70",
    "zoo-animals": "https://images.unsplash.com/photo-1456926631375-92c8ce872def?auto=format&fit=crop&w=600&q=70",
    "historic-theatre": "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=600&q=70",
  },
};

// Map points (lat/lon) for the Leaflet mini-map.
// Only the campsite is plotted — other park amenities and the hospital
// will be added back if/when we have verified coordinates for each.
const MAP_POINTS = [
  { id: "g3", label: "Group Camp G3", lat: 43.40955652, lon: -89.71321280, primary: true },
];

window.TRIP_DATA = {
  TRIP,
  PARK,
  CAMPSITE,
  TRAILS,
  WATER,
  ACTIVITIES_AT_PARK,
  NEARBY,
  EAT_SHOP,
  SAFETY,
  PHOTOS,
  MAP_POINTS,
};
