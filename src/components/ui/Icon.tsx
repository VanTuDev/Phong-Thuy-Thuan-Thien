import { HTMLAttributes } from "react";

interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  name: string;
  filled?: boolean;
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
}

export default function Icon({
  name,
  filled = false,
  weight,
  className = "",
  style,
  ...rest
}: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${filled ? "icon-fill" : ""} ${className}`}
      style={
        weight
          ? {
              fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}`,
              ...style,
            }
          : style
      }
      {...rest}
    >
      {name}
    </span>
  );
}
