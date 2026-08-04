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
  secondary: string
  secondaryHover: string
  secondaryLight: string
  terracotta: string
  terracottaHover: string
  terracottaLight: string
  terracottaVeryLight: string
  dark: string
  darkHover: string
  paper: string
  cream: string
  ink: string
  navy: string
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
  // Couleur Terracotta (Principale pour les Boutons, CTA, Actifs & Marque)
  primary: '#BD5B37',
  primaryHover: '#A44B2B',
  primaryLight: '#F2E1D6',
  primaryDark: '#8C3D20',
  primaryVeryLight: '#FAF0E6',

  // Terracotta Alias
  terracotta: '#BD5B37',
  terracottaHover: '#A44B2B',
  terracottaLight: '#F2E1D6',
  terracottaVeryLight: '#FAF0E6',

  // Structure Dark (Noir & Navy pour les headers, bannières et cartes)
  dark: '#12192B',
  darkHover: '#263449',
  secondary: '#12192B',
  secondaryHover: '#263449',
  secondaryLight: '#3E4652',

  // Fonds & accents sombres
  paper: '#FDFCFA',
  cream: '#F3ECE1',
  ink: '#12192B',
  navy: '#263449',

  // Neutres
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

  // États
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#EF4444',

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

    // Terracotta (Primaire / Marque)
    root.style.setProperty('--color-primary', COLOR_PALETTE.primary)
    root.style.setProperty('--color-primary-hover', COLOR_PALETTE.primaryHover)
    root.style.setProperty('--color-primary-light', COLOR_PALETTE.primaryLight)
    root.style.setProperty('--color-primary-dark', COLOR_PALETTE.primaryDark)
    root.style.setProperty(
      '--color-primary-very-light',
      COLOR_PALETTE.primaryVeryLight
    )
    root.style.setProperty('--color-terracotta', COLOR_PALETTE.terracotta)
    root.style.setProperty('--color-terracotta-hover', COLOR_PALETTE.terracottaHover)
    root.style.setProperty('--color-terracotta-light', COLOR_PALETTE.terracottaLight)

    // Dark Ink (Secondaire / Structure)
    root.style.setProperty('--color-secondary', COLOR_PALETTE.secondary)
    root.style.setProperty('--color-secondary-hover', COLOR_PALETTE.secondaryHover)
    root.style.setProperty('--color-dark', COLOR_PALETTE.dark)
    root.style.setProperty('--color-paper', COLOR_PALETTE.paper)
    root.style.setProperty('--color-cream', COLOR_PALETTE.cream)
    root.style.setProperty('--color-ink', COLOR_PALETTE.ink)
    root.style.setProperty('--color-navy', COLOR_PALETTE.navy)

    // Variables pour Tailwind CSS (HSL du Terracotta #BD5B37)
    root.style.setProperty('--primary', '16 55% 48%')
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
