export function MobiconLogo({
  className,
  variant = "compact",
}: {
  className?: string;
  variant?: "compact" | "full";
}) {
  if (variant === "full") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/mobicon-logo.png"
        alt="mobicon – Computer & Kommunikation"
        className={`h-auto w-56 ${className ?? ""}`}
      />
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/mobicon-icon.png" alt="" className="h-9 w-auto" />
      <div className="leading-tight">
        <div className="text-2xl font-semibold tracking-tight text-mobicon-dark">
          mobicon
        </div>
        <div className="text-[0.6rem] font-medium tracking-[0.18em] text-mobicon-green-dark">
          COMPUTER &amp; KOMMUNIKATION
        </div>
      </div>
    </div>
  );
}
