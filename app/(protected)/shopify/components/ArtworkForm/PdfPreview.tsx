'use client'

import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { PdfPreviewProps } from './types'
import styles from '../ArtworkForm.module.scss'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

// Configuration du worker PDF.js (nécessaire pour react-pdf)
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

function PdfPreview({ url, certificateFile }: PdfPreviewProps) {
  const [numPages, setNumPages] = useState<number | null>(null)

  if (!url) return null

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
  }

  return (
    <div className={styles.certificatePreviewContainer}>
      {!certificateFile && (
        <div className={styles.imageMainLabel}>
          <p><strong>Certificat déjà enregistré dans la base de données</strong></p>
        </div>
      )}
      <div className={styles.certificateInfo}>
        {certificateFile && (
          <>
            <p>Format: PDF</p>
            <p>Nom: {certificateFile.name}</p>
            <p>Taille: {(certificateFile.size / 1024).toFixed(2)} Ko</p>
          </>
        )}
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.viewPdfLink}
        >
          Voir le PDF dans un nouvel onglet
        </a>
      </div>
      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        className={styles.pdfDocument}
      >
        <Page pageNumber={1} />
      </Document>
    </div>
  )
}

export default PdfPreview 