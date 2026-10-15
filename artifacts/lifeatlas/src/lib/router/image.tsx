import * as React from "react";

type ImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  placeholder?: string;
  blurDataURL?: string;
  unoptimized?: boolean;
};

/** next/image replacement: a plain <img> that honours `fill` and `priority` without leaking props. */
export default function Image({ fill, priority, quality: _q, placeholder: _p, blurDataURL: _b, unoptimized: _u, style, loading, ...rest }: ImageProps) {
  return (
    <img
      {...rest}
      loading={priority ? "eager" : (loading ?? "lazy")}
      decoding="async"
      {...(priority ? { fetchPriority: "high" as const } : {})}
      style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style } : style}
    />
  );
}
