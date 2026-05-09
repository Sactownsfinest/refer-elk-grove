import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://gyxzrzmofqpehwpdtnhc.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eHpyem1vZnFwZWh3cGR0bmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNzM5NDcsImV4cCI6MjA5Mzg0OTk0N30.qB8KfC716GT6ULJIHGFwwcy1OIxqoj_cW98m9TvZL7o',
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: 'BCM1clEH2HoZ2l1dFIkeOJ9v93IWoDJ9XWFdY7ZKSlPmJaSCnXAeRKfTaPHrXVZgy1tg8UqQVPg6rvGhd_loiMg',
  },
};

export default nextConfig;
