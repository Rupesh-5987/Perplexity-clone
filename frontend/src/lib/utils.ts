import {
  Globe,
  GraduationCap,
  ImageIcon,
  Video,
  PenLine,
  MessageSquareText,
  type LucideIcon,
} from "lucide-react";
import type { FocusMode } from "../types";

export interface FocusModeMeta {
  id: FocusMode;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
}

// Reddit doesn't ship a lucide icon, so we render its glyph as inline SVG
// (see RedditGlyph below) rather than pulling in a whole brand-icon package.
export const FOCUS_MODES: FocusModeMeta[] = [
  {
    id: "webSearch",
    label: "Web",
    shortLabel: "Web",
    description: "Search across the entire web",
    icon: Globe,
  },
  {
    id: "academicSearch",
    label: "Academic",
    shortLabel: "Academic",
    description: "Search academic papers and journals",
    icon: GraduationCap,
  },
  {
    id: "redditSearch",
    label: "Reddit",
    shortLabel: "Reddit",
    description: "Search discussions on Reddit",
    icon: Globe, // overridden with RedditGlyph where rendered
  },
  {
    id: "youtubeSearch",
    label: "YouTube",
    shortLabel: "YouTube",
    description: "Search videos on YouTube",
    icon: Video, // overridden with YoutubeGlyph where rendered
  },
  {
    id: "imageSearch",
    label: "Image",
    shortLabel: "Image",
    description: "Search for images",
    icon: ImageIcon,
  },
  {
    id: "videoSearch",
    label: "Video",
    shortLabel: "Video",
    description: "Search for videos",
    icon: Video,
  },
  {
    id: "writingAssistant",
    label: "Writing",
    shortLabel: "Writing",
    description: "Get help writing, without web search",
    icon: PenLine,
  },
];

export function getFocusModeMeta(mode: FocusMode): FocusModeMeta {
  return (
    FOCUS_MODES.find((m) => m.id === mode) ?? {
      id: mode,
      label: mode,
      shortLabel: mode,
      description: "",
      icon: MessageSquareText,
    }
  );
}

export function getDomain(url: string | undefined): string {
  if (!url) return "";
  try {
    const { hostname } = new URL(url);
    return hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function getFaviconUrl(url: string): string {
  const domain = getDomain(url);
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

export function truncate(text: string | undefined | null, max: number): string {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "\u2026";
}