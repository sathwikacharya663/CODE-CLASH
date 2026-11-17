export default function BlinkingCursor({ color = '#39ff14' }) {
  return (
    <span
      className="inline-block w-3 h-5 ml-1 align-middle animate-blink"
      style={{ backgroundColor: color }}
    />
  )
}
