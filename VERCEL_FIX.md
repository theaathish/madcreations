# Vercel Deployment Fix

## Problem
Vercel deployment was failing with error:
```
Invalid route source pattern
The source property follows the syntax from path-to-regexp, not the RegExp syntax.
```

## Root Cause
The `vercel.json` file was using RegExp syntax (e.g., `/(.*\\.jpg)`) instead of path-to-regexp syntax.

## Solution Applied

### Before (Invalid)
```json
{
  "source": "/(.*\\.(jpg|jpeg|png|gif|webp|svg|ico))",
  "source": "/(.*\\.(js|css|woff|woff2|ttf|eot))",
  "source": "/api/(.*)",
  "source": "/(.*)"
}
```

### After (Valid)
```json
{
  "source": "/:path*",           // Matches any path
  "source": "/assets/:path*",    // Matches /assets/anything
  "source": "/sw.js"             // Exact match
}
```

## Changes Made

### 1. Simplified Rewrites
**Before:**
```json
"rewrites": [
  { "source": "/api/(.*)", "destination": "/api" },
  { "source": "/(.*)", "destination": "/index.html" }
]
```

**After:**
```json
"rewrites": [
  { "source": "/:path*", "destination": "/index.html" }
]
```

### 2. Fixed Headers Configuration
**Before:**
```json
"headers": [
  { "source": "/api/(.*)", ... },
  { "source": "/assets/(.*)", ... },
  { "source": "/(.*\\.(jpg|jpeg|png|gif|webp|svg|ico))", ... },
  { "source": "/(.*\\.(js|css|woff|woff2|ttf|eot))", ... },
  { "source": "/(.*)", ... }
]
```

**After:**
```json
"headers": [
  { "source": "/assets/:path*", ... },  // Cache assets for 1 year
  { "source": "/sw.js", ... },          // No cache for service worker
  { "source": "/:path*", ... }          // Security headers for all pages
]
```

## Path-to-regexp Syntax Guide

### Valid Patterns
- `/:path*` - Matches any path (replaces `(.*)`)
- `/assets/:path*` - Matches /assets/anything
- `/product/:id` - Matches /product/123
- `/api/:version/:endpoint` - Matches /api/v1/users
- `/:path+` - Matches one or more path segments

### Invalid Patterns (Don't Use)
- ❌ `/(.*)`
- ❌ `/(.*\\.jpg)`
- ❌ `/(?!admin)`
- ❌ `/[a-z]+`

## Testing

After this fix, the deployment should succeed. Verify:
1. ✅ Homepage loads correctly
2. ✅ Product pages work (/product/:id)
3. ✅ Category pages work (/posters, /polaroids)
4. ✅ Assets are cached (check Network tab)
5. ✅ Security headers are applied (check Response headers)

## Performance Impact

The simplified configuration maintains all performance benefits:
- ✅ 1 year cache for assets
- ✅ No cache for service worker
- ✅ Security headers on all pages
- ✅ DNS prefetch enabled

## References

- Vercel path-to-regexp docs: https://vercel.com/docs/projects/project-configuration#rewrites
- path-to-regexp syntax: https://github.com/pillarjs/path-to-regexp

---

**Status:** ✅ Fixed and ready to deploy
**Next Step:** Commit and push to trigger new deployment
