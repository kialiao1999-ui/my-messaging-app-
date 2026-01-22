import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://ovgjoucblebzcgysnvfv.supabase.co";
const supabaseAnonKey = "sb_secret_rXkNLYiL5IdFxe4Yk-HbGw_wkJQIQMD";
// const supabase = createClient(supabaseUrl, supabaseKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
