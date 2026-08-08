import { query } from './db.js';
import bcrypt from 'bcryptjs';

// ============================================================
// SINGLE SOURCE OF TRUTH — All seed / default data lives here.
// ============================================================

// ---- Customization Rules ----
export const DEFAULT_CUSTOMIZATION_RULES = {
  fonts: [
    { label: 'Serif', value: "'Fraunces', serif" },
    { label: 'Modern', value: "'Inter', sans-serif" },
    { label: 'Script', value: "'Brush Script MT', cursive" },
    { label: 'Mono', value: "ui-monospace, monospace" },
  ],
  colors: [
    { label: 'Black', value: '#1a1612' },
    { label: 'Gold', value: '#c08a3e' },
    { label: 'Silver', value: '#9a9a9a' },
    { label: 'Navy', value: '#1e3a5f' },
    { label: 'Burgundy', value: '#7a2e3a' },
    { label: 'Forest', value: '#2d5a3d' },
  ],
  maxLength: 20,
  enabled: true,
};

// ---- Categories ----
export const CATEGORIES = [
  { id: 1, name: 'Notebooks', slug: 'notebooks', description: 'Hardcover, softcover, and lay-flat journals', display_order: 1 },
  { id: 2, name: 'Pens', slug: 'pens', description: 'Fine rollerballs, gel pens, and brass instruments', display_order: 2 },
  { id: 3, name: 'Planners', slug: 'planners', description: 'Weekly, monthly, and undated goal organizers', display_order: 3 },
  { id: 4, name: 'Desk', slug: 'desk', description: 'Organizers, trays, and studio accessories', display_order: 4 },
  { id: 5, name: 'Art', slug: 'art', description: 'High GSM sketchbooks and creative paper', display_order: 5 },
];

