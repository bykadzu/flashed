/**
 * Analytics Tracking Edge Function
 *
 * Receives page view data from published pages and stores in Supabase.
 * Called by the analytics script injected into published HTML.
 *
 * POST /track
 * Body: { pageId: string, referrer?: string, userAgent?: string }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for cross-origin requests from published pages
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Simple hash function for IP anonymization (privacy-friendly)
async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(ip + Deno.env.get('IP_SALT') || 'flashed-salt')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16)
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Parse request body
    const { pageId, referrer, userAgent } = await req.json()

    if (!pageId) {
      return new Response(
        JSON.stringify({ error: 'pageId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get client IP for anonymized tracking
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] ||
                     req.headers.get('x-real-ip') ||
                     'unknown'
    const ipHash = await hashIP(clientIP)

    // Look up the page to get the UUID
    const { data: page } = await supabase
      .from('published_pages')
      .select('id')
      .eq('short_id', pageId)
      .single()

    // Insert page view record
    const { error } = await supabase
      .from('page_views')
      .insert({
        page_id: page?.id || null,
        short_id: pageId,
        referrer: referrer || null,
        user_agent: userAgent || null,
        ip_hash: ipHash,
        timestamp: new Date().toISOString()
      })

    if (error) {
      console.error('Error inserting page view:', error)
      // Don't expose internal errors to client
      return new Response(
        JSON.stringify({ ok: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Also increment the views counter on the published page
    if (page?.id) {
      await supabase.rpc('increment_page_views', { page_uuid: page.id })
        .catch(() => {
          // Fallback if RPC doesn't exist - do manual increment
          supabase
            .from('published_pages')
            .update({ views: supabase.rpc('increment', { x: 1 }) })
            .eq('id', page.id)
        })
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Track error:', error)
    return new Response(
      JSON.stringify({ ok: false }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
