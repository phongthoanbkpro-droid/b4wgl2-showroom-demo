# B4WGL2 — Public WebGL2 Showroom Preview

A **static, public, interactive WebGL2** prototype of the reusable B4WGL2 showroom experience. It renders **three original, procedurally authored demo models** (FORMA Lounge, ARC Table Light, NOVA Compact), with product navigation, four live color options per model, orbit/zoom/pinch, theme persistence, responsive mobile UI, and fullscreen where supported.

**Scope and provenance:** The actual private/internal Blend4Web CE scenes `cfchonmau3vn`, `MAUBOM`, and `TH02`, and their CE runtime, were **not** included. Asset redistribution rights for those originals have not been established. This is not a Blend4Web runtime benchmark, and not a production release or product-specification certification. The public model samples are fresh code-driven meshes with no external libraries, assets, fonts, tracking scripts, or credentials.

## Run locally

Open `index.html` in a browser, or serve the directory statically (e.g., `python -m http.server 8080`) and visit `http://localhost:8080/`. A browser with WebGL2 support is required.

## Publish

The included `.github/workflows/pages.yml` publishes the repository root to GitHub Pages when Pages is configured with **Settings → Pages → Source: GitHub Actions**. The site is hosted under `https://<account>.github.io/<repo>/`, with all links and resources relative to that subdirectory.

## License / rights

The newly authored demo code and procedural model definitions are provided by the project owner for demonstration within this repository. No third-party engine/scene binaries are bundled. Before repurposing production assets, verify applicable licenses, trademarks, source/notice requirements, customer authorization and scene provenance.