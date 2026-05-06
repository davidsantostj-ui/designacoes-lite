import React from 'react';
import { AlertCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary', error, info);
    this.setState({ errorInfo: info, error });
  }
  render() {
    if (this.state.hasError) {
      const message = this.state.error?.message || 'Erro desconhecido';
      return (
        <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center bg-transparent">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
            <AlertCircle size={20} />
          </div>
          <h2 className="text-lg font-black uppercase tracking-widest">Algo deu errado</h2>
          <p className="text-xs text-slate-500 mt-2">{message}</p>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-navy-900 text-white text-[10px] font-black uppercase"
            >
              Recarregar
            </button>
            <button
              onClick={() => navigator.clipboard?.writeText(JSON.stringify({ message, info: this.state.errorInfo }))}
              className="px-4 py-2 rounded-xl bg-slate-50 text-slate-900 text-[10px] font-black uppercase"
            >
              Copiar detalhes
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
