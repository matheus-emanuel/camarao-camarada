'use client'

export async function generatePdf(elementId: string, filename: string): Promise<void> {
  const { default: jsPDF } = await import('jspdf')
  const { default: html2canvas } = await import('html2canvas')

  const element = document.getElementById(elementId)
  if (!element) throw new Error(`Element #${elementId} not found`)

  const prevDisplay = element.style.display
  element.style.display = 'block'

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth - 20
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    const margin = 10

    let yPos = margin
    let remainingHeight = imgHeight

    while (remainingHeight > 0) {
      const sliceHeight = Math.min(remainingHeight, pageHeight - 2 * margin)
      const sourceY = (imgHeight - remainingHeight) * (canvas.height / imgHeight)
      const sourceHeight = sliceHeight * (canvas.height / imgHeight)

      const sliceCanvas = document.createElement('canvas')
      sliceCanvas.width = canvas.width
      sliceCanvas.height = sourceHeight
      const sliceCtx = sliceCanvas.getContext('2d')!
      sliceCtx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight)

      const sliceData = sliceCanvas.toDataURL('image/png')
      pdf.addImage(sliceData, 'PNG', margin, yPos, imgWidth, sliceHeight)
      remainingHeight -= sliceHeight

      if (remainingHeight > 0) {
        pdf.addPage()
        yPos = margin
      }
    }

    pdf.save(filename)
  } finally {
    element.style.display = prevDisplay
  }
}
