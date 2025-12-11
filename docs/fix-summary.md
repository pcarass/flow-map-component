# Flow Map Configuration Fix Summary

This update focuses on making configuration choices persist reliably between Flow Builder renders and across saved sessions.

## What changed

- Added an input-variable signature check in `flowMapCpe` so cached values only reset when Flow Builder sends new data, preventing stale settings from overwriting edits while still honoring saved configurations.
- Normalized cache hydration to always run when `inputVariables` updates, ensuring map type, list placement, and center settings load accurately after reopening the Flow.

## Problems solved

- Map type selection (Google vs. Leaflet) now sticks instead of reverting during CPE rerenders.
- Map center options (Auto, coordinates, or address) refresh correctly instead of retaining old coordinates.
- List panel choices and other CPE selections no longer reset unexpectedly after the editor refreshes.

