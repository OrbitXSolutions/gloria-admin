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
  language?: "en" | "ar";
  label?: string;
}

export function AttributeInput({
  value = {},
  onChange,
  className,
  language = "en",
  label,
}: AttributeInputProps) {
  const isArabic = language === "ar";
  const attributes = value || {};
  const {
    color: initialColor,
    size: initialSize,
    ...customAttributes
  } = attributes;

  // --- State Management ---
  // For English, color is an object; for Arabic, it's a string
  const [color, setColor] = React.useState<ProductColor | string | null>(
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

    if (isArabic) {
      // For Arabic, color is a simple string
      if (typeof color === "string" && color.trim()) {
        (newAttributes.color as unknown as string) = color.trim();
      } else {
        delete newAttributes.color;
      }
    } else {
      // For English, color is an object
      if (
        color &&
        typeof color === "object" &&
        "name" in color &&
        "hex" in color &&
        color.name &&
        color.hex
      ) {
        newAttributes.color = color;
      } else {
        delete newAttributes.color;
      }
    }

    // Size handling is the same for both languages
    if (size && size.trim()) {
      newAttributes.size = size.trim();
    } else {
      delete newAttributes.size;
    }

    // Avoid infinite loops by comparing stringified versions
    if (JSON.stringify(newAttributes) !== JSON.stringify(attributes)) {
      onChange(newAttributes);
    }
  }, [color, size, customAttributes, onChange, attributes, isArabic]);

  // --- Handlers ---
  const addCustomAttribute = () => {
    if (isNewKeyInvalid || !newValue.trim()) return;

    const key = newKey.trim();
    const value = newValue.trim();

    setNewKey("");
    setNewValue("");
    onChange({
      ...attributes,
      ...customAttributes,
      [key]: value,
    });
  };

  const removeCustomAttribute = (key: string) => {
    const { [key]: removed, ...rest } = customAttributes;
    onChange({
      ...attributes,
      ...rest,
    });
  };

  const handleColorChange = (newColor: Partial<ProductColor> | string) => {
    if (isArabic) {
      setColor(newColor as string);
    } else {
      setColor((prev) => {
        if (typeof newColor === "string") return prev;
        const updated = { ...(prev as ProductColor), ...newColor };
        if (updated.name !== undefined || updated.hex !== undefined) {
          return {
            name: updated.name || "",
            hex: updated.hex || "#000000",
          };
        }
        return null;
      });
    }
  };

  const renderAttributeValue = (value: any) => {
    return <span className="text-sm">{String(value)}</span>;
  };

  // Labels and placeholders based on language
  const labels = {
    title: label || (isArabic ? "خصائص المنتج" : "Product Attributes"),
    primaryAttributes: isArabic ? "الخصائص الأساسية" : "Primary Attributes",
    color: isArabic ? "اللون" : "Color",
    colorName: isArabic ? "اسم اللون" : "Color name",
    colorPlaceholder: isArabic ? "مثال: أزرق غامق" : "e.g., Deep Blue",
    size: isArabic ? "الحجم" : "Size",
    sizePlaceholder: isArabic ? "مثال: متوسط، 42، 250مل" : "e.g., M, 42, 250ml",
    additionalAttributes: isArabic ? "خصائص إضافية" : "Additional Attributes",
    noAdditionalAttributes: isArabic
      ? "لا توجد خصائص إضافية."
      : "No additional attributes.",
    addCustomAttribute: isArabic ? "إضافة خاصية مخصصة" : "Add Custom Attribute",
    attributeName: isArabic ? "اسم الخاصية" : "Attribute Name",
    attributeNamePlaceholder: isArabic
      ? "مثال: العلامة التجارية، المواد"
      : "e.g., brand, material",
    value: isArabic ? "القيمة" : "Value",
    valuePlaceholder: isArabic ? "أدخل القيمة" : "Enter value",
    addAttribute: isArabic ? "إضافة خاصية" : "Add Attribute",
    cannotUseColorSize: isArabic
      ? "لا يمكن استخدام 'color' أو 'size'."
      : "Cannot use 'color' or 'size'.",
    attributeExists: isArabic
      ? "الخاصية موجودة بالفعل."
      : "Attribute already exists.",
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{labels.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* --- Primary Attributes --- */}
        <div className="space-y-4">
          <h4 className="font-medium text-base">{labels.primaryAttributes}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Color Input */}
            <div className="space-y-2">
              <Label>{labels.color}</Label>
              {isArabic ? (
                // For Arabic, just a simple text input for color name
                <Input
                  value={typeof color === "string" ? color : ""}
                  onChange={(e) => handleColorChange(e.target.value)}
                  placeholder={labels.colorPlaceholder}
                  dir="rtl"
                />
              ) : (
                // For English, color picker and name
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    className="p-1 h-10 w-14 rounded-lg cursor-pointer"
                    value={
                      typeof color === "object" && color ? color.hex : "#000000"
                    }
                    onChange={(e) => handleColorChange({ hex: e.target.value })}
                  />
                  <Input
                    className="flex-1"
                    value={typeof color === "object" && color ? color.name : ""}
                    onChange={(e) =>
                      handleColorChange({ name: e.target.value })
                    }
                    placeholder={labels.colorPlaceholder}
                  />
                </div>
              )}
            </div>

            {/* Size Input */}
            <div className="space-y-2">
              <Label htmlFor="attr-size">{labels.size}</Label>
              <Input
                id="attr-size"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder={labels.sizePlaceholder}
                dir={isArabic ? "rtl" : "ltr"}
              />
            </div>
          </div>
        </div>

        {/* --- Additional Attributes --- */}
        <div className="border-t pt-6 space-y-4">
          <h4 className="font-medium text-base">
            {labels.additionalAttributes}
          </h4>

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
                {labels.noAdditionalAttributes}
              </p>
            )}
          </div>

          {/* Add New Custom Attribute */}
          <div className="border-t pt-4 space-y-4">
            <h5 className="font-medium">{labels.addCustomAttribute}</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="attr-key">{labels.attributeName}</Label>
                <Input
                  id="attr-key"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder={labels.attributeNamePlaceholder}
                  dir={isArabic ? "rtl" : "ltr"}
                />
                {newKey.trim() &&
                  (newKey.toLowerCase() === "color" ||
                    newKey.toLowerCase() === "size") && (
                    <p className="text-sm text-destructive">
                      {labels.cannotUseColorSize}
                    </p>
                  )}
                {newKey.trim() && customAttributes[newKey.trim()] && (
                  <p className="text-sm text-destructive">
                    {labels.attributeExists}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="attr-value">{labels.value}</Label>
                <Input
                  id="attr-value"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={labels.valuePlaceholder}
                  dir={isArabic ? "rtl" : "ltr"}
                />
              </div>
            </div>
            <Button
              type="button"
              onClick={addCustomAttribute}
              disabled={isNewKeyInvalid || !newValue.trim()}
              className="w-full sm:w-auto"
            >
              <Plus className={isArabic ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
              {labels.addAttribute}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
