---
name: Imported dependency detection
description: Avoid false dependency names emitted by the frontend migration copy helper.
---

Treat the frontend migration helper's inferred dependency list as untrusted suggestions, not an install manifest.

**Why:** Its text-based import detection can mistake template literals and prose for package names and include Node built-ins. It can print an installation-success label even after the underlying install command fails.

**How to apply:** After copying imported source, check the actual package manifest and real external import statements. Install genuine client dependencies explicitly; exclude Node built-ins, framework-only server dependencies, and strings extracted from prose.
