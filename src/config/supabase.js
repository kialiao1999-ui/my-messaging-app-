import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://ovgjoucblebzcgysnvfv.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92Z2pvdWNibGViemNneXNudmZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDEwODgsImV4cCI6MjA4Mzk3NzA4OH0.9TEjFmPnC_2vTypUeZ-xB-bzj334MjQHgpYkuPqVbLQ";
// const supabaseAnonKey = "sb_secret_rXkNLYiL5IdFxe4Yk-HbGw_wkJQIQMD";
// const supabase = createClient(supabaseUrl, supabaseKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
