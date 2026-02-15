## Summary

Improves metadata extraction in the HTML library to provide better fallback behavior when `<title>` is missing.

### Changes

- Extract `<h1>` as title fallback when `<title>` is missing
- Extract `og:title` and `og:description` meta tags  
- Extract `og:image` for thumbnail support
- Applied same improvements to both `lib/htmlLibrary.ts` and `lumina_library/utils/htmlHelpers.ts`

### Why

Previously, if an HTML artifact didn't have a `<title>` tag, the library would show "Untitled Document" even if there was a meaningful `<h1>` heading. This fix provides better automatic title/description extraction from generated HTML.
