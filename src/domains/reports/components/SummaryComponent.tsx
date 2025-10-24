import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { File, FileSpreadsheet, FileText } from 'lucide-react'
import React, { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  LineController,
  BarController,
  DoughnutController,
} from 'chart.js'
import type { ChartOptions } from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  LineController,
  BarController,
  DoughnutController
)

export default function SummaryComponent() {
  const lineChartRef = useRef<HTMLCanvasElement>(null)
  const doughnutChartRef = useRef<HTMLCanvasElement>(null)
  const barChartRef = useRef<HTMLCanvasElement>(null)
  const lineChartInstance = useRef<ChartJS<'line'> | null>(null)
  const doughnutChartInstance = useRef<ChartJS<'doughnut'> | null>(null)
  const barChartInstance = useRef<ChartJS<'bar'> | null>(null)

  // Chart data
  const revenueData = {
    labels: [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ],
    datasets: [
      {
        label: 'Ingresos',
        data: [
          2800, 3200, 3500, 3800, 4200, 4500, 4800, 5000, 4700, 4900, 5200,
          5400,
        ],
        fill: true,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderColor: 'rgb(99, 102, 241)',
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
      },
    ],
  }

  const planDistribution = {
    labels: ['Plan Mensual', 'Plan Semestral', 'Paquetes'],
    datasets: [
      {
        data: [45, 35, 20],
        backgroundColor: [
          'rgb(99, 102, 241)',
          'rgb(249, 115, 22)',
          'rgb(34, 197, 94)',
        ],
        borderWidth: 0,
      },
    ],
  }

  const attendanceData = {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Asistencia',
        data: [85, 92, 78, 88, 95, 72, 65],
        backgroundColor: 'rgb(99, 102, 241)',
        borderRadius: 6,
      },
    ],
  }

  useEffect(() => {
    // Cleanup function to destroy charts before creating new ones
    const cleanupCharts = () => {
      if (lineChartInstance.current) {
        lineChartInstance.current.destroy()
        lineChartInstance.current = null
      }
      if (doughnutChartInstance.current) {
        doughnutChartInstance.current.destroy()
        doughnutChartInstance.current = null
      }
      if (barChartInstance.current) {
        barChartInstance.current.destroy()
        barChartInstance.current = null
      }
    }

    // Clean up any existing charts first
    cleanupCharts()

    // Line Chart
    if (lineChartRef.current) {
      const ctx = lineChartRef.current.getContext('2d')
      if (ctx) {
        lineChartInstance.current = new ChartJS(ctx, {
          type: 'line',
          data: revenueData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                displayColors: false,
                callbacks: {
                  label: (context) =>
                    `$${(context.parsed.y ?? 0).toLocaleString()}`,
                },
              },
            },
            scales: {
              x: {
                grid: {
                  display: false,
                },
                border: {
                  display: false,
                },
              },
              y: {
                grid: {
                  color: 'rgba(0, 0, 0, 0.05)',
                },
                border: {
                  display: false,
                },
                ticks: {
                  callback: (value) => `$${value}`,
                },
              },
            },
            interaction: {
              intersect: false,
              mode: 'index',
            },
          } as ChartOptions<'line'>,
        })
      }
    }

    // Doughnut Chart
    if (doughnutChartRef.current) {
      const ctx = doughnutChartRef.current.getContext('2d')
      if (ctx) {
        doughnutChartInstance.current = new ChartJS(ctx, {
          type: 'doughnut',
          data: planDistribution,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 20,
                  usePointStyle: true,
                  pointStyle: 'circle',
                  font: {
                    size: 12,
                  },
                },
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                callbacks: {
                  label: (context) =>
                    `${context.label}: ${context.parsed ?? 0}%`,
                },
              },
            },
            cutout: '70%',
          } as ChartOptions<'doughnut'>,
        })
      }
    }

    // Bar Chart
    if (barChartRef.current) {
      const ctx = barChartRef.current.getContext('2d')
      if (ctx) {
        barChartInstance.current = new ChartJS(ctx, {
          type: 'bar',
          data: attendanceData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                displayColors: false,
                callbacks: {
                  label: (context) => `${context.parsed.y ?? 0}% de asistencia`,
                },
              },
            },
            scales: {
              x: {
                grid: {
                  display: false,
                },
                border: {
                  display: false,
                },
              },
              y: {
                beginAtZero: true,
                max: 100,
                grid: {
                  color: 'rgba(0, 0, 0, 0.05)',
                },
                border: {
                  display: false,
                },
                ticks: {
                  callback: (value) => `${value}%`,
                },
              },
            },
          } as ChartOptions<'bar'>,
        })
      }
    }

    return () => {
      cleanupCharts()
    }
  }, [])

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Evolución de Ingresos</CardTitle>
            <p className="text-sm text-gray-500">
              Ingresos mensuales de los últimos 12 meses
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <canvas ref={lineChartRef}></canvas>
            </div>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribución de Planes</CardTitle>
            <p className="text-sm text-gray-500">
              Porcentaje de alumnos por tipo de plan
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <canvas ref={doughnutChartRef}></canvas>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Patrón de Asistencia Semanal
          </CardTitle>
          <p className="text-sm text-gray-500">
            Porcentaje de asistencia por día de la semana
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <canvas ref={barChartRef}></canvas>
          </div>
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Exportar Datos</CardTitle>
          <p className="text-sm text-gray-500">
            Descarga reportes en diferentes formatos
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Exportar PDF
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Exportar Excel
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <File className="w-4 h-4" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
