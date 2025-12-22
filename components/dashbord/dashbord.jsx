// export default DashboardCard
import { db } from '@/lib/firebase/client_config'
import { useAuthUser } from 'next-firebase-auth'
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import { parseDocsData } from '@/utils/firebase/firestore'
import { useColors } from '../../contexts/ColorContext'
import {
  Home,
  Users,
  CheckCircle2,
  Zap,
  Landmark,
  Calendar,
} from 'lucide-react'

function DashboardCard() {
  const colors = useColors()
  const AuthUser = useAuthUser()
  const [totalHouses, setTotalHouse] = useState()
  const [totalAvailable, setTotalAvailable] = useState()
  const [totalTerrains, setTotalTerrains] = useState()
  const [totalDailyRentals, setTotalDailyRentals] = useState()
  const [users, setUsers] = useState()

  useEffect(() => {
    const houseRef = collection(db, 'houses')
    const terrainRef = collection(db, 'lands')
    const dailyRentalRef = collection(db, 'daily_rentals')
    const userRef = collection(db, 'users')

    const fetchData = async () => {
      // Query pour maisons
      const q =
        AuthUser.claims.userType == 'admin'
          ? query(houseRef, orderBy('createdAt', 'desc'))
          : query(
              houseRef,
              where('userId', '==', AuthUser.id),
              orderBy('createdAt', 'desc')
            )

      // Query pour maisons disponibles
      const qry =
        AuthUser.claims.userType == 'admin'
          ? query(
              houseRef,
              where('type', '==', 'manager'),
              where('isAvailable', '==', false),
              orderBy('createdAt', 'desc')
            )
          : query(
              houseRef,
              where('userId', '==', AuthUser.id),
              where('isAvailable', '==', false),
              orderBy('createdAt', 'desc')
            )

      // Query pour terrains
      const terrainQuery =
        AuthUser.claims.userType == 'admin'
          ? query(terrainRef, orderBy('createdAt', 'desc'))
          : query(
              terrainRef,
              where('userId', '==', AuthUser.id),
              orderBy('createdAt', 'desc')
            )

      // Query pour locations journaliers
      const dailyRentalQuery =
        AuthUser.claims.userType == 'admin'
          ? query(dailyRentalRef, orderBy('createdAt', 'desc'))
          : query(
              dailyRentalRef,
              where('userId', '==', AuthUser.id),
              orderBy('createdAt', 'desc')
            )

      // Query pour utilisateurs
      const qury = query(userRef, orderBy('createdAt', 'desc'))

      try {
        const querySnapshot = await getDocs(q)
        const querysnapAvailable = await getDocs(qry)
        const terrainSnapshot = await getDocs(terrainQuery)
        const dailyRentalSnapshot = await getDocs(dailyRentalQuery)
        const queryUser = await getDocs(qury)

        setTotalHouse(parseDocsData(querySnapshot))
        setTotalAvailable(parseDocsData(querysnapAvailable))
        setTotalTerrains(parseDocsData(terrainSnapshot))
        setTotalDailyRentals(parseDocsData(dailyRentalSnapshot))
        setUsers(parseDocsData(queryUser))
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      }
    }

    fetchData()
  }, [AuthUser.id])

  return (
    <>
      <style>{`
        @keyframes slideUp {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes cardHover {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-4px);
          }
        }

        .dashboard-card {
          animation: slideUp 0.6s ease-out;
        }

        .dashboard-card:hover {
          animation: cardHover 0.3s ease-out forwards;
        }

        .card-icon {
          transition: all 0.3s ease;
        }

        .dashboard-card:hover .card-icon {
          transform: scale(1.1) rotate(5deg);
        }

        .stat-number {
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .stat-label {
          font-size: 0.875rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          opacity: 0.9;
        }
      `}</style>

      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Card 1: Total Maisons */}
        <div
          className="dashboard-card col-span-1 rounded-xl p-6 shadow-md transition-all duration-300 hover:shadow-xl md:col-span-1 lg:col-span-1 xl:col-span-2"
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p
                className="stat-label"
                style={{ color: colors.white, opacity: 0.9 }}
              >
                Total Maisons
              </p>
              <h3
                className="stat-number mt-2 text-4xl"
                style={{ color: colors.white }}
              >
                {totalHouses?.length || 0}
              </h3>
            </div>
            <div
              className="card-icon flex h-12 w-12 items-center justify-center rounded-lg"
              style={{ backgroundColor: `rgba(255, 255, 255, 0.2)` }}
            >
              <Home className="h-6 w-6" style={{ color: colors.white }} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div
              className="h-1 flex-1 rounded-full"
              style={{ backgroundColor: `rgba(255, 255, 255, 0.3)` }}
            />
            <span
              className="text-xs font-medium"
              style={{ color: colors.white, opacity: 0.8 }}
            >
              Actif
            </span>
          </div>
        </div>

        {/* Card 2: Total Disponible */}
        <div
          className="dashboard-card col-span-1 rounded-xl p-6 shadow-md transition-all duration-300 hover:shadow-xl md:col-span-1 lg:col-span-1 xl:col-span-2"
          style={{
            background: `linear-gradient(135deg, ${colors.primaryLight} 0%, ${colors.primary} 100%)`,
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p
                className="stat-label"
                style={{ color: colors.white, opacity: 0.9 }}
              >
                Disponibles
              </p>
              <h3
                className="stat-number mt-2 text-4xl"
                style={{ color: colors.white }}
              >
                {(totalHouses?.length || 0) - (totalAvailable?.length || 0)}
              </h3>
            </div>
            <div
              className="card-icon flex h-12 w-12 items-center justify-center rounded-lg"
              style={{ backgroundColor: `rgba(255, 255, 255, 0.2)` }}
            >
              <CheckCircle2
                className="h-6 w-6"
                style={{ color: colors.white }}
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div
              className="h-1 flex-1 rounded-full"
              style={{ backgroundColor: `rgba(255, 255, 255, 0.3)` }}
            />
            <span
              className="text-xs font-medium"
              style={{ color: colors.white, opacity: 0.8 }}
            >
              À louer
            </span>
          </div>
        </div>

        {/* Card 3: Total Occupé (Admin only) */}
        {AuthUser.claims.userType == 'admin' && (
          <div
            className="dashboard-card col-span-1 rounded-xl p-6 shadow-md transition-all duration-300 hover:shadow-xl md:col-span-1 lg:col-span-1 xl:col-span-2"
            style={{
              background: `linear-gradient(135deg, ${colors.warning} 0%, ${colors.warning}dd 100%)`,
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p
                  className="stat-label"
                  style={{ color: colors.white, opacity: 0.9 }}
                >
                  Occupés
                </p>
                <h3
                  className="stat-number mt-2 text-4xl"
                  style={{ color: colors.white }}
                >
                  {totalAvailable?.length || 0}
                </h3>
              </div>
              <div
                className="card-icon flex h-12 w-12 items-center justify-center rounded-lg"
                style={{ backgroundColor: `rgba(255, 255, 255, 0.2)` }}
              >
                <Zap className="h-6 w-6" style={{ color: colors.white }} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div
                className="h-1 flex-1 rounded-full"
                style={{ backgroundColor: `rgba(255, 255, 255, 0.3)` }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: colors.white, opacity: 0.8 }}
              >
                En cours
              </span>
            </div>
          </div>
        )}

        {/* Card 4: Total Terrains */}
        <div
          className="dashboard-card col-span-1 rounded-xl p-6 shadow-md transition-all duration-300 hover:shadow-xl md:col-span-1 lg:col-span-1 xl:col-span-2"
          style={{
            background: `linear-gradient(135deg, #10b981 0%, #059669 100%)`,
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p
                className="stat-label"
                style={{ color: colors.white, opacity: 0.9 }}
              >
                Total Terrains
              </p>
              <h3
                className="stat-number mt-2 text-4xl"
                style={{ color: colors.white }}
              >
                {totalTerrains?.length || 0}
              </h3>
            </div>
            <div
              className="card-icon flex h-12 w-12 items-center justify-center rounded-lg"
              style={{ backgroundColor: `rgba(255, 255, 255, 0.2)` }}
            >
              <Landmark className="h-6 w-6" style={{ color: colors.white }} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div
              className="h-1 flex-1 rounded-full"
              style={{ backgroundColor: `rgba(255, 255, 255, 0.3)` }}
            />
            <span
              className="text-xs font-medium"
              style={{ color: colors.white, opacity: 0.8 }}
            >
              Disponible
            </span>
          </div>
        </div>

        {/* Card 5: Locations Journalières */}
        <div
          className="dashboard-card col-span-1 rounded-xl p-6 shadow-md transition-all duration-300 hover:shadow-xl md:col-span-1 lg:col-span-1 xl:col-span-2"
          style={{
            background: `linear-gradient(135deg, #f59e0b 0%, #d97706 100%)`,
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p
                className="stat-label"
                style={{ color: colors.white, opacity: 0.9 }}
              >
                Locations Journalières
              </p>
              <h3
                className="stat-number mt-2 text-4xl"
                style={{ color: colors.white }}
              >
                {totalDailyRentals?.length || 0}
              </h3>
            </div>
            <div
              className="card-icon flex h-12 w-12 items-center justify-center rounded-lg"
              style={{ backgroundColor: `rgba(255, 255, 255, 0.2)` }}
            >
              <Calendar className="h-6 w-6" style={{ color: colors.white }} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div
              className="h-1 flex-1 rounded-full"
              style={{ backgroundColor: `rgba(255, 255, 255, 0.3)` }}
            />
            <span
              className="text-xs font-medium"
              style={{ color: colors.white, opacity: 0.8 }}
            >
              En cours
            </span>
          </div>
        </div>

        {/* Card 6: Total Utilisateurs */}
        <div
          className="dashboard-card col-span-1 rounded-xl p-6 shadow-md transition-all duration-300 hover:shadow-xl md:col-span-1 lg:col-span-1 xl:col-span-2"
          style={{
            background: `linear-gradient(135deg, ${colors.gray600} 0%, ${colors.gray700} 100%)`,
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p
                className="stat-label"
                style={{ color: colors.white, opacity: 0.9 }}
              >
                Total Utilisateurs
              </p>
              <h3
                className="stat-number mt-2 text-4xl"
                style={{ color: colors.white }}
              >
                {users?.length || 0}
              </h3>
            </div>
            <div
              className="card-icon flex h-12 w-12 items-center justify-center rounded-lg"
              style={{ backgroundColor: `rgba(255, 255, 255, 0.2)` }}
            >
              <Users className="h-6 w-6" style={{ color: colors.white }} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div
              className="h-1 flex-1 rounded-full"
              style={{ backgroundColor: `rgba(255, 255, 255, 0.3)` }}
            />
            <span
              className="text-xs font-medium"
              style={{ color: colors.white, opacity: 0.8 }}
            >
              Actifs
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

export default DashboardCard
