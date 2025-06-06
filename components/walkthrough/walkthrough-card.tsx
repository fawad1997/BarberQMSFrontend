import React from 'react'
import { X, ArrowRight, ArrowLeft, ChevronDown } from 'lucide-react'

interface WalkthroughCardProps {
  title: string
  description: string
  currentStep: number
  totalSteps: number
  onNext?: () => void
  onPrevious?: () => void
  onSkip: () => void
  onComplete?: () => void
  highlightDropdown?: boolean
  dropdownTarget?: string
  isLastStep?: boolean
}

export const WalkthroughCard: React.FC<WalkthroughCardProps> = ({
  title,
  description,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  onComplete,
  highlightDropdown = false,
  dropdownTarget,
  isLastStep = false
}) => {

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" />
        {/* Card positioned on the right side */}
      <div className="fixed top-1/2 right-6 transform -translate-y-1/2 z-50">
        <div className="bg-card border rounded-lg shadow-xl p-6 max-w-sm w-full animate-in fade-in-50 slide-in-from-right-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm text-muted-foreground">
                Step {currentStep} of {totalSteps}
              </span>
            </div>
            <button 
              onClick={onSkip}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2 mb-6">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>

          {/* Content */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3 text-foreground">
              {title}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={onSkip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip tour
            </button>
            
            <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <button
                  onClick={onPrevious}
                  className="flex items-center gap-2 px-4 py-2 rounded-md border border-border hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>
              )}
              
              {isLastStep ? (
                <button
                  onClick={onComplete}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Complete
                </button>
              ) : (
                <button
                  onClick={onNext}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>      {/* Dropdown highlight effect */}
      {highlightDropdown && (
        <div className="fixed inset-0 z-51 pointer-events-none">
          <style dangerouslySetInnerHTML={{
            __html: `
              .navbar-shops-dropdown {
                position: relative;
                z-index: 51;
              }
              .navbar-shops-dropdown::after {
                content: '';
                position: absolute;
                inset: -4px;
                border: 2px solid hsl(var(--primary));
                border-radius: 8px;
                animation: walkthroughPulse 2s infinite;
                pointer-events: none;
              }
              @keyframes walkthroughPulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
              }
            `
          }} />
        </div>
      )}
    </>
  )
}
