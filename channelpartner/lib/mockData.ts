// ─────────────────────────────────────────────────────────
// mockData.ts  –  All hardcoded filter data
// Replace these arrays with API calls when backend is ready
// ─────────────────────────────────────────────────────────

export const PROJECTS = [
  "Lodha Palava",
  "Godrej Reserve",
  "Prestige Park Grove",
  "Sobha Dream Acres",
  "Mahindra Happinest",
  "Brigade Utopia",
  "Hiranandani Gardens",
  "Oberoi Eternia",
  "Kalpataru Radiance",
  "Shapoorji Pallonji Joyville",
  "Piramal Aranya",
  "Runwal Gardens",
  "Rustomjee Seasons",
  "K Raheja Vistas",
  "Raymond Realty Ten X",
];

export const DEVELOPERS = [
  "Lodha Group",
  "Godrej Properties",
  "Prestige Group",
  "Sobha Developers",
  "Mahindra Lifespaces",
  "Brigade Group",
  "Hiranandani Developers",
  "Oberoi Realty",
  "Kalpataru Ltd",
  "Shapoorji Pallonji",
  "Piramal Realty",
  "Runwal Group",
  "Rustomjee",
  "K Raheja Corp",
  "Raymond Realty",
];

export const LOCATIONS = [
  "Andheri East, Mumbai",
  "Powai, Mumbai",
  "Thane West",
  "Navi Mumbai",
  "Kalyan",
  "Dombivli",
  "Panvel",
  "Borivali West",
  "Malad East",
  "Goregaon East",
  "Kharghar",
  "Belapur",
  "Mulund",
  "Bhandup",
  "Vikhroli",
];

export const AMENITIES = [
  "Swimming Pool",
  "Gym / Fitness Center",
  "Clubhouse",
  "Children's Play Area",
  "Landscaped Garden",
  "24x7 Security",
  "CCTV Surveillance",
  "Covered Parking",
  "Jogging Track",
  "Sports Court",
  "Indoor Games Room",
  "Co-working Space",
  "Rooftop Terrace",
  "Power Backup",
  "EV Charging Station",
  "Concierge Service",
  "Home Theatre",
  "Sky Lounge",
];

export const INTENTS = [
  "End Use",
  "Investment",
  "Rental Income",
  "Resale",
  "NRI Investment",
  "Commercial Lease",
];

export const UNIT_TYPES = [
  "Studio",
  "1 BHK",
  "1.5 BHK",
  "2 BHK",
  "2.5 BHK",
  "3 BHK",
  "3.5 BHK",
  "4 BHK",
  "4+ BHK",
  "Penthouse",
  "Duplex",
  "Row House",
  "Villa",
  "Shop",
  "Office",
];

export const DEVELOPMENT_STATUS = [
  { label: "Under Construction", value: "under_construction" },
  { label: "Ready to Move", value: "ready" },
  { label: "Both", value: "both" },
];

export const BEST_SUITED = [
  { label: "Live", value: "live" },
  { label: "Invest", value: "invest" },
  { label: "Live & Invest", value: "live_invest" },
];

export interface FilterState {
  projectName: string[];
  developer: string[];
  location: string[];
  amenities: string[];
  developmentStatus: string;
  bestSuited: string;
  intent: string[];
  possessionDate: string;
  unitTypes: string[];
  areaMin: number;
  areaMax: number;
  priceMin: number;
  priceMax: number;
  unitsAvailable: number;
}

export const DEFAULT_FILTERS: FilterState = {
  projectName: [],
  developer: [],
  location: [],
  amenities: [],
  developmentStatus: "",
  bestSuited: "",
  intent: [],
  possessionDate: "",
  unitTypes: [],
  areaMin: 200,
  areaMax: 10000,
  priceMin: 2000000,
  priceMax: 50000000,
  unitsAvailable: 0,
};

// ── Mock Project Cards shown on home page ──────────────────
export interface ProjectCard {
  id: number;
  name: string;
  developer: string;
  location: string;
  type: string;
  price: string;
  status: string;
  possession: string;
  units: number;
  area: string;
  badge?: string;
}

export const MOCK_PROJECT_CARDS: ProjectCard[] = [
  {
    id: 1,
    name: "Lodha Palava",
    developer: "Lodha Group",
    location: "Dombivli, Thane",
    type: "2 BHK / 3 BHK",
    price: "₹65 L – ₹1.2 Cr",
    status: "Ready to Move",
    possession: "Dec 2025",
    units: 120,
    area: "650–1200 sq.ft",
    badge: "Hot",
  },
  {
    id: 2,
    name: "Godrej Reserve",
    developer: "Godrej Properties",
    location: "Kandivali East, Mumbai",
    type: "2 BHK / 3 BHK",
    price: "₹1.4 Cr – ₹2.2 Cr",
    status: "Under Construction",
    possession: "Jun 2027",
    units: 48,
    area: "900–1450 sq.ft",
    badge: "New Launch",
  },
  {
    id: 3,
    name: "Prestige Park Grove",
    developer: "Prestige Group",
    location: "Whitefield, Bangalore",
    type: "1 BHK / 2 BHK / 3 BHK",
    price: "₹75 L – ₹1.8 Cr",
    status: "Under Construction",
    possession: "Mar 2026",
    units: 200,
    area: "580–1380 sq.ft",
  },
  {
    id: 4,
    name: "Sobha Dream Acres",
    developer: "Sobha Developers",
    location: "Panathur, Bangalore",
    type: "1 BHK / 2 BHK",
    price: "₹58 L – ₹1.1 Cr",
    status: "Ready to Move",
    possession: "Sep 2024",
    units: 75,
    area: "540–920 sq.ft",
    badge: "Best Seller",
  },
  {
    id: 5,
    name: "Mahindra Happinest",
    developer: "Mahindra Lifespaces",
    location: "Kalyan, Thane",
    type: "1 BHK / 2 BHK",
    price: "₹38 L – ₹72 L",
    status: "Under Construction",
    possession: "Dec 2026",
    units: 310,
    area: "400–780 sq.ft",
  },
  {
    id: 6,
    name: "Hiranandani Gardens",
    developer: "Hiranandani Developers",
    location: "Powai, Mumbai",
    type: "2 BHK / 3 BHK / 4 BHK",
    price: "₹2.2 Cr – ₹5.5 Cr",
    status: "Ready to Move",
    possession: "Immediate",
    units: 22,
    area: "1100–2800 sq.ft",
    badge: "Luxury",
  },
];