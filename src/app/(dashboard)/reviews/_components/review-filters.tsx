"use client";

import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { FILTER_TABS } from "../_lib/helpers";

interface ReviewFiltersProps {
  status: string;
  locationId: string;
  search: string;
  locations: { id: string; name: string }[];
  onStatusChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onSearchChange: (value: string) => void;
}

export function ReviewFilters({
  status,
  locationId,
  search,
  locations,
  onStatusChange,
  onLocationChange,
  onSearchChange,
}: ReviewFiltersProps) {
  const handleSearchInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(e.target.value);
    },
    [onSearchChange]
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search reviews…"
          value={search}
          onChange={handleSearchInput}
          className="pl-8"
        />
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filter reviews by status">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onStatusChange(tab.value)}
            role="tab"
            aria-selected={status === tab.value}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              status === tab.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Location filter */}
      {locations.length > 1 && (
        <Select
          value={locationId}
          onValueChange={(val) => onLocationChange(val ?? "all")}
        >
          <SelectTrigger className="w-[160px]" size="sm">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={loc.id}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
