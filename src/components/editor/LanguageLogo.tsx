import type { LanguageId } from "@/types/language";

type IconSource =
  | { source: "simpleicons"; slug: string; color: string }
  | { source: "devicon"; path: string };

// SimpleIcons drops some proprietary brand marks (C#, .NET). For those we
// fall back to Devicon via jsDelivr.
const ICON: Record<LanguageId, IconSource> = {
  python: { source: "simpleicons", slug: "python", color: "3776AB" },
  javascript: { source: "simpleicons", slug: "javascript", color: "F7DF1E" },
  typescript: { source: "simpleicons", slug: "typescript", color: "3178C6" },
  go: { source: "simpleicons", slug: "go", color: "00ADD8" },
  rust: { source: "simpleicons", slug: "rust", color: "CE412B" },
  java: { source: "simpleicons", slug: "openjdk", color: "ED8B00" },
  cpp: { source: "simpleicons", slug: "cplusplus", color: "00599C" },
  csharp: {
    source: "devicon",
    path: "csharp/csharp-original.svg",
  },
};

interface LanguageLogoProps {
  lang: LanguageId;
  size?: number;
  className?: string;
}

export function LanguageLogo({ lang, size = 14, className }: LanguageLogoProps) {
  const icon = ICON[lang];
  const src =
    icon.source === "simpleicons"
      ? `https://cdn.simpleicons.org/${icon.slug}/${icon.color}`
      : `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${icon.path}`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={className}
      draggable={false}
    />
  );
}
