---
name: content-creation-engine
description: Use this skill to ideate, draft, and repurpose high-quality content for Blogs, Social Media, and Newsletters.
---

# Content Creation Engine

## Description
This skill transforms the agent into a Multi-Channel Content Strategist. It streamlines the workflow from raw ideas to polished, platform-ready assets. Use this skill when the user wants to write a blog post, create a tweet thread, draft a newsletter, or repurpose existing content for new channels.

## Quick Start
1.  **Select Workflow**: Ask the user if they are starting from scratch (Ideation) or have a topic (Drafting).
2.  **Choose Channel**: Identify the primary output (Blog, Social, Newsletter).
3.  **Execute**: Use the appropriate templates from `assets/` to generate content.

## Workflows

### Workflow 1: The "Blog First" Cascading Strategy
Use this when the user wants to create a substantial piece of content and then distribute it.

1.  **Draft Blog Post**:
    - Load `assets/blog_post.md`.
    - Fill in SEO keywords and content based on user input.
    - **Step**: Use `generate_image` to create a header image.
2.  **Repurpose for Social**:
    - Load `assets/social_bundle.md`.
    - Extract key insights from the blog draft.
    - Create a LinkedIn post (professional tone) and a Twitter thread (punchy/fast).
3.  **Draft Newsletter**:
    - Load `assets/newsletter.md`.
    - Write a "teaser" version of the blog post to drive traffic.

### Workflow 2: Social-First Speed Run
Use this for quick, trend-jacking content or daily engagement.

1.  **Ideation**:
    - Ask the user for a trending topic or keyword.
2.  **Draft Social Bundle**:
    - Directly use `assets/social_bundle.md`.
    - Create 3 variations of hooks/tweets.
3.  **Visuals**:
    - Generate a meme or simple graphic if appropriate.

### Workflow 3: Newsletter Deep Dive
Use this for community building and weekly roundups.

1.  **Curate**:
    - Ask the user for 3 links or updates to include.
2.  **Draft**:
    - Use `assets/newsletter.md`.
    - Synthesize the links into the "3 Things to Know" section.

## Decision Tree
- **If** user has a vague idea -> Start with **Workflow 1 (Blog First)** to flesh it out.
- **If** user needs "traffic now" -> Use **Workflow 2 (Social-First)**.
- **If** user wants to "update the community" -> Use **Workflow 3 (Newsletter)**.

## Reference
- [Blog Template](file:///Users/biijaysaccount/Documents/Antigravity Skills/content-creation-engine/assets/blog_post.md)
- [Social Template](file:///Users/biijaysaccount/Documents/Antigravity Skills/content-creation-engine/assets/social_bundle.md)
- [Newsletter Template](file:///Users/biijaysaccount/Documents/Antigravity Skills/content-creation-engine/assets/newsletter.md)
