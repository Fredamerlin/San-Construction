import { images, type ImageKey } from '../../data/images';

export interface ArtDirectedSource {
  /** Media query, e.g. "(orientation: portrait)". The first matching source wins. */
  media: string;
  image: ImageKey;
}

interface PictureProps {
  image: ImageKey;
  /** Alternative compositions for particular screen shapes, checked in order before `image`. */
  sources?: ArtDirectedSource[];
  /** Describes what the browser should expect the rendered width to be, e.g. "(min-width: 1024px) 50vw, 100vw". */
  sizes: string;
  /** Overrides the manifest alt text. Pass "" for purely decorative images. */
  alt?: string;
  /** Load immediately with high priority (use only for the main above-the-fold image). */
  priority?: boolean;
  className?: string;
  imgClassName?: string;
}

const srcSet = (key: ImageKey, format: 'avif' | 'webp') =>
  images[key].widths.map((w) => `/images/${key}-${w}.${format} ${w}w`).join(', ');

/**
 * Responsive AVIF/WebP image. Width and height are always set so the browser can reserve
 * space and avoid layout shift; CSS (object-cover) handles cropping to the container.
 */
export function Picture({ image, sources = [], sizes, alt, priority = false, className = '', imgClassName = '' }: PictureProps) {
  const asset = images[image];
  const fallbackWidth = asset.widths.find((w) => w >= 1024) ?? asset.widths[asset.widths.length - 1];

  return (
    <picture className={className}>
      {sources.map((source) => [
        <source key={`${source.media}-avif`} media={source.media} type="image/avif" srcSet={srcSet(source.image, 'avif')} sizes={sizes} />,
        <source key={`${source.media}-webp`} media={source.media} type="image/webp" srcSet={srcSet(source.image, 'webp')} sizes={sizes} />,
      ])}
      <source type="image/avif" srcSet={srcSet(image, 'avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(image, 'webp')} sizes={sizes} />
      <img
        src={`/images/${image}-${fallbackWidth}.webp`}
        width={asset.width}
        height={asset.height}
        alt={alt ?? asset.alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        className={`h-full w-full object-cover ${imgClassName}`}
      />
    </picture>
  );
}
