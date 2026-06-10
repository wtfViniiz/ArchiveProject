"use client";

import { useState, useRef, useEffect } from "react";

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface TagSelectorProps {
  tags: Tag[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function TagSelector({ tags, selected, onChange }: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedTags = tags.filter((tag) => selected.includes(tag.id));

  const toggleTag = (tagId: string) => {
    if (selected.includes(tagId)) {
      onChange(selected.filter((id) => id !== tagId));
    } else {
      onChange([...selected, tagId]);
    }
  };

  const removeTag = (tagId: string) => {
    onChange(selected.filter((id) => id !== tagId));
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedTags.map((tag) => (
            <span
              key={tag.id}
              className="font-mono inline-flex items-center gap-1 rounded bg-primary/20 px-2 py-1 text-xs text-primary"
            >
              #{tag.name}
              <button
                type="button"
                onClick={() => removeTag(tag.id)}
                className="hover:text-primary/80"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Selector button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="font-mono flex items-center justify-between w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-left focus:border-primary focus:outline-none"
      >
        <span className={selectedTags.length === 0 ? "text-muted-foreground" : "text-foreground"}>
          {selectedTags.length === 0
            ? "Selecione as tags..."
            : `${selectedTags.length} tag(s) selecionada(s)`}
        </span>
        <ChevronDownIcon className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-card shadow-lg">
          {/* Search */}
          <div className="p-2 border-b border-border">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar tags..."
              className="font-mono w-full rounded border border-border bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          {/* Tags list */}
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredTags.length === 0 ? (
              <p className="font-mono text-xs text-muted-foreground text-center py-4">
                Nenhuma tag encontrada
              </p>
            ) : (
              filteredTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className="flex items-center justify-between w-full rounded px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                  <span className="font-mono text-foreground">#{tag.name}</span>
                  {selected.includes(tag.id) && (
                    <CheckIcon className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
