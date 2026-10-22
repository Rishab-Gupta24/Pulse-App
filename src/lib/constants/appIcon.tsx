// Flat app mark shared by the favicon, PWA and Apple touch icons:
// solid system blue, white "P", no gradients (design.md §1).
export const APP_ICON_BACKGROUND = "#007AFF";

export function AppIconMark({ size }: { size: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: APP_ICON_BACKGROUND,
        color: "#FFFFFF",
        // Glyph stays inside the maskable-icon safe zone (inner 80%).
        fontSize: size * 0.56,
        fontWeight: 700,
        letterSpacing: "-0.04em",
      }}
    >
      P
    </div>
  );
}
