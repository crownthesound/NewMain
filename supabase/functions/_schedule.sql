-- Schedule for sync-tiktok-metrics function
-- Runs every 10 minutes to update TikTok metrics for contest submissions

-- First, remove any existing job with the same name to avoid duplicates
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'sync-tiktok-metrics';

-- Add the cron job to run every 10 minutes
SELECT cron.schedule(
  'sync-tiktok-metrics',           -- job name
  '*/10 * * * *',                  -- cron expression: every 10 minutes
  $$
  SELECT net.http_post(
    'https://' || current_setting('supabase_functions.url', true) || '/sync-tiktok-metrics',
    '{}',
    jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || current_setting('supabase_functions.key', true))
  );
  $$
); 