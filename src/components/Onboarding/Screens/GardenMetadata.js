import React from 'react'
import { useOnboardingState } from '@providers/Onboarding'
import Navigation from '../Navigation'

function GardenMetadata({ title }) {
  const { onBack, onNext, step, steps } = useOnboardingState()

  return (
    <div>
      {title}
      <Navigation
        backEnabled
        nextEnabled
        nextLabel={`Next: ${steps[step + 1].title}`}
        onBack={onBack}
        onNext={onNext}
      />
    </div>
  )
}

export default GardenMetadata