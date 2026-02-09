import Breadcrumbs from 'nextjs-breadcrumbs'
import { RiArrowLeftLine } from 'react-icons/ri'
import { useColors } from '../contexts/ColorContext'

export default function Header({ title }) {
  const colors = useColors()

  return (
    <div className="py-5">
      <div>
        <nav className="sm:hidden" aria-label="Back">
          <a
            href="#"
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
        <nav className="hidden sm:flex" aria-label="Breadcrumb">
          <ol role="list" className="flex items-center space-x-4">
            <div className="flex flex-row">
              <style>{`
                .bread-container {
                  display: flex;
                  align-items: center;
                  gap: 1rem;
                }

                .bread-container a {
                  color: ${colors.gray600};
                  text-decoration: none;
                  font-size: 0.875rem;
                  transition: all 0.3s ease;
                  cursor: pointer;
                }

                .bread-container a:hover {
                  color: ${colors.primary};
                }

                .bread-container span {
                  color: ${colors.gray400};
                  font-size: 0.875rem;
                }

                .bread-container li:last-child {
                  color: ${colors.gray900 || '#000000'};
                  font-weight: 600;
                  cursor: default;
                }
                .bread-container li:last-child a {
                  color: ${colors.gray900 || '#000000'};
                  pointer-events: none;
                }
              `}</style>
              <Breadcrumbs
                containerClassName="bread-container"
                transformLabel={(title) => title}
                rootLabel="Acceuil"
              />
            </div>
          </ol>
        </nav>
      </div>
      <div className="mt-2 md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
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
