# Making the 11 walkthrough clips: beginner guide

**Goal:** 11 short photorealistic video clips of the same house. Played in order, they form one
continuous camera journey from the street, through every room, up to the sky and into the
night. The website then plays them as you scroll.

The full plan, with every prompt, is in **PLAN.md**. Each clip has its own folder
(`c01-arrival`, `c02-front-door`, …) holding exactly what to upload:

| File | What it is |
|---|---|
| `start.png` | Upload as the **start frame** |
| `end.png` | Upload as the **end frame** (c11 has none) |
| `prompt.txt` | The prompt and negative prompt to paste, the length, and where to save the result |
| `start-storyboard.png` | The storyboard version of the start frame (a fallback; see step 4) |

## What you need

1. **Kling AI** (klingai.com), a paid plan. It's easy to use and has a **start frame + end
   frame** mode, which is what makes the clips join up. The free plan adds a watermark and
   limits quality, so pay for the month you are producing. Budget for about 30–40 generations
   (11 clips × about 3 takes each).
2. **Upscayl** (upscayl.org), free for Windows. It sharpens the small storyboard panels before
   you use them.
3. Optional, for the keyframe fixes: ChatGPT or Google Gemini.

Menus change often. If a button below has a different name, look for the same idea: "Image to
Video", "Start/End frame", "Professional/High quality", "Negative prompt".

## Step 1: sharpen the keyframes (10 minutes, once)

1. Open Upscayl. Choose **Batch Upscale**.
2. Input folder: `cinematic/production/00-keyframes/original`
3. Output folder: `cinematic/production/00-keyframes/upscaled`
4. Model: **High Fidelity** (or "Real-ESRGAN" / "Ultrasharp"), scale **4x**, format PNG. Click Upscayl.
5. In the project folder, run:

       node scripts/cinematic/prepare-clips.mjs

   Every clip folder now uses the sharpened images (each `prompt.txt` says "upscaled/…").

## Step 2: fix keyframes 9 and 10 (before clip c08)

These two storyboard panels show a different house. Follow `00-keyframes/fixes/FIXES.md`. You
can start clips c01–c07 first.

## Step 3: generate a clip (c01 first)

1. In Kling, open **Video → Image to Video**.
2. Turn on the **end frame** (sometimes called "Start & End frames" or "Frames").
3. **Start frame:** upload `c01-arrival/start.png`. **End frame:** upload `c01-arrival/end.png`.
4. Paste the **PROMPT** section of `prompt.txt` into the prompt box and the **NEGATIVE PROMPT**
   section into the negative prompt box.
5. Settings: **Professional / High quality** mode, **1080p**, **16:9**, duration as given in
   `prompt.txt` (5 s or 10 s). Move the **Creativity ↔ Relevance** slider about 70% toward
   Relevance. Leave camera-control presets off: the prompt describes the camera move.
6. Generate **3 takes** (or 1 at a time until one is good).
7. Pick the best take using the checklist below and click **Download** (MP4, no watermark).
8. Rename it **`c01.mp4`** and save it in **`cinematic/clips/`**.

## Step 4: link it to the next clip

Run:

    node scripts/cinematic/last-frame.mjs c01

This saves the exact last frame of c01 as `c02-front-door/start.png`, so c02 starts where c01
ended and there's no visible jump. Then generate c02 the same way, run `last-frame.mjs c02`, and
so on up to c11.

If a clip's last frame came out distorted, don't run `last-frame.mjs`. Upload
`start-storyboard.png` as the next clip's start frame instead.

## Checklist: is this take good enough?

- [ ] Looks like a real photograph or film, not CGI or a game
- [ ] Walls, columns and window frames stay straight; nothing bends or melts
- [ ] It's still the **same house** (roof shape, cream walls, teak windows, columns)
- [ ] The camera move is smooth and slow, with no jumps or speed bursts
- [ ] The final frame matches the end frame closely
- [ ] No people, text, logos or watermark

If two out of three takes fail, simplify the first sentence of the prompt (less movement), or
set Relevance higher.

## Step 5: hand over

When `cinematic/clips/` holds `c01.mp4` to `c11.mp4`, tell Claude. Claude will build the
website frames (`node scripts/cinematic/build-frames.mjs`), run the site, check every scene
against the storyboard and show you screenshots before anything goes live.

## Alternative tool

**Google Veo 3.1 in Google Flow** (needs a Google AI Pro/Ultra subscription) also does start
and end frames ("Frames to Video"). Clips are a fixed 8 s; use the same files and prompts.
Don't mix tools between clips if you can avoid it: colour and texture change between models.
