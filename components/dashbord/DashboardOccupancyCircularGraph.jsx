import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useColors } from '../../contexts/ColorContext'

const DashboardOccupancyCircularGraph = ({ data }) => {
  const colors = useColors()
  
  // Transformer les données pour le pie chart
  // Agrège Disponible et Occupé pour chaque élément
  const pieData = data.map(item => ({
    name: item.name,
    Disponible: item.Disponible,
    Occupé: item.Occupé,
    total: item.Disponible + item.Occupé
  }))

  // Calculer les totaux globaux
  const totalDisponible = pieData.reduce((sum, item) => sum + item.Disponible, 0)
  const totalOccupé = pieData.reduce((sum, item) => sum + item.Occupé, 0)
  
  const chartData = [
    { name: 'Disponible', value: totalDisponible },
    { name: 'Occupé', value: totalOccupé }
  ]

  const COLORS = [colors.primary, '#ef4444']

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-6 text-lg font-semibold text-gray-900">
        Statistiques d'Occupation global
      </h3>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value, percent }) => 
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                borderRadius: '8px', 
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value) => `${value} places`}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              wrapperStyle={{ paddingTop: '20px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default DashboardOccupancyCircularGraph