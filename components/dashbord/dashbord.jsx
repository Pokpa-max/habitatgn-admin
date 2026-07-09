import { db } from '@/lib/firebase/client_config'
import { useAuthUser } from 'next-firebase-auth'
import { collection, getDocs, query, where } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import { useColors } from '../../contexts/ColorContext'
import {
  Briefcase,
  Hammer,
  Users,
  ShieldCheck,
  Scale,
  Building2,
} from 'lucide-react'

function DashboardCard() {
  const colors = useColors()
  const AuthUser = useAuthUser()

  const [stats, setStats] = useState({
    agents: { approved: 0, pending: 0 },
    workers: { approved: 0, pending: 0 },
    customers: 0,
    managers: 0,
    legalPartners: 0,
    agencies: { active: 0, total: 0 },
  })

  useEffect(() => {
    if (AuthUser.claims?.userType !== 'admin') return

    const fetchData = async () => {
      try {
        const agentRequestsRef = collection(db, 'agent_requests')
        const workersRef = collection(db, 'workers')
        const usersRef = collection(db, 'users')
        const legalPartnersRef = collection(db, 'legalPartners')
        const agenciesRef = collection(db, 'partner_agencies')

        const [
          snapAgentsApproved,
          snapAgentsPending,
          snapWorkersApproved,
          snapWorkersPending,
          snapCustomers,
          snapManagers,
          snapLegalPartners,
          snapAgencies,
        ] = await Promise.all([
          getDocs(query(agentRequestsRef, where('status', '==', 'approved'))),
          getDocs(query(agentRequestsRef, where('status', '==', 'pending'))),
          getDocs(query(workersRef, where('status', '==', 'approved'))),
          getDocs(query(workersRef, where('status', '==', 'pending'))),
          getDocs(query(usersRef, where('type', '==', 'customer'))),
          getDocs(query(usersRef, where('type', 'in', ['manager', 'admin']))),
          getDocs(legalPartnersRef),
          getDocs(agenciesRef),
        ])

        setStats({
          agents: { approved: snapAgentsApproved.size, pending: snapAgentsPending.size },
          workers: { approved: snapWorkersApproved.size, pending: snapWorkersPending.size },
          customers: snapCustomers.size,
          managers: snapManagers.size,
          legalPartners: snapLegalPartners.size,
          agencies: {
            active: snapAgencies.docs.filter((d) => d.data().active).length,
            total: snapAgencies.size,
          },
        })
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      }
    }

    fetchData()
  }, [AuthUser.claims?.userType])

  const StatCard = ({ icon: Icon, label, value, subValue }) => (
    <div className="flex h-full flex-col justify-between rounded-lg border border-gray-200 bg-white p-6 transition-all duration-200 hover:border-gray-300 hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
          {subValue && <p className="mt-2 text-sm font-medium text-gray-500">{subValue}</p>}
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-md"
          style={{ backgroundColor: colors.primary }}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  )

  if (AuthUser.claims?.userType !== 'admin') {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
        Bienvenue sur le portail BâtiServices Admin.
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <StatCard
        icon={Briefcase}
        label="Agents"
        value={stats.agents.approved}
        subValue={`${stats.agents.pending} en attente de validation`}
      />
      <StatCard
        icon={Hammer}
        label="Ouvriers"
        value={stats.workers.approved}
        subValue={`${stats.workers.pending} en attente de validation`}
      />
      <StatCard icon={Users} label="Utilisateurs" value={stats.customers} />
      <StatCard icon={ShieldCheck} label="Managers & admins" value={stats.managers} />
      <StatCard icon={Scale} label="Partenaires légaux" value={stats.legalPartners} />
      <StatCard
        icon={Building2}
        label="Agences sponsorisées"
        value={stats.agencies.active}
        subValue={`${stats.agencies.total} au total`}
      />
    </div>
  )
}

export default DashboardCard
