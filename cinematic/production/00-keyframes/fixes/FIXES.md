# Fix keyframes 09, 10 and 11 before clips c08–c11

**Update:** clip c01 established the house design (saved as `00-keyframes/master-house.png`).
Storyboard panels 9 (side garden), 10 (aerial) and 11 (night front) show the storyboard's
original house, which differs from it. A video tool animating from panel 8 to panel 9, or from 9
to 10, would visibly morph the building. Remake these three images so they show the c01 house.

You only need this for clips c08–c11. Clips c02–c07 are indoors and can go ahead now.

## Tool

Any image generator that accepts reference images and keeps a building's design. The easiest:
**ChatGPT** (upload the images, ask for an image) or **Google Gemini** (image editing). Kling's
own "Image" tab with a reference image works too.

## Keyframe 09: side garden

Upload, in this order:
1. `00-keyframes/master-house.png` (the clip c01 house): the house design to keep
2. `00-keyframes/original/panel-09.png`: the camera angle and garden to copy

Prompt:

> Create a photorealistic architectural photograph, 16:9 landscape. Use the FIRST image as the
> exact house: the same two-storey villa with warm cream plaster walls, terracotta clay-tile
> gable roofs, stone-clad piers, white columns, a balcony with a black metal railing and timber
> louvres, teak-framed windows glowing warmly. Use the SECOND image only for the camera
> angle and setting: standing in the side garden at dusk, a manicured lawn in the foreground,
> young trees, low warm garden lights along a cream compound wall, the side of the house on the
> right. Same time of day and warm lighting as the first image. Real materials, natural light,
> sharp detail. No people, no text, no watermark.

Save the result as **`00-keyframes/fixes/kf-09.png`**.

## Keyframe 10: aerial view

Upload, in this order:
1. `00-keyframes/master-house.png`
2. `00-keyframes/original/panel-10.png`

Prompt:

> Create a photorealistic aerial drone photograph, 16:9 landscape. Use the FIRST image as the
> exact house: the same two-storey villa with cream plaster walls, terracotta clay-tile
> gable roofs, stone-clad piers, a balcony with a black metal railing and warmly lit windows.
> Use the SECOND image only for the camera angle and surroundings: a high three-quarter view from
> above at dusk, showing the whole plot: the roofs, a green lawn, a cream compound wall, a paved
> driveway, the road in front and dense green trees around. Warm lights just coming on. Real
> materials, natural light, sharp detail. No people, no text, no watermark.

Save the result as **`00-keyframes/fixes/kf-10.png`**.

## Keyframe 11: front of the house at night

Upload `00-keyframes/master-house.png`, then `00-keyframes/original/panel-11.png`.

Prompt:

> Create a photorealistic architectural photograph, 16:9 landscape. Show the EXACT house from the
> FIRST image, from the same street-front angle, but at night: deep blue night sky, every window
> glowing warm, porch lantern and downlights on, warm uplights on the stone-clad piers, the
> compound wall and gate pillars lit, palm trees silhouetted. Use the SECOND image only for the
> night mood and lighting. Real materials, sharp detail. No people, no text, no watermark.

Save the result as **`00-keyframes/fixes/kf-11.png`**.

## Check, then refresh the clip folders

Put each new image next to `master-house.png` and check: same roof shape, wall colour, columns, windows?
If not, generate again. When all three look right, run:

    node scripts/cinematic/prepare-clips.mjs

The c08–c11 folders will then use the fixed images (their prompt.txt says which image
each frame came from).

Optional: the same method can tighten panel 2 (entrance) and panel 8 (terrace), but they are
close-ups and already fit well enough.
