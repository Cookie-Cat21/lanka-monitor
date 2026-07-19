-- Phase 5 activation: dengue weekly CSV is verified and tidy.
-- Coconut/HARTI remain demo until PDF parse lands.
-- OpenAQ stays inactive until OPENAQ_API_KEY is set.

update sources set active = true where id = 'dengue_hub';

-- Prefer civic category for quake watch (seeded as health earlier).
update sources set category = 'civic' where id = 'usgs_quakes';
