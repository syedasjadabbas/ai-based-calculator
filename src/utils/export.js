function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function exportHistoryCsv(history) {
  const rows = [
    ['Date', 'Type', 'Expression', 'Result', 'Pinned'],
    ...history.map((item) => [
      new Date(item.createdAt).toLocaleString(),
      item.kind ?? 'calculation',
      item.expression ?? item.prompt ?? '',
      item.result ?? item.answer ?? '',
      item.pinned ? 'Yes' : 'No',
    ]),
  ]

  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `calculator-history-${Date.now()}.csv`)
}

export function exportHistoryPdf(history) {
  return import('jspdf').then(({ jsPDF }) => {
  const pdf = new jsPDF()
  pdf.setFontSize(18)
  pdf.text('Calculator History', 14, 18)
  pdf.setFontSize(10)

  let y = 30

  history.forEach((item, index) => {
    const label = `${index + 1}. ${item.kind ?? 'calculation'} - ${new Date(item.createdAt).toLocaleString()}`
    const expression = `Input: ${item.expression ?? item.prompt ?? ''}`
    const result = `Result: ${item.result ?? item.answer ?? ''}`
    const pinned = item.pinned ? 'Pinned' : ' '

    pdf.text(label, 14, y)
    pdf.text(expression, 14, y + 6)
    pdf.text(result, 14, y + 12)
    pdf.text(pinned, 14, y + 18)
    y += 28

    if (y > 270) {
      pdf.addPage()
      y = 18
    }
  })

  pdf.save(`calculator-history-${Date.now()}.pdf`)
  })
}