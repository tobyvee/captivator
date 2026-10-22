---
title: "Picking an Unsplash photo sets the size and referral parameters on the parsed URL instead of appending strings"
type: decision
project: captivator
ticket: T-032
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, unsplash, editor]
---
# Picking an Unsplash photo sets the size and referral parameters on the parsed URL instead of appending strings

## Context
The spec and T-032 say `src = urls.regular + "&w=1600&q=70"` and `profileUrl = user.links.html + "?utm_source=captivator&utm_medium=referral"`. Unsplash's `urls.regular` already carries `q=80&w=1080`, so appending gives two `w` and two `q` parameters and leaves the size to whichever one the image CDN honours. Appending `?…` to a profile URL that already has a query would make a malformed one.

## Decision
`UnsplashSearch` parses each URL and calls `searchParams.set` (`w=1600`, `q=70` on the photo; `utm_source=captivator`, `utm_medium=referral` on the profile), replacing any existing value. A URL that doesn't parse makes the pick fail with "That photo can't be used. Try another."

## Alternatives
- **String append, as written:** duplicate parameters with an undefined winner, and a broken profile link if one ever has a query.

## Consequences
The stored `src` keeps Unsplash's other parameters (`ixid`, `crop`, `fm`…) in their original order, with `q` and `w` changed in place. The result is still an `https:` URL on `images.unsplash.com`, so the schema allowlist and the export's inlining treat it as before. The splash's `profileHref` adds the referral parameters only when missing, so it leaves these as stored.
