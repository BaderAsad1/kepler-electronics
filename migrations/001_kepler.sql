CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS products (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),slug text UNIQUE NOT NULL,sku text,name text NOT NULL,description text NOT NULL DEFAULT '',category text NOT NULL,categories text[] NOT NULL DEFAULT '{}',brand text,protocols text[] NOT NULL DEFAULT '{}',applications text[] NOT NULL DEFAULT '{}',specs jsonb NOT NULL DEFAULT '{}',media jsonb NOT NULL DEFAULT '[]',downloads jsonb NOT NULL DEFAULT '[]',variants jsonb NOT NULL DEFAULT '[]',included text,compatibility text,mode text NOT NULL DEFAULT 'quote' CHECK(mode IN('quote','buy','unavailable')),price_minor integer CHECK(price_minor>0),currency text NOT NULL DEFAULT 'AED' CHECK(currency='AED'),stock integer CHECK(stock>=0),published boolean NOT NULL DEFAULT true,source_url text UNIQUE,source_hash text,review_status text NOT NULL DEFAULT 'source-review-pending',edited_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),CHECK(mode!='buy' OR(price_minor IS NOT NULL AND stock IS NOT NULL AND review_status='approved'))
);
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category);
CREATE TABLE IF NOT EXISTS projects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),slug text UNIQUE NOT NULL,name text NOT NULL,description text NOT NULL DEFAULT '',scope text,location text,media jsonb NOT NULL DEFAULT '[]',published boolean NOT NULL DEFAULT true,source_url text UNIQUE,source_hash text,review_status text NOT NULL DEFAULT 'source-review-pending',edited_at timestamptz);
CREATE TABLE IF NOT EXISTS content(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),slug text UNIQUE NOT NULL,title text NOT NULL,kind text NOT NULL,body text NOT NULL DEFAULT '',media jsonb NOT NULL DEFAULT '[]',downloads jsonb NOT NULL DEFAULT '[]',source_url text UNIQUE,source_hash text,published boolean NOT NULL DEFAULT true,review_status text NOT NULL DEFAULT 'source-review-pending',edited_at timestamptz);
CREATE TABLE IF NOT EXISTS redirects(source text PRIMARY KEY,destination text NOT NULL,status integer NOT NULL DEFAULT 308 CHECK(status IN(301,308)),review_status text NOT NULL DEFAULT 'pending');
CREATE TABLE IF NOT EXISTS settings(key text PRIMARY KEY,value jsonb NOT NULL,updated_at timestamptz NOT NULL DEFAULT now());
INSERT INTO settings(key,value) VALUES
 ('commerce','{"sellingEnabled":false,"pricesApproved":false,"inventoryApproved":false,"policiesApproved":false,"fulfillmentApproved":false,"shippingApproved":false,"taxApproved":false,"taxBps":null,"taxInclusive":false,"shippingZones":[]}'),
 ('contact','{"name":"KEPLER Electronics for Control Systems LLC","address":"Abdullah Ahmad Mohammed Bin Fahad Building 4, Office No. 123, Qusais Industrial 2, Dubai, UAE","phone":"+971 4 324 4835","email":"sales@kepler-elec.com","headquarters":"Istanbul","jordan":"Thabet Ben Dinar St. Building 3, Office No 2, Khalda, Amman, Jordan","jordanPhone":"+962 6 516 1510","whatsapp":null,"source":"https://kepler-elec.com/contact-us/","reviewStatus":"source-confirmed, business approval pending"}') ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS staff(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),email text UNIQUE NOT NULL,password_hash text,supabase_id uuid UNIQUE,role text NOT NULL CHECK(role IN('admin','editor','sales','fulfillment')),disabled boolean NOT NULL DEFAULT false,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS sessions(token_hash text PRIMARY KEY,staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,expires_at timestamptz NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS carts(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),token_hash text UNIQUE NOT NULL,items jsonb NOT NULL DEFAULT '[]',quote_items jsonb NOT NULL DEFAULT '[]',updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS enquiries(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),reference text UNIQUE NOT NULL,access_hash text NOT NULL,cart_id uuid REFERENCES carts(id),name text NOT NULL,contact_method text NOT NULL,contact text NOT NULL,project_type text NOT NULL,location text NOT NULL,requirements text NOT NULL,company text,timing text,budget text,source_page text,items jsonb NOT NULL DEFAULT '[]',status text NOT NULL DEFAULT 'new',assigned_to uuid REFERENCES staff(id),notes jsonb NOT NULL DEFAULT '[]',created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS attachments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),enquiry_id uuid REFERENCES enquiries(id),owner_hash text NOT NULL,original_name text NOT NULL,storage_key text NOT NULL,mime text NOT NULL,size integer NOT NULL,sha256 text NOT NULL,scan_status text NOT NULL DEFAULT 'quarantined' CHECK(scan_status IN('quarantined','clean','rejected')),created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS quotations(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),enquiry_id uuid NOT NULL REFERENCES enquiries(id),version integer NOT NULL,token_hash text UNIQUE NOT NULL,lines jsonb NOT NULL,valid_until timestamptz NOT NULL,terms text NOT NULL,approved_by uuid NOT NULL REFERENCES staff(id),revoked boolean NOT NULL DEFAULT false,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(enquiry_id,version));
