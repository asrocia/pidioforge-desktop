import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PanelErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[PanelErrorBoundary] ${this.props.fallbackTitle || 'Panel'} crashed:`, error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 p-6 min-h-[120px] bg-[#1a0f11] border border-[#e76d78]/30 rounded-lg m-2">
          <p className="text-[12px] font-semibold text-[#e76d78]">
            {this.props.fallbackTitle || 'Panel'} mengalami error
          </p>
          <p className="text-[10px] text-[#8da0af] max-w-[280px] text-center">
            {this.state.error?.message || 'Terjadi kesalahan yang tidak terduga.'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-3 py-1.5 text-[10px] font-medium bg-[#1a1421] border border-[#7d52d9]/50 text-[#b99cff] rounded-md hover:bg-[#251a30] transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
