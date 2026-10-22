import { ImageResponse } from "next/og";
import { AppIconMark } from "@/lib/constants/appIcon";

export const contentType = "image/png";

const SIZES = [32, 192, 512] as const;

// Served at /icon/32, /icon/192 and /icon/512 (referenced by manifest.ts).
export function generateImageMetadata() {
  return SIZES.map((size) => ({
    id: String(size),
    size: { width: size, height: size },
    contentType,
  }));
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const size = Number(await id);
  return new ImageResponse(<AppIconMark size={size} />, { width: size, height: size });
}
