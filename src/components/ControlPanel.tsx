import type { ReactNode } from 'react';
import { Camera, Eye, Hash, RotateCcw, Sparkles, Waves } from 'lucide-react';

export type DemoOptions = {
  showSkeleton: boolean;
  showPoints: boolean;
  showLabels: boolean;
  showTrail: boolean;
  mirror: boolean;
};

type ControlPanelProps = {
  options: DemoOptions;
  onChange: (nextOptions: DemoOptions) => void;
  onSwitchCamera: () => void;
  disabled: boolean;
};

function ToggleButton({
  active,
  disabled,
  label,
  icon,
  onClick
}: {
  active: boolean;
  disabled?: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`control-button ${active ? 'is-active' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export function ControlPanel({ options, onChange, onSwitchCamera, disabled }: ControlPanelProps) {
  const update = (key: keyof DemoOptions) => {
    onChange({ ...options, [key]: !options[key] });
  };

  return (
    <div className="control-panel" aria-label="Display controls">
      <ToggleButton
        active={options.showSkeleton}
        disabled={disabled}
        label="骨架线"
        icon={<Waves size={16} />}
        onClick={() => update('showSkeleton')}
      />
      <ToggleButton
        active={options.showPoints}
        disabled={disabled}
        label="关键点"
        icon={<Eye size={16} />}
        onClick={() => update('showPoints')}
      />
      <ToggleButton
        active={options.showLabels}
        disabled={disabled}
        label="编号"
        icon={<Hash size={16} />}
        onClick={() => update('showLabels')}
      />
      <ToggleButton
        active={options.showTrail}
        disabled={disabled}
        label="残影"
        icon={<Sparkles size={16} />}
        onClick={() => update('showTrail')}
      />
      <ToggleButton
        active={options.mirror}
        disabled={disabled}
        label="镜像"
        icon={<RotateCcw size={16} />}
        onClick={() => update('mirror')}
      />
      <button type="button" className="control-button" onClick={onSwitchCamera} disabled={disabled}>
        <Camera size={16} />
        <span>切换镜头</span>
      </button>
    </div>
  );
}
