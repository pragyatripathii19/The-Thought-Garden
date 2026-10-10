# Thought Garden — Backend

This directory is designated for backend services, APIs, and data processing utilities as The Thought Garden evolves.

## Architecture & Scope
* **Current State (MVP / Prototype):** The Thought Garden is architected local-first using IndexedDB in `frontend/` with zero server dependency.
* **Future Evolution:**
  - Local SQLite / persistent desktop service (if wrapped in Electron/Tauri)
  - Optional local embedding / semantic search service (e.g., Python FastAPI or Node/ONNX)
  - Optional encrypted backup sync or export processing
