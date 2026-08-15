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

  // Couleurs de la charte "Consult"
  navyDark: string // Barre supérieure / Footer très sombre
  blueCorporate: string // Bleu principal des bannières
  orangeAccent: string // Boutons CTA & accents
  orangeHover: string // Hover des boutons
  orangeLight: string // Fond d'accent léger

  paper: string
  ink: string
  white: string

  // Nuances de gris (Cool Gray)
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

  // Utilitaires
  success: string
  warning: string
  error: string

  // Ombres
  shadow: string
  shadowHover: string
}

const COLOR_PALETTE: ColorStyles = {
  // Couleur principale : Bleu Corporate / Royal
  primary: '#0A4D9C',
  primaryHover: '#083B78',
  primaryLight: '#E8F0FA',
  primaryDark: '#072B57',
  primaryVeryLight: '#F2F6FC',

  // Identité visuelle extraite de l'image
  navyDark: '#0A192F', // Fond très sombre (Barre haute / Footer)
  blueCorporate: '#0A4D9C', // Fond des sections "Our Mission" & Stats
  orangeAccent: '#FF5E00', // Boutons "Get a Quote", "Learn More"
  orangeHover: '#E05300', // État survol des boutons orange
  orangeLight: '#FFF1E8', // Surbrillance légère / Badges orange

  // Bases neutres
  paper: '#F8FAFC',
  ink: '#0F172A',
  white: '#FFFFFF',

  // Échelle de gris froid (adaptée au bleu)
  gray50: '#F8FAFC',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F172A',

  // Couleurs utilitaires
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#DC2626',

  // Ombres
  shadow:
    '0 4px 6px -1px rgba(10, 77, 156, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
  shadowHover:
    '0 10px 15px -3px rgba(10, 77, 156, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
}

const ColorContext = createContext<ColorContextType | undefined>(undefined)

export const ColorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    const root = document.documentElement

    // Variables CSS dynamiques
    root.style.setProperty('--color-primary', COLOR_PALETTE.primary)
    root.style.setProperty('--color-primary-hover', COLOR_PALETTE.primaryHover)
    root.style.setProperty('--color-primary-light', COLOR_PALETTE.primaryLight)
    root.style.setProperty('--color-primary-dark', COLOR_PALETTE.primaryDark)
    root.style.setProperty(
      '--color-primary-very-light',
      COLOR_PALETTE.primaryVeryLight
    )

    // Couleurs d'accentuation (Orange)
    root.style.setProperty('--color-accent', COLOR_PALETTE.orangeAccent)
    root.style.setProperty('--color-accent-hover', COLOR_PALETTE.orangeHover)

    // Variables HSL pour Tailwind CSS (Bleu corporate : #0A4D9C -> HSL 213, 88%, 33%)
    root.style.setProperty('--primary', '213 88% 33%')
    root.style.setProperty('--primary-foreground', '0 0% 100%')

    // Variable HSL pour l'accent Orange (#FF5E00 -> HSL 22, 100%, 50%)
    root.style.setProperty('--accent', '22 100% 50%')
    root.style.setProperty('--accent-foreground', '0 0% 100%')
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
