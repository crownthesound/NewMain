// @deno-types="npm:@types/node"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const { url } = await req.json();

    if (!url) {
      throw new Error('URL is required');
    }

    if (!url.includes('tiktok.com')) {
      throw new Error('Invalid TikTok URL');
    }

    try {
      // Parse the TikTok URL to get video ID and username
      const tiktokUrl = new URL(url);
      const pathParts = tiktokUrl.pathname.split('/');
      const username = pathParts[1]?.replace('@', '');
      const videoId = pathParts[3];

      if (!username || !videoId) {
        throw new Error('Invalid TikTok URL format');
      }

      // Construct the embed code
      const embedCode = `<blockquote class="tiktok-embed" cite="${url}" data-video-id="${videoId}">
        <section></section>
      </blockquote>
      <script async src="https://www.tiktok.com/embed.js"></script>`;

      // Construct the thumbnail URL (this is a predictable format)
      const thumbnailUrl = `https://www.tiktok.com/api/img/?itemId=${videoId}&location=0`;

      const response = {
        title: `TikTok by @${username}`,
        url,
        embedCode,
        thumbnail: thumbnailUrl,
        username,
        views: 0, // These will be updated client-side
        likes: 0,
        comments: 0,
        shares: 0
      };

      return new Response(
        JSON.stringify(response),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate'
          },
        },
      );
    } catch (error) {
      console.error('Processing error:', error);
      throw new Error('Invalid TikTok URL format. Please check the URL and try again.');
    }
  } catch (error) {
    console.error('Function error:', error);
    
    const errorMessage = error.message || 'An unexpected error occurred';
    const status = error.message.includes('Method not allowed') ? 405 : 400;

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        },
      },
    );
  }
});