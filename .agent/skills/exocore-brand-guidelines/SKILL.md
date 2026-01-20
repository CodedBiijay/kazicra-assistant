---
name: exocore-brand-guidelines
description: Applies the ExoCore Systems visual identity (Ebony, Bone, Picasso Green, Warning Coral) to digital artifacts and UI components. Use this to maintain "Plate Lock" consistency across all Sibling OS developments.
license: ExoCore Systems Internal
---

# ExoCore Systems Brand Styling

## Overview

To access the official ExoCore Systems identity and visual resources, use this skill. This style is designed to evoke resilience, clinical precision, and "Peace of Mind" through structured modularity.

**Keywords**: ExoCore, Sphaerocoris, resilience, clinical precision, Plate Lock, Signal Reveal, Picasso Green, Warning Coral, Ebony, Bone, tech branding, visual identity

## Brand Guidelines

### Colors

The palette is inspired by the *Sphaerocoris annulus* (Picasso Bug), representing a biological "Exoskeleton" that is both beautiful and protective.

**Core Palette:**

- **Ebony:** `#1A1A1B` — Primary background and "Shield" containers. Represents stability.
- **Bone:** `#F9F6EE` — Primary text and high-contrast labels. Represents clarity.
- **Picasso Green:** `#D0F0C0` — Primary accent. Used for "Plate Lock" success states and confirmed data.
- **Warning Coral:** `#FF4D4D` — Alert accent. Used for "Signal Reveal" high-priority risks or revenue opportunities.

### Typography

- **Headings**: Montserrat (with Helvetica fallback) — Bold, geometric, and authoritative.
- **Body Text**: Inter or Roboto (with Sans-Serif fallback) — Highly legible for data-dense clinical environments.
- **Note**: Montserrat should be used for all "Signal" elements to ensure immediate recognition.

## Features

### Plate Lock Formatting

- Wraps all data outputs in modular containers with a 1px Picasso Green border.
- Applies a subtle outer glow to "Locked" status cards.
- Ensures all elements snap to a strict 8px grid system, mirroring clinical order.

### Signal Reveal Automation

- Automatically highlights "High Urgency" text or "Revenue Signals" using Warning Coral.
- Uses pulsing animations for Coral elements to draw the operator’s eye to critical protocol deviations.
- Darkens the Ebony background during "Alert States" to increase focus on the Signal.

### Fractured Flow Visualization

- Uses directional motion (left-to-right) for data processing states.
- Applies "Bone" white for inactive paths and "Picasso Green" for active, validated data streams.

## Technical Details

### Font Management

- Uses Google Fonts (Montserrat) when available via CDN or system-install.
- Provides fallback to standard geometric sans-serifs to maintain the "Exoskeleton" look across all devices.

### Color Application

- Uses HEX and RGB values for web-based UI (Streamlit/Vercel).
- Implements alpha-transparency (e.g., `rgba(208, 240, 192, 0.1)`) for background "Plate" shading without losing readability.
