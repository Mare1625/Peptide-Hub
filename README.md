# Peptide IQ Prototype

This repository contains the Peptide IQ single-page prototype with a tabbed experience for the peptide library, curated stacks, and dosing calculator.

## Quick preview

To explore the prototype locally:

1. Ensure you have Python 3 installed.
2. Serve the `src` directory with a lightweight HTTP server:
   ```bash
   python -m http.server 4173
   ```
3. Open [http://localhost:4173/src/index.html](http://localhost:4173/src/index.html) in your browser.
4. Interact with the Library, Stacks, and Calculator tabs to review the experience.

The UI is mobile-first, so consider narrowing your browser width or using device simulation tools for the intended layout.

## Data

The peptide definitions and curated stack protocols are generated via `scripts/generate_peptide_data.py`, which compiles category defaults and stack metadata into `src/data/peptides.js`.

## Build notes

The prototype is framework-free and uses vanilla JavaScript. For production use, integrate with Supabase for persistence and wire the AI search endpoint to Google AI Studio or OpenAI as described in the product brief.
