/** El çizimi simge (bkz. src/art/icons.ts). */
import type { CSSProperties } from 'react';
import { hasIcon, iconSvg } from '../art/icons';
import type { Category } from '../engine/categories';

export function Icon({ name, size = 28, className, label, style }: { name: string; size?: number; className?: string; label?: string; style?: CSSProperties }) {
  return (
    <span
      className={`icon ${className ?? ''}`}
      style={{ width: size, height: size, ...style }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      dangerouslySetInnerHTML={{ __html: iconSvg(name, size) }}
    />
  );
}

/** Kategorinin simgesi (oyuncunun eklediği kategoriler: yıldız). */
export function CatIcon({ cat, size = 24 }: { cat: Pick<Category, 'id'>; size?: number }) {
  return <Icon name={hasIcon(cat.id) ? cat.id : 'ozel'} size={size} className="cat-icon" />;
}
