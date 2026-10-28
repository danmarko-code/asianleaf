export function LeafMark({
  className,
  veinClassName,
}: {
  className?: string;
  veinClassName?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M39 9C22 9 10 19 10 34c0 2 .2 4 .6 6 12-1 24-6 28-19 .8-2.6 .4-8 .4-12Z"
        fill="currentColor"
      />
      <path
        className={veinClassName}
        d="M12 38C18 30 25 23 34 15"
        stroke="var(--color-lime)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
