"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type {
  ProductAttributes,
  ProductColor,
} from "@/lib/types/database.types";

interface AttributeInputProps {
  value: ProductAttributes | null;
  onChange: (attributes: ProductAttributes) => void;
  className?: string;
}

export function AttributeInput({
  value = {},
  onChange,
  className,
}: AttributeInputProps) {
  const attributes = value || {};
  const {
    color: initialColor,
    size: initialSize,
    ...customAttributes
  } = attributes;

  // --- State Management ---
  const [color, setColor] = React.useState<ProductColor | null>(
    initialColor || null
  );
  const [size, setSize] = React.useState<string>(
    typeof initialSize === "string" ? initialSize : ""
  );

  const [newKey, setNewKey] = React.useState("");
  const [newValue, setNewValue] = React.useState("");

  // --- Derived State ---
  const isNewKeyInvalid =
    !newKey.trim() ||
    newKey.trim().toLowerCase() === "color" ||
    newKey.trim().toLowerCase() === "size" ||
    !!customAttributes[newKey.trim()];

  // --- Effect to sync parent state ---
  React.useEffect(() => {
    const newAttributes: ProductAttributes = { ...customAttributes };

    // Only include color if it's a complete object
    if (color && color.name && color.hex) {
      newAttributes.color = color;
    } else {
      // Ensure color is not partially present
      delete newAttributes.color;
    }

    // Only include size if it's not empty
    if (size && size.trim()) {
      newAttributes.size = size.trim();
    } else {
      delete newAttributes.size;
    }

    // Avoid infinite loops by comparing stringified versions
    if (JSON.stringify(newAttributes) !== JSON.stringify(attributes)) {
      onChange(newAttributes);
    }
  }, [color, size, customAttributes, onChange, attributes]);

  // --- Handlers ---
  const addCustomAttribute = () => {
    if (isNewKeyInvalid || !newValue.trim()) return;

    const key = newKey.trim();
    const value = newValue.trim();

    // The useEffect hook will handle the onChange call
    setNewKey("");
    setNewValue("");
    // Trigger the effect by updating custom attributes
    onChange({
      ...attributes,
      ...customAttributes,
      [key]: value,
    });
  };

  const removeCustomAttribute = (key: string) => {
    const { [key]: removed, ...rest } = customAttributes;
    // The useEffect hook will handle the onChange call
    onChange({
      ...attributes,
      ...rest,
    });
  };

  const handleColorChange = (newColor: Partial<ProductColor>) => {
    setColor((prev) => {
      const updated = { ...prev, ...newColor };
      // Ensure we always have a valid structure if either field is set
      if (updated.name !== undefined || updated.hex !== undefined) {
        return {
          name: updated.name || "",
          hex: updated.hex || "#000000",
        };
      }
      return null; // Or handle as needed
    });
  };

  const renderAttributeValue = (value: any) => {
    return <span className="text-sm">{String(value)}</span>;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Product Attributes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* --- Primary Attributes --- */}
        <div className="space-y-4">
          <h4 className="font-medium text-base">Primary Attributes</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Color Input */}
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  className="p-1 h-10 w-14 rounded-lg cursor-pointer"
                  value={color?.hex || "#000000"}
                  onChange={(e) => handleColorChange({ hex: e.target.value })}
                />
                <Input
                  className="flex-1"
                  value={color?.name || ""}
                  onChange={(e) => handleColorChange({ name: e.target.value })}
                  placeholder="Color name (e.g., Deep Blue)"
                />
              </div>
            </div>

            {/* Size Input */}
            <div className="space-y-2">
              <Label htmlFor="attr-size">Size</Label>
              <Input
                id="attr-size"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="e.g., M, 42, 250ml"
              />
            </div>
          </div>
        </div>

        {/* --- Additional Attributes --- */}
        <div className="border-t pt-6 space-y-4">
          <h4 className="font-medium text-base">Additional Attributes</h4>

          {/* Existing Custom Attributes */}
          <div className="space-y-3">
            {Object.entries(customAttributes).length > 0 ? (
              Object.entries(customAttributes).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs capitalize">
                      {key}
                    </Badge>
                    {renderAttributeValue(value)}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCustomAttribute(key)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No additional attributes.
              </p>
            )}
          </div>

          {/* Add New Custom Attribute */}
          <div className="border-t pt-4 space-y-4">
            <h5 className="font-medium">Add Custom Attribute</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="attr-key">Attribute Name</Label>
                <Input
                  id="attr-key"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="e.g., brand, material"
                />
                {newKey.trim() &&
                  (newKey.toLowerCase() === "color" ||
                    newKey.toLowerCase() === "size") && (
                    <p className="text-sm text-destructive">
                      Cannot use 'color' or 'size'.
                    </p>
                  )}
                {newKey.trim() && customAttributes[newKey.trim()] && (
                  <p className="text-sm text-destructive">
                    Attribute already exists.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="attr-value">Value</Label>
                <Input
                  id="attr-value"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Enter value"
                />
              </div>
            </div>
            <Button
              type="button"
              onClick={addCustomAttribute}
              disabled={isNewKeyInvalid || !newValue.trim()}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Attribute
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
