ALTER TABLE leads ADD COLUMN year_built integer;
ALTER TABLE leads ADD COLUMN wall_material text CHECK (wall_material IN ('panel','brick','monolith'));
ALTER TABLE leads ADD COLUMN is_pledged boolean NOT NULL DEFAULT false;
ALTER TABLE leads ADD COLUMN intent text NOT NULL DEFAULT 'ready' CHECK (intent IN ('ready','negotiate'));
