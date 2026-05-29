export default function Logo({ height = 36, dark = false }) {
  const textColor = dark ? '#ffffff' : '#0C1A35'
  return (
    <svg id="logo" xmlns="http://www.w3.org/2000/svg" height={height} viewBox="0 0 300 80" role="img">
      <title>Varman</title>
      <text id="txt" x="0" y="62" fontFamily="-apple-system,'Inter','Helvetica Neue',Arial,sans-serif" fontSize="58" fontWeight="900" letterSpacing="-2" fill={textColor}>varman</text>
      <circle id="dot" cy="55" r="9" fill="#E11D48"/>
      <script>{`
        try {
          const t = document.getElementById('txt')
          const d = document.getElementById('dot')
          d.setAttribute('cx', t.getComputedTextLength() + 14)
        } catch(e){}
      `}</script>
    </svg>
  )
}
