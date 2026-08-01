-- ============================================================================
-- ⚡ ARIHANT E-COMMERCE — PRODUCTION-READY POSTGRESQL DATABASE SCHEMA
-- ============================================================================

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ----------------------------------------------------------------------------
-- Automatic updated_at Timestamp Trigger Function
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'b2b')),
    is_verified BOOLEAN NOT NULL DEFAULT true,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Upgrade columns for existing databases if needed
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'local' CHECK (auth_provider IN ('local', 'google'));

-- ----------------------------------------------------------------------------
-- 2. CATEGORIES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- ----------------------------------------------------------------------------
-- 3. PRODUCTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    long_description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    wholesale_price NUMERIC(10, 2) CHECK (wholesale_price IS NULL OR wholesale_price >= 0),
    category VARCHAR(100) NOT NULL,
    audience VARCHAR(50) NOT NULL DEFAULT 'both' CHECK (audience IN ('retail', 'wholesale', 'both')),
    image_url TEXT NOT NULL,
    gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
    stock INT NOT NULL DEFAULT 100 CHECK (stock >= 0),
    sku VARCHAR(100),
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    rating NUMERIC(3, 2) NOT NULL DEFAULT 4.5 CHECK (rating >= 0 AND rating <= 5),
    featured BOOLEAN NOT NULL DEFAULT false,
    bulk_min_qty INT NOT NULL DEFAULT 1 CHECK (bulk_min_qty >= 1),
    dimensions VARCHAR(100),
    material VARCHAR(100),
    color VARCHAR(100),
    weight VARCHAR(100),
    care_instructions TEXT,
    personalizable BOOLEAN NOT NULL DEFAULT false,
    customization_price NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (customization_price >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesale_price NUMERIC(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS audience VARCHAR(50) DEFAULT 'both';
ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 4.5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS bulk_min_qty INT DEFAULT 1;
ALTER TABLE products ADD COLUMN IF NOT EXISTS personalizable BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS customization_price NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- ----------------------------------------------------------------------------
-- 4. ORDERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    pincode VARCHAR(20),
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    shipping NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (shipping >= 0),
    total NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    payment_method VARCHAR(50) NOT NULL DEFAULT 'cod' CHECK (payment_method IN ('cod', 'card', 'upi', 'razorpay', 'stripe')),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    order_type VARCHAR(50) NOT NULL DEFAULT 'retail' CHECK (order_type IN ('retail', 'b2b', 'bulk')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    tracking_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cod';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(50) DEFAULT 'retail';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS state VARCHAR(100);

-- ----------------------------------------------------------------------------
-- 4b. USER ADDRESSES TABLE (saved shipping addresses)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(100) NOT NULL DEFAULT 'Home',
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE addresses ADD COLUMN IF NOT EXISTS label VARCHAR(100) DEFAULT 'Home';
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS full_name VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS phone VARCHAR(50) NOT NULL DEFAULT '';
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS addresses_user_idx ON addresses (user_id);

DROP TRIGGER IF EXISTS set_updated_at_addresses ON addresses;
CREATE TRIGGER set_updated_at_addresses BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 5. EMAIL VERIFICATIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_verifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 6. PASSWORD RESETS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_resets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 7. NEWSLETTER SUBSCRIPTIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 8. B2B INQUIRIES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS b2b_inquiries (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    gst_number VARCHAR(100),
    products TEXT,
    quantity VARCHAR(100),
    message TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'quoted', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE b2b_inquiries ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'new';
ALTER TABLE b2b_inquiries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- ----------------------------------------------------------------------------
-- 9. CUSTOMIZATION RULES TABLE (Config Key-Value)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customization_rules (
    id SERIAL PRIMARY KEY,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed default customization rules if missing
INSERT INTO customization_rules (id, config) VALUES (1, $${
  "fonts": [{"label": "Serif", "value": "'Fraunces', serif"}, {"label": "Modern", "value": "'Inter', sans-serif"}, {"label": "Script", "value": "'Brush Script MT', cursive"}, {"label": "Mono", "value": "ui-monospace, monospace"}],
  "colors": [{"label": "Black", "value": "#1a1612"}, {"label": "Gold", "value": "#c08a3e"}, {"label": "Silver", "value": "#9a9a9a"}, {"label": "Navy", "value": "#1e3a5f"}, {"label": "Burgundy", "value": "#7a2e3a"}, {"label": "Forest", "value": "#2d5a3d"}],
  "maxLength": 20,
  "enabled": true
}$$)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 11. WISHLIST TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wishlist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);
CREATE TABLE IF NOT EXISTS site_content (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. REVIEWS & RATINGS TABLE
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    review_text TEXT,
    verified_purchase BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- 12. COUPONS & DISCOUNTS TABLE
CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL,
    min_order_value NUMERIC(10, 2),
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    applicable_to VARCHAR(50) DEFAULT 'all' CHECK (applicable_to IN ('all', 'retail', 'wholesale')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ----------------------------------------------------------------------------

-- Full-Text & Fuzzy Search Indexes
CREATE INDEX IF NOT EXISTS products_search_idx ON products USING GIN (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(tags::text, '')));
CREATE INDEX IF NOT EXISTS products_name_trgm_idx ON products USING GIN (name gin_trgm_ops);

-- B-Tree Indexes for Lookups, Filtering & Sorting
CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_idx ON users (google_id) WHERE google_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_idx ON categories (slug);
CREATE UNIQUE INDEX IF NOT EXISTS coupons_code_idx ON coupons (code);
CREATE INDEX IF NOT EXISTS categories_display_order_idx ON categories (display_order ASC);
CREATE INDEX IF NOT EXISTS products_category_idx ON products (category);
CREATE INDEX IF NOT EXISTS products_featured_idx ON products (featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS products_price_idx ON products (price);
CREATE INDEX IF NOT EXISTS products_rating_idx ON products (rating DESC);
CREATE INDEX IF NOT EXISTS orders_user_idx ON orders (user_id);
CREATE INDEX IF NOT EXISTS orders_email_idx ON orders (email);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS reviews_product_idx ON reviews (product_id);
CREATE INDEX IF NOT EXISTS reviews_user_idx ON reviews (user_id);
CREATE INDEX IF NOT EXISTS reviews_rating_idx ON reviews (rating DESC);
CREATE INDEX IF NOT EXISTS coupons_code_active_idx ON coupons (code) WHERE is_active = true;
CREATE UNIQUE INDEX IF NOT EXISTS email_verifications_email_idx ON email_verifications (email);
CREATE UNIQUE INDEX IF NOT EXISTS password_resets_token_idx ON password_resets (token);
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscriptions_email_idx ON newsletter_subscriptions (email);
CREATE INDEX IF NOT EXISTS b2b_inquiries_status_idx ON b2b_inquiries (status);

-- ----------------------------------------------------------------------------
-- COMPOSITE & FUNCTIONAL INDEXES FOR QUERY OPTIMIZATION
-- ----------------------------------------------------------------------------

-- Products: common filter/sort combos used by the shop
CREATE INDEX IF NOT EXISTS products_category_featured_idx ON products (category, featured DESC) WHERE featured = true;
CREATE INDEX IF NOT EXISTS products_category_price_idx ON products (category, price ASC);
CREATE INDEX IF NOT EXISTS products_audience_category_idx ON products (audience, category);
CREATE INDEX IF NOT EXISTS products_created_at_idx ON products (created_at DESC);

-- Orders: user-scoped lists + admin status/date reporting
CREATE INDEX IF NOT EXISTS orders_user_created_idx ON orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_created_idx ON orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders (payment_status);
CREATE INDEX IF NOT EXISTS orders_paid_created_idx ON orders (payment_status, created_at DESC) WHERE payment_status = 'paid';

-- Reviews: per-product lists and stats
CREATE INDEX IF NOT EXISTS reviews_product_created_idx ON reviews (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reviews_product_rating_idx ON reviews (product_id, rating DESC);

-- Coupons: active-code lookups
CREATE INDEX IF NOT EXISTS coupons_code_lower_idx ON coupons (LOWER(code));
CREATE INDEX IF NOT EXISTS coupons_valid_range_idx ON coupons (valid_from, valid_until);

-- Email verifications / password resets: expiry cleanup
CREATE INDEX IF NOT EXISTS email_verifications_expires_idx ON email_verifications (expires_at);
CREATE INDEX IF NOT EXISTS password_resets_expires_idx ON password_resets (expires_at);

-- ----------------------------------------------------------------------------
-- MATERIALIZED VIEWS FOR REPORTING
-- ----------------------------------------------------------------------------

-- Product sales summary (revenue + units per product for paid orders)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_product_sales_summary AS
SELECT
  oi->>'product_id' AS product_id,
  oi->>'name' AS product_name,
  COUNT(*)::int AS order_count,
  SUM((oi->>'qty')::int)::bigint AS units_sold,
  SUM((oi->>'qty')::int * (oi->>'price')::numeric)::NUMERIC(12,2) AS total_revenue
FROM orders o
CROSS JOIN LATERAL jsonb_array_elements(o.items::jsonb) AS oi
WHERE o.payment_status = 'paid'
GROUP BY oi->>'product_id', oi->>'name';

CREATE UNIQUE INDEX IF NOT EXISTS mv_product_sales_pk ON mv_product_sales_summary (product_id);

-- Daily orders summary (orders count + revenue per day for paid orders)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_orders_summary AS
SELECT
  created_at::date AS order_date,
  COUNT(*)::int AS orders_count,
  COUNT(*) FILTER (WHERE payment_status = 'paid')::int AS paid_orders,
  COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid'), 0)::NUMERIC(12,2) AS revenue
FROM orders
GROUP BY created_at::date;

CREATE UNIQUE INDEX IF NOT EXISTS mv_daily_orders_pk ON mv_daily_orders_summary (order_date);

-- Refresh helper function + trigger-based auto-refresh on new orders
CREATE OR REPLACE FUNCTION refresh_reporting_views()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_sales_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_orders_summary;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS refresh_reporting_views_on_order ON orders;
CREATE TRIGGER refresh_reporting_views_on_order
AFTER INSERT OR UPDATE OF payment_status ON orders
FOR EACH ROW
EXECUTE FUNCTION refresh_reporting_views();

-- ----------------------------------------------------------------------------
-- UPDATED_AT AUTOMATIC TRIGGERS
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS set_updated_at_users ON users;
CREATE TRIGGER set_updated_at_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_categories ON categories;
CREATE TRIGGER set_updated_at_categories BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_products ON products;
CREATE TRIGGER set_updated_at_products BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_orders ON orders;
CREATE TRIGGER set_updated_at_orders BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_b2b_inquiries ON b2b_inquiries;
CREATE TRIGGER set_updated_at_b2b_inquiries BEFORE UPDATE ON b2b_inquiries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_customization_rules ON customization_rules;
CREATE TRIGGER set_updated_at_customization_rules BEFORE UPDATE ON customization_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_site_content ON site_content;
CREATE TRIGGER set_updated_at_site_content BEFORE UPDATE ON site_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_reviews ON reviews;
CREATE TRIGGER set_updated_at_reviews BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_coupons ON coupons;
CREATE TRIGGER set_updated_at_coupons BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
