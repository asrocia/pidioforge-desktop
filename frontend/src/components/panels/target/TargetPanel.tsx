import { Callout, WorkflowStepper } from '../../ui/design-system-components';
import type { PidioConfig } from '../../../types/app.types';
import { useTargetEngine } from './hooks';
import { InputCard } from './InputCard';
import { PlatformPresetsCard } from './PlatformPresetsCard';
import { RenderSettingsCard } from './RenderSettingsCard';
import { AdvancedCards } from './AdvancedCards';
import { ActionsCard } from './ActionsCard';
import { SummaryCards } from './SummaryCards';

export function TargetPanel({
  config,
  updateConfig,
}: {
  config: PidioConfig;
  updateConfig: (path: string, value: unknown) => void;
}) {
  const engine = useTargetEngine({ config, updateConfig });

  return (
    <div className="space-y-4">
      <WorkflowStepper steps={engine.workflowSteps} activeIndex={engine.activeWorkflowIndex} />

      <Callout type="tip">
        Ikuti alur: pilih visual, pilih audio, cek preview, lalu buat batch atau lanjut render.
      </Callout>

      <InputCard config={config} updateConfig={updateConfig} engine={engine} />
      <PlatformPresetsCard config={config} updateConfig={updateConfig} />
      <RenderSettingsCard config={config} updateConfig={updateConfig} engine={engine} />
      <AdvancedCards config={config} updateConfig={updateConfig} engine={engine} />
      <ActionsCard engine={engine} />
      <SummaryCards engine={engine} />
    </div>
  );
}
