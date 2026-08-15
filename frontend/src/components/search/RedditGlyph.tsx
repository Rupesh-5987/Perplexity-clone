interface Props {
  size?: number;
  className?: string;
}

export default function RedditGlyph({ size = 16, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="8.6" cy="13.2" r="1.35" fill="currentColor" />
      <circle cx="15.4" cy="13.2" r="1.35" fill="currentColor" />
      <path
        d="M8.2 16c1 .8 2.3 1.2 3.8 1.2s2.8-.4 3.8-1.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path d="M12 10.4V6.6l2.4.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="15.1" cy="7" r="1" fill="currentColor" />
    </svg>
  );
}
