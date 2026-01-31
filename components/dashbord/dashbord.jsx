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
import DashboardOccupancyGraph from './DashboardOccupancyGraph'

function DashboardCard() {
  const colors = useColors()
  const AuthUser = useAuthUser()
  
  const [stats, setStats] = useState({
    houses: { total: 0, occupied: 0 },
    lands: { total: 0, occupied: 0 },
    dailyRentals: { total: 0, occupied: 0 },
    users: 0
  })

  useEffect(() => {
    const houseRef = collection(db, 'houses')
    const terrainRef = collection(db, 'lands')
    const dailyRentalRef = collection(db, 'daily_rentals')
    const userRef = collection(db, 'users')

    const fetchData = async () => {
      try {
        // Queries based on user role
        const isManager = AuthUser.claims.userType !== 'admin'
        const userFilter = isManager ? [where('userId', '==', AuthUser.id)] : []

        // Houses
        const qHouses = query(houseRef, orderBy('createdAt', 'desc'), ...userFilter)
        // Occupied Houses (isAvailable == false)
        // Note: For manager, we filter by userId. For admin, we might want to see all occupied? 
        // Following existing logic in original file: 
        // Admin: where('type', '==', 'manager') AND where('isAvailable', '==', false) ?? 
        // Original code had: 
        // Admin: where('type', '==', 'manager'), where('isAvailable', '==', false)
        // Manager: where('userId', '==', AuthUser.id), where('isAvailable', '==', false)
        
        // I will simplify/standardize to: All items for Admin, User's items for Manager.
        const qHousesOccupied = query(
           houseRef, 
           where('isAvailable', '==', false), 
           ...userFilter
        )

        // Lands
        const qLands = query(terrainRef, orderBy('createdAt', 'desc'), ...userFilter)
        const qLandsOccupied = query(
          terrainRef,
          where('isAvailable', '==', false),
          ...userFilter
        )

        // Daily Rentals
        const qDailyRentals = query(dailyRentalRef, orderBy('createdAt', 'desc'), ...userFilter)
        const qDailyRentalsOccupied = query(
          dailyRentalRef,
          where('isAvailable', '==', false),
          ...userFilter
        )

        // Users
        const qUsers = query(userRef, orderBy('createdAt', 'desc'))

        const [
          snapHouses, snapHousesOccupied,
          snapLands, snapLandsOccupied,
          snapDailyRentals, snapDailyRentalsOccupied,
          snapUsers
        ] = await Promise.all([
          getDocs(qHouses), getDocs(qHousesOccupied),
          getDocs(qLands), getDocs(qLandsOccupied),
          getDocs(qDailyRentals), getDocs(qDailyRentalsOccupied),
          getDocs(qUsers)
        ])

        setStats({
          houses: { 
            total: snapHouses.size, 
            occupied: snapHousesOccupied.size 
          },
          lands: { 
            total: snapLands.size, 
            occupied: snapLandsOccupied.size 
          },
          dailyRentals: { 
            total: snapDailyRentals.size, 
            occupied: snapDailyRentalsOccupied.size 
          },
          users: snapUsers.size
        })

      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      }
    }

    if (AuthUser.id) {
        fetchData()
    }
  }, [AuthUser.id, AuthUser.claims.userType])

  const StatCard = ({ icon: Icon, label, value, subValue, labelColor }) => (
    <div className="group h-full flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-6 transition-all duration-200 hover:border-gray-300 hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
          {subValue && (
             <p className={`mt-2 text-sm font-medium ${labelColor || 'text-gray-500'}`}>
               {subValue}
             </p>
          )}
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

  const graphData = [
    {
      name: 'Maisons',
      Total: stats.houses.total,
      Occupé: stats.houses.occupied,
      Disponible: stats.houses.total - stats.houses.occupied,
    },
    {
      name: 'Terrains',
      Total: stats.lands.total,
      Occupé: stats.lands.occupied,
      Disponible: stats.lands.total - stats.lands.occupied,
    },
    {
      name: 'Locations',
      Total: stats.dailyRentals.total,
      Occupé: stats.dailyRentals.occupied,
      Disponible: stats.dailyRentals.total - stats.dailyRentals.occupied,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Grille principale */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Maisons */}
        <StatCard
            icon={Home}
            label="Maisons"
            value={stats.houses.total}
            subValue={`${stats.houses.occupied} Occupée(s)`}
            labelColor="text-red-500"
        />

        {/* Card 2: Terrains */}
        <StatCard
            icon={Landmark}
            label="Terrains"
            value={stats.lands.total}
            subValue={`${stats.lands.occupied} Occupé(s)`}
            labelColor="text-red-500"
        />

        {/* Card 3: Locations Journalières */}
        <StatCard
            icon={Calendar}
            label="Locations Jr."
            value={stats.dailyRentals.total}
            subValue={`${stats.dailyRentals.occupied} Occupée(s)`}
            labelColor="text-red-500"
        />

        {/* Card 4: Total Utilisateurs */}
        <StatCard
            icon={Users}
            label="Utilisateurs"
            value={stats.users}
        />
        
        {/* Card 5: Total Disponibles (Global) */}
        <StatCard
            icon={CheckCircle2}
            label="Total Disponibles"
            value={
                (stats.houses.total - stats.houses.occupied) +
                (stats.lands.total - stats.lands.occupied) +
                (stats.dailyRentals.total - stats.dailyRentals.occupied)
            }
         
            labelColor="text-green-600"
        />

         {/* Card 6: Total Occupés (Global) */}
         <StatCard
            icon={Zap}
            label="Total Occupés"
            value={
                stats.houses.occupied +
                stats.lands.occupied +
                stats.dailyRentals.occupied
            }
           
             labelColor="text-red-600"
        />
      </div>

      {/* Graphique */}
      <DashboardOccupancyGraph data={graphData} />
    </div>
  )
}

export default DashboardCard