CREATE TABLE IF NOT EXISTS orders(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),reference text UNIQUE NOT NULL,access_hash text NOT NULL,cart_id uuid REFERENCES carts(id),quotation_id uuid REFERENCES quotations(id),status text NOT NULL DEFAULT 'pending' CHECK(status IN('pending','paid','failed','cancelled','fulfilled','refunded','payment_review')),currency text NOT NULL DEFAULT 'AED',subtotal_minor integer NOT NULL CHECK(subtotal_minor>=0),tax_minor integer NOT NULL CHECK(tax_minor>=0),shipping_minor integer NOT NULL CHECK(shipping_minor>=0),total_minor integer NOT NULL CHECK(total_minor>0),address jsonb NOT NULL,lines jsonb NOT NULL,provider_session text UNIQUE,checkout_key text UNIQUE NOT NULL,expires_at timestamptz NOT NULL,paid_at timestamptz,fulfilled_at timestamptz,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS reservations(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),order_id uuid NOT NULL REFERENCES orders(id),product_id uuid NOT NULL REFERENCES products(id),quantity integer NOT NULL CHECK(quantity>0),state text NOT NULL DEFAULT 'reserved' CHECK(state IN('reserved','consumed','released')),expires_at timestamptz NOT NULL,UNIQUE(order_id,product_id));
CREATE TABLE IF NOT EXISTS payments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),order_id uuid NOT NULL REFERENCES orders(id),provider_payment text UNIQUE NOT NULL,amount_minor integer NOT NULL,currency text NOT NULL,status text NOT NULL,refund_minor integer NOT NULL DEFAULT 0,updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS webhook_events(id text PRIMARY KEY,type text NOT NULL,payload jsonb NOT NULL,status text NOT NULL DEFAULT 'pending',error text,attempts integer NOT NULL DEFAULT 0,created_at timestamptz NOT NULL DEFAULT now(),processed_at timestamptz);
CREATE TABLE IF NOT EXISTS notification_jobs(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),event_key text UNIQUE NOT NULL,kind text NOT NULL,payload jsonb NOT NULL,status text NOT NULL DEFAULT 'pending',attempts integer NOT NULL DEFAULT 0,next_attempt_at timestamptz NOT NULL DEFAULT now(),last_error text,created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE notification_jobs ADD COLUMN IF NOT EXISTS lease_at timestamptz;
ALTER TABLE notification_jobs ADD COLUMN IF NOT EXISTS provider_id text;
CREATE TABLE IF NOT EXISTS audit_log(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,staff_id uuid REFERENCES staff(id),action text NOT NULL,entity_id text,details jsonb NOT NULL DEFAULT '{}',created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS rate_limits(key text PRIMARY KEY,hits integer NOT NULL DEFAULT 1,expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS import_runs(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),summary jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS analytics_events(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),dedupe_key text UNIQUE NOT NULL,name text NOT NULL,data jsonb NOT NULL DEFAULT '{}',created_at timestamptz NOT NULL DEFAULT now());
-- No direct client access to commercial/customer tables. The server enforces roles.
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['products','projects','content','redirects','settings','staff','sessions','carts','enquiries','attachments','quotations','orders','reservations','payments','webhook_events','notification_jobs','audit_log','rate_limits','import_runs','analytics_events'] LOOP EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t); EXECUTE format('REVOKE ALL ON %I FROM PUBLIC',t); END LOOP; END $$;
DROP POLICY IF EXISTS published_products ON products;
CREATE POLICY published_products ON products FOR SELECT USING (published AND review_status='approved');
DROP POLICY IF EXISTS published_projects ON projects;
CREATE POLICY published_projects ON projects FOR SELECT USING (published AND review_status='approved');
DROP POLICY IF EXISTS published_content ON content;
CREATE POLICY published_content ON content FOR SELECT USING (published AND review_status='approved');

ALTER TABLE orders ADD COLUMN IF NOT EXISTS analytics_consent boolean NOT NULL DEFAULT false;
CREATE OR REPLACE FUNCTION immutable_order_finances() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF (NEW.lines,NEW.currency,NEW.subtotal_minor,NEW.tax_minor,NEW.shipping_minor,NEW.total_minor,NEW.cart_id,NEW.quotation_id,NEW.checkout_key,NEW.access_hash) IS DISTINCT FROM (OLD.lines,OLD.currency,OLD.subtotal_minor,OLD.tax_minor,OLD.shipping_minor,OLD.total_minor,OLD.cart_id,OLD.quotation_id,OLD.checkout_key,OLD.access_hash) THEN RAISE EXCEPTION 'Order financial snapshots are immutable'; END IF; RETURN NEW; END $$;
DROP TRIGGER IF EXISTS immutable_order_finances ON orders;
CREATE TRIGGER immutable_order_finances BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION immutable_order_finances();
CREATE TABLE IF NOT EXISTS media_library(path text PRIMARY KEY,original_name text NOT NULL,alt text NOT NULL,sha256 text NOT NULL,staff_id uuid REFERENCES staff(id),created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON media_library FROM PUBLIC;
-- Supabase may provision explicit grants for these API roles. This application
-- exposes data through its authorised server, never through direct table access.
DO $$ DECLARE role_name text; t text; BEGIN
 FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=role_name) THEN
   FOREACH t IN ARRAY ARRAY['products','projects','content','redirects','settings','staff','sessions','carts','enquiries','attachments','quotations','orders','reservations','payments','webhook_events','notification_jobs','audit_log','rate_limits','import_runs','analytics_events','media_library'] LOOP
    EXECUTE format('REVOKE ALL ON %I FROM %I',t,role_name);
   END LOOP;
  END IF;
 END LOOP;
END $$;
