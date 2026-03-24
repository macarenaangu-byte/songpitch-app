import { useState, useEffect } from "react";
import { DESIGN_SYSTEM } from '../constants/designSystem';

export function Avatar({ name, color, size = 40, avatarUrl, border }) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  const initials = name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name || "Avatar"}
        loading="lazy"
        onError={() => setImgError(true)}
        style={{
          width: size,
          height: size,
          borderRadius: DESIGN_SYSTEM.radius.full,
          objectFit: "cover",
          flexShrink: 0,
          boxShadow: DESIGN_SYSTEM.shadow.sm,
          border: border || '2px solid rgba(255,255,255,0.1)',
        }}
      />
    );
  }

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: DESIGN_SYSTEM.radius.full,
      background: color || DESIGN_SYSTEM.colors.brand.primary,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: DESIGN_SYSTEM.colors.text.primary,
      fontWeight: DESIGN_SYSTEM.fontWeight.bold,
      fontSize: size * 0.38,
      flexShrink: 0,
      fontFamily: DESIGN_SYSTEM.font.body,
      boxShadow: DESIGN_SYSTEM.shadow.sm,
      border: border || '2px solid rgba(255,255,255,0.1)',
    }}>
      {initials}
    </div>
  );
}
