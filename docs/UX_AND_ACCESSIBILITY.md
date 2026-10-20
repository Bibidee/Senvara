# Interface, Visual Language and Accessibility

Senvara's design language is the **Evidence Atelier**: spacious, editorial and exploratory. A pale ink-washed background contrasts with deep navy, confident ultramarine, soft cornflower, citron and peach. A new rounded four-point glyph, generous open typography, opposing document layers and a magnifying-lens motif belong to this product's visual vocabulary.

The first screen asks a question rather than displaying fake network activity. Navigation centers on **Observatory**, **Start a review**, and **How it works**. Each route exists as a statically exportable Next.js App Router page; the live record viewer uses `?id=` so that public record IDs do not require a server or generated dynamic routes.

- The Observatory shows only on-chain data. Loading, empty, unconfigured and RPC-error states are separate.
- The Workbench pairs a compact, validated creation form with a live unsigned record preview.
- The Record viewer pairs two immutable source cards with an independently read assessment; source links target the exact GitHub commit.
- Each participant sees actions gated by contract status, deadline and wallet role; the contract enforces authorization again.
- The transaction desk preserves meaningful result phases and source hashes without turning local storage into a protocol state.
- Responsive breakpoints preserve header wallet access, reduce large compositions for mobile, prevent horizontal overflow where CSS permits, and honor reduced-motion preferences.

The local Chromium smoke verifies visible labels, keyboard traversal, responsive layouts at 390px, 768px and 1440px, and an automated axe-core 4.14.0 sweep across all routes with zero reported violations. This is not a complete accessibility certification: assistive-technology/manual mobile review remains mandatory before release.
