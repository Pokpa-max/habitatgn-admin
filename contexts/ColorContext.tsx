// contexts/ColorContext.tsx
'use client'
import React, { createContext, useContext, useEffect } from 'react'

interface ColorContextType {
  colors: ColorStyles
}

interface ColorStyles {
  [x: string]: string
  primary: string
  primaryHover: string
  primaryLight: string
  primaryDark: string
  primaryVeryLight: string
  white: string
  gray50: string
  gray100: string
  gray200: string
  gray300: string
  gray400: string
  gray500: string
  gray600: string
  gray700: string
  gray800: string
  gray900: string
  success: string
  warning: string
  error: string
  shadow: string
  shadowHover: string
}

const COLOR_PALETTE: ColorStyles = {
  primary: '#024652',
  primaryHover: '#035E6B',
  primaryLight: '#3A99A5',
  primaryDark: '#012F36',
  primaryVeryLight: '#D4F1F5',

  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#C4C8D0',
  gray400: '#8D95A1',
  gray500: '#5F6673',
  gray600: '#3E4652',
  gray700: '#2D3542',
  gray800: '#1F2937',
  gray900: '#111827',

  // Couleurs utilitaires
  success: '#16A34A', // Vert pour succès
  warning: '#F59E0B', // Orange pour avertissement
  error: '#EF4444', // Rouge pour erreurs

  // Ombres
  shadow:
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  shadowHover:
    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
}

const ColorContext = createContext<ColorContextType | undefined>(undefined)

export const ColorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    // Mise à jour des variables CSS au montage du composant
    const root = document.documentElement

    // Variables CSS personnalisées pour le vert émeraude
    root.style.setProperty('--color-primary', COLOR_PALETTE.primary)
    root.style.setProperty('--color-primary-hover', COLOR_PALETTE.primaryHover)
    root.style.setProperty('--color-primary-light', COLOR_PALETTE.primaryLight)
    root.style.setProperty('--color-primary-dark', COLOR_PALETTE.primaryDark)
    root.style.setProperty(
      '--color-primary-very-light',
      COLOR_PALETTE.primaryVeryLight
    )

    // Variables pour Tailwind CSS (HSL du vert émeraude)
    root.style.setProperty('--primary', '160 84% 39%') // HSL de #10B981
    root.style.setProperty('--primary-foreground', '0 0% 100%')
  }, [])

  return (
    <ColorContext.Provider value={{ colors: COLOR_PALETTE }}>
      {children}
    </ColorContext.Provider>
  )
}

export const useColors = () => {
  const context = useContext(ColorContext)
  if (!context) {
    throw new Error('useColors must be used within a ColorProvider')
  }
  return context.colors
}
