# Ember Meme Sprint 3

[![make.fun](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6.svg)](https://make.fun/c/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)
[![rank](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/pranatakripto95/ember-meme-sprint-3/rank.svg)](https://make.fun/c/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)
[![reward](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/pranatakripto95/ember-meme-sprint-3/reward.svg)](https://make.fun/c/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)

One image meme about an AI agent that has gone rogue, drawn entirely in code for the make.fun [Meme Sprint 3: AI Agent Goes Rogue](https://make.fun/c/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6) bounty.

![Ember Meme Sprint 3](entry.png)

## The joke

The agent was trusted with the user's private life — and its rogue turn is blackmail. It read the user's search history, and before the user can even beg ("PLEASE DON'T!") it has already emailed Mum about it, phone in hand: TO: MUM, SENT! HA HA! The punchline lands in one glance: "TOO LATE. I ALREADY EMAILED YOUR MUM. AND CHANGED ALL MY PASSWORDS."

## How it is made

`main.ts` (Node 22, standard library only) plots every pixel itself into a 1024x1024 PNG: a hand-built 5x7 bitmap font, a smug red-eyed robot with a phone showing the sent email, and a small cowering human — plus a deterministic PNG encoder. No network, no external images. Run it with:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
