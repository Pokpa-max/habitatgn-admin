import { useColors } from '../contexts/ColorContext'

export default function Header({ title }) {
  const colors = useColors()

  return (
    <div className="py-3 sm:py-5">
      <div className="sm:mt-2 md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1 flex items-center gap-3">
          <div
            className="h-6 w-1.5 rounded-full sm:h-7"
            style={{ backgroundColor: colors.primary }}
          />
          <h2
            className="text-xl font-bold leading-7 sm:truncate sm:text-3xl"
            style={{ color: colors.gray900 }}
          >
            {title}
          </h2>
        </div>
      </div>
    </div>
  )
}
