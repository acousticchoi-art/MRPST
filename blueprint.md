# MRPST School Website Blueprint

## Overview

This document outlines the design, features, and development plan for the MRPST School website. The goal is to create a modern, visually appealing, and user-friendly website that follows the AI Development Guidelines.

## Current State

The website is a simple, static one-page site with the following sections:
- Header with navigation
- Hero section
- About Us
- Academics
- Admissions
- Contact
- Footer

The styling is basic and lacks modern design features. The JavaScript file is empty.

## Redesign Plan

### Phase 1: Visual and Structural Overhaul

#### HTML Structure
- Review and improve semantic HTML.
- Add a container div to wrap the main content for better layout control.

#### CSS Modernization
- **Color Palette:** Introduce a modern color scheme using CSS variables.
  - Primary: `#0A2540` (Oxford Blue)
  - Secondary: `#425466` (Payne's Gray)
  - Accent: `#007BFF` (A vibrant blue for interactive elements)
  - Text: `#F0F0F0` (Light gray for text on dark backgrounds)
  - Background: A subtle noise texture over a dark gradient.
- **Typography:**
  - Use a modern, readable font from Google Fonts (e.g., 'Poppins').
  - Establish a clear type scale for headings and paragraphs.
- **Layout:**
  - Use Flexbox and Grid for responsive layouts.
  - Make the design mobile-first.
- **Effects & Animations:**
  - Add a subtle background texture.
  - Add a "glow" effect to buttons and links on hover.
  - Implement smooth transitions for hover effects.
  - Add a subtle box-shadow to cards/sections to create depth.

#### JavaScript Interactivity
- Implement smooth scrolling for navigation links.
- Add a simple "fade-in" on scroll animation for sections.

### Phase 2: Advanced Features (Future)
- Convert repeating UI patterns into Web Components.
- Add a dynamic news/events section powered by a simple JSON file or Firebase.
- Explore 3D elements with Three.js for a more immersive experience.
- Add a contact form with validation.

## Current Task: Phase 1 Implementation

- **Goal:** Implement the visual and structural overhaul described in Phase 1.
- **Steps:**
  1. Update `index.html` with improved structure and link to Google Fonts.
  2. Rewrite `style.css` with the new design, including colors, fonts, layout, and effects.
  3. Update `main.js` to add smooth scrolling and fade-in animations.
  4. Commit and push the changes to the repository.
