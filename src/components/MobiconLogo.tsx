import Image from "next/image";

export function MobiconLogo({
  className,
  variant = "compact",
}: {
  className?: string;
  variant?: "compact" | "full";
}) {
  if (variant === "full") {
    return (
      <Image
        src="/mobicon-logo.png"
        alt="mobicon – Computer & Kommunikation"
        width={1029}
        height={558}
        priority
        className={`h-auto w-56 ${className ?? ""}`}
      />
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <Image
        src="/mobicon-icon.png"
        alt=""
        width={522}
        height={430}
        className="h-9 w-auto"
      />
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
