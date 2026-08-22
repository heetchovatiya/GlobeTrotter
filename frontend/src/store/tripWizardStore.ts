import { create } from 'zustand';
import { Activity, City } from '../types';

export const WIZARD_STEPS = [
  { id: 1, label: 'Route', short: 'Where' },
  { id: 2, label: 'Dates', short: 'When' },
  { id: 3, label: 'City days', short: 'Stay' },
  { id: 4, label: 'Activities', short: 'What' },
  { id: 5, label: 'Review', short: 'Confirm' },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]['id'];

interface TripWizardState {
  step: WizardStepId;
  cityIds: number[];
  cityDays: Record<number, number>;
  startDate: string;
  endDate: string;
  name: string;
  description: string;
  coverPhotoUrl: string;
  coverPreview: string | null;
  coverFile: File | null;
  selectedActivityIds: number[];
  suggestedActivities: Activity[];
  activitiesByCity: Record<number, Activity[]>;
  cities: City[];

  setStep: (step: WizardStepId) => void;
  nextStep: () => void;
  prevStep: () => void;
  setCities: (cities: City[]) => void;
  addCity: (cityId: number) => void;
  removeCity: (cityId: number) => void;
  setPrimaryCity: (cityId: number) => void;
  setCityDays: (cityId: number, days: number) => void;
  setCityDaysMap: (cityDays: Record<number, number>) => void;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setCoverPhotoUrl: (url: string) => void;
  setCoverPreview: (preview: string | null) => void;
  setCoverFile: (file: File | null) => void;
  setSuggestedActivities: (activities: Activity[]) => void;
  setActivitiesByCity: (activitiesByCity: Record<number, Activity[]>) => void;
  toggleActivity: (activityId: number) => void;
  reset: () => void;
}

const initialState = {
  step: 1 as WizardStepId,
  cityIds: [] as number[],
  cityDays: {} as Record<number, number>,
  startDate: '',
  endDate: '',
  name: '',
  description: '',
  coverPhotoUrl: '',
  coverPreview: null as string | null,
  coverFile: null as File | null,
  selectedActivityIds: [] as number[],
  suggestedActivities: [] as Activity[],
  activitiesByCity: {} as Record<number, Activity[]>,
  cities: [] as City[],
};

export const useTripWizardStore = create<TripWizardState>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ step }),

  nextStep: () => {
    const { step } = get();
    if (step < 5) set({ step: (step + 1) as WizardStepId });
  },

  prevStep: () => {
    const { step } = get();
    if (step > 1) set({ step: (step - 1) as WizardStepId });
  },

  setCities: (cities) => set({ cities }),

  addCity: (cityId) => {
    const { cityIds, cityDays } = get();
    if (cityIds.includes(cityId) || cityIds.length >= 4) return;
    set({
      cityIds: [...cityIds, cityId],
      cityDays: { ...cityDays, [cityId]: cityDays[cityId] || 1 },
    });
  },

  removeCity: (cityId) => {
    const { cityIds, cityDays } = get();
    const nextDays = { ...cityDays };
    delete nextDays[cityId];
    set({ cityIds: cityIds.filter((id) => id !== cityId), cityDays: nextDays });
  },

  setPrimaryCity: (cityId) => {
    const { cityIds } = get();
    const rest = cityIds.filter((id) => id !== cityId);
    set({ cityIds: [cityId, ...rest] });
  },

  setCityDays: (cityId, days) => {
    const safeDays = Math.max(1, days);
    set({ cityDays: { ...get().cityDays, [cityId]: safeDays } });
  },

  setCityDaysMap: (cityDays) => {
    const current = get().cityDays;
    const keys = new Set([...Object.keys(current), ...Object.keys(cityDays)]);
    for (const key of keys) {
      const id = Number(key);
      if ((current[id] || 0) !== (cityDays[id] || 0)) {
        set({ cityDays });
        return;
      }
    }
  },

  setStartDate: (startDate) => set({ startDate }),
  setEndDate: (endDate) => set({ endDate }),
  setName: (name) => set({ name }),
  setDescription: (description) => set({ description }),
  setCoverPhotoUrl: (coverPhotoUrl) => set({ coverPhotoUrl }),
  setCoverPreview: (coverPreview) => set({ coverPreview }),
  setCoverFile: (coverFile) => set({ coverFile }),
  setSuggestedActivities: (suggestedActivities) => set({ suggestedActivities }),
  setActivitiesByCity: (activitiesByCity) => set({ activitiesByCity }),

  toggleActivity: (activityId) => {
    const { selectedActivityIds } = get();
    set({
      selectedActivityIds: selectedActivityIds.includes(activityId)
        ? selectedActivityIds.filter((id) => id !== activityId)
        : [...selectedActivityIds, activityId],
    });
  },

  reset: () => set({ ...initialState }),
}));
