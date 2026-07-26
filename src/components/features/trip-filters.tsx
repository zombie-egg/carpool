"use client";

import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface TripFilterValues {
  departLocation: string;
  destination: string;
  date: string;
  minPrice: string;
  maxPrice: string;
  minSeats: string;
}

export const EMPTY_TRIP_FILTERS: TripFilterValues = {
  departLocation: "",
  destination: "",
  date: "",
  minPrice: "",
  maxPrice: "",
  minSeats: "",
};

interface TripFiltersProps {
  values: TripFilterValues;
  onChange: (values: TripFilterValues) => void;
  resultCount: number;
}

// Filter panel for the trip board: location, date, price range, seats.
export function TripFilters({ values, onChange, resultCount }: TripFiltersProps) {
  const t = useTranslations("filters");

  const update = (patch: Partial<TripFilterValues>) =>
    onChange({ ...values, ...patch });

  return (
    <div className="rounded-xl border border-border bg-card/70 p-4 backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          {t("title")}
        </div>
        <span className="text-xs text-muted-foreground">
          {t("results", { count: resultCount })}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="space-y-1.5">
          <Label htmlFor="filter-depart" className="text-foreground/80">
            {t("departLocation")}
          </Label>
          <Input
            id="filter-depart"
            value={values.departLocation}
            placeholder={t("departPlaceholder")}
            onChange={(event) => update({ departLocation: event.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-destination" className="text-foreground/80">
            {t("destination")}
          </Label>
          <Input
            id="filter-destination"
            value={values.destination}
            placeholder={t("destinationPlaceholder")}
            onChange={(event) => update({ destination: event.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-date" className="text-foreground/80">
            {t("date")}
          </Label>
          <Input
            id="filter-date"
            type="date"
            value={values.date}
            onChange={(event) => update({ date: event.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-min-price" className="text-foreground/80">
            {t("minPrice")}
          </Label>
          <Input
            id="filter-min-price"
            type="number"
            min="0"
            value={values.minPrice}
            onChange={(event) => update({ minPrice: event.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-max-price" className="text-foreground/80">
            {t("maxPrice")}
          </Label>
          <Input
            id="filter-max-price"
            type="number"
            min="0"
            value={values.maxPrice}
            onChange={(event) => update({ maxPrice: event.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-min-seats" className="text-foreground/80">
            {t("minSeats")}
          </Label>
          <Input
            id="filter-min-seats"
            type="number"
            min="0"
            value={values.minSeats}
            onChange={(event) => update({ minSeats: event.target.value })}
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(EMPTY_TRIP_FILTERS)}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t("reset")}
        </Button>
      </div>
    </div>
  );
}
