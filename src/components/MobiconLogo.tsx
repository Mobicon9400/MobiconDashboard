export function MobiconLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <svg
        viewBox="0 0 64 56"
        className="h-10 w-10 shrink-0"
        aria-hidden="true"
      >
        <path
          d="M8 0h40a8 8 0 0 1 8 8v20a8 8 0 0 1-8 8h-8l-14 18v-18H8a8 8 0 0 1-8-8V8a8 8 0 0 1 8-8Z"
          fill="var(--mobicon-green)"
        />
        <g fill="#fff">
          <path d="M18 24a18 18 0 0 1 28 0l-4.2 4.2a12 12 0 0 0-19.6 0Z" />
          <path d="M23.8 30.2a10 10 0 0 1 16.4 0l-4.2 4.2a4 4 0 0 0-8 0Z" />
          <circle cx="32" cy="38" r="3" />
        </g>
      </svg>
      <div className="leading-tight">
        <div className="text-2xl font-semibold tracking-tight text-mobicon-dark">
          mobicon
        </div>
        <div className="text-[0.65rem] font-medium tracking-[0.2em] text-mobicon-green-dark">
          COMPUTER &amp; KOMMUNIKATION
        </div>
      </div>
    </div>
  );
}
