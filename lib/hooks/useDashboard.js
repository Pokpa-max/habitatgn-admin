import { useEffect, useState } from 'react'
import { useAuthUser } from 'next-firebase-auth'
import { fetchRevenueData, calculateRevenueStats } from '@/lib/services/revenueService'


export const useRevenueData = () => {
    const AuthUser = useAuthUser()
    const [revenueData, setRevenueData] = useState([])
    const [revenueStats, setRevenueStats] = useState({
        total: 0,
        average: 0,
        max: 0,
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!AuthUser.id || !AuthUser.claims?.userType) {
            setLoading(false)
            return
        }

        const loadRevenueData = async () => {
            try {
                setLoading(true)
                setError(null)

                const data = await fetchRevenueData(AuthUser.id, AuthUser.claims.userType)
                setRevenueData(data)

                // Calculer les stats
                const stats = calculateRevenueStats(data)
                setRevenueStats(stats)
            } catch (err) {
                console.error('Erreur dans useRevenueData:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        loadRevenueData()
    }, [AuthUser.id, AuthUser.claims?.userType])

    return {
        revenueData,
        revenueStats,
        loading,
        error,
    }
}