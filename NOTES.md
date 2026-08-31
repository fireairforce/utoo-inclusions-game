# Utoo Build Blades — Throwaway Prototype

An endless one-button booth game inspired by the classic rotating-disc knife
mechanic, rebuilt around the Utoo Web toolchain.

## Game loop

1. The landing page explains the challenge and shows the best record. Press
   Space to enter the dedicated game page and start Level 1; every later Space
   press fires one toolchain knife.
2. The central Utoo logo disc rotates continuously. Collision uses the actual
   blade and handle widths: visible gaps accept a knife, and only physical
   knife-to-knife contact crashes the throw. The needle-thin blade profile and
   pixel-fit hitbox allow a throw through any visibly open gap.
3. Consecutive successful throws build a Combo and multiply the score.
4. Level 1 requires five knives and starts with two evenly spaced guard knives.
   Every three levels adds one guard, capped at four. Most difficulty still
   comes from a repeating motion pattern that shifts between steady, turbo,
   slow, reverse, reverse-turbo, and reverse-slow phases. Later levels increase
   the peak speed and shorten every phase. Each new level also rotates through
   a distinct disc, guide, and glow color so the transition reads immediately.
5. The run starts with two heart-shaped chances and ends after two crashes,
   then reports the player's reached level,
   total inserted knives, score, and rank. The result stays visible for a
   ten-second countdown before the booth automatically returns to the
   landing page for the next visitor; Space returns immediately.
6. The single highest score and its reached level are saved in browser-local
   storage and survive page refreshes; no player identity is collected.

## Prototype question

Can a familiar one-button mechanic keep booth visitors playing long enough to
compare levels, while the rotating Utoo logo and named toolchain knives make the
project memorable?

This is a throwaway prototype. Validate difficulty and session length before
moving it into a production route or connecting it to a leaderboard.
