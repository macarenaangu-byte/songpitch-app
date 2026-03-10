import { Upload } from 'lucide-react';
import { DESIGN_SYSTEM } from '../constants/designSystem';

export function UploadProgressBar({ progress, fileName, totalFiles, currentFile }) {
  const isBulk = totalFiles && totalFiles > 1;
  const label = isBulk
    ? `Uploading ${currentFile} of ${totalFiles}...`
    : `Uploading ${fileName || 'file'}...`;

  return (
    <div style={{
      background: DESIGN_SYSTEM.colors.bg.card,
      border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
      borderRadius: DESIGN_SYSTEM.radius.md,
      padding: DESIGN_SYSTEM.spacing.lg,
      marginBottom: DESIGN_SYSTEM.spacing.md,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <Upload size={16} color={DESIGN_SYSTEM.colors.brand.primary} className={progress < 100 ? 'upload-pulse' : undefined} />
        <span style={{
          color: DESIGN_SYSTEM.colors.text.secondary,
          fontSize: DESIGN_SYSTEM.fontSize.sm,
          fontWeight: DESIGN_SYSTEM.fontWeight.medium,
          fontFamily: "'Outfit', sans-serif",
        }}>{label}</span>
        <span style={{
          marginLeft: 'auto',
          color: DESIGN_SYSTEM.colors.brand.primary,
          fontSize: DESIGN_SYSTEM.fontSize.sm,
          fontWeight: DESIGN_SYSTEM.fontWeight.bold,
          fontFamily: "'Outfit', sans-serif",
        }}>{progress}%</span>
      </div>
      <div style={{
        height: 6,
        background: DESIGN_SYSTEM.colors.bg.surface,
        borderRadius: DESIGN_SYSTEM.radius.full,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: DESIGN_SYSTEM.colors.brand.primary,
          borderRadius: DESIGN_SYSTEM.radius.full,
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
}
