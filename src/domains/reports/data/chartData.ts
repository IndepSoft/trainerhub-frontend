/**
 * Conjuntos de datos para las graficas de Reportes, en formato chart.js.
 *
 * Fuente unica: los consume SummaryComponent, que monta con ellos el grafico de
 * linea, el de dona y el de barras. Estaban duplicados literalmente en
 * SummaryComponent y en Reports.tsx; en Reports.tsx ademas no los usaba nadie.
 *
 * TODO: los valores son de ejemplo. Deben venir del backend a traves de un
 * repositorio de reportes cuando exista, no vivir en el codigo.
 */

export const revenueData = {
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

export const planDistribution = {
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

export const attendanceData = {
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
