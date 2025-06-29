"use client"

import * as React from "react"
import { X, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface KeywordsInputProps {
  value: string[]
  onChange: (keywords: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function KeywordsInput({
  value = [],
  onChange,
  placeholder = "Add keywords...",
  className,
  disabled = false,
}: KeywordsInputProps) {
  const [inputValue, setInputValue] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  const addKeyword = (keyword: string) => {
    const trimmedKeyword = keyword.trim()
    if (trimmedKeyword && !value.includes(trimmedKeyword)) {
      onChange([...value, trimmedKeyword])
    }
    setInputValue("")
  }

  const removeKeyword = (keywordToRemove: string) => {
    onChange(value.filter((keyword) => keyword !== keywordToRemove))
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addKeyword(inputValue)
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      removeKeyword(value[value.length - 1])
    }
  }

  const handleInputBlur = () => {
    if (inputValue.trim()) {
      addKeyword(inputValue)
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2">
        {value.map((keyword) => (
          <Badge key={keyword} variant="secondary" className="text-sm">
            {keyword}
            {!disabled && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-auto p-0 text-muted-foreground hover:text-foreground"
                onClick={() => removeKeyword(keyword)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </Badge>
        ))}
      </div>
      {!disabled && (
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addKeyword(inputValue)}
            disabled={!inputValue.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">Press Enter or comma to add keywords. Click × to remove.</p>
    </div>
  )
}
