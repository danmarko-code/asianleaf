import { cn } from "@/lib/utils";

/*
 * Brand mark: two leaf blades folded into the letter A.
 *
 * The olive blade carries the left stroke and the apex, the lime blade crosses
 * in front as the right stroke, and a thin crossbar sits underneath. The wedge
 * of negative space between the blades is the counter of the A.
 *
 * Gradients are brand art only; they are never used as UI surfaces.
 */

const GLYPH_DARK =
  "M4 42c5-12 12-26 20-35 1 5 1 13-1 19-5 4-12 8-19 16Z";
const GLYPH_LIME =
  "M24 7c5 6 12 17 18 29 2 3 3 6 4 7-7-3-13-7-18-12-3-4-4-14-4-24Z";
const GLYPH_CROSS =
  "M14 32c5-4 10-6 15-6 2 2 4 4 6 6-6-2-11-3-16-2Z";

export function LeafGlyph({
  className,
  animated = false,
}: {
  className?: string;
  animated?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g
        className={cn(animated && "logo-blade logo-blade-left")}
        style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
      >
        <path d={GLYPH_DARK} fill="url(#leaf-glyph-dark)" />
        <path
          d="M6 38C10 28 16 17 22.5 8.5"
          stroke="#d9ee8a"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.5"
        />
      </g>

      <g
        className={cn(animated && "logo-blade logo-blade-right")}
        style={{ transformBox: "fill-box", transformOrigin: "50% 0%" }}
      >
        <path d={GLYPH_LIME} fill="url(#leaf-glyph-lime)" />
        <path
          d="M26 12c4 9 9 19 14 27"
          stroke="#f2ffc4"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.45"
        />
      </g>

      <path d={GLYPH_CROSS} fill="#3f5a12" opacity="0.9" />

      <defs>
        <linearGradient
          id="leaf-glyph-dark"
          x1="6"
          y1="42"
          x2="24"
          y2="7"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#2f430e" />
          <stop offset="0.55" stopColor="#4f6b1f" />
          <stop offset="1" stopColor="#7ba11e" />
        </linearGradient>
        <linearGradient
          id="leaf-glyph-lime"
          x1="24"
          y1="7"
          x2="46"
          y2="43"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#d5ec6b" />
          <stop offset="0.5" stopColor="#a8ca26" />
          <stop offset="1" stopColor="#6f9410" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const LOCKUP_TEXT_STYLE = {
  fontFamily: "var(--font-playfair), Georgia, serif",
  fontWeight: 500,
} as const;

const LOCKUP_DARK =
  "M238 172C266 128 300 82 336 40c4 26 2 56-8 82-22 16-46 32-66 56Z";
const LOCKUP_LIME =
  "M336 40c24 34 60 78 96 118 14 14 22 22 30 30-34-12-68-30-98-52-18-14-28-32-28-96Z";
const LOCKUP_CROSS =
  "M286 154c20-14 44-24 66-26 12 10 24 20 36 30-30-8-58-14-82-10-8 2-14 4-20 6Z";

export function LeafLogo({
  className,
  animated = false,
  showPlace = true,
}: {
  className?: string;
  animated?: boolean;
  showPlace?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 640 232"
      className={className}
      role="img"
      aria-labelledby={animated ? "leaf-logo-title" : undefined}
      aria-label={animated ? undefined : "Asian Leaf Homeowners Association"}
      focusable="false"
    >
      {animated ? (
        <title id="leaf-logo-title">Asian Leaf Homeowners Association</title>
      ) : null}

      <g
        className={cn(animated && "logo-blade logo-blade-left")}
        style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
      >
        <path d={LOCKUP_DARK} fill="url(#leaf-lockup-dark)" />
        <path
          d="M246 164c18-38 46-84 84-118"
          stroke="#d9ee8a"
          strokeWidth="2.4"
          strokeLinecap="round"
          opacity="0.45"
        />
      </g>

      <g
        className={cn(animated && "logo-blade logo-blade-right")}
        style={{ transformBox: "fill-box", transformOrigin: "50% 0%" }}
      >
        <path d={LOCKUP_LIME} fill="url(#leaf-lockup-lime)" />
        <path
          d="M344 54c24 36 58 78 96 122"
          stroke="#f2ffc4"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.45"
        />
      </g>

      <path d={LOCKUP_CROSS} fill="#3f5a12" opacity="0.9" />

      <g className={cn(animated && "logo-word")}>
        <text
          className="logo-word-text"
          x={232}
          y={140}
          textAnchor="end"
          style={LOCKUP_TEXT_STYLE}
          fontSize={44}
          letterSpacing="0.16em"
          fill="var(--color-forest)"
        >
          ASIAN
        </text>
        <text
          className="logo-word-text"
          x={436}
          y={140}
          textAnchor="start"
          style={LOCKUP_TEXT_STYLE}
          fontSize={44}
          letterSpacing="0.16em"
          fill="var(--color-forest)"
        >
          LEAF
        </text>
      </g>

      {showPlace ? (
        <text
          className={cn(animated && "logo-place")}
          x={320}
          y={206}
          textAnchor="middle"
          style={LOCKUP_TEXT_STYLE}
          fontSize={21}
          letterSpacing="0.02em"
          fill="var(--color-muted)"
        >
          General Trias, Cavite
        </text>
      ) : null}

      <defs>
        <linearGradient
          id="leaf-lockup-dark"
          x1="238"
          y1="172"
          x2="336"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#2f430e" />
          <stop offset="0.5" stopColor="#4f6b1f" />
          <stop offset="1" stopColor="#8fb11f" />
        </linearGradient>
        <linearGradient
          id="leaf-lockup-lime"
          x1="336"
          y1="40"
          x2="462"
          y2="188"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#d5ec6b" />
          <stop offset="0.5" stopColor="#a8ca26" />
          <stop offset="1" stopColor="#6f9410" />
        </linearGradient>
      </defs>
    </svg>
  );
}
