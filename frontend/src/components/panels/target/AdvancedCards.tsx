import { Field, Check, TextInput, SelectInput } from '../../ui/form-controls';
import { getDeep } from '../../../lib/config-path';
import { Callout, Card } from '../../ui/design-system-components';
import type { TargetCardProps, TargetEngineState } from './types';

interface AdvancedCardsProps extends TargetCardProps {
  engine: TargetEngineState;
}

export function AdvancedCards({ config, updateConfig, engine }: AdvancedCardsProps) {
  if (!engine.advanced) return null;

  return (
    <>
      <Card title="Smart Optimization">
        <Check
          label="Enable Smart Optimization"
          checked={Boolean(getDeep(config, 'target.smartOptimization.enabled', false))}
          onChange={v => updateConfig('target.smartOptimization.enabled', v)}
        />
        <Field label="Optimization Level">
          <SelectInput
            value={getDeep(config, 'target.smartOptimization.level', 'balanced')}
            onChange={v => updateConfig('target.smartOptimization.level', v)}
          >
            <option value="minimal">Minimal</option>
            <option value="balanced">Balanced</option>
            <option value="aggressive">Aggressive</option>
          </SelectInput>
        </Field>
        <Field label="Target File Size">
          <TextInput
            type="number"
            value={getDeep(config, 'target.smartOptimization.targetSizeMB', 0)}
            onChange={v => updateConfig('target.smartOptimization.targetSizeMB', v)}
            placeholder="0 = auto"
          />
        </Field>
        <Field label="Max Duration">
          <TextInput
            type="number"
            value={getDeep(config, 'target.smartOptimization.maxDuration', 0)}
            onChange={v => updateConfig('target.smartOptimization.maxDuration', v)}
            placeholder="0 = no limit"
          />
        </Field>
        <Check
          label="Auto-adjust bitrate for file size"
          checked={Boolean(getDeep(config, 'target.smartOptimization.autoBitrate', true))}
          onChange={v => updateConfig('target.smartOptimization.autoBitrate', v)}
        />
        <Check
          label="Two-pass encoding for better quality"
          checked={Boolean(getDeep(config, 'target.smartOptimization.twoPass', false))}
          onChange={v => updateConfig('target.smartOptimization.twoPass', v)}
        />
        <Check
          label="Auto-detect scene changes"
          checked={Boolean(getDeep(config, 'target.smartOptimization.sceneDetect', true))}
          onChange={v => updateConfig('target.smartOptimization.sceneDetect', v)}
        />
        <Callout type="tip">
          Smart Optimization otomatis menyesuaikan encoding settings berdasarkan konten video untuk hasil optimal.
        </Callout>
      </Card>

      <Card title="Batch Processing Options">
        <Field label="Parallel Jobs">
          <TextInput
            type="number"
            value={getDeep(config, 'target.batch.parallelJobs', 1)}
            onChange={v => updateConfig('target.batch.parallelJobs', v)}
            placeholder="1-8"
          />
        </Field>
        <Field label="Priority">
          <SelectInput
            value={getDeep(config, 'target.batch.priority', 'normal')}
            onChange={v => updateConfig('target.batch.priority', v)}
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </SelectInput>
        </Field>
        <Field label="On Error">
          <SelectInput
            value={getDeep(config, 'target.batch.onError', 'continue')}
            onChange={v => updateConfig('target.batch.onError', v)}
          >
            <option value="continue">Continue</option>
            <option value="pause">Pause</option>
            <option value="stop">Stop All</option>
          </SelectInput>
        </Field>
        <Check
          label="Auto-retry failed jobs"
          checked={Boolean(getDeep(config, 'target.batch.autoRetry', true))}
          onChange={v => updateConfig('target.batch.autoRetry', v)}
        />
        <Check
          label="Send notification on completion"
          checked={Boolean(getDeep(config, 'target.batch.notify', false))}
          onChange={v => updateConfig('target.batch.notify', v)}
        />
        <Check
          label="Auto-organize output by date"
          checked={Boolean(getDeep(config, 'target.batch.organizeByDate', false))}
          onChange={v => updateConfig('target.batch.organizeByDate', v)}
        />
      </Card>
    </>
  );
}
