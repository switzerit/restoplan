export default function Logo({ size = 28, dark = false, white = false }) {
  const color = white ? '#ffffff' : '#0C1A35'
  return (
    <div style={{display:'flex',alignItems:'baseline',gap:0}}>
      <span style={{
        fontFamily:"'Inter','Helvetica Neue',Arial,sans-serif",
        fontSize:size,
        fontWeight:900,
        letterSpacing:'-1px',
        color,
        lineHeight:1
      }}>varman</span>
      <div style={{
        width:size*0.22,
        height:size*0.22,
        borderRadius:'50%',
        background:'#E11D48',
        marginLeft:2,
        marginBottom:size*0.05,
        flexShrink:0
      }}/>
    </div>
  )
}
