import { create } from 'zustand';
import { Trip, TripSection, SectionType, City } from '../types';
import { tripsApi } from '../api/trips';
import { sectionsApi } from '../api/sections';
import { stopsApi } from '../api/stops';

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

let debounceTimer: NodeJS.Timeout | null = null;

export const useTripBuilderStore = create<TripBuilderState>((set, get) => ({
  trip: null,
  selectedCity: null,
  sections: [
    {
      id: 1,
      stop_id: 1,
      title: 'Section 1: Inbound Travel & Airport Transfer',
      type: 'travel',
      date_range_start: new Date().toISOString().split('T')[0],
      date_range_end: new Date().toISOString().split('T')[0],
      budget: 150,
      notes: 'Flight arrival and high-speed rail transfer to city center.',
      order_index: 1,
      isNew: false,
    },
    {
      id: 2,
      stop_id: 1,
      title: 'Section 2: Accommodation & Hotel Check-in',
      type: 'stay',
      date_range_start: new Date().toISOString().split('T')[0],
      date_range_end: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      budget: 350,
      notes: 'Centrally located boutique hotel with complimentary breakfast.',
      order_index: 2,
      isNew: false,
    },
    {
      id: 3,
      stop_id: 1,
      title: 'Section 3: Sightseeing, Walking Tour & Experiences',
      type: 'activity',
      date_range_start: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      date_range_end: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      budget: 200,
      notes: 'Explore top historical landmarks, cultural districts, and local culinary gems.',
      order_index: 3,
      isNew: false,
    },
  ],
  isLoading: false,
  saveStatus: 'saved',
  lastSavedAt: new Date().toLocaleTimeString(),
  error: null,

  loadTrip: async (tripId) => {
    set({ isLoading: true, error: null });
    try {
      const trip = await tripsApi.getTrip(tripId);
      set({ trip, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
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

    const newSection: SectionDraft = {
      id: Date.now(), // Temporary ID until saved
      stop_id: trip?.stops?.[0]?.id || 1,
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

    // Debounced autosave (1.5s as requested in MVP plan)
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
      } catch (err: any) {
        set({ saveStatus: 'error', error: err.message });
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
      } catch (err: any) {
        console.warn('Failed to delete section from backend:', err);
      }
    }
  },

  saveSectionImmediate: async (index) => {
    const { sections } = get();
    const target = sections[index];
    set({ saveStatus: 'saving' });
    try {
      if (target.id && !target.isNew) {
        await sectionsApi.updateSection(target.id, target);
      } else {
        const created = await sectionsApi.createSection(target.stop_id, target);
        const updatedSections = [...sections];
        updatedSections[index] = { ...created, isNew: false };
        set({ sections: updatedSections });
      }
      set({ saveStatus: 'saved', lastSavedAt: new Date().toLocaleTimeString() });
    } catch (err: any) {
      set({ saveStatus: 'error', error: err.message });
    }
  },

  saveAllSections: async () => {
    const { sections } = get();
    set({ saveStatus: 'saving' });
    try {
      for (let i = 0; i < sections.length; i++) {
        const s = sections[i];
        if (s.isNew) {
          const created = await sectionsApi.createSection(s.stop_id, s);
          sections[i] = { ...created, isNew: false };
        } else {
          await sectionsApi.updateSection(s.id, s);
        }
      }
      set({
        sections: [...sections],
        saveStatus: 'saved',
        lastSavedAt: new Date().toLocaleTimeString(),
      });
      return true;
    } catch (err: any) {
      set({ saveStatus: 'error', error: err.message });
      return false;
    }
  },

  resetBuilder: () => {
    set({
      trip: null,
      selectedCity: null,
      saveStatus: 'saved',
      error: null,
    });
  },
}));

