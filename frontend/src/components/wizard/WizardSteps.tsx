import React from 'react';
import { Check } from 'lucide-react';
import { WIZARD_STEPS, WizardStepId } from '../../store/tripWizardStore';

interface WizardStepsProps {
  currentStep: WizardStepId;
  onStepClick?: (step: WizardStepId) => void;
}

export const WizardSteps: React.FC<WizardStepsProps> = ({ currentStep, onStepClick }) => {
  return (
    <nav aria-label="Trip creation progress" className="w-full">
      {/* Desktop: horizontal stepper */}
      <ol className="hidden sm:flex items-center justify-between gap-2">
        {WIZARD_STEPS.map((step, idx) => {
          const done = step.id < currentStep;
          const active = step.id === currentStep;
          const clickable = onStepClick && step.id < currentStep;

          return (
            <li key={step.id} className="flex flex-1 items-center min-w-0">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick?.(step.id)}
                className={`flex items-center gap-2 min-w-0 ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    done
                      ? 'bg-emerald-500 text-white'
                      : active
                        ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                        : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : step.id}
                </span>
                <span
                  className={`text-xs font-bold truncate ${
                    active ? 'text-brand-700' : done ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </button>
              {idx < WIZARD_STEPS.length - 1 && (
                <div
                  className={`mx-2 h-0.5 flex-1 min-w-[12px] rounded ${
                    step.id < currentStep ? 'bg-emerald-400' : 'bg-slate-200'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile: compact pills */}
      <div className="sm:hidden flex items-center gap-1.5">
        {WIZARD_STEPS.map((step) => {
          const done = step.id < currentStep;
          const active = step.id === currentStep;
          return (
            <div
              key={step.id}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                done ? 'bg-emerald-400' : active ? 'bg-brand-600' : 'bg-slate-200'
              }`}
            />
          );
        })}
      </div>
      <p className="sm:hidden mt-2 text-center text-xs font-bold text-slate-600">
        Step {currentStep} of {WIZARD_STEPS.length} — {WIZARD_STEPS[currentStep - 1].label}
      </p>
    </nav>
  );
};
