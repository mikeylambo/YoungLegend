# Young Legend

A character-driven strategy RPG prototype built around the fantasy of becoming a legend through relationships, investigation, network management, and tactical resolution.

## Current vertical slice

- Network hub with persistent resources
- Recruitable specialists
- Relationship/bond progression
- Investigation board with six discoverable clues
- Theory formation
- Operation planning with four approaches
- Tactical card combat as the resolution layer
- Combat Flow, energy, enemy intent, evasion, weakening, escape
- Rewards and persistent progression
- Legend traits/upgrades
- Day progression and local save
- Responsive premium game UI

## Run locally

This is intentionally dependency-light. Serve the repository as static files:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Architecture direction

Young Legend is being developed as an SLU Frame/application rather than a one-off game. The current prototype keeps game state and presentation separated enough to migrate into the SLU Web Shell once the shell archive is available as working source bytes.

## Design principle

The protagonist's class is not selected. It emerges from repeated behavior: social manipulation, investigation, risk, combat style, network building, and relationships.
