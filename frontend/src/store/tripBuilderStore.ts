import { create } from 'zustand';
import { Trip, TripSection, SectionType, City, Activity, Stop } from '../types';
import { tripsApi } from '../api/trips';
import { sectionsApi } from '../api/sections';
import { stopsApi } from '../api/stops';
import { itineraryApi } from '../api/itinerary';
import { flattenSections } from '../api/mappers';
import { validateStopDates } from '../utils/validation';

interface SectionDraft extends TripSection {
  isNew?: boolean;
}

interface TripBuilderState {
  trip: Trip | null;
  selectedCity: City | null;
  sections: SectionDraft[];
  isLoading: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: string | null;
  error: string | null;

  loadTrip: (tripId: number | string) => Promise<void>;
  setSelectedCity: (city: City | null) => void;
  addStop: (cityId: number) => Promise<void>;
  updateStop: (stopId: number, updates: Partial<Stop>) => Promise<void>;
  removeStop: (stopId: number) => Promise<void>;
  reorderStop: (stopId: number, direction: 'up' | 'down') => Promise<void>;
  assignActivityToStop: (stopId: number, activity: Activity) => void;
  addSection: (type?: SectionType, stopId?: number) => void;
  updateSection: (index: number, updates: Partial<SectionDraft>) => void;
  removeSection: (index: number) => Promise<void>;
  saveSectionImmediate: (index: number) => Promise<void>;
  saveAllSections: () => Promise<boolean>;
  resetBuilder: () => void;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let stopDebounceTimer: ReturnType<typeof setTimeout> | null = null;

function sortedStops(stops: Stop[] = []): Stop[] {
  return [...stops].sort((a, b) => a.order_index - b.order_index);
}

export const useTripBuilderStore = create<TripBuilderState>((set, get) => ({
  trip: null,
  selectedCity: null,
  sections: [],
  isLoading: false,
  saveStatus: 'idle',
  lastSavedAt: null,
  error: null,

  loadTrip: async (tripId) => {
    set({ isLoading: true, error: null });
    try {
      const [trip, stops, itinerary] = await Promise.all([
        tripsApi.getTrip(tripId),
        stopsApi.getStops(tripId),
        itineraryApi.getItinerary(tripId),
      ]);
      const sections = flattenSections(itinerary.days);
      set({
        trip: { ...trip, stops: sortedStops(stops) },
        sections,
        isLoading: false,
        saveStatus: sections.length > 0 ? 'saved' : 'idle',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load trip';
      set({ error: message, isLoading: false });
    }
  },

  setSelectedCity: (city) => {
    set({ selectedCity: city });
  },

  addStop: async (cityId) => {
    const { trip } = get();
    if (!trip) return;

    const stops = sortedStops(trip.stops);
    const order_index = stops.length + 1;
    const defaultStart = trip.start_date;
    const defaultEnd = trip.end_date;

    set({ saveStatus: 'saving' });
    try {
      const created = await stopsApi.createStop(trip.id, {
        city_id: cityId,
        arrival_date: defaultStart,
        departure_date: defaultEnd,
        order_index,
      });
      set({
        trip: { ...trip, stops: [...stops, created] },
        saveStatus: 'saved',
        lastSavedAt: new Date().toLocaleTimeString(),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add stop';
      set({ saveStatus: 'error', error: message });
    }
  },

  updateStop: async (stopId, updates) => {
    const { trip } = get();
    if (!trip) return;

    const current = sortedStops(trip.stops).find((s) => s.id === stopId);
    if (!current) return;

    const merged = { ...current, ...updates };
    const dateError = validateStopDates(
      merged.arrival_date || '',
      merged.departure_date || '',
      trip.start_date,
      trip.end_date
    );
    if (dateError) {
      set({ saveStatus: 'error', error: dateError });
      return;
    }

    const stops = sortedStops(trip.stops).map((stop) =>
      stop.id === stopId ? merged : stop
    );
    set({ trip: { ...trip, stops }, saveStatus: 'saving', error: null });

    if (stopDebounceTimer) clearTimeout(stopDebounceTimer);
    stopDebounceTimer = setTimeout(async () => {
      try {
        await stopsApi.updateStop(trip.id, stopId, updates);
        set({
          saveStatus: 'saved',
          lastSavedAt: new Date().toLocaleTimeString(),
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to update stop';
        set({ saveStatus: 'error', error: message });
      }
    }, 800);
  },

  removeStop: async (stopId) => {
    const { trip, sections } = get();
    if (!trip) return;

    const stops = sortedStops(trip.stops).filter((stop) => stop.id !== stopId);
    set({
      trip: { ...trip, stops },
      sections: sections.filter((section) => section.stop_id !== stopId),
    });

    try {
      await stopsApi.deleteStop(trip.id, stopId);
    } catch (err) {
      console.warn('Failed to delete stop from backend:', err);
    }
  },

  reorderStop: async (stopId, direction) => {
    const { trip } = get();
    if (!trip?.stops?.length) return;

    const stops = sortedStops(trip.stops);
    const currentIndex = stops.findIndex((stop) => stop.id === stopId);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= stops.length) return;

    const reordered = [...stops];
    [reordered[currentIndex], reordered[targetIndex]] = [
      reordered[targetIndex],
      reordered[currentIndex],
    ];
    const normalized = reordered.map((stop, idx) => ({ ...stop, order_index: idx + 1 }));

    set({ trip: { ...trip, stops: normalized }, saveStatus: 'saving' });
    try {
      await Promise.all(
        normalized.map((stop) =>
          stopsApi.updateStop(trip.id, stop.id, { order_index: stop.order_index })
        )
      );
      set({
        saveStatus: 'saved',
        lastSavedAt: new Date().toLocaleTimeString(),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reorder stops';
      set({ saveStatus: 'error', error: message });
    }
  },

  assignActivityToStop: (stopId, activity) => {
    const { sections, trip } = get();
    const stopSections = sections.filter((section) => section.stop_id === stopId);
    const nextIndex = stopSections.length + 1;
    const defaultStart = trip?.start_date || new Date().toISOString().split('T')[0];

    const newSection: SectionDraft = {
      id: Date.now(),
      stop_id: stopId,
      title: `Section ${nextIndex}: ${activity.name}`,
      type: 'activity',
      date_range_start: defaultStart,
      date_range_end: defaultStart,
      budget: activity.cost || 50,
      notes: activity.description,
      order_index: sections.length + 1,
      isNew: true,
    };

    set({
      sections: [...sections, newSection],
      saveStatus: 'idle',
    });
  },

  addSection: (type = 'activity', stopId) => {
    const { sections, trip } = get();
    const resolvedStopId = stopId ?? sortedStops(trip?.stops)[0]?.id;
    const nextIndex = sections.length + 1;
    const defaultStart = trip?.start_date || new Date().toISOString().split('T')[0];
    const defaultEnd = trip?.end_date || defaultStart;

    if (!trip || !resolvedStopId) {
      set({ error: 'Add a destination stop before creating sections.' });
      return;
    }

    const newSection: SectionDraft = {
      id: Date.now(),
      stop_id: resolvedStopId,
      title: `Section ${nextIndex}: New ${type.charAt(0).toUpperCase() + type.slice(1)} Block`,
      type,
      date_range_start: defaultStart,
      date_range_end: defaultEnd,
      budget: 100,
      notes: '',
      order_index: nextIndex,
      isNew: true,
    };

    set({
      sections: [...sections, newSection],
      saveStatus: 'idle',
    });
  },

  updateSection: (index, updates) => {
    const { sections } = get();
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], ...updates };

    set({ sections: newSections, saveStatus: 'saving' });

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      try {
        const targetSection = newSections[index];
        if (targetSection.id && !targetSection.isNew) {
          await sectionsApi.updateSection(targetSection.id, targetSection);
        }
        set({
          saveStatus: 'saved',
          lastSavedAt: new Date().toLocaleTimeString(),
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Autosave failed';
        set({ saveStatus: 'error', error: message });
      }
    }, 1500);
  },

  removeSection: async (index) => {
    const { sections } = get();
    const target = sections[index];
    const newSections = sections.filter((_, i) => i !== index);

    set({ sections: newSections });

    if (target.id && !target.isNew) {
      try {
        await sectionsApi.deleteSection(target.id);
      } catch (err) {
        console.warn('Failed to delete section from backend:', err);
      }
    }
  },

  saveSectionImmediate: async (index) => {
    const { sections, trip } = get();
    const target = sections[index];
    if (!trip) return;

    set({ saveStatus: 'saving' });
    try {
      if (target.id && !target.isNew) {
        await sectionsApi.updateSection(target.id, target);
      } else {
        const created = await sectionsApi.createSection(trip.id, target.stop_id, target);
        const updatedSections = [...sections];
        updatedSections[index] = { ...created, isNew: false };
        set({ sections: updatedSections });
      }
      set({ saveStatus: 'saved', lastSavedAt: new Date().toLocaleTimeString() });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Save failed';
      set({ saveStatus: 'error', error: message });
    }
  },

  saveAllSections: async () => {
    const { sections, trip } = get();
    if (!trip) return false;

    set({ saveStatus: 'saving' });
    try {
      const nextSections = [...sections];
      for (let i = 0; i < nextSections.length; i++) {
        const s = nextSections[i];
        if (s.isNew) {
          const created = await sectionsApi.createSection(trip.id, s.stop_id, s);
          nextSections[i] = { ...created, isNew: false };
        } else {
          await sectionsApi.updateSection(s.id, s);
        }
      }
      set({
        sections: nextSections,
        saveStatus: 'saved',
        lastSavedAt: new Date().toLocaleTimeString(),
      });
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Save failed';
      set({ saveStatus: 'error', error: message });
      return false;
    }
  },

  resetBuilder: () => {
    set({
      trip: null,
      selectedCity: null,
      sections: [],
      saveStatus: 'idle',
      error: null,
    });
  },
}));
