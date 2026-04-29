import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function minutesToHHMM(minutes) {
  if (!minutes || minutes < 0) return '0h00'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h${m.toString().padStart(2, '0')}`
}

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0
  const [h, m] = timeStr.slice(0, 5).split(':').map(Number)
  return h * 60 + m
}

function calcDuration(debut, fin) {
  if (!debut || !fin) return 0
  let d = parseTimeToMinutes(debut)
  let f = parseTimeToMinutes(fin)
  if (f < d) f += 24 * 60 // passage minuit
  return f - d
}

export function generatePDF({ restaurant, employes, shifts, pointages, dateDebut, dateFin }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()

  // ── HEADER ──────────────────────────────────────────────
  // Bande bleue en haut
  doc.setFillColor(0, 113, 227)
  doc.rect(0, 0, pageW, 36, 'F')

  // Logo cercle blanc
  doc.setFillColor(255, 255, 255)
  doc.circle(20, 18, 10, 'F')
  doc.setTextColor(0, 113, 227)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('RP', 20, 22, { align: 'center' })

  // Titre
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Rapport de présence', 36, 14)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(restaurant.nom, 36, 22)
  doc.text(`${restaurant.adresse || ''}`, 36, 28)

  // Période (coin droit)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  const periode = `${formatDate(dateDebut)} → ${formatDate(dateFin)}`
  doc.text(periode, pageW - 14, 14, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, pageW - 14, 21, { align: 'right' })

  // ── RÉSUMÉ ───────────────────────────────────────────────
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Résumé de la période', 14, 48)

  // Ligne séparatrice
  doc.setDrawColor(0, 113, 227)
  doc.setLineWidth(0.5)
  doc.line(14, 50, pageW - 14, 50)

  // ── TABLEAU PAR EMPLOYÉ ──────────────────────────────────
  const rows = []
  let totalPlannifMin = 0
  let totalPointeMin = 0

  employes.forEach(emp => {
    // Shifts sur la période
    const empShifts = shifts.filter(s =>
      s.employe_id === emp.id &&
      s.date >= dateDebut &&
      s.date <= dateFin
    )
    const plannifMin = empShifts.reduce((acc, s) => acc + calcDuration(s.heure_debut, s.heure_fin), 0)

    // Pointages sur la période
    const empPointages = pointages.filter(p =>
      p.employe_id === emp.id &&
      p.date >= dateDebut &&
      p.date <= dateFin
    )
    const pointeMin = empPointages.reduce((acc, p) => {
      if (p.heure_arrivee && p.heure_depart) {
        return acc + calcDuration(p.heure_arrivee, p.heure_depart)
      }
      return acc
    }, 0)

    const ecartMin = pointeMin - plannifMin
    const nbJours = empShifts.length
    const nbPresences = empPointages.filter(p => p.heure_arrivee).length

    totalPlannifMin += plannifMin
    totalPointeMin += pointeMin

    rows.push([
      `${emp.prenom} ${emp.nom}`,
      emp.role,
      nbJours.toString(),
      minutesToHHMM(plannifMin),
      `${nbPresences}/${nbJours}`,
      minutesToHHMM(pointeMin),
      {
        content: ecartMin >= 0 ? `+${minutesToHHMM(ecartMin)}` : `-${minutesToHHMM(Math.abs(ecartMin))}`,
        styles: {
          textColor: ecartMin >= 0 ? [26, 122, 58] : [176, 32, 32],
          fontStyle: 'bold'
        }
      }
    ])
  })

  autoTable(doc, {
    startY: 55,
    head: [['Employé', 'Poste', 'Jours', 'H. planifiées', 'Présences', 'H. pointées', 'Écart']],
    body: rows,
    foot: [[
      { content: 'TOTAL', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [240, 242, 245] } },
      { content: minutesToHHMM(totalPlannifMin), styles: { fontStyle: 'bold', fillColor: [240, 242, 245] } },
      { content: '', styles: { fillColor: [240, 242, 245] } },
      { content: minutesToHHMM(totalPointeMin), styles: { fontStyle: 'bold', fillColor: [240, 242, 245] } },
      {
        content: totalPointeMin >= totalPlannifMin
          ? `+${minutesToHHMM(totalPointeMin - totalPlannifMin)}`
          : `-${minutesToHHMM(totalPlannifMin - totalPointeMin)}`,
        styles: {
          fontStyle: 'bold',
          fillColor: [240, 242, 245],
          textColor: totalPointeMin >= totalPlannifMin ? [26, 122, 58] : [176, 32, 32]
        }
      }
    ]],
    styles: {
      fontSize: 9,
      cellPadding: 4,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: [0, 113, 227],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 35 },
      2: { halign: 'center', cellWidth: 15 },
      3: { halign: 'center', cellWidth: 25 },
      4: { halign: 'center', cellWidth: 22 },
      5: { halign: 'center', cellWidth: 25 },
      6: { halign: 'center', cellWidth: 20 },
    },
    margin: { left: 14, right: 14 },
  })

  // ── DÉTAIL PAR EMPLOYÉ ───────────────────────────────────
  const finalY = doc.lastAutoTable.finalY + 12

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 30)
  doc.text('Détail des pointages', 14, finalY)
  doc.setDrawColor(0, 113, 227)
  doc.line(14, finalY + 2, pageW - 14, finalY + 2)

  let currentY = finalY + 8

  employes.forEach(emp => {
    const empPointages = pointages.filter(p =>
      p.employe_id === emp.id &&
      p.date >= dateDebut &&
      p.date <= dateFin &&
      p.heure_arrivee
    ).sort((a, b) => a.date.localeCompare(b.date))

    if (empPointages.length === 0) return

    // Vérifier si on a besoin d'une nouvelle page
    if (currentY > 240) {
      doc.addPage()
      currentY = 20
    }

    // Nom employé
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 113, 227)
    doc.text(`${emp.prenom} ${emp.nom} — ${emp.role}`, 14, currentY)
    currentY += 5

    const detailRows = empPointages.map(p => {
      const dureeMin = calcDuration(p.heure_arrivee, p.heure_depart)
      return [
        new Date(p.date).toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'}),
        p.heure_arrivee?.slice(0, 5) || '—',
        p.heure_depart?.slice(0, 5) || 'En cours',
        minutesToHHMM(dureeMin)
      ]
    })

    autoTable(doc, {
      startY: currentY,
      head: [['Date', 'Arrivée', 'Départ', 'Durée']],
      body: detailRows,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [232, 242, 253], textColor: [0, 80, 160], fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [250, 252, 255] },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { halign: 'center', cellWidth: 30 },
        2: { halign: 'center', cellWidth: 30 },
        3: { halign: 'center', cellWidth: 30, fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
    })

    currentY = doc.lastAutoTable.finalY + 8
  })

  // ── FOOTER ───────────────────────────────────────────────
  const pages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(160, 160, 160)
    doc.setFont('helvetica', 'normal')
    doc.text(`RestoPlan • ${restaurant.nom} • Page ${i}/${pages}`, pageW / 2, 292, { align: 'center' })
    doc.setDrawColor(220, 220, 220)
    doc.line(14, 289, pageW - 14, 289)
  }

  // Téléchargement
  const fileName = `rapport_${restaurant.nom.replace(/\s+/g, '_')}_${dateDebut}_${dateFin}.pdf`
  doc.save(fileName)
}

function formatDate(dateStr) {
  const d = new Date(dateStr); const months = ['jan','fev','mar','avr','mai','juin','juil','aout','sep','oct','nov','dec']; return d.getDate()+' '+months[d.getMonth()]+' '+d.getFullYear()
}
