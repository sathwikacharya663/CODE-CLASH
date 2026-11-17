export default function LoadingSpinner({ size = 'md', color = 'green' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  const colors = {
    green: 'border-volt-green',
    cyan: 'border-volt-cyan',
    white: 'border-white',
  }
  return (
    <div
      className={`${sizes[size]} ${colors[color]} border-2 border-t-transparent rounded-full animate-spin`}
    />
  )
}
