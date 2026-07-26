"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { TripCard } from "@/components/features/trip-card";
import {
  EMPTY_TRIP_FILTERS,
  TripFilters,
  type TripFilterValues,
} from "@/components/features/trip-filters";
import type { CarpoolOrderDTO } from "@/lib/types";

function toLocalDateString(iso: string): string {
  const date = new Date(iso);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function matchesFilters(
  trip: CarpoolOrderDTO,
  filters: TripFilterValues
): boolean {
  if (
    filters.departLocation &&
    !trip.departLocation
      .toLowerCase()
      .includes(filters.departLocation.trim().toLowerCase())
  ) {
    return false;
  }
  if (
    filters.destination &&
    !trip.destination
      .toLowerCase()
      .includes(filters.destination.trim().toLowerCase())
  ) {
    return false;
  }
  if (filters.date && toLocalDateString(trip.departTime) !== filters.date) {
    return false;
  }
  const price = Number(trip.totalPrice);
  if (filters.minPrice !== "" && price < Number(filters.minPrice)) {
    return false;
  }
  if (filters.maxPrice !== "" && price > Number(filters.maxPrice)) {
    return false;
  }
  if (
    filters.minSeats !== "" &&
    trip.remainingSeats < Number(filters.minSeats)
  ) {
    return false;
  }
  return true;
}

// Fetches all trips, applies client-side filters and renders the card grid.
export function TripBoard() {
  const t = useTranslations("trip");
  const tCommon = useTranslations("common");
  const [trips, setTrips] = useState<CarpoolOrderDTO[]>([]);
  const [filters, setFilters] = useState<TripFilterValues>(EMPTY_TRIP_FILTERS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadTrips = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await fetch("/api/carpool", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as CarpoolOrderDTO[];
      setTrips(data);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  const handleJoined = useCallback((updated: CarpoolOrderDTO) => {
    setTrips((current) =>
      current.map((trip) => (trip.id === updated.id ? updated : trip))
    );
  }, []);

  const filteredTrips = useMemo(
    () => trips.filter((trip) => matchesFilters(trip, filters)),
    [trips, filters]
  );

  return (
    <div className="space-y-6">
      <TripFilters
        values={filters}
        onChange={setFilters}
        resultCount={filteredTrips.length}
      />

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{tCommon("loading")}</span>
        </div>
      )}

      {!loading && loadError && (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <p>{t("loadError")}</p>
          <Button variant="outline" size="sm" onClick={() => void loadTrips()}>
            {t("retry")}
          </Button>
        </div>
      )}

      {!loading && !loadError && filteredTrips.length === 0 && (
        <p className="py-16 text-center text-muted-foreground">{t("empty")}</p>
      )}

      {!loading && !loadError && filteredTrips.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onJoined={handleJoined} />
          ))}
        </div>
      )}
    </div>
  );
}
