import type { UrgencyLevel } from "@/lib/countdown";

export interface HeroTone {
  gradient: string;
  ring: string;
  hours: string;
}

export interface StatusBarTone {
  gradient: string;
  text: string;
  subtext: string;
  progressTrack: string;
  progressFill: string;
  border: string;
}

export const heroTones: Record<UrgencyLevel, HeroTone> = {
  calm: {
    gradient: "from-accent via-accent to-accent-hover",
    ring: "ring-accent/30",
    hours: "bg-white/15 text-white",
  },
  focus: {
    gradient: "from-accent via-accent-hover to-[#1E7DE0]",
    ring: "ring-accent/40",
    hours: "bg-white/15 text-white",
  },
  urgent: {
    gradient: "from-warning via-[#FF8500] to-[#FF7B00]",
    ring: "ring-warning/40",
    hours: "bg-white/20 text-white",
  },
  critical: {
    gradient: "from-danger via-[#E22A20] to-[#D7261C]",
    ring: "ring-danger/50",
    hours: "bg-white/20 text-white",
  },
  past: {
    gradient: "from-bg-tertiary via-bg-secondary to-bg-tertiary",
    ring: "ring-border",
    hours: "bg-bg-secondary text-text-secondary",
  },
};

const accentStatusBarTone: StatusBarTone = {
  gradient: "from-accent to-accent-hover",
  text: "text-white",
  subtext: "text-white/85",
  progressTrack: "bg-white/20",
  progressFill: "bg-white",
  border: "border-accent/40",
};

export const statusBarTones: Record<UrgencyLevel, StatusBarTone> = {
  calm: accentStatusBarTone,
  focus: accentStatusBarTone,
  urgent: {
    gradient: "from-warning to-[#FF7B00]",
    text: "text-white",
    subtext: "text-white/90",
    progressTrack: "bg-white/25",
    progressFill: "bg-white",
    border: "border-warning/50",
  },
  critical: {
    gradient: "from-danger to-[#D7261C]",
    text: "text-white",
    subtext: "text-white/90",
    progressTrack: "bg-white/25",
    progressFill: "bg-white",
    border: "border-danger/60",
  },
  past: {
    gradient: "from-bg-tertiary to-bg-secondary",
    text: "text-text-secondary",
    subtext: "text-text-muted",
    progressTrack: "bg-bg-tertiary",
    progressFill: "bg-text-muted",
    border: "border-border",
  },
};
