import { db } from '@/lib/firebase/client_config'
import { useAuthUser } from 'next-firebase-auth'
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
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
      const q =
        AuthUser.claims.userType == 'admin'
          ? query(houseRef, orderBy('createdAt', 'desc'))
          : query(
              houseRef,
              where('userId', '==', AuthUser.id),
              orderBy('createdAt', 'desc')
            )

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

      const terrainQuery =
        AuthUser.claims.userType == 'admin'
          ? query(terrainRef, orderBy('createdAt', 'desc'))
          : query(
              terrainRef,
              where('userId', '==', AuthUser.id),
              orderBy('createdAt', 'desc')
            )

      const dailyRentalQuery =
        AuthUser.claims.userType == 'admin'
          ? query(dailyRentalRef, orderBy('createdAt', 'desc'))
          : query(
              dailyRentalRef,
              where('userId', '==', AuthUser.id),
              orderBy('createdAt', 'desc')
            )

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

  const StatCard = ({ icon: Icon, label, value }) => (
    <div className="group rounded-lg border border-gray-200 bg-white p-6 transition-all duration-200 hover:border-gray-300 hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-md"
          style={{ backgroundColor: colors.primary || '#3b82f6' }}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Grille principale */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Card 1: Total Maisons */}
        <div className="xl:col-span-2">
          <StatCard
            icon={Home}
            label="Total Maisons"
            value={totalHouses?.length || 0}
          />
        </div>

        {/* Card 2: Disponibles */}
        <div className="xl:col-span-2">
          <StatCard
            icon={CheckCircle2}
            label="Disponibles"
            value={(totalHouses?.length || 0) - (totalAvailable?.length || 0)}
          />
        </div>

        {/* Card 3: Occupés (Admin only) */}
        {AuthUser.claims.userType == 'admin' && (
          <div className="xl:col-span-2">
            <StatCard
              icon={Zap}
              label="Occupés"
              value={totalAvailable?.length || 0}
            />
          </div>
        )}

        {/* Card 4: Total Terrains */}
        <div className="xl:col-span-2">
          <StatCard
            icon={Landmark}
            label="Total Terrains"
            value={totalTerrains?.length || 0}
          />
        </div>

        {/* Card 5: Locations Journalières */}
        <div className="xl:col-span-2">
          <StatCard
            icon={Calendar}
            label="Locations Journalières"
            value={totalDailyRentals?.length || 0}
          />
        </div>

        {/* Card 6: Total Utilisateurs */}
        <div className="xl:col-span-2">
          <StatCard
            icon={Users}
            label="Total Utilisateurs"
            value={users?.length || 0}
          />
        </div>
      </div>
    </div>
  )
}

export default DashboardCard
