import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL ||
  "https://ovgjoucblebzcgysnvfv.supabase.co";
const supabaseAnonKey =
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92Z2pvdWNibGViemNneXNudmZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDEwODgsImV4cCI6MjA4Mzk3NzA4OH0.9TEjFmPnC_2vTypUeZ-xB-bzj334MjQHgpYkuPqVbLQ";

// Suppress AbortError from showing in console
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filter out AbortError messages
  if (
    args[0] &&
    typeof args[0] === "string" &&
    args[0].includes("AbortError")
  ) {
    return;
  }

  // Filter out "signal is aborted" messages
  if (
    args[0] &&
    typeof args[0] === "object" &&
    args[0].message &&
    args[0].message.includes("signal is aborted")
  ) {
    return;
  }

  originalConsoleError.apply(console, args);
};

// Create Supabase client with proper configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // This helps prevent the AbortError
    storage: window.localStorage,
    storageKey: "supabase.auth.token",
  },
  // Disable realtime temporarily to reduce errors
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

// import { createClient } from "@supabase/supabase-js";
// // const supabaseUrl = "https://ovgjoucblebzcgysnvfv.supabase.co";
// // const supabaseAnonKey =
// // ("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92Z2pvdWNibGViemNneXNudmZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDEwODgsImV4cCI6MjA4Mzk3NzA4OH0.9TEjFmPnC_2vTypUeZ-xB-bzj334MjQHgpYkuPqVbLQ");
// // const supabaseAnonKey = "sb_secret_rXkNLYiL5IdFxe4Yk-HbGw_wkJQIQMD";
// // const supabase = createClient(supabaseUrl, supabaseKey);

// const supabaseUrl =
//   process.env.REACT_APP_SUPABASE_URL ||
//   "https://ovgjoucblebzcgysnvfv.supabase.co";
// const supabaseAnonKey =
//   process.env.REACT_APP_SUPABASE_ANON_KEY ||
//   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92Z2pvdWNibGViemNneXNudmZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDEwODgsImV4cCI6MjA4Mzk3NzA4OH0.9TEjFmPnC_2vTypUeZ-xB-bzj334MjQHgpYkuPqVbLQ";

// export const supabase = createClient(supabaseUrl, supabaseAnonKey);
