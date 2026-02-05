/**
 * Page Serving Edge Function
 *
 * Serves published HTML pages by their short ID.
 * URL pattern: /p/{shortId}
 *
 * GET /serve-page?id={shortId}
 * Returns: HTML content with proper headers
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Cache control for published pages (5 minutes)
const CACHE_MAX_AGE = 300

serve(async (req) => {
  const url = new URL(req.url)

  // Extract short ID from query param or path
  // Supports: ?id=abc123 or /serve-page/abc123
  let shortId = url.searchParams.get('id')
  if (!shortId) {
    // Try to extract from path
    const pathParts = url.pathname.split('/')
    shortId = pathParts[pathParts.length - 1]
  }

  if (!shortId || shortId === 'serve-page') {
    return new Response(notFoundPage(), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch the published page
    const { data: page, error } = await supabase
      .from('published_pages')
      .select('html, seo_title, seo_description')
      .eq('short_id', shortId)
      .single()

    if (error || !page) {
      console.error('Page not found:', shortId, error)
      return new Response(notFoundPage(), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      })
    }

    // Return the HTML with appropriate headers
    return new Response(page.html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE}`,
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff',
      }
    })

  } catch (error) {
    console.error('Serve page error:', error)
    return new Response(errorPage(), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  }
})

// 404 Page
function notFoundPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Not Found - Flashed</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #09090b;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .logo { font-size: 4rem; margin-bottom: 1rem; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; color: #ef4444; }
    p { color: rgba(255,255,255,0.6); margin-bottom: 2rem; }
    a {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background: #fff;
      color: #09090b;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      transition: opacity 0.2s;
    }
    a:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">⚡</div>
    <h1>Page Not Found</h1>
    <p>This page doesn't exist or may have been removed.</p>
    <a href="https://flashed.app">Create Your Own Page</a>
  </div>
</body>
</html>`
}

// Error Page
function errorPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - Flashed</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #09090b;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .logo { font-size: 4rem; margin-bottom: 1rem; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; color: #f59e0b; }
    p { color: rgba(255,255,255,0.6); margin-bottom: 2rem; }
    a {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background: #fff;
      color: #09090b;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">⚡</div>
    <h1>Something Went Wrong</h1>
    <p>We're having trouble loading this page. Please try again later.</p>
    <a href="javascript:location.reload()">Retry</a>
  </div>
</body>
</html>`
}