// ---- Products ----
export const PRODUCTS = [
  {
    id: 1,
    name: 'Arihant Artisan Hardcover Journal (A5)',
    slug: 'artisan-hardcover-journal-a5',
    description: 'Hand-bound notebook with 160 pages of 120 GSM fountain-pen friendly paper.',
    long_description: 'Designed for writers, creators, and daily thinkers. Features lay-flat 180° binding, expandable back pocket, dual satin ribbon markers, and heavyweight acid-free paper.',
    price: 699,
    wholesale_price: 499,
    category: 'Notebooks',
    audience: 'both',
    image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80',
    gallery: ['https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80', 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&q=80'],
    stock: 120,
    sku: 'LKH-NB-001',
    tags: ['Notebook', 'Hardcover', 'Personalizable', 'Bestseller'],
    rating: 4.9,
    featured: true,
    bulk_min_qty: 10,
    dimensions: '21.0 × 14.8 cm',
    material: '120 GSM Acid-Free Paper',
    color: 'Navy',
    weight: '340 g',
    care_instructions: 'Keep away from direct moisture. Wipe cover with clean dry cloth.',
    personalizable: true,
    customization_price: 99,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Brass Rollerball Pen · Edition 01',
    slug: 'brass-rollerball-pen-01',
    description: 'Solid brass body with gel refill and weighted ergonomic balance.',
    long_description: 'Crafted from a single block of raw brass that develops a rich patina over time. Smooth 0.5mm Schmidt ceramic rollerball refill included.',
    price: 899,
    wholesale_price: 599,
    category: 'Pens',
    audience: 'both',
    image_url: 'https://images.unsplash.com/photo-1583485088034-697b5bc36b92?w=800&q=80',
    gallery: ['https://images.unsplash.com/photo-1583485088034-697b5bc36b92?w=800&q=80'],
    stock: 85,
    sku: 'LKH-PN-002',
    tags: ['Pen', 'Brass', 'Engraving', 'Bestseller'],
    rating: 4.8,
    featured: true,
    bulk_min_qty: 15,
    dimensions: '13.8 × 1.1 cm',
    material: 'Solid Brass',
    color: 'Gold',
    weight: '48 g',
    care_instructions: 'Polish with brass cleaner if shiny finish is preferred, or allow natural patina.',
    personalizable: true,
    customization_price: 149,
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Undated Minimalist Weekly Planner',
    slug: 'undated-minimalist-weekly-planner',
    description: '52-week goal tracker, habit log, and open-dated layout.',
    long_description: 'Start anytime. Clean typography with dot grid notes sections, monthly spreads, and quarterly reflection pages. Cloth-bound hard cover.',
    price: 799,
    wholesale_price: 549,
    category: 'Planners',
    audience: 'both',
    image_url: 'https://images.unsplash.com/photo-1506784983877-45294b162795?w=800&q=80',
    gallery: ['https://images.unsplash.com/photo-1506784983877-45294b162795?w=800&q=80'],
    stock: 90,
    sku: 'LKH-PL-003',
    tags: ['Planner', 'Undated', 'Productivity'],
    rating: 4.7,
    featured: true,
    bulk_min_qty: 10,
    dimensions: '24.0 × 17.0 cm',
    material: 'Clothbound Hardcover, 100 GSM Paper',
    color: 'Burgundy',
    weight: '410 g',
    care_instructions: 'Store flat in dry environment.',
    personalizable: true,
    customization_price: 99,
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    name: 'Walnut Wood Desk Tray Organiser',
    slug: 'walnut-wood-desk-tray-organiser',
    description: 'Handcrafted solid American walnut desk tray for stationery and daily tools.',
    long_description: 'Precision milled from sustainable walnut wood with natural matte wax oil finish. Designed to hold pens, notebooks, clips, and mobile phone.',
    price: 1299,
    wholesale_price: 899,
    category: 'Desk',
    audience: 'both',
    image_url: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=800&q=80',
    gallery: ['https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=800&q=80'],
    stock: 45,
    sku: 'LKH-DK-004',
    tags: ['Desk', 'Walnut', 'Wood', 'Bestseller'],
    rating: 4.9,
    featured: true,
    bulk_min_qty: 5,
    dimensions: '28.0 × 14.0 × 2.5 cm',
    material: 'Solid Walnut Wood',
    color: 'Brown',
    weight: '450 g',
    care_instructions: 'Clean with soft cloth. Treat with natural wood wax annually.',
    personalizable: true,
    customization_price: 199,
    created_at: new Date().toISOString(),
  },
  {
    id: 5,
    name: 'Artist Watercolor Sketchbook (A4)',
    slug: 'artist-watercolor-sketchbook-a4',
    description: '300 GSM cold-press cotton paper for watercolor, gouache, and ink.',
    long_description: 'Professional grade 100% cotton cold pressed paper. Absorbs water evenly without buckling. Spiral ring binding allows 360 degree flat working surface.',
    price: 949,
    wholesale_price: 649,
    category: 'Art',
    audience: 'both',
    image_url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&q=80',
    gallery: ['https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&q=80'],
    stock: 60,
    sku: 'LKH-AR-005',
    tags: ['Art', 'Watercolor', '300GSM'],
    rating: 4.8,
    featured: false,
    bulk_min_qty: 10,
    dimensions: '29.7 × 21.0 cm',
    material: '300 GSM Cotton Paper',
    color: 'White',
    weight: '520 g',
    care_instructions: 'Keep dry until ready for artistic creation.',
    personalizable: false,
    customization_price: 0,
    created_at: new Date().toISOString(),
  },
];

// ---- Home Page Data ----
export const HOME_COLLECTIONS = [
  { name: 'Notebooks & Journals', desc: 'Premium paper, lay-flat bindings', img: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600&q=80', path: '/shop?category=Notebooks', span: 'lg:col-span-2 lg:row-span-2' },
  { name: 'Pens & Writing', desc: 'Smooth-writing instruments', img: 'https://images.unsplash.com/photo-1583485088034-697b5bc36b92?w=600&q=80', path: '/shop?category=Pens' },
  { name: 'Planners', desc: 'Plan with intention', img: 'https://images.unsplash.com/photo-1506784983877-45294b162795?w=600&q=80', path: '/shop?category=Planners' },
  { name: 'Desk Accessories', desc: 'Organize in style', img: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=600&q=80', path: '/shop?category=Desk' },
  { name: 'Personalized Gifts', desc: 'Make it uniquely theirs', img: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&q=80', path: '/gift-builder' },
];

export const HOME_MARQUEE_ITEMS = [
  { icon: 'Truck', text: 'Free shipping over ₹999' },
  { icon: 'ShieldCheck', text: '30-day easy returns' },
  { icon: 'Recycle', text: 'FSC-certified paper' },
  { icon: 'Sparkles', text: 'Handcrafted in India' },
  { icon: 'Pen', text: 'Personalized engraving' },
];

export const HOME_STATS = [
  { value: '12k+', label: 'Happy writers' },
  { value: '4.9', label: 'Average rating' },
  { value: '50+', label: 'Cities served' },
  { value: '100%', label: 'Recyclable packaging' },
];

export const HOME_TESTIMONIALS = [
  { name: 'Priya Sharma', role: 'Architect, Mumbai', text: 'The paper quality is exceptional. My fountain pens glide — these are the only notebooks I use now.' },
  { name: 'Rohan Mehta', role: 'Founder, BlueSeed Labs', text: 'Ordered 500 branded notebooks for our team. Seamless wholesale process and stellar finish.' },
  { name: 'Ananya Iyer', role: 'Illustrator', text: 'Beautiful, sustainable, and thoughtfully designed. Arihant gets what creators need.' },
];

// ---- Seasonal Campaigns ----
export const SEASONAL_CAMPAIGNS = [
  { name: 'Back to School', desc: 'Student essentials & planners', img: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&q=80', path: '/shop?category=Planners' },
  { name: 'Diwali', desc: 'Festive hampers & gifts', img: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&q=80', path: '/shop' },
  { name: 'Christmas', desc: 'Gift boxes & greeting cards', img: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=600&q=80', path: '/shop' },
  { name: 'Weddings', desc: 'Personalized keepsakes', img: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80', path: '/shop' },
];

// ---- Shop Page Data ----
export const SHOP_ALL_CATEGORIES = ['Notebooks', 'Pens', 'Desk', 'Art', 'Planners'];

export const SHOP_MATERIAL_OPTIONS = [
  { label: 'Paper', match: ['paper'] },
  { label: 'Leather', match: ['leather'] },
  { label: 'Wood', match: ['wood', 'walnut', 'beech'] },
  { label: 'Metal', match: ['aluminum', 'aluminium', 'metal', 'steel', 'brass', 'iron'] },
  { label: 'Plastic', match: ['plastic', 'acrylic'] },
  { label: 'Fabric', match: ['fabric', 'cotton', 'linen', 'canvas'] },
];

export const SHOP_COLOR_SWATCHES = {
  'Black': '#1a1a1a',
  'Brown': '#6B4423',
  'Blue': '#2C5F8A',
  'Navy': '#1B2845',
  'Green': '#3A6B47',
  'Beige': '#D4C5A0',
  'Burgundy': '#6B2C39',
  'Gold': '#C9A84C',
  'Silver': '#B8B8B8',
  'White': '#F5F5F0',
  'Multicolor': 'linear-gradient(135deg, #ff6b6b, #4ecdc4, #ffe66d)',
};

// ---- Gift Builder Data ----
export const GIFT_OCCASIONS = ['Birthday', 'Anniversary', 'Wedding', 'Baby Shower', 'Graduation', "Teacher's Day", "Valentine's Day", 'Christmas', 'Diwali', 'Corporate'];

export const GIFT_PACKAGING = [
  { id: 'classic', label: 'Classic Kraft', price: 0, desc: 'Recycled kraft box with twine' },
  { id: 'premium', label: 'Premium Wrap', price: 99, desc: 'Matte finish, satin ribbon' },
  { id: 'luxury', label: 'Luxury Hamper', price: 199, desc: 'Rigid magnetic-closure box' },
];

// ---- B2B Page Data ----
export const B2B_BENEFITS = [
  { icon: 'Tags', title: 'Wholesale Pricing', desc: 'Up to 40% off retail on bulk orders, with tiered discounts as quantity grows.' },
  { icon: 'Package', title: 'Custom Branding', desc: 'Add your logo, choose colours, and customize covers for a cohesive brand identity.' },
  { icon: 'Truck', title: 'Pan-India Delivery', desc: 'Reliable logistics with tracking, delivered to offices and warehouses nationwide.' },
  { icon: 'Headphones', title: 'Dedicated Account Manager', desc: 'A single point of contact for quotes, reorders, and ongoing support.' },
];

export const B2B_TIERS = [
  { qty: '50–199', discount: '15%', desc: 'Great for small teams' },
  { qty: '200–499', discount: '25%', desc: 'For growing organizations' },
  { qty: '500–999', discount: '32%', desc: 'Best value for mid-scale' },
  { qty: '1000+', discount: '40%', desc: 'Enterprise & bulk' },
];

// ---- Admin User ----
export const ADMIN_USER = {
  id: 1,
  email: 'admin@arihant.com',
  password_hash: '$2a$10$.3BVO3eEFm4zm/wiblzwDe2QOkwPiwnrM7A4tjz9k/q5gqcmGx0cu', // 'admin123'
  role: 'admin',
  is_verified: true,
  created_at: new Date().toISOString(),
};

// ---- About Page Data ----
export const ABOUT_VALUES = [
  { icon: 'Recycle', title: 'Sustainability First', desc: 'FSC-certified paper, soy-based inks, and plastic-free packaging on every order.' },
  { icon: 'Heart', title: 'Crafted by Hand', desc: 'Each notebook is hand-stitched and quality-checked in our Bengaluru studio.' },
  { icon: 'Award', title: 'Built to Last', desc: 'We design for longevity — durable bindings, premium paper, timeless aesthetics.' },
];

export const ABOUT_STATS = [
  { num: '2019', label: 'Founded in Bengaluru' },
  { num: '12k+', label: 'Customers served' },
  { num: '500+', label: 'B2B partners' },
  { num: '100%', label: 'Recyclable packaging' },
];

// ---- Featured Collections Config ----
export const FEATURED_COLLECTIONS_CONFIG = [
  {
    key: 'Notebooks',
    title: 'Notebooks & Journals',
    tagline: 'Lay-flat bindings, premium 100 GSM paper',
    img: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&q=80',
    path: '/shop?category=Notebooks',
  },
  {
    key: 'Desk',
    title: 'Desk Accessories',
    tagline: 'Handcrafted organizers and essentials',
    img: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=800&q=80',
    path: '/shop?category=Desk',
  },
];

// ============================================================
// SEED FUNCTION — Populates PostgreSQL DB from above data
// ============================================================

export async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...');

    // Seed Categories (idempotent — each section is seeded independently so a
    // partially-populated DB still gets its missing defaults).
    for (const cat of CATEGORIES) {
      await query(
        `INSERT INTO categories (name, slug, description, display_order)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug) DO NOTHING`,
        [cat.name, cat.slug, cat.description, cat.display_order]
      );
    }

    // Seed Products
    for (const p of PRODUCTS) {
      await query(
        `INSERT INTO products 
        (name, slug, description, long_description, price, wholesale_price, category, audience, image_url, gallery, stock, sku, tags, rating, featured, bulk_min_qty, dimensions, material, color, weight, care_instructions, personalizable, customization_price)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        ON CONFLICT (slug) DO NOTHING`,
        [
          p.name, p.slug, p.description, p.long_description, p.price, p.wholesale_price,
          p.category, p.audience, p.image_url, JSON.stringify(p.gallery), p.stock, p.sku,
          JSON.stringify(p.tags), p.rating, p.featured, p.bulk_min_qty, p.dimensions,
          p.material, p.color, p.weight, p.care_instructions, p.personalizable, p.customization_price,
        ]
      );
    }

    // Seed Site Content (UI config data)
    const siteContentEntries = [
      { key: 'home_collections', value: HOME_COLLECTIONS },
      { key: 'home_marquee_items', value: HOME_MARQUEE_ITEMS },
      { key: 'home_stats', value: HOME_STATS },
      { key: 'home_testimonials', value: HOME_TESTIMONIALS },
      { key: 'seasonal_campaigns', value: SEASONAL_CAMPAIGNS },
      { key: 'shop_categories', value: SHOP_ALL_CATEGORIES },
      { key: 'shop_material_options', value: SHOP_MATERIAL_OPTIONS },
      { key: 'shop_color_swatches', value: SHOP_COLOR_SWATCHES },
      { key: 'gift_occasions', value: GIFT_OCCASIONS },
      { key: 'gift_packaging', value: GIFT_PACKAGING },
      { key: 'b2b_benefits', value: B2B_BENEFITS },
      { key: 'b2b_tiers', value: B2B_TIERS },
      { key: 'featured_collections_config', value: FEATURED_COLLECTIONS_CONFIG },
      { key: 'about_values', value: ABOUT_VALUES },
      { key: 'about_stats', value: ABOUT_STATS },
    ];

    for (const entry of siteContentEntries) {
      await query(
        `INSERT INTO site_content (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO NOTHING`,
        [entry.key, JSON.stringify(entry.value)]
      );
    }

    // Seed Admin User
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    await query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING`,
      ['admin@arihant.com', adminPasswordHash, 'admin']
    );

    console.log('🎉 Seed complete! Default admin created (admin@arihant.com / admin123).');
  } catch (err) {
    console.error('⚠️ Error seeding database:', err.message);
  }
}

