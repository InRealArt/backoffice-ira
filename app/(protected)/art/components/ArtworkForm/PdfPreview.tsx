'use client'

import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { PdfPreviewProps } from './types'
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
    <div className="mt-4 bg-black/5 p-4 rounded-lg">
      {!certificateFile && (
        <div className="mt-4 mb-1 px-2 py-1 bg-[#e6f0ff] border-l-4 border-[#4a6cf7] rounded">
          <p className="m-0 text-[#3a57e8]"><strong>Certificat déjà enregistré dans la base de données</strong></p>
        </div>
      )}
      <div className="[&_p]:my-1">
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
          className="mt-2 inline-block text-primary underline hover:text-primary-dark"
        >
          Voir le PDF dans un nouvel onglet
        </a>
      </div>
      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        className="border border-border rounded overflow-hidden max-w-full shadow"
      >
        <Page pageNumber={1} />
      </Document>
    </div>
  )
}

export default PdfPreview 