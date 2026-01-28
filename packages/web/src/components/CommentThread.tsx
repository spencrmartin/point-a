import { useState } from 'react'
import { useComments, useCreateComment, useUpdateComment, useDeleteComment } from '@/hooks/useComments'
import { useUserStore } from '@/stores/useUserStore'
import { Button } from './ui/button'
import { cn, formatRelativeDate } from '@/lib/utils'
import { MessageSquare, Send, Edit2, Trash2, X, Check } from 'lucide-react'
import type { Comment } from '@point-a/shared'

interface CommentThreadProps {
  issueId: string
}

export function CommentThread({ issueId }: CommentThreadProps) {
  const { data, isLoading } = useComments(issueId)
  const createComment = useCreateComment()
  const updateComment = useUpdateComment()
  const deleteComment = useDeleteComment()
  const { getDisplayName, getUserIdentifier } = useUserStore()
  const userName = getDisplayName()
  const userIdentifier = getUserIdentifier()
  
  const [newComment, setNewComment] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const comments = data?.data || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    await createComment.mutateAsync({
      issueId,
      data: {
        content: newComment.trim(),
        author: userName || undefined,
      },
    })
    setNewComment('')
  }

  const handleEdit = (comment: Comment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editContent.trim()) return

    await updateComment.mutateAsync({
      id: editingId,
      data: { content: editContent.trim() },
    })
    setEditingId(null)
    setEditContent('')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this comment?')) return
    await deleteComment.mutateAsync(id)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <MessageSquare className="h-4 w-4" />
        <span>Comments ({comments.length})</span>
      </div>

      {/* Comment List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-24" />
                    <div className="h-12 bg-muted rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No comments yet. Start the discussion!
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isEditing={editingId === comment.id}
              editContent={editContent}
              onEditContentChange={setEditContent}
              onEdit={() => handleEdit(comment)}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              onDelete={() => handleDelete(comment.id)}
              currentUser={userName}
            />
          ))
        )}
      </div>

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full min-h-[80px] p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSubmit(e)
              }
            }}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Press ⌘+Enter to submit
          </p>
        </div>
        <Button
          type="submit"
          size="icon"
          disabled={!newComment.trim() || createComment.isPending}
          className="h-10 w-10 self-start"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}

function CommentItem({
  comment,
  isEditing,
  editContent,
  onEditContentChange,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  currentUser,
}: {
  comment: Comment
  isEditing: boolean
  editContent: string
  onEditContentChange: (value: string) => void
  onEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: () => void
  currentUser: string | null
}) {
  const isOwner = currentUser && comment.author === currentUser
  const authorInitial = comment.author?.charAt(0).toUpperCase() || '?'

  return (
    <div className="flex items-start gap-3 group">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-medium">{authorInitial}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">
            {comment.author || 'Anonymous'}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatRelativeDate(comment.createdAt)}
          </span>
          {comment.updatedAt !== comment.createdAt && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => onEditContentChange(e.target.value)}
              className="w-full min-h-[60px] p-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={onCancelEdit}>
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={onSaveEdit}>
                <Check className="h-3 w-3 mr-1" />
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <p className="text-sm whitespace-pre-wrap break-words">
              {comment.content}
            </p>
            
            {/* Actions (show on hover) */}
            <div className={cn(
              'absolute -right-2 top-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
              isOwner && 'opacity-100 sm:opacity-0'
            )}>
              {isOwner && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={onEdit}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={onDelete}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
