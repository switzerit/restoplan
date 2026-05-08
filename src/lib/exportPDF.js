import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function parseTimeToMinutes(t) {
  if (!t) return 0
  const [h, m] = t.slice(0, 5).split(':').map(Number)
  return h * 60 + m
}

function calcDuration(debut, fin) {
  if (!debut || !fin) return 0
  let d = parseTimeToMinutes(debut)
  let f = parseTimeToMinutes(fin)
  if (f < d) f += 1440
  return f - d
}

function toHHMM(mins) {
  if (!mins || mins <= 0) return '0h00'
  return `${Math.floor(mins / 60)}h${(mins % 60).toString().padStart(2, '0')}`
}

function fmtDate(dateStr) {
  const d = new Date(dateStr)
  const months = ['jan','fev','mar','avr','mai','juin','juil','aout','sep','oct','nov','dec']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function fmtDateShort(dateStr) {
  const d = new Date(dateStr)
  const days = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']
  const months = ['jan','fev','mar','avr','mai','juin','juil','aout','sep','oct','nov','dec']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
}

export function generatePDF({ restaurant, employes, shifts, pointages, dateDebut, dateFin }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const BLUE = [0, 113, 227]
  const DARK = [20, 20, 30]
  const GRAY = [120, 120, 130]

  // ── HEADER ──────────────────────────────────
  doc.setFillColor(...BLUE)
  doc.roundedRect(0, 0, W, 40, 0, 0, 'F')

  // Icone RP
  doc.setFillColor(255, 255, 255)
  doc.circle(22, 20, 11, 'F')
  doc.setTextColor(...BLUE)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('RP', 22, 24, { align: 'center' })

  // Titre et infos restaurant
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(17)
  doc.setFont('helvetica', 'bold')
  doc.text('Rapport de presence', 38, 16)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(restaurant.nom, 38, 24)
  if (restaurant.adresse) doc.text(restaurant.adresse, 38, 30)

  // Periode coin droit
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(`${fmtDate(dateDebut)} - ${fmtDate(dateFin)}`, W - 14, 16, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`Exporte le ${new Date().toLocaleDateString('fr-FR')}`, W - 14, 23, { align: 'right' })

  // ── STATS GLOBALES ──────────────────────────
  let totalShiftMins = 0
  let totalPointageMins = 0
  let totalJours = 0
  let totalPresences = 0

  const empData = employes.map(emp => {
    const empShifts = shifts.filter(s => s.employe_id === emp.id && s.date >= dateDebut && s.date <= dateFin)
    const empPointages = pointages.filter(p => p.employe_id === emp.id && p.date >= dateDebut && p.date <= dateFin)

    const shiftMins = empShifts.reduce((acc, s) => {
      let t = calcDuration(s.heure_debut, s.heure_fin)
      if (s.heure_debut_2 && s.heure_fin_2) t += calcDuration(s.heure_debut_2, s.heure_fin_2)
      return acc + t
    }, 0)

    const pointageMins = empPointages.reduce((acc, p) => {
      return acc + calcDuration(p.heure_arrivee, p.heure_depart)
    }, 0)

    const nbJours = empShifts.length
    const nbPresences = [...new Set(empPointages.filter(p => p.heure_arrivee).map(p => p.date))].length
    const ecart = pointageMins - shiftMins

    totalShiftMins += shiftMins
    totalPointageMins += pointageMins
    totalJours += nbJours
    totalPresences += nbPresences

    return { emp, empShifts, empPointages, shiftMins, pointageMins, nbJours, nbPresences, ecart }
  })

  // ── TABLEAU RECAP ────────────────────────────
  doc.setTextColor(...DARK)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Resume de la periode', 14, 52)
  doc.setDrawColor(...BLUE)
  doc.setLineWidth(0.4)
  doc.line(14, 54, W - 14, 54)

  const rows = empData.map(({ emp, nbJours, nbPresences, shiftMins, pointageMins, ecart }) => [
    `${emp.prenom} ${emp.nom}`,
    emp.role,
    `${nbPresences}/${nbJours}`,
    toHHMM(shiftMins),
    toHHMM(pointageMins),
    {
      content: ecart === 0 ? '=' : (ecart > 0 ? `+${toHHMM(ecart)}` : `-${toHHMM(Math.abs(ecart))}`),
      styles: { textColor: ecart >= 0 ? [26, 122, 58] : [176, 32, 32], fontStyle: 'bold' }
    }
  ])

  const ecartTotal = totalPointageMins - totalShiftMins

  autoTable(doc, {
    startY: 57,
    head: [['Employe', 'Poste', 'Presences', 'H. planifiees', 'H. pointees', 'Ecart']],
    body: rows,
    foot: [[
      { content: 'TOTAL', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [235, 240, 248] } },
      { content: `${totalPresences}/${totalJours}`, styles: { fontStyle: 'bold', fillColor: [235, 240, 248], halign: 'center' } },
      { content: toHHMM(totalShiftMins), styles: { fontStyle: 'bold', fillColor: [235, 240, 248], halign: 'center' } },
      { content: toHHMM(totalPointageMins), styles: { fontStyle: 'bold', fillColor: [235, 240, 248], halign: 'center' } },
      {
        content: ecartTotal === 0 ? '=' : (ecartTotal > 0 ? `+${toHHMM(ecartTotal)}` : `-${toHHMM(Math.abs(ecartTotal))}`),
        styles: { fontStyle: 'bold', fillColor: [235, 240, 248], halign: 'center', textColor: ecartTotal >= 0 ? [26, 122, 58] : [176, 32, 32] }
      }
    ]],
    styles: { fontSize: 9, cellPadding: 4.5, font: 'helvetica', textColor: DARK },
    headStyles: { fillColor: BLUE, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 251, 255] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 42 },
      1: { cellWidth: 38, textColor: GRAY },
      2: { halign: 'center', cellWidth: 22 },
      3: { halign: 'center', cellWidth: 28 },
      4: { halign: 'center', cellWidth: 28 },
      5: { halign: 'center', cellWidth: 22 },
    },
    margin: { left: 14, right: 14 },
    footStyles: { fontSize: 9 }
  })

  // ── DETAIL POINTAGES ─────────────────────────
  let Y = doc.lastAutoTable.finalY + 14

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...DARK)
  doc.text('Detail des pointages par employe', 14, Y)
  doc.setDrawColor(...BLUE)
  doc.setLineWidth(0.4)
  doc.line(14, Y + 2, W - 14, Y + 2)
  Y += 10

  empData.forEach(({ emp, empPointages, shiftMins, pointageMins }) => {
    const pts = empPointages.filter(p => p.heure_arrivee).sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return a.heure_arrivee.localeCompare(b.heure_arrivee)
    })
    if (pts.length === 0) return

    if (Y > 245) { doc.addPage(); Y = 20 }

    // Nom employe avec badge résumé
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BLUE)
    doc.text(`${emp.prenom} ${emp.nom}`, 14, Y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GRAY)
    doc.text(`${emp.role}  |  Prevu: ${toHHMM(shiftMins)}  |  Pointe: ${toHHMM(pointageMins)}`, 14, Y + 4)
    Y += 8

    // Grouper les pointages par date
    const byDate = {}
    pts.forEach(p => {
      if (!byDate[p.date]) byDate[p.date] = []
      byDate[p.date].push(p)
    })

    const detailRows = []
    Object.entries(byDate).sort().forEach(([date, datePts]) => {
      const totalMins = datePts.reduce((acc, p) => acc + calcDuration(p.heure_arrivee, p.heure_depart), 0)
      datePts.forEach((p, idx) => {
        const dur = calcDuration(p.heure_arrivee, p.heure_depart)
        detailRows.push([
          idx === 0 ? fmtDateShort(date) : '',
          p.heure_arrivee?.slice(0, 5) || '--',
          p.heure_depart?.slice(0, 5) || 'En cours',
          dur > 0 ? toHHMM(dur) : '--',
          idx === datePts.length - 1 && datePts.length > 1 ? { content: toHHMM(totalMins), styles: { fontStyle: 'bold', textColor: [0, 113, 227] } } : ''
        ])
      })
    })

    autoTable(doc, {
      startY: Y,
      head: [['Date', 'Arrivee', 'Depart', 'Duree', 'Total jour']],
      body: detailRows,
      styles: { fontSize: 8, cellPadding: 3, font: 'helvetica' },
      headStyles: { fillColor: [240, 246, 255], textColor: [0, 80, 160], fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [250, 253, 255] },
      columnStyles: {
        0: { cellWidth: 38, fontStyle: 'bold' },
        1: { halign: 'center', cellWidth: 28 },
        2: { halign: 'center', cellWidth: 28 },
        3: { halign: 'center', cellWidth: 25 },
        4: { halign: 'center', cellWidth: 25 },
      },
      margin: { left: 14, right: 14 },
    })

    Y = doc.lastAutoTable.finalY + 10
  })

  // ── FOOTER ───────────────────────────────────
  const pages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setDrawColor(210, 220, 235)
    doc.setLineWidth(0.3)
    doc.line(14, 287, W - 14, 287)
    doc.setFontSize(7.5)
    doc.setTextColor(...GRAY)
    doc.setFont('helvetica', 'normal')
    doc.text(`RestoPlan  •  ${restaurant.nom}  •  ${fmtDate(dateDebut)} au ${fmtDate(dateFin)}`, 14, 292)
    doc.text(`Page ${i} / ${pages}`, W - 14, 292, { align: 'right' })
  }

  doc.save(`rapport_${restaurant.nom.replace(/\s+/g, '_')}_${dateDebut}_${dateFin}.pdf`)
}
