# ViTrack Branded Page Transition — Design

**Data**: 2026-02-20
**Approccio**: Overlay Transition con Logo SVG Stroke Draw
**Librerie**: framer-motion (gia installata)

---

## Componente `<ViTrackTransition>`

Componente montato in `dashboard/layout.tsx` che ascolta i cambi di `pathname` e anima una transizione brandizzata tra le pagine.

### Fasi dell'animazione

**Fase 1 — Overlay Enter (0-150ms)**
- `position: fixed` overlay nero (`bg-black`) con `opacity: 0 -> 1`
- `z-index: 50` (sopra tutto tranne modali)

**Fase 2 — Logo Stroke Draw (150-450ms)**
- Logo SVG "VT" monogramma centrato (~120px larghezza)
- Path SVG con `stroke` bianco, `fill: none`
- `stroke-dasharray` = lunghezza totale, `stroke-dashoffset` da lunghezza -> 0
- Spring: stiffness 200, damping 30

**Fase 3 — Glow Pulse (450-600ms)**
- Logo passa da stroke bianco a fill con accent color (`--color-accent-dynamic`)
- `filter: drop-shadow(0 0 20px accentColor)` animato
- Durata 150ms ease-in-out

**Fase 4 — Exit (600-800ms)**
- Logo `scale: 1 -> 1.05`, `opacity: 1 -> 0`
- Overlay `opacity: 1 -> 0`
- Nuova pagina gia renderizzata sotto

### Logo SVG

Monogramma "VT" come singolo `<path>` SVG vettoriale per abilitare lo stroke-dashoffset draw animation. Non un font — un path disegnato.

### Integrazione

- Montato in `dashboard/layout.tsx`
- `PageTransition` semplificato a solo fade-in (no slide, l'overlay copre)
- `usePathname()` + `useRef` per detectare cambi rotta
- Transizione disabilitata al primo mount
- Accent color da `usePreferences()` per glow dinamico
