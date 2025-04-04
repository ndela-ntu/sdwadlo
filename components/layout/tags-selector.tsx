"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface ITag {
  id: number;
  name: string;
}

interface TagsSelectorProps {
  availableTags: ITag[];
  selectedTags: ITag[];
  onTagsChange: (tags: ITag[]) => void;
  name?: string; // For form compatibility
  disabled?: boolean;
  placeholder?: string;
  notFoundText?: string;
}

export function TagsSelector({
  availableTags,
  selectedTags = [],
  onTagsChange,
  name,
  disabled = false,
  placeholder = "Select tags...",
  notFoundText = "No tags found.",
}: TagsSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  const handleSelect = (tag: ITag) => {
    const isSelected = selectedTags.some((t) => t.id === tag.id);
    let newSelectedTags: ITag[];

    if (isSelected) {
      newSelectedTags = selectedTags.filter((t) => t.id !== tag.id);
    } else {
      newSelectedTags = [...selectedTags, tag];
    }

    onTagsChange(newSelectedTags);
    setSearchValue("");
  };

  const filteredTags = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className="space-y-2">
      {/* Hidden input for form submission */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={JSON.stringify(selectedTags.map((tag) => tag.id))}
        />
      )}

      {/* Selected tags display */}
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="cursor-pointer hover:bg-secondary/80"
            onClick={() => !disabled && handleSelect(tag)}
          >
            {tag.name}
            <span className="ml-1.5 text-xs">×</span>
          </Badge>
        ))}
      </div>

      {/* Tag selection combobox */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search tags..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandEmpty>{notFoundText}</CommandEmpty>
            <CommandGroup className="max-h-60 overflow-y-auto">
              {filteredTags.map((tag) => {
                const isSelected = selectedTags.some((t) => t.id === tag.id);
                return (
                  <CommandItem
                    key={tag.id}
                    value={tag.id.toString()}
                    onSelect={() => handleSelect(tag)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {tag.name}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}