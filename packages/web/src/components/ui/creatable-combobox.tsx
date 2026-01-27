import * as React from 'react'
import { Check, ChevronsUpDown, Plus, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from './command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover'

export interface ComboboxOption {
  value: string
  label: string
  icon?: string
  iconComponent?: LucideIcon
  color?: string
}

interface CreatableComboboxProps {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  onCreateNew?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  createText?: string
  allowCreate?: boolean
  className?: string
  disabled?: boolean
}

export function CreatableCombobox({
  options,
  value,
  onChange,
  onCreateNew,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyText = 'No results found.',
  createText = 'Create',
  allowCreate = true,
  className,
  disabled = false,
}: CreatableComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')

  const selectedOption = options.find((opt) => opt.value === value)

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  )

  const showCreateOption =
    allowCreate &&
    onCreateNew &&
    search.trim() &&
    !options.some((opt) => opt.label.toLowerCase() === search.toLowerCase())

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue)
    setOpen(false)
    setSearch('')
  }

  const handleCreate = () => {
    if (onCreateNew && search.trim()) {
      onCreateNew(search.trim())
      setSearch('')
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('justify-between font-normal', className)}
          disabled={disabled}
        >
          {selectedOption ? (
            <span className="flex items-center gap-2 truncate">
              {selectedOption.iconComponent && (
                <selectedOption.iconComponent className="h-4 w-4" style={selectedOption.color ? { color: selectedOption.color } : undefined} />
              )}
              {selectedOption.icon && !selectedOption.iconComponent && <span>{selectedOption.icon}</span>}
              {selectedOption.color && !selectedOption.iconComponent && (
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedOption.color }}
                />
              )}
              <span className="truncate">{selectedOption.label}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === option.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {option.iconComponent && (
                    <option.iconComponent className="mr-2 h-4 w-4" style={option.color ? { color: option.color } : undefined} />
                  )}
                  {option.icon && !option.iconComponent && <span className="mr-2">{option.icon}</span>}
                  {option.color && !option.iconComponent && (
                    <span
                      className="mr-2 w-3 h-3 rounded-full"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  <span className="truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {showCreateOption && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem onSelect={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    {createText} "{search}"
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
