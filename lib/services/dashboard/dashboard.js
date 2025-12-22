import { db } from '@/lib/firebase/client_config'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'


export const fetchRevenueData = async (userId, userType) => {
    try {
        const dailyRentalRef = collection(db, 'daily_rentals')
        const housesRef = collection(db, 'houses')

        // Query pour les locations journalières
        const dailyQuery =
            userType === 'admin'
                ? query(dailyRentalRef, orderBy('createdAt', 'desc'))
                : query(
                    dailyRentalRef,
                    where('userId', '==', userId),
                    orderBy('createdAt', 'desc')
                )

        const snapshot = await getDocs(dailyQuery)
        const rentals = snapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
        }))

        // Calculer les revenus par jour (7 derniers jours)
        const revenueByDay = calculateRevenueByDay(rentals)

        return revenueByDay
    } catch (error) {
        console.error('Erreur lors du chargement des revenus:', error)
        return []
    }
}


export const calculateRevenueByDay = (rentals) => {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    const today = new Date()
    const revenueData = []

    // Créer un objet pour chaque jour des 7 derniers jours
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)

        const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1]
        const dateStr = date.toISOString().split('T')[0]

        // Calculer le revenu pour ce jour
        const dayRevenue = rentals
            .filter((rental) => {
                const rentalDate = rental.createdAt?.toDate?.()?.toISOString()?.split('T')[0]
                return rentalDate === dateStr
            })
            .reduce((sum, rental) => sum + (rental.price || 0), 0)

        revenueData.push({
            day: dayName,
            date: dateStr,
            revenue: dayRevenue,
        })
    }

    return revenueData
}


export const calculateRevenueStats = (revenueData) => {
    const total = revenueData.reduce((sum, item) => sum + item.revenue, 0)
    const average = total / revenueData.length

    return {
        total: Math.round(total),
        average: Math.round(average),
        max: Math.max(...revenueData.map((item) => item.revenue)),
    }
}