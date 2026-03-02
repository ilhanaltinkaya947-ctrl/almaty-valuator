-- Fix: assigned_to had FK to profiles(id) but CRM uses authorized_agents
-- Drop the constraint so we can store agent IDs from authorized_agents table
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_assigned_to_fkey;
-- No new FK added — column stays uuid, agent ID stored as text
-- This avoids cross-table FK conflicts between profiles and authorized_agents
