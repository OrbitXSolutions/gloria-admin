"use client"

import * as React from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { ProductAttributes, ProductColor } from "@/lib/types/database.types"

interface AttributeInputProps {
  value: ProductAttributes | null
  onChange: (attributes: ProductAttributes) => void
  className?: string
}

type AttributeType = "text" | "number" | "color" | "list"

export function AttributeInput({ value = {}, onChange, className }: AttributeInputProps) {
  const [newKey, setNewKey] = React.useState("")
  const [newValue, setNewValue] = React.useState("")
  const [newType, setNewType] = React.useState<AttributeType>("text")
  const [colorHex, setColorHex] = React.useState("#000000")
  const [colorName, setColorName] = React.useState("")
  const [listItems, setListItems] = React.useState<string[]>([])
  const [listInput, setListInput] = React.useState("")

  const attributes = value || {}

  const addAttribute = () => {
    if (!newKey.trim()) return

    let attributeValue: any = newValue

    switch (newType) {
      case "number":
        attributeValue = Number.parseFloat(newValue) || 0
        break
      case "color":
        if (!colorName.trim()) return
        attributeValue = { hex: colorHex, name: colorName.trim() }
        break
      case "list":
        attributeValue = listItems.filter((item) => item.trim())
        break
      default:
        attributeValue = newValue.trim()
    }

    onChange({
      ...attributes,
      [newKey.trim()]: attributeValue,
    })

    // Reset form
    setNewKey("")
    setNewValue("")
    setNewType("text")
    setColorHex("#000000")
    setColorName("")
    setListItems([])
    setListInput("")
  }

  const removeAttribute = (key: string) => {
    const { [key]: removed, ...rest } = attributes
    onChange(rest)
  }

  const addListItem = () => {
    if (listInput.trim() && !listItems.includes(listInput.trim())) {
      setListItems([...listItems, listInput.trim()])
      setListInput("")
    }
  }

  const removeListItem = (index: number) => {
    setListItems(listItems.filter((_, i) => i !== index))
  }

  const renderAttributeValue = (key: string, value: any) => {
    if (key === "color" && typeof value === "object" && value.hex && value.name) {
      const color = value as ProductColor
      return (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: color.hex }} />
          <span>{color.name}</span>
          <Badge variant="outline" className="text-xs">
            {color.hex}
          </Badge>
        </div>
      )
    }

    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {String(item)}
            </Badge>
          ))}
        </div>
      )
    }

    return <span className="text-sm">{String(value)}</span>
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Product Attributes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Attributes */}
        <div className="space-y-3">
          {Object.entries(attributes).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs capitalize">
                    {key}
                  </Badge>
                  {renderAttributeValue(key, value)}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeAttribute(key)}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add New Attribute */}
        <div className="border-t pt-4 space-y-4">
          <h4 className="font-medium">Add New Attribute</h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="attr-key">Attribute Name</Label>
              <Input
                id="attr-key"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="e.g., size, brand, volume"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attr-type">Type</Label>
              <RadioGroup 
                value={newType} 
                onValueChange={(value: AttributeType) => setNewType(value)}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="text" id="type-text" />
                  <Label htmlFor="type-text" className="cursor-pointer">Text</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="number" id="type-number" />
                  <Label htmlFor="type-number" className="cursor-pointer">Number</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="color" id="type-color" />
                  <Label htmlFor="type-color" className="cursor-pointer">Color</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="list" id="type-list" />
                  <Label htmlFor="type-list" className="cursor-pointer">List</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Value Input Based on Type */}
          <div className="space-y-2">
            <Label>Value</Label>
            {newType === "text" && (
              <Input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="Enter text value" />
            )}
            {newType === "number" && (
              <Input
                type="number"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Enter number value"
              />
            )}
            {newType === "color" && (
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-20 p-2">
                      <div className="w-full h-6 rounded" style={{ backgroundColor: colorHex }} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="space-y-2">
                      <Label>Color Picker</Label>
                      <Input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} />
                      <Input value={colorHex} onChange={(e) => setColorHex(e.target.value)} placeholder="#000000" />
                    </div>
                  </PopoverContent>
                </Popover>
                <Input
                  className="flex-1"
                  value={colorName}
                  onChange={(e) => setColorName(e.target.value)}
                  placeholder="Color name (e.g., Deep Blue)"
                />
              </div>
            )}
            {newType === "list" && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={listInput}
                    onChange={(e) => setListInput(e.target.value)}
                    placeholder="Add list item"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addListItem()
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addListItem}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {listItems.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {listItems.map((item, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {item}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-auto p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => removeListItem(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            type="button"
            onClick={addAttribute}
            disabled={!newKey.trim() || (newType === "color" && !colorName.trim())}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Attribute
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
