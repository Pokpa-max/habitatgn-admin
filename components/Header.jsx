import { RiArrowLeftLine } from 'react-icons/ri'
import { useRouter } from 'next/router'
import { useColors } from '../contexts/ColorContext'

export default function Header({ title }) {
  const colors = useColors()
  const router = useRouter()

  return (
    <div className="py-5">
      <div className="mb-2">
        <nav aria-label="Back">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (window.history.length > 1) {
                router.back()
              } else {
                router.push('/')
              }
            }}
            className="flex items-center text-sm font-medium transition-colors"
            style={{
              color: colors.gray500,
            }}
            onMouseEnter={(e) => (e.target.style.color = colors.gray700)}
            onMouseLeave={(e) => (e.target.style.color = colors.gray500)}
          >
            <RiArrowLeftLine
              className="mr-1 -ml-1 h-5 w-5 flex-shrink-0"
              style={{ color: colors.gray400 }}
              aria-hidden="true"
            />
            Retour
          </a>
        </nav>
      </div>
      <div className="mt-2 md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1 flex items-center gap-3">
          <div
            className="h-7 w-1.5 rounded-full"
            style={{ backgroundColor: colors.primary }}
          />
          <h2
            className="text-2xl font-bold leading-7 sm:truncate sm:text-3xl"
            style={{ color: colors.gray900 }}
          >
            {title}
          </h2>
        </div>
      </div>
    </div>
  )
}
