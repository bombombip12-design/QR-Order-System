import { useEffect, useState } from 'react'
import { DollarSign, ShoppingBag, TrendingUp } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { adminApi } from '../../api/client'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const CHART_COLORS = [
  'rgba(99, 102, 241, 0.8)', // indigo
  'rgba(34, 197, 94, 0.8)', // green
  'rgba(249, 115, 22, 0.8)', // orange
  'rgba(236, 72, 153, 0.8)', // pink
  'rgba(59, 130, 246, 0.8)', // blue
]

export default function AdminStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.stats
      .get()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-gray-400 py-8">Đang tải...</div>
  }

  if (!stats) {
    return <div className="card p-8 text-center text-gray-400">Không thể tải thống kê. Kiểm tra kết nối API.</div>
  }

  const barData = {
    labels: stats.topItems.map((i) => i.name),
    datasets: [
      {
        label: 'Số lượng bán',
        data: stats.topItems.map((i) => i.quantity),
        backgroundColor: CHART_COLORS.slice(0, stats.topItems.length),
        borderColor: CHART_COLORS.map((c) => c.replace('0.8', '1')),
        borderWidth: 1,
      },
    ],
  }

  const doughnutData = {
    labels: stats.topItems.map((i) => i.name),
    datasets: [
      {
        data: stats.topItems.map((i) => i.quantity),
        backgroundColor: CHART_COLORS,
        borderColor: 'rgb(30, 41, 59)',
        borderWidth: 2,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: { size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const raw = typeof ctx?.raw === 'number' ? ctx.raw : Number(ctx?.raw ?? 0)
            return ` ${raw} đơn`
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8', maxRotation: 45 },
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#94a3b8', font: { size: 12 } },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const total = stats.topItems.reduce((s, i) => s + i.quantity, 0)
            const raw = typeof ctx?.raw === 'number' ? ctx.raw : Number(ctx?.raw ?? 0)
            const pct = total ? ((raw / total) * 100).toFixed(1) : 0
            return ` ${ctx?.label ?? ''}: ${raw} đơn (${pct}%)`
          },
        },
      },
    },
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Thống kê & doanh thu</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Doanh thu</p>
            <p className="text-xl font-semibold text-white">{stats.revenue.toLocaleString('vi-VN')}₫</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Số đơn hàng</p>
            <p className="text-xl font-semibold text-white">{stats.totalOrders}</p>
          </div>
        </div>
      </div>

      {stats.topItems.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-5">
            <h3 className="font-medium text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-400" />
              Món bán chạy (biểu đồ cột)
            </h3>
            <div className="h-72">
              <Bar data={barData} options={chartOptions} />
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-medium text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-400" />
              Tỷ lệ món bán chạy
            </h3>
            <div className="h-72">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-5">
          <h3 className="font-medium text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-400" />
            Món bán chạy
          </h3>
          <p className="text-gray-400">Chưa có dữ liệu.</p>
        </div>
      )}
    </div>
  )
}

