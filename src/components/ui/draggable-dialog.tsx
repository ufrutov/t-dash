'use client'

import { useEffect, useState, type ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type DraggableDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  title?: ReactNode
  description?: ReactNode
}

export function DraggableDialog({
  open,
  onOpenChange,
  children,
  title,
  description,
}: DraggableDialogProps) {
  const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.dialog-drag-handle')) {
      setIsDragging(true)
      setDragOffset({
        x: e.clientX - dialogPosition.x,
        y: e.clientY - dialogPosition.y,
      })
    }
  }

  // Handle drag move
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      setDialogPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset])

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!state) {
          setDialogPosition({ x: 0, y: 0 })
        }
        onOpenChange(state)
      }}
    >
      <DialogContent
        className='sm:max-w-lg'
        style={{
          transform: `translate(${dialogPosition.x}px, ${dialogPosition.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
        onMouseDown={handleMouseDown}
      >
        {(title || description) && (
          <DialogHeader className='dialog-drag-handle cursor-grab text-start select-none active:cursor-grabbing'>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  )
}

export {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
