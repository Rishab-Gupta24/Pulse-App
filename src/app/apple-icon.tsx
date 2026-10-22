import { ImageResponse } from "next/og";
import { AppIconMark } from "@/lib/constants/appIcon";

// iOS Home Screen icon; iOS applies its own rounded mask, so draw full-bleed.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<AppIconMark size={size.width} />, size);
}
