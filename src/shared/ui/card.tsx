import { forwardRef } from 'react'
import { Card as TamaguiCard, CardProps as TamaguiCardProps } from 'tamagui'

export interface CardProps extends TamaguiCardProps {
  children?: React.ReactNode
}

const CardComponent = forwardRef<any, CardProps>(({ children, ...props }, ref) => {
  return (
    <TamaguiCard
      ref={ref}
      size="$4"
      padding="$4"
      backgroundColor="white"
      borderRadius="$4"
      borderWidth={1}
      borderColor="$borderColor"
      shadowColor="$shadowColor"
      shadowOpacity={0}
      shadowRadius={0}
      shadowOffset={{ width: 0, height: 0.5 }}
      elevation={0}
      {...props}
    >
      {children}
    </TamaguiCard>
  )
})

CardComponent.displayName = 'Card'

// Preserve Tamagui Card namespace (Header, Footer)
export const Card = Object.assign(CardComponent, {
  Header: TamaguiCard.Header,
  Footer: TamaguiCard.Footer,
})
