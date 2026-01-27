import {
  Folder,
  Rocket,
  Lightbulb,
  Target,
  Zap,
  Wrench,
  Package,
  Palette,
  BarChart3,
  FlaskConical,
  Code,
  Globe,
  Heart,
  Star,
  Shield,
  Users,
  Calendar,
  BookOpen,
  Briefcase,
  Coffee,
  type LucideIcon,
} from 'lucide-react'

export interface ProjectIconConfig {
  id: string
  icon: LucideIcon
  label: string
}

export const PROJECT_ICONS: ProjectIconConfig[] = [
  { id: 'folder', icon: Folder, label: 'Folder' },
  { id: 'rocket', icon: Rocket, label: 'Rocket' },
  { id: 'lightbulb', icon: Lightbulb, label: 'Lightbulb' },
  { id: 'target', icon: Target, label: 'Target' },
  { id: 'zap', icon: Zap, label: 'Zap' },
  { id: 'wrench', icon: Wrench, label: 'Wrench' },
  { id: 'package', icon: Package, label: 'Package' },
  { id: 'palette', icon: Palette, label: 'Palette' },
  { id: 'chart', icon: BarChart3, label: 'Chart' },
  { id: 'flask', icon: FlaskConical, label: 'Flask' },
  { id: 'code', icon: Code, label: 'Code' },
  { id: 'globe', icon: Globe, label: 'Globe' },
  { id: 'heart', icon: Heart, label: 'Heart' },
  { id: 'star', icon: Star, label: 'Star' },
  { id: 'shield', icon: Shield, label: 'Shield' },
  { id: 'users', icon: Users, label: 'Users' },
  { id: 'calendar', icon: Calendar, label: 'Calendar' },
  { id: 'book', icon: BookOpen, label: 'Book' },
  { id: 'briefcase', icon: Briefcase, label: 'Briefcase' },
  { id: 'coffee', icon: Coffee, label: 'Coffee' },
]

export const PROJECT_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
]

export function getProjectIcon(iconId: string | null | undefined): LucideIcon {
  const found = PROJECT_ICONS.find((i) => i.id === iconId)
  return found?.icon || Folder
}

export function getRandomProjectIcon(): string {
  return PROJECT_ICONS[Math.floor(Math.random() * PROJECT_ICONS.length)].id
}

export function getRandomProjectColor(): string {
  return PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)]
}

// Component to render a project icon
export function ProjectIcon({ 
  iconId, 
  className,
  size = 16,
}: { 
  iconId: string | null | undefined
  className?: string
  size?: number
}) {
  const Icon = getProjectIcon(iconId)
  return <Icon className={className} size={size} />
}
