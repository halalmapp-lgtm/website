// Public runtime config for the marketing site.
// The anon key is safe to ship: waitlist_signups only grants INSERT to anon,
// and has no SELECT policy, so the list cannot be read with this key.
window.HALALMAPP_CONFIG = {
  SUPABASE_URL: "https://jphdaraqmtlxraejkosk.supabase.co",
  SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaGRhcmFxbXRseHJhZWprb3NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMDc4NTQsImV4cCI6MjA4Njc4Mzg1NH0.yDf54s3rNcTpWHKdPJx3d8MWIJo7wjJ_vrvLog1IxBk",
  CONTACT_EMAIL: "halalmapp@gmail.com",
};
