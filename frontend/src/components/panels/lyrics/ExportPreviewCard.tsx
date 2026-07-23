import { Card } from '../../ui/design-system-components';

interface ExportPreviewCardProps {
  outputPreview: string;
}

export function ExportPreviewCard({ outputPreview }: ExportPreviewCardProps) {
  if (!outputPreview) return null;

  return (
    <Card title="Ekspor Pratinjau">
      <pre className="bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[10px] text-[var(--text-primary)] p-3 max-h-[200px] overflow-auto whitespace-pre-wrap font-mono">
        {outputPreview.slice(0, 1600)}
      </pre>
    </Card>
  );
}
