'use client'

import React from 'react'

export interface Column<T> {
  key: string
  header: React.ReactNode
  render?: (item: T, index: number) => React.ReactNode
  sortable?: boolean
  width?: string
  className?: string
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
  emptyState
}: DataTableProps<T>) {
  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>
  }

  return (
    <div className={`table-container ${className}`}>
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
          {data.map((item, index) => {
            const key = keyExtractor(item)
            const isRowLoading = loadingRowId === key
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
                    {column.render ? column.render(item, index) : (item as any)[column.key]}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable 