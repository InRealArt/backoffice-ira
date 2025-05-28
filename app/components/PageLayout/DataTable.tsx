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
              {columns.map((column) => (
                <th 
                  key={column.key}
                  className={`${column.sortable ? 'sortable-column' : ''} ${column.className || ''}`}
                  style={column.width ? { width: column.width } : {}}
                  onClick={column.sortable && onSort ? () => onSort(column.key) : undefined}
                >
                  {column.sortable && sortColumn === column.key ? (
                    <div className="d-flex align-items-center gap-xs">
                      {column.header}
                      <span className="sort-icon">
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    </div>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
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
                
              return (
                <tr 
                  key={key}
                  onClick={() => onRowClick && !isLoading && onRowClick(item)}
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