import { useState, useRef, useEffect } from 'react'
import { 
  useChecklist, 
  useCreateChecklistItem, 
  useToggleChecklistItem, 
  useUpdateChecklistItem,
  useDeleteChecklistItem 
} from '@/hooks/useChecklist'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import { 
  CheckSquare, 
  Square, 
  Plus, 
  Trash2, 
  GripVertical,
  Pencil,
  X,
  Check,
} from 'lucide-react'
import type { ChecklistItem } from '@point-a/shared'

interface ChecklistSectionProps {
  issueId: string
}

export function ChecklistSection({ issueId }: ChecklistSectionProps) {
  const { data: checklistData, isLoading } = useChecklist(issueId)
  const createItem = useCreateChecklistItem()
  const toggleItem = useToggleChecklistItem()
  const updateItem = useUpdateChecklistItem()
  const deleteItem = useDeleteChecklistItem()

  const [newItemTitle, setNewItemTitle] = useState('')
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  const items = checklistData?.data || []
  const completedCount = items.filter(i => i.completed).length
  const totalCount = items.length
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  // Focus input when adding new item
  useEffect(() => {
    if (isAddingItem && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isAddingItem])

  // Focus edit input when editing
  useEffect(() => {
    if (editingItemId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingItemId])

  const handleAddItem = async () => {
    if (!newItemTitle.trim()) return

    await createItem.mutateAsync({
      issueId,
      data: { title: newItemTitle.trim() },
    })
    setNewItemTitle('')
    // Keep input focused for rapid entry
    inputRef.current?.focus()
  }

  const handleToggle = async (item: ChecklistItem) => {
    await toggleItem.mutateAsync({ id: item.id, issueId })
  }

  const handleStartEdit = (item: ChecklistItem) => {
    setEditingItemId(item.id)
    setEditingTitle(item.title)
  }

  const handleSaveEdit = async () => {
    if (!editingItemId || !editingTitle.trim()) {
      setEditingItemId(null)
      return
    }

    await updateItem.mutateAsync({
      id: editingItemId,
      issueId,
      data: { title: editingTitle.trim() },
    })
    setEditingItemId(null)
    setEditingTitle('')
  }

  const handleCancelEdit = () => {
    setEditingItemId(null)
    setEditingTitle('')
  }

  const handleDelete = async (item: ChecklistItem) => {
    await deleteItem.mutateAsync({ id: item.id, issueId })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddItem()
    } else if (e.key === 'Escape') {
      setIsAddingItem(false)
      setNewItemTitle('')
    }
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  return (
    <div className="space-y-3">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Checklist</span>
          {totalCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {completedCount}/{totalCount}
            </span>
          )}
        </div>
        {!isAddingItem && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAddingItem(true)}
            className="h-7 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add item
          </Button>
        )}
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Checklist items */}
      {isLoading ? (
        <div className="py-4 text-center text-sm text-muted-foreground">
          Loading...
        </div>
      ) : items.length === 0 && !isAddingItem ? (
        <div 
          className="py-4 text-center text-sm text-muted-foreground cursor-pointer hover:text-foreground"
          onClick={() => setIsAddingItem(true)}
        >
          No checklist items. Click to add one.
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                'group flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors',
                item.completed && 'opacity-60'
              )}
            >
              {/* Drag handle (visual only for now) */}
              <GripVertical className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 cursor-grab" />
              
              {/* Checkbox */}
              <button
                onClick={() => handleToggle(item)}
                className="flex-shrink-0 text-muted-foreground hover:text-foreground"
              >
                {item.completed ? (
                  <CheckSquare className="h-4 w-4 text-green-500" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </button>

              {/* Title or edit input */}
              {editingItemId === item.id ? (
                <div className="flex-1 flex items-center gap-1">
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    className="flex-1 text-sm bg-transparent border-none outline-none"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleSaveEdit}
                  >
                    <Check className="h-3 w-3 text-green-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleCancelEdit}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <span 
                    className={cn(
                      'flex-1 text-sm cursor-pointer',
                      item.completed && 'line-through'
                    )}
                    onClick={() => handleStartEdit(item)}
                  >
                    {item.title}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleStartEdit(item)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-red-500"
                      onClick={() => handleDelete(item)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add new item input */}
      {isAddingItem && (
        <div className="flex items-center gap-2 p-2 border rounded-md bg-background">
          <Square className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a checklist item..."
            className="flex-1 text-sm bg-transparent border-none outline-none"
          />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleAddItem}
              disabled={!newItemTitle.trim() || createItem.isPending}
            >
              <Check className="h-3 w-3 text-green-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                setIsAddingItem(false)
                setNewItemTitle('')
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
