// front/supabase/functions/sync-tiktok-metrics/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Configure Supabase client
const supabaseUrl =
  Deno.env.get("SUPABASE_URL") || "https://mhflahfkeqxsolneaoxy.supabase.co";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl, supabaseKey);

// Backend API URL for TikTok stats
const BACKEND_URL = Deno.env.get("BACKEND_URL");

console.log(`Starting sync-tiktok-metrics function`);
console.log(`BACKEND_URL: ${BACKEND_URL ? "Configured" : "Not configured"}`);

// Helper function to extract TikTok video ID from URL
function extractTikTokVideoId(url: string) {
  console.log(`Extracting ID from URL: ${url}`);
  try {
    const urlObj = new URL(url);
    console.log(
      `URL parsed: hostname=${urlObj.hostname}, path=${urlObj.pathname}`
    );

    // Handle different TikTok URL formats
    if (urlObj.hostname.includes("tiktok.com")) {
      // Format: https://www.tiktok.com/@username/video/1234567890123456789
      const pathParts = urlObj.pathname.split("/");
      console.log(`Path parts: ${JSON.stringify(pathParts)}`);

      const videoIndex = pathParts.indexOf("video");
      if (videoIndex !== -1 && videoIndex + 1 < pathParts.length) {
        const videoId = pathParts[videoIndex + 1];
        console.log(`Extracted video ID: ${videoId}`);
        return videoId;
      }

      // Format: https://vm.tiktok.com/1234567890123456789/
      if (urlObj.hostname === "vm.tiktok.com") {
        const videoId = urlObj.pathname.replace(/\//g, "");
        console.log(`Extracted vm.tiktok.com video ID: ${videoId}`);
        return videoId;
      }
    }

    console.log(`Could not extract video ID from URL format`);
    return null;
  } catch (error) {
    console.error(`Error parsing TikTok URL: ${error.message}`);
    return null;
  }
}

async function getTikTokVideoStats(url: string) {
  console.log(`Getting stats for URL: ${url}`);
  try {
    if (!BACKEND_URL) {
      console.error("BACKEND_URL environment variable is not set");
      return null;
    }

    // Use the scrape-video endpoint instead of video-stats
    const apiUrl = `${BACKEND_URL}/api/v1/tiktok/scrape-video`;
    console.log(`Calling API: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ videoUrl: url }),
    });

    console.log(
      `API response status: ${response.status} ${response.statusText}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error response: ${errorText}`);
      throw new Error(`${response.statusText}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`API response data: ${JSON.stringify(data)}`);

    // Extract stats from the response based on the scrape-video endpoint format
    if (data && data.data && data.data.video && data.data.video.stats) {
      const stats = data.data.video.stats;
      return {
        views: stats.views || 0,
        likes: stats.likes || 0,
        comments: stats.comments || 0,
        shares: stats.shares || 0,
      };
    } else {
      console.error(`Unexpected response format from scrape-video endpoint`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching TikTok stats: ${error.message}`);
    return null;
  }
}

async function syncTikTokMetrics() {
  console.log(`${new Date().toISOString()} - Starting TikTok metrics sync`);

  try {
    // Get all active contest submissions
    console.log("Querying contest_links table for active submissions");
    const { data: submissions, error } = await supabase
      .from("contest_links")
      .select("*")
      .is("active", true);

    if (error) {
      console.error(`Error fetching submissions: ${error.message}`);
      throw error;
    }

    console.log(
      `Found ${submissions?.length || 0} active submissions to update`
    );

    // Process each submission
    let updatedCount = 0;
    let failedCount = 0;

    for (const submission of submissions || []) {
      console.log(
        `Processing submission ID: ${submission.id}, URL: ${submission.url}`
      );

      if (!submission.url) {
        console.log(`Skipping submission ${submission.id}: No URL`);
        continue;
      }

      // Get latest stats from TikTok
      const stats = await getTikTokVideoStats(submission.url);

      if (!stats) {
        console.log(
          `Skipping submission ${submission.id}: Could not get stats`
        );
        failedCount++;
        continue;
      }

      console.log(
        `Updating submission ${submission.id} with stats: ${JSON.stringify(
          stats
        )}`
      );

      // Update the submission with new stats
      const { error: updateError } = await supabase
        .from("contest_links")
        .update({
          views: stats.views,
          likes: stats.likes,
          comments: stats.comments,
          shares: stats.shares,
          last_stats_update: new Date().toISOString(),
        })
        .eq("id", submission.id);

      if (updateError) {
        console.error(
          `Error updating submission ${submission.id}: ${updateError.message}`
        );
        failedCount++;
      } else {
        console.log(`Successfully updated submission ${submission.id}`);
        updatedCount++;
      }
    }

    console.log(
      `Sync complete: Updated ${updatedCount} submissions, Failed: ${failedCount}`
    );
    return {
      success: true,
      updated: updatedCount,
      failed: failedCount,
      total: submissions?.length || 0,
    };
  } catch (error) {
    console.error(`Error syncing TikTok metrics: ${error.message}`);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  console.log(
    `${new Date().toISOString()} - Received request: ${req.method} ${req.url}`
  );

  try {
    // Parse request body if present
    let requestBody = {};
    try {
      const bodyText = await req.text();
      if (bodyText) {
        requestBody = JSON.parse(bodyText);
        console.log(`Request body: ${JSON.stringify(requestBody)}`);
      }
    } catch (e) {
      console.log(`No request body or invalid JSON: ${e.message}`);
    }

    // Run the sync process
    console.log("Starting TikTok metrics sync process");
    const result = await syncTikTokMetrics();

    // Return the result
    console.log(`Returning result: ${JSON.stringify(result)}`);
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
      status: result.success ? 200 : 500,
    });
  } catch (error) {
    console.error(`Unhandled error: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
