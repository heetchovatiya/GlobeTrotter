import { create } from 'zustand';
import { Trip, TripSection, SectionType, City } from '../types';
import { tripsApi } from '../api/trips';
import { sectionsApi } from '../api/sections';
import { stopsApi } from '../api/stops';
import { itineraryApi } from '../api/itinerary';
import { flattenSections } from '../api/mappers';

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
  addSection: (type?: SectionType) => void;
  updateSection: (index: number, updates: Partial<SectionDraft>) => void;
  removeSection: (index: number) => Promise<void>;
  saveSectionImmediate: (index: number) => Promise<void>;
  saveAllSections: () => Promise<boolean>;
  resetBuilder: () => void;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

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
        trip: { ...trip, stops },
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

  addSection: (type = 'activity') => {
    const { sections, trip } = get();
    const nextIndex = sections.length + 1;
    const defaultStart = trip?.start_date || new Date().toISOString().split('T')[0];
    const defaultEnd = trip?.end_date || defaultStart;
    const stopId = trip?.stops?.[0]?.id;

    if (!trip || !stopId) {
      set({ error: 'Add a destination stop before creating sections.' });
      return;
    }

    const newSection: SectionDraft = {
      id: Date.now(),
      stop_id: stopId,
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
