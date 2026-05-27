-- ====================================================================
-- ReliefLink AI - Supabase Database Setup SQL Schema
-- ====================================================================
--
-- This script creates the "volunteers" table to store operational responder coordinates, 
-- skills, and real-time status details. Paste this into your Supabase SQL Editor.
--

-- 1. Create the volunteers table
CREATE TABLE IF NOT EXISTS public.volunteers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    skills TEXT[] DEFAULT '{}'::TEXT[],
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    available BOOLEAN DEFAULT TRUE,
    score INTEGER DEFAULT 0,
    assigned_task_id TEXT,
    current_task_name TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Turn on Row Level Security (RLS) for security
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;

-- 3. Create public access policies for emergency rescue purposes
-- Allow anyone to read volunteer statuses & live tracking (crucial for coordinate mapping)
CREATE POLICY "Allow public read access to volunteer telemetry" 
ON public.volunteers 
FOR SELECT 
USING (true);

-- Allow anyone to sign up as a volunteer or update statuses for operations coordination
CREATE POLICY "Allow public insert access to registration" 
ON public.volunteers 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to update volunteer status (e.g., coordinates, assigned tasks)
CREATE POLICY "Allow public update access for live updates" 
ON public.volunteers 
FOR UPDATE 
USING (true);

-- 4. Enable indexes for high-speed location queries and leaderboard sorting
CREATE INDEX IF NOT EXISTS idx_volunteers_score ON public.volunteers (score DESC);
CREATE INDEX IF NOT EXISTS idx_volunteers_available ON public.volunteers (available);

-- 5. Seed some initial Bangladeshi responder data to start with if empty:
INSERT INTO public.volunteers (id, name, phone, skills, latitude, longitude, available, score, assigned_task_id, current_task_name)
VALUES 
  ('vol_01', 'Tanvir Rahman', '+880 1515-556677', ARRAY['First Aid', 'Driving', 'Cooking'], 23.8110, 90.4130, true, 750, NULL, ''),
  ('vol_02', 'Fahmida Akter', '+880 1712-445566', ARRAY['First Aid', 'Coordination', 'Search & Rescue'], 23.8210, 90.4220, true, 1220, NULL, 'Debris clearance Mirpur'),
  ('vol_03', 'Sajid Hasan', '+880 1813-223322', ARRAY['Search & Rescue', 'Driving'], 23.7260, 90.4020, false, 980, 'task_01', 'Suppressing Chemical Spot'),
  ('vol_04', 'Imran Khan', '+880 1612-990011', ARRAY['Driving', 'Cooking', 'Coordination'], 22.3551, 91.7820, true, 320, NULL, '')
ON CONFLICT (id) DO NOTHING;
