// Prepares the AI video production folder from cinematic/production/clips.json:
//   cinematic/production/00-keyframes/original/   storyboard panels (copied, never changed)
//   cinematic/production/00-keyframes/upscaled/   put Upscayl output here (optional, recommended)
//   cinematic/production/00-keyframes/fixes/      regenerated keyframes, e.g. kf-09.png (see FIXES.md)
//   cinematic/production/cNN-name/                start.png, end.png, prompt.txt for each clip
//   cinematic/production/PLAN.md                  the full clip plan
//
// Keyframe source, best first: fixes/kf-NN.* > upscaled/panel-NN* > original/panel-NN.png.
// A start.png made from the previous clip's last frame (by last-frame.mjs) is kept.
// Safe to run again at any time.
//
// Usage: node scripts/cinematic/prepare-clips.mjs
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const prod = join(root, 'cinematic', 'production');
const kf = join(prod, '00-keyframes');
const plan = JSON.parse(readFileSync(join(prod, 'clips.json'), 'utf8'));
for (const dir of ['original', 'upscaled', 'fixes']) mkdirSync(join(kf, dir), { recursive: true });
mkdirSync(join(root, 'cinematic', 'clips'), { recursive: true });

// Storyboard panels (cut by keyframes.mjs)
for (let n = 1; n <= 12; n++) {
  const name = `panel-${String(n).padStart(2, '0')}.png`;
  const from = join(root, 'cinematic', 'keyframes', name);
  if (!existsSync(join(kf, 'original', name))) copyFileSync(from, join(kf, 'original', name));
}

const IMAGE = /\.(png|jpe?g|webp)$/i;
function keyframeSource(id) {
  const fix = readdirSync(join(kf, 'fixes')).find((f) => f.toLowerCase().startsWith(`kf-${id}.`) && IMAGE.test(f));
  if (fix) return { path: join(kf, 'fixes', fix), label: `fixes/${fix}` };
  const up = readdirSync(join(kf, 'upscaled')).find((f) => f.toLowerCase().startsWith(`panel-${id}`) && IMAGE.test(f));
  if (up) return { path: join(kf, 'upscaled', up), label: `upscaled/${up}` };
  return { path: join(kf, 'original', `panel-${id}.png`), label: `original/panel-${id}.png, not upscaled yet` };
}

/** 16:9 centre crop at 1920×1080. */
async function writeFrame(id, to) {
  const src = keyframeSource(id);
  await sharp(src.path).resize(1920, 1080, { fit: 'cover', kernel: 'lanczos3' }).png().toFile(to);
  return src.label;
}

const promptText = (clip) => [clip.prompt, ...clip.blocks.map((b) => plan.blocks[b])].join('\n\n');

const lines = [];
for (const clip of plan.clips) {
  const folder = join(prod, `${clip.id}-${clip.slug}`);
  mkdirSync(folder, { recursive: true });
  const fromPrevious = existsSync(join(folder, 'start-source.txt'));

  const storyboardStart = await writeFrame(clip.start, join(folder, 'start-storyboard.png'));
  if (!fromPrevious) copyFileSync(join(folder, 'start-storyboard.png'), join(folder, 'start.png'));
  const endLabel = clip.end ? await writeFrame(clip.end, join(folder, 'end.png')) : null;
  const startLabel = fromPrevious ? readFileSync(join(folder, 'start-source.txt'), 'utf8').trim() : `storyboard keyframe ${clip.start} (${storyboardStart})`;

  writeFileSync(
    join(folder, 'prompt.txt'),
    [
      `CLIP ${clip.id}: ${clip.title}`,
      `Purpose: ${clip.purpose}`,
      `Camera: ${clip.camera}`,
      `Duration: ${clip.duration} s    Aspect: ${plan.settings.aspect}    Quality: ${plan.settings.resolution}`,
      '',
      `UPLOAD AS START FRAME:  start.png   <- ${startLabel}`,
      clip.end ? `UPLOAD AS END FRAME:    end.png     <- storyboard keyframe ${clip.end} (${endLabel})` : 'END FRAME:              none (leave the end frame empty)',
      '',
      '--- PROMPT (paste into the prompt box) ---',
      promptText(clip),
      '',
      '--- NEGATIVE PROMPT (paste into the negative prompt box) ---',
      plan.blocks.negative,
      '',
      ...(clip.risk ? ['--- WATCH OUT ---', clip.risk, ''] : []),
      `Save the best take as:  cinematic/clips/${clip.id}.mp4`,
      ...(clip.id !== plan.clips.at(-1).id ? [`Then run:               node scripts/cinematic/last-frame.mjs ${clip.id}`] : ['Then tell Claude all 11 clips are ready.']),
      '',
    ].join('\n'),
  );
  lines.push({ clip, startLabel, endLabel });
  console.log(`✓ ${clip.id}-${clip.slug}  start: ${startLabel}${clip.end ? `  end: ${endLabel}` : ''}`);
}

// PLAN.md: the whole plan in one place
const md = [
  '# Walkthrough clip plan (generated from clips.json, do not edit by hand)',
  '',
  `Tool: ${plan.settings.tool}. ${plan.settings.aspect}, ${plan.settings.resolution}. ${plan.settings.relevance}.`,
  `Total length: ${plan.clips.reduce((s, c) => s + c.duration, 0)} s across ${plan.clips.length} clips.`,
  '',
  '| # | Clip | Start frame | End frame | Camera | Length |',
  '|---|---|---|---|---|---|',
  ...plan.clips.map((c) => `| ${c.id} | ${c.title} | ${c.id === 'c01' ? 'keyframe 01' : `last frame of ${plan.clips[plan.clips.indexOf(c) - 1].id}`} | ${c.end ? `keyframe ${c.end}` : 'none'} | ${c.camera} | ${c.duration} s |`),
  '',
  ...lines.flatMap(({ clip }) => [
    `## ${clip.id}: ${clip.title}`,
    '',
    `- **Purpose:** ${clip.purpose}`,
    `- **Start frame:** \`${clip.id}-${clip.slug}/start.png\` (${clip.id === 'c01' ? 'storyboard keyframe 01' : `last frame of the previous clip; storyboard keyframe ${clip.start} until then`})`,
    `- **End frame:** ${clip.end ? `\`${clip.id}-${clip.slug}/end.png\` (storyboard keyframe ${clip.end})` : 'none'}`,
    `- **Camera:** ${clip.camera}`,
    `- **Duration:** ${clip.duration} s`,
    `- **Matches the reference:** ${clip.reference}`,
    ...(clip.risk ? [`- **Watch out:** ${clip.risk}`] : []),
    '',
    '**Prompt**',
    '',
    ...promptText(clip).split('\n\n').map((p) => `> ${p}\n>`),
    '',
  ]),
  '## Negative prompt (every clip)',
  '',
  `> ${plan.blocks.negative}`,
  '',
].join('\n');
writeFileSync(join(prod, 'PLAN.md'), md);
console.log('\n✓ PLAN.md');
