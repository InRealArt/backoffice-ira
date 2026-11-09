'use client'

import React from 'react'
import Pagination from './Pagination'

export interface Column<T> {
  key: string
  header: React.ReactNode
  render?: (item: T, index: number) => React.ReactNode
  sortable?: boolean
  width?: string
  className?: string
}

interface PaginationConfig {
  enabled: boolean
  currentPage: number
  itemsPerPage: number
  totalItems: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (itemsPerPage: number) => void
  showItemsPerPage?: boolean
  itemsPerPageOptions?: number[]
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (item: T) => string | number
  onRowClick?: (item: T) => void
  isLoading?: boolean
  loadingRowId?: string | number | null
  className?: string
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
  onSort?: (column: string) => void
  emptyState?: React.ReactNode
  pagination?: PaginationConfig
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  isLoading = false,
  loadingRowId = null,
  className = '',
  sortColumn,
  sortDirection,
  onSort,
  emptyState,
  pagination
}: DataTableProps<T>) {
  // Calculer les données paginées si la pagination est activée
  const paginatedData = React.useMemo(() => {
    if (!pagination?.enabled) {
      return data
    }
    
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage
    const endIndex = startIndex + pagination.itemsPerPage
    return data.slice(startIndex, endIndex)
  }, [data, pagination])

  const totalPages = pagination?.enabled 
    ? Math.ceil(pagination.totalItems / pagination.itemsPerPage)
    : 1

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>
  }

  return (
    <div className={`data-table-wrapper ${className}`}>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => {
                const isSortable = !!column.sortable && !!onSort
                const isSorted = !!column.sortable && sortColumn === column.key
                const ariaSort: React.AriaAttributes['aria-sort'] = isSorted
                  ? sortDirection === 'asc' ? 'ascending' : 'descending'
                  : column.sortable ? 'none' : undefined

                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={ariaSort}
                    className={`${column.sortable ? 'sortable-column' : ''} ${column.className || ''}`}
                    style={column.width ? { width: column.width } : {}}
                    onClick={isSortable ? () => onSort(column.key) : undefined}
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        className="sortable-header-button"
                        onClick={(e) => {
                          // Évite le double déclenchement avec le onClick du <th>
                          e.stopPropagation()
                          onSort(column.key)
                        }}
                      >
                        {column.header}
                        {isSorted && (
                          <span className="sort-icon" aria-hidden="true">
                            {sortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, index) => {
              const key = keyExtractor(item)
              const isRowLoading = loadingRowId === key
              // Calculer l'index global pour la pagination
              const globalIndex = pagination?.enabled 
                ? (pagination.currentPage - 1) * pagination.itemsPerPage + index
                : index
                
              const handleRowClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
                // Ne pas déclencher onRowClick si le clic vient d'un élément interactif
                const target = e.target as HTMLElement
                const isInteractiveElement = 
                  target.tagName === 'BUTTON' ||
                  target.tagName === 'A' ||
                  target.closest('button') !== null ||
                  target.closest('a') !== null ||
                  target.closest('[role="button"]') !== null
                
                if (!isInteractiveElement && onRowClick && !isLoading) {
                  onRowClick(item)
                }
              }

              const handleRowKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
                // Seulement si la ligne elle-même a le focus (pas un bouton/lien/champ enfant)
                if (e.target !== e.currentTarget) return
                if ((e.key === 'Enter' || e.key === ' ') && onRowClick && !isLoading) {
                  e.preventDefault()
                  onRowClick(item)
                }
              }

              return (
                <tr
                  key={key}
                  onClick={handleRowClick}
                  onKeyDown={onRowClick ? handleRowKeyDown : undefined}
                  tabIndex={onRowClick && !isLoading ? 0 : undefined}
                  aria-busy={isRowLoading || undefined}
                  className={`
                    ${onRowClick ? 'clickable-row' : ''}
                    ${isRowLoading ? 'loading-row' : ''}
                    ${isLoading && !isRowLoading ? 'disabled-row' : ''}
                  `}
                >
                  {columns.map((column) => (
                    <td key={`${key}-${column.key}`}>
                      {column.render ? column.render(item, globalIndex) : (item as any)[column.key]}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {pagination?.enabled && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={totalPages}
          onPageChange={pagination.onPageChange}
          itemsPerPage={pagination.itemsPerPage}
          totalItems={pagination.totalItems}
          onItemsPerPageChange={pagination.onItemsPerPageChange}
          showItemsPerPage={pagination.showItemsPerPage}
          itemsPerPageOptions={pagination.itemsPerPageOptions}
        />
      )}
    </div>
  )
}

export default DataTable 