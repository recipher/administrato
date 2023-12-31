import { SyntheticEvent } from 'react';

const DEFAULT_FALLBACK = '';

type Props = {
  src: string;
  fallbackSrc?: string;
  alt?: string | undefined;
  className?: string;
};

export default function Image({ src, fallbackSrc, alt = "", className }: Props) {
  const addImageFallback = (e: SyntheticEvent<HTMLImageElement, Event>) =>
    e.currentTarget.src = fallbackSrc || DEFAULT_FALLBACK;

  return <img src={src} alt={alt} title={alt} onError={addImageFallback} className={className} />;
};