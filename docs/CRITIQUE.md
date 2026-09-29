# Self-critique

A pass over the first drop using the Interface Craft design-critique lens: context, first impressions, visual, interface, consistency, user context, ranked opportunities. Findings marked **fixed** were addressed before shipping; the rest are open.

## Context

A gallery of UI patterns for designers and engineers. They arrive browsing, curious and a little sceptical. The task is low-stakes and exploratory: they want to be surprised, and to understand in seconds what is special about each pattern.

## First impressions

Calm and editorial. Typography carries the brand, and the three themes read as three different products rather than one product recoloured. The weakness was that several patterns look ordinary at rest: Sieve looked like a product grid and Fuse like a button. Each pattern's idea only appears after the right interaction, and nothing told you what that interaction was.

## Visual design

- **Danger on Klein blue** (fixed): red text on Volt's blue vibrated and read poorly. Added `--danger-ink` (danger as text on a surface), which is light coral on Volt.
- **Translucent tints turn purple on blue** (fixed): Volt's `*-soft` states were hue tints and went violet over the blue ground. On Volt they are now navy recesses, and the meaning rides on the text or icon colour.
- **Hazard zones** (fixed): the danger zone was a pink wash that looked muddy on Volt. Added `--hazard-bg`, which is a tint in Paper/Ink and poster hazard stripes in Volt.
- **Pleats too faint** (fixed): Origami's folded pleats barely separated from the surface. The alternating faces now mix toward `--fg` and take the accent on hover.
- **Soft 3D layers** (fixed): unfolded crumbs kept an identity `matrix3d` from a per-element perspective, which rasterized slightly blurry at fractional DPR. Perspective moved to the row, and crumbs return to `transform: none`.
- **Dials slider needle** (fixed): the fill's edge line cut through label text. It is now a short needle that stays clear of the x-height.

## Interface design

- **No focusing mechanism** (fixed, the highest-impact change): the stage bar said “Live”, which is redundant. Every pattern now has a **Try** prompt that sets up its key moment (“Tap once. Then hold, and let go halfway. Then hold all the way.”).
- **Tuning wasn’t discoverable** (fixed): Dials only lived in the topbar. A contextual **Tune** button now sits next to Reset on every stage.
- **The empty state was unreachable** (fixed): with the demo data, no Sieve filter combination produced zero results, so its best feature (naming the culprit) never appeared. The data and the prompt now lead there.
- **Layout jumps** (fixed): Sieve’s grid shrank as items left, which re-centred the card and moved the tray under your cursor. Emptied cells now stay as faint slots, including at zero results.
- **Stamp covering the answers** (fixed): Ledger’s CONFIRMED stamp landed on top of the party and time. It now takes the confirm button’s place in the flow.

## Consistency & conventions

- One set of primitives (`ui-btn`, `ui-chip`, `ui-card`, `ui-input`) and one label style (`t-label`) across all eight demos, so they feel like one designer's work.
- **Focus theft on load** (fixed): Ledger moved focus into its first control on mount, which painted a focus ring and could scroll the page. Focus now follows the open card only after the user acts.
- **Narrow columns** (fixed): in compare mode, Inchworm, Loupe and Origami overflowed their columns because grid items default to `min-width: auto`. Stage children can now shrink, and Origami's window track uses `minmax(0, 1fr)`.

## User context

Visitors are in a browsing state of mind, so every demo should reward a single idle interaction. Uncommon care here means demos that start mid-story (Strata already has history, Origami starts eight folders deep, Loupe starts on a building deploy), prompts that name the moment to try, and state that survives reloads.

## Open opportunities

1. **Animated index thumbnails.** The home index is typographic only. A 2-second loop per pattern would sell each idea before the click.
2. **Touch pass.** Detent, Fuse and Origami handle touch, but none has been tested on a real device. Detent's haptics (`navigator.vibrate`) only fire on Android.
3. **Reduced-motion variants.** Motion respects the OS setting globally, but some patterns (Inchworm's stretch, Sieve's flight) could offer a purpose-built reduced version instead of an instant jump.
4. **Screen-reader audit.** Roles and labels are in place; they need a real VoiceOver/NVDA run, especially Sieve's tray and Strata's history.
