// Squelette de page affiché pendant le chargement serveur d'une route (loading.tsx).
// Même silhouette qu'une page liste : titre, panneau de filtre, tableau.

interface PageSkeletonProps {
  rows?: number
  columns?: number
}

export default function PageSkeleton({ rows = 6, columns = 4 }: PageSkeletonProps) {
  return (
    <div className="skeleton-page" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Chargement…</span>
      <div className="skeleton-line skeleton-title" aria-hidden="true" />
      <div className="skeleton-card" aria-hidden="true">
        <div className="skeleton-line skeleton-input" />
      </div>
      <div className="skeleton-table" aria-hidden="true">
        {Array.from({ length: rows }).map((_, row) => (
          <div className="skeleton-row" key={row}>
            {Array.from({ length: columns }).map((_, col) => (
              <span className="skeleton-line" key={col} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
