import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  Json,
  ProductAttributes,
  ProductColor,
} from "@/lib/types/database.types";

interface ProductAttributesDisplayProps {
  attributes: Json;
  className?: string;
}

export function ProductAttributesDisplay({
  attributes,
  className,
}: ProductAttributesDisplayProps) {
  attributes = attributes as ProductAttributes;
  if (!attributes || Object.keys(attributes).length === 0) {
    return <span className="text-muted-foreground text-sm">No attributes</span>;
  }

  const renderColorAttribute = (color: ProductColor) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border border-border"
              style={{ backgroundColor: color.hex }}
            />
            <span className="text-sm">{color.name}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Color: {color.name}</p>
          <p>Hex: {color.hex}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const renderAttribute = (key: string, value: any) => {
    if (
      key === "color" &&
      typeof value === "object" &&
      value.hex &&
      value.name
    ) {
      return renderColorAttribute(value as ProductColor);
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
      );
    }

    return <span className="text-sm">{String(value)}</span>;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {Object.entries(attributes).map(([key, value]) => (
        <div key={key} className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs capitalize">
            {key}
          </Badge>
          {renderAttribute(key, value)}
        </div>
      ))}
    </div>
  );
}

interface ProductAttributesCompactProps {
  attributes?: Json | null;
  maxItems?: number;
}

export function ProductAttributesCompact({
  attributes,
  maxItems = 3,
}: ProductAttributesCompactProps) {
  attributes = attributes as ProductAttributes | null;
  if (!attributes || Object.keys(attributes).length === 0) {
    return null;
  }

  const entries = Object.entries(attributes);
  const visibleEntries = entries.slice(0, maxItems);
  const remainingCount = entries.length - maxItems;

  return (
    <div className="flex flex-wrap gap-1">
      {visibleEntries.map(([key, value]) => {
        if (
          key === "color" &&
          value &&
          typeof value === "object" &&
          (value as ProductAttributes)?.hex &&
          (value as ProductAttributes)?.name
        ) {
          return (
            <TooltipProvider key={key}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                    <div
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: (value as ProductColor).hex }}
                    />
                    <span>{(value as ProductColor).name}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Color: {(value as ProductColor).name}</p>
                  <p>Hex: {(value as ProductColor).hex}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }

        return (
          <Badge key={key} variant="outline" className="text-xs">
            {key}: {Array.isArray(value) ? value.join(", ") : String(value)}
          </Badge>
        );
      })}
      {remainingCount > 0 && (
        <Badge variant="outline" className="text-xs">
          +{remainingCount} more
        </Badge>
      )}
    </div>
  );
}
