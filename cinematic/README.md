# Cinematic walkthrough: shot list and clip pipeline

> **Producing the clips? Start with `production/START-HERE.md`.** It has the final plan
> (`production/PLAN.md`, generated from `production/clips.json`), a ready folder per clip, and
> takes precedence over the shorter table below (its clip lengths are 5 s or 10 s to suit Kling).

The home page walkthrough is a sequence of video frames scrubbed by scrolling, like the reference
(`video/sanvideo.mp4`). The frames come from 11 short AI image-to-video clips that join end to
start, so the whole walk feels like one continuous camera move:

    exterior → entrance → living → dining → kitchen → bedroom → bathroom → terrace → garden → aerial → night → SAN card

## 1. Keyframes

`keyframes/` holds the 12 storyboard panels (`node scripts/cinematic/keyframes.mjs`):

- `panel-NN.png`: the panel as cut from the storyboard (about 375×230, too small to use directly)
- `kf-NN-1920.png`: cropped to 16:9 and enlarged to 1920×1080. It's soft, so run it through an AI
  upscaler (Magnific, Topaz, Krea, Leonardo, or the video tool's own "enhance") first. Clips
  look as sharp as the keyframes they start from.

If the original full-size storyboard images exist, use those instead.

## 2. Generate the clips

Use a tool that takes a **start frame and an end frame**: Kling (2.x, "Start & End frame"),
Runway (Gen-4 / Gen-3 keyframes), Luma Dream Machine (start/end), or Google Veo 3.1 ("Frames to
video" in Flow).

**Settings for every clip:** 16:9, 1080p or higher, 24 fps, no audio needed, no text, no people.

**How to keep it continuous:**
1. Clip N's **end frame** is keyframe N+1.
2. Clip N+1's **start frame** is the **last frame of clip N** (export it from the finished clip),
   not the storyboard panel. Then the cut between clips is invisible. (Fall back to the
   keyframe if the last frame came out distorted.)
3. Generate 2–4 versions of each clip and keep the one where the house does not warp.

**Add this to every prompt:**
> Photorealistic architectural visualization, the same house and interior design throughout,
> straight vertical lines, no warping or morphing of architecture, smooth stabilized camera
> (gimbal / drone), one continuous shot, no cuts, no people, no text, no watermark.

| Clip | From → to | Length | Prompt (camera move) |
|---|---|---|---|
| c01 | kf-01 → kf-02 | 8 s | Slow cinematic dolly forward from the street at sunset, through the open front gate and along the paved driveway, gently descending to eye level and arriving in front of the pillared entrance porch and its steps. Warm facade lights glowing, palms swaying slightly. |
| c02 | kf-02 → kf-03 | 8 s | The camera glides up the porch steps toward the carved teak double door, the door swings open inward, and the camera passes through the doorway into a warm, softly lit living room with beige sofas and a ceiling fan. |
| c03 | kf-03 → kf-04 | 6 s | Slow lateral tracking shot to the right across the living room, past the carved wooden jali partition, revealing the dining area with its wooden dining table and pendant lights. |
| c04 | kf-04 → kf-05 | 6 s | The camera glides past the dining table and through a wide opening into the modern kitchen with teak-wood cabinets, stone counters and a window above the sink. |
| c05 | kf-05 → kf-06 | 8 s | The camera turns away from the kitchen, rises smoothly up a wooden staircase to the first floor and enters the master bedroom with a timber headboard wall, a made bed and sliding glass doors to a balcony. |
| c06 | kf-06 → kf-07 | 6 s | Slow pan to the side of the bedroom and forward through a doorway into the en-suite bathroom with natural stone walls, a backlit mirror, floating wooden vanity and glass shower. |
| c07 | kf-07 → kf-08 | 8 s | The camera turns back out of the bathroom, crosses the bedroom and moves through the open sliding glass doors onto the covered rooftop terrace at sunset, with sofas, a coffee table with a lit diya, plants and a wide view of palm trees. |
| c08 | kf-08 → kf-09 | 8 s | The camera floats forward over the terrace parapet and descends smoothly along the side of the house, down to a lush green side garden with low garden lights and young trees at dusk. |
| c09 | kf-09 → kf-10 | 8 s | Drone shot: the camera rises vertically from the garden, tilting down to reveal the whole house from above: the terracotta tiled roofs, the compound wall, lawns, driveway and the road. |
| c10 | kf-10 → kf-11 | 8 s | Drone descends slowly and arcs around to the front of the house while dusk turns to night; the windows, facade lights and garden lights brighten. Ends on the front elevation at night. |
| c11 | kf-11 → (none) | 6 s | Very slow, steady pull-back from the front of the house at night, warm lights glowing, gentle movement in the palm leaves. Static mood, no new elements. (Only a start frame; the SAN brand card is added by the website.) |

## 3. Drop the clips in

Save the clips as `cinematic/clips/c01.mp4` … `c11.mp4`, then run:

    node scripts/cinematic/build-frames.mjs

It extracts the frames (headless Edge; ffmpeg isn't needed), writes them to `public/cinematic/`
(1600 px for desktop, 960 px for phones) and writes `src/data/cinematic.json`. Once that file
lists all 11 shots, the home page uses the frame sequence instead of the old real-time 3D scene.

`shots.json` sets each shot's clip, an optional trim (`from` / `to`, in seconds), and `focusX`
(0–1: which part of the frame stays in view when a portrait phone screen crops the sides).
