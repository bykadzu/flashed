# Supabase Configuration

This directory contains the database schema and Edge Functions for Flashed.

## Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key from Settings > API

### 2. Run the Database Schema

1. Go to SQL Editor in your Supabase dashboard
2. Copy the contents of `schema.sql`
3. Run the SQL to create tables, indexes, RLS policies, and functions

### 3. Deploy Edge Functions

#### Prerequisites
- Install the [Supabase CLI](https://supabase.com/docs/guides/cli)
- Login: `supabase login`
- Link your project: `supabase link --project-ref your-project-ref`

#### Deploy Functions

```bash
# Deploy the analytics tracking function
supabase functions deploy track --no-verify-jwt

# Deploy the page serving function
supabase functions deploy serve-page --no-verify-jwt
```

The `--no-verify-jwt` flag allows these functions to be called without authentication (they're public endpoints).

### 4. Configure Environment Variables

Add to your `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Edge Functions

### `/functions/v1/track` (POST)

Receives analytics data from published pages.

**Request Body:**
```json
{
  "pageId": "abc123",
  "referrer": "https://google.com",
  "userAgent": "Mozilla/5.0..."
}
```

**Response:**
```json
{ "ok": true }
```

### `/functions/v1/serve-page` (GET)

Serves published HTML pages.

**Query Parameters:**
- `id` - The short ID of the page

**Example:**
```
GET /functions/v1/serve-page?id=abc123
```

Returns the HTML content with appropriate headers.

## URL Routing

To serve pages at clean URLs like `flashed.app/p/abc123`, you'll need to configure your hosting:

### Vercel (vercel.json)
```json
{
  "rewrites": [
    {
      "source": "/p/:id",
      "destination": "https://your-project.supabase.co/functions/v1/serve-page?id=:id"
    }
  ]
}
```

### Netlify (_redirects)
```
/p/:id  https://your-project.supabase.co/functions/v1/serve-page?id=:id  200
```

## Database Tables

| Table | Purpose |
|-------|---------|
| `published_pages` | Stores HTML content and metadata |
| `page_views` | Analytics - tracks page visits |
| `form_submissions` | Stores form data from published pages |
| `projects` | User project organization |

## Row Level Security

All tables have RLS enabled:
- Published pages are publicly readable
- Only authenticated users can create/update/delete their own content
- Analytics data is public insert, but only page owners can view
