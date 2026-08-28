export const getInitials = (firstName?: string, lastName?: string): string => {
  const first = firstName?.charAt(0) || ''
  const last = lastName?.charAt(0) || ''
  return (first + last).toUpperCase() || 'US'
}

export const getShortName = (firstName?: string, lastName?: string): string => {
  const first = firstName?.split(' ')[0] || ''
  const last = lastName?.split(' ')[0] || ''
  return `${first} ${last}`.trim() || 'Sin nombre'
}