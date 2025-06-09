"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { WalkthroughCard } from './walkthrough-card'

interface WalkthroughStep {
  id: string
  title: string
  description: string
  highlightDropdown?: boolean
  dropdownTarget?: string
  targetElement?: string
}

interface WalkthroughContextType {
  isActive: boolean
  currentStep: number
  totalSteps: number
  highlightTarget: string | null
  completeWalkthrough: () => void
  skipWalkthrough: () => void
  highlightDropdown: (target: string) => void
  removeHighlight: () => void
}

const WalkthroughContext = createContext<WalkthroughContextType | undefined>(undefined)

const walkthroughSteps: WalkthroughStep[] = [
  {
    id: 'welcome',
    title: '🎉 Welcome to BarberQMS!',
    description: 'We\'re excited to have you on board! Let\'s take a quick tour to help you get started with managing your barber shop efficiently.'
  },
  {
    id: 'manage-shop',
    title: '🏪 Manage Your Shop',
    description: 'Set up your shop details, hours, and basic information. This is where you\'ll configure your shop settings and keep your business information up to date.',
    highlightDropdown: true,
    dropdownTarget: 'manage-shops'
  },
  {
    id: 'artists',
    title: '✂️ Manage Your Artists',
    description: 'Add and manage your barbers/artists. Set their schedules, specialties, and availability to ensure smooth operations.',
    highlightDropdown: true,
    dropdownTarget: 'artists'
  },
  {
    id: 'services',
    title: '💼 Shop Services',
    description: 'Define your services, pricing, and duration. This helps customers know what you offer and allows for better queue management.',
    highlightDropdown: true,
    dropdownTarget: 'shop-services'
  }
]

export function WalkthroughProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [highlightTarget, setHighlightTarget] = useState<string | null>(null)

  // Handle highlighting when step changes
  useEffect(() => {
    if (isActive && currentStep > 0) {
      const currentStepData = walkthroughSteps[currentStep - 1]
      if (currentStepData?.highlightDropdown && currentStepData?.dropdownTarget) {
        setHighlightTarget(currentStepData.dropdownTarget)
      } else {
        setHighlightTarget(null)
      }
    } else {
      setHighlightTarget(null)
    }
  }, [isActive, currentStep])

  useEffect(() => {
    // Check if user is logging in for the first time
    
    if (status === 'authenticated' && session?.user) {
      
      // Create user-specific localStorage key
      const userId = session.user.email || session.user.id || 'anonymous'
      const walkthroughKey = `walkthrough_completed_${userId}`      
      // Check localStorage for this specific user
      const walkthroughCompleted = localStorage.getItem(walkthroughKey)
      
      // If this specific user already completed, never show again
      if (walkthroughCompleted === 'true') {
        return
      }      // Check if this is a first-time login from session data
      
      if (session.user.isFirstLogin === true) {        setIsActive(true)
      }
    }  }, [session, status])

  const completeWalkthrough = async () => {
    try {
      // Get user ID for localStorage key
      const userId = session?.user?.email || session?.user?.id || 'anonymous'
      const walkthroughKey = `walkthrough_completed_${userId}`
        // Mark as completed in localStorage immediately
      localStorage.setItem(walkthroughKey, 'true')
      
      // Call backend to mark walkthrough as completed (sets is_first_login = false)
      const response = await fetch('/api/auth/complete-walkthrough', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })      
      if (response.ok) {
        // Walkthrough completed successfully
      } else {
        console.error('Failed to complete walkthrough on backend')
      }
    } catch (error) {
      console.error('Error completing walkthrough:', error)
    }
    
    // Always close the walkthrough since localStorage is set
    setIsActive(false)
    setCurrentStep(1)
    setHighlightTarget(null)
  }
  const skipWalkthrough = async () => {
    try {
      // Get user ID for localStorage key
      const userId = session?.user?.email || session?.user?.id || 'anonymous'
      const walkthroughKey = `walkthrough_completed_${userId}`
        // Mark as completed in localStorage immediately
      localStorage.setItem(walkthroughKey, 'true')
      
      // Call backend to mark walkthrough as completed (sets is_first_login = false)
      const response = await fetch('/api/auth/complete-walkthrough', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })      
      if (response.ok) {
        // Walkthrough skipped successfully
      } else {
        console.error('Failed to skip walkthrough on backend')
      }
    } catch (error) {
      console.error('Error skipping walkthrough:', error)
    }
    
    setIsActive(false)
    setCurrentStep(1)
    setHighlightTarget(null)
  }

  const nextStep = () => {
    if (currentStep < walkthroughSteps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const highlightDropdown = (target: string) => {
    setHighlightTarget(target)
  }

  const removeHighlight = () => {
    setHighlightTarget(null)
  }

  const currentStepData = walkthroughSteps[currentStep - 1]
  return (
    <WalkthroughContext.Provider      value={{
        isActive,
        currentStep,
        totalSteps: walkthroughSteps.length,
        highlightTarget,
        completeWalkthrough,
        skipWalkthrough,
        highlightDropdown,
        removeHighlight
      }}
    >
      {children}
      
      {isActive && currentStepData && (
        <WalkthroughCard
          title={currentStepData.title}
          description={currentStepData.description}
          currentStep={currentStep}
          totalSteps={walkthroughSteps.length}
          onNext={nextStep}
          onPrevious={previousStep}
          onSkip={skipWalkthrough}
          onComplete={completeWalkthrough}
          highlightDropdown={currentStepData.highlightDropdown}
          dropdownTarget={currentStepData.dropdownTarget}
          isLastStep={currentStep === walkthroughSteps.length}
        />
      )}
    </WalkthroughContext.Provider>
  )
}

export function useWalkthrough() {
  const context = useContext(WalkthroughContext)
  if (context === undefined) {
    throw new Error('useWalkthrough must be used within a WalkthroughProvider')
  }
  return context
}
