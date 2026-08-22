import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';

interface WizardStickyFooterProps {
  onBack?: () => void;
  onContinue: () => void;
  onSaveDraft?: () => void;
  continueLabel?: string;
  backLabel?: string;
  saveDraftLabel?: string;
  isLoading?: boolean;
  isSavingDraft?: boolean;
  continueDisabled?: boolean;
  showBack?: boolean;
}

export const WizardStickyFooter: React.FC<WizardStickyFooterProps> = ({
  onBack,
  onContinue,
  onSaveDraft,
  continueLabel = 'Continue',
  backLabel = 'Back',
  saveDraftLabel = 'Save as draft',
  isLoading = false,
  isSavingDraft = false,
  continueDisabled = false,
  showBack = true,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 sm:relative sm:bottom-auto sm:z-auto bg-white/95 backdrop-blur-lg border-t border-slate-200 px-4 py-3 sm:py-0 sm:bg-transparent sm:border-0 sm:backdrop-blur-none pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-0">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
        {showBack && onBack ? (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={onBack}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            className="flex-1 sm:flex-none"
          >
            {backLabel}
          </Button>
        ) : (
          <div className="flex-1 sm:hidden" />
        )}

        <div className="flex items-center gap-2 flex-1 sm:flex-none justify-end">
          {onSaveDraft && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onSaveDraft}
              isLoading={isSavingDraft}
              disabled={isLoading || isSavingDraft}
              className="flex-1 sm:flex-none"
            >
              {saveDraftLabel}
            </Button>
          )}

          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={onContinue}
            isLoading={isLoading}
            disabled={continueDisabled || isSavingDraft}
            rightIcon={!isLoading ? <ArrowRight className="h-4 w-4" /> : undefined}
            className="flex-1 sm:flex-none shadow-md shadow-brand-500/25 min-w-[140px]"
          >
            {continueLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
