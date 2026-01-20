---
name: nano-banana-imager
description: Use this skill to generate high-quality images, icons, and assets for frontend web development using Gemini 3 Pro.
---

# Nano Banana Imager

## Description
This skill leverages the `gemini-3-pro-image-preview` model to create visual assets on demand. Use this when the user needs:
1.  Placeholder images for a website layout.
2.  Custom icons or UI assets.
3.  Visual ideas generated from text prompts.

**Prerequisites**:
-   `google-genai` package installed (`pip install google-genai`).
-   `GEMINI_API_KEY` environment variable set.

## Quick Start
1.  **Define Prompt**: Detailed description of the visual style and subject.
2.  **Generate**: Run the script with the prompt and output filename.

## Workflows

### Workflow 1: Generate Website Placeholders
Use this to fill empty spots in a layout (Hero section, Feature cards, etc.).

1.  **Identify Requirement**: "I need a hero image of a futuristic city."
2.  **Construct Command**:
    ```bash
    python3 scripts/generate_image.py --prompt "A futuristic city skyline at sunset, cyberpunk style, wide angle, high resolution, web design hero image" --output "assets/hero_city.png"
    ```
3.  **Execute**: Run the command from the skill directory or project root.

### Workflow 2: Create UI Icons
Use this to create consistent icon sets.

1.  **Identify Style**: "Minimalist flat blue icons."
2.  **Construct Command**:
    ```bash
    python3 scripts/generate_image.py --prompt "Minimalist flat vector icon of a shopping cart, blue color, white background" --output "assets/icon_cart.png"
    ```

## Reference
- **Model**: `gemini-3-pro-image-preview`
- **Script**: `scripts/generate_image.py`
