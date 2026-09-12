import React, { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

/**
 * Last-resort render guard for the whole app.
 *
 * Individual pages (Student Brain, Knowledge Map) already catch their own
 * render errors so one broken widget doesn't take out the rest of the app.
 * This one sits above the router so a crash anywhere else (layout, a page
 * with no local boundary, a bad state transition) still lands on a
 * recoverable screen instead of a blank white page.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('EduHive crashed:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#EAE5DC] shadow-xl p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FDF0ED] text-[#B93826] flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl text-[#1C1917]">Something went wrong</h2>
          <p className="text-xs text-[#57534E]">
            EduHive hit an unexpected error rendering this screen. Your session and data are
            safe — try reloading this view.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#A8421E] hover:bg-[#8E3516] text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.assign('/app/tutor')}
              className="px-4 py-2 rounded-lg bg-white border border-[#EAE5DC] text-xs font-semibold text-[#57534E] hover:bg-[#FAF8F5] cursor-pointer"
            >
              Go to Tutor
            </button>
          </div>
        </div>
      </div>
    );
  }
}
