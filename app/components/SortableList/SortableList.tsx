'use client'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useState } from 'react'
import styles from './SortableList.module.scss'

export interface SortableItem {
  id: number | string
  [key: string]: any
}

interface SortableListProps<T extends SortableItem> {
  items: T[]
  onReorder: (reorderedItems: T[]) => Promise<void>
  renderItem: (item: T, index: number, isDragging: boolean) => React.ReactNode
  disabled?: boolean
  className?: string
  emptyMessage?: string
}

export default function SortableList<T extends SortableItem>({
  items,
  onReorder,
  renderItem,
  disabled = false,
  className = '',
  emptyMessage = 'Aucun élément à afficher',
}: SortableListProps<T>) {
  const [activeId, setActiveId] = useState<string | number | null>(null)
  const [isReordering, setIsReordering] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Délai de 8px avant activation du drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    if (disabled) return
    setActiveId(event.active.id)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id || disabled) {
      setActiveId(null)
      return
    }

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedItems = arrayMove(items, oldIndex, newIndex)
      setIsReordering(true)

      try {
        await onReorder(reorderedItems)
      } catch (error) {
        console.error('Erreur lors du réordonnancement:', error)
      } finally {
        setIsReordering(false)
        setActiveId(null)
      }
    } else {
      setActiveId(null)
    }
  }

  if (items.length === 0) {
    return (
      <div className={`${styles.emptyState} ${className}`}>
        <p>{emptyMessage}</p>
      </div>
    )
  }

  const activeItem = activeId
    ? items.find((item) => item.id === activeId)
    : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={`${styles.sortableList} ${className}`}>
          {items.map((item, index) => (
            <div key={item.id}>
              {renderItem(
                item,
                index,
                activeId === item.id && !isReordering
              )}
            </div>
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeItem ? (
          <div className={styles.dragOverlay}>
            {renderItem(activeItem, -1, true)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}










