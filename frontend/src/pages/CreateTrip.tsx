import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { citiesApi } from '../api/cities';
import { activitiesApi } from '../api/activities';
import { tripsApi } from '../api/trips';
import { stopsApi } from '../api/stops';
import { sectionsApi } from '../api/sections';
import { uploadsApi } from '../api/uploads';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { useTripWizardStore, WizardStepId } from '../store/tripWizardStore';
import { validateTripDates, isValidHttpUrl, tripDurationDays } from '../utils/validation';
import { resolveUserHomeCityId, defaultDestinationPickerId } from '../utils/homeCity';
import {
  buildActivitySchedule,
  buildCityDaysMap,
  cityDaysMapsEqual,
  splitTripDatesByCityDays,
  suggestActivitiesForCity,
} from '../utils/scheduleBuilder';
import { WizardSteps } from '../components/wizard/WizardSteps';
import { WizardStickyFooter } from '../components/wizard/WizardStickyFooter';
import { WizardStepRoute } from '../components/wizard/WizardStepRoute';
import { WizardStepDates } from '../components/wizard/WizardStepDates';
import { WizardStepCityDays } from '../components/wizard/WizardStepCityDays';
import { WizardStepActivities } from '../components/wizard/WizardStepActivities';
import { WizardStepReview } from '../components/wizard/WizardStepReview';
import { TripTemplatePicker } from '../components/wizard/TripTemplatePicker';

export const CreateTrip: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pickerCityId, setPickerCityId] = React.useState(0);
  const [activitiesLoading, setActivitiesLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSavingDraft, setIsSavingDraft] = React.useState(false);
  const [mode, setMode] = React.useState<'templates' | 'wizard'>('templates');

  const {
    step,
    cityIds,
    cityDays,
    startDate,
    endDate,
    name,
    description,
    coverPhotoUrl,
    coverPreview,
    coverFile,
    selectedActivityIds,
    suggestedActivities,
    activitiesByCity,
    cities,
    setStep,
    nextStep,
    prevStep,
    setCities,
    addCity,
    removeCity,
    setPrimaryCity,
    setCityDays,
    setCityDaysMap,
    setStartDate,
    setEndDate,
    setName,
    setDescription,
    setCoverPhotoUrl,
    setCoverPreview,
    setCoverFile,
    setSuggestedActivities,
    setActivitiesByCity,
    toggleActivity,
    reset,
  } = useTripWizardStore();

  useEffect(() => {
    if (mode !== 'wizard') return;
    reset();
    const load = async () => {
      try {
        const cityList = await citiesApi.getCities();
        setCities(cityList);
        if (cityList.length === 0) return;

        const homeCityId = resolveUserHomeCityId(user, cityList);
        const startCityId = homeCityId ?? cityList[0].id;
        const startCity = cityList.find((c) => c.id === startCityId) ?? cityList[0];

        addCity(startCity.id);
        setPickerCityId(defaultDestinationPickerId(cityList, [startCity.id]));
        setCoverPhotoUrl(startCity.image_url);
        setCoverPreview(startCity.image_url);
      } catch (err) {
        console.error(err);
        showToast('error', 'Could not load cities.');
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const primaryCityId = cityIds[0];

  useEffect(() => {
    if (cityIds.length === 0) return;
    setActivitiesLoading(true);
    Promise.all(cityIds.map((id) => activitiesApi.getActivities({ city_id: id })))
      .then((results) => {
        const byCity: Record<number, typeof suggestedActivities> = {};
        cityIds.forEach((id, index) => {
          byCity[id] = results[index] || [];
        });
        setActivitiesByCity(byCity);
        setSuggestedActivities(Object.values(byCity).flat());
      })
      .catch(console.error)
      .finally(() => setActivitiesLoading(false));
  }, [cityIds, setActivitiesByCity, setSuggestedActivities]);

  useEffect(() => {
    if (!startDate || !endDate || cityIds.length === 0) return;
    const total = tripDurationDays(startDate, endDate);
    if (total <= 0) return;

    const next = buildCityDaysMap(cityIds, total);
    const current = useTripWizardStore.getState().cityDays;
    if (cityDaysMapsEqual(current, cityIds, next)) return;

    setCityDaysMap(next);
  }, [startDate, endDate, cityIds, setCityDaysMap]);

  const selectedCities = useMemo(
    () =>
      cityIds.map((id) => cities.find((c) => c.id === id)).filter(Boolean) as typeof cities,
    [cityIds, cities]
  );

  const cityNames = selectedCities.map((c) => c.name);
  const primaryCity = selectedCities[0];

  const estimatedBudget = useMemo(() => {
    if (selectedActivityIds.length > 0) {
      return suggestedActivities
        .filter((a) => selectedActivityIds.includes(a.id))
        .reduce((sum, a) => sum + (a.cost || 0), 0);
    }
    return 150;
  }, [selectedActivityIds, suggestedActivities]);

  const dayCount = startDate && endDate ? tripDurationDays(startDate, endDate) : 0;

  const validateStep = useCallback(
    (s: WizardStepId): string | null => {
      if (s === 1) {
        if (cityIds.length === 0) return 'Select at least one destination.';
      }
      if (s === 2) {
        return validateTripDates(startDate, endDate);
      }
      if (s === 3) {
        const allocated = cityIds.reduce((sum, id) => sum + (cityDays[id] || 0), 0);
        if (allocated !== dayCount) {
          return `Allocate exactly ${dayCount} days across your cities (currently ${allocated}).`;
        }
      }
      if (s === 5) {
        if (!name.trim()) return 'Please name your trip.';
        if (coverPhotoUrl && !coverFile && !isValidHttpUrl(coverPhotoUrl)) {
          return 'Cover photo URL must be a valid http or https link.';
        }
      }
      return null;
    },
    [cityIds, cityDays, startDate, endDate, name, coverPhotoUrl, coverFile, dayCount]
  );

  const handleContinue = () => {
    const err = validateStep(step);
    if (err) {
      showToast('error', err);
      return;
    }
    if (step === 5) {
      handleSubmit();
    } else {
      nextStep();
    }
  };

  const handleAutoDistributeDays = () => {
    if (!dayCount) return;
    setCityDaysMap(buildCityDaysMap(cityIds, dayCount));
  };

  const handlePickerChange = (cityId: number) => {
    setPickerCityId(cityId);
    const chosen = cities.find((c) => c.id === cityId);
    if (chosen && cityIds.length === 0) {
      addCity(cityId);
    }
    if (chosen && !coverFile && cityIds[0] === cityId) {
      setCoverPhotoUrl(chosen.image_url);
      setCoverPreview(chosen.image_url);
    }
  };

  const handleCoverFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Cover photo must be 5 MB or smaller.');
      return;
    }
    setCoverFile(file);
    setCoverPhotoUrl('');
    setCoverPreview(URL.createObjectURL(file));
  };

  const persistTrip = async (asDraft: boolean) => {
    if (cityIds.length === 0) {
      showToast('error', 'Select at least one destination.');
      return;
    }

    if (!asDraft) {
      const err = validateStep(5);
      if (err) {
        showToast('error', err);
        return;
      }
    }

    if (asDraft) {
      setIsSavingDraft(true);
    } else {
      setIsSubmitting(true);
    }

    try {
      let resolvedCoverUrl = coverPhotoUrl.trim() || undefined;
      if (coverFile) {
        resolvedCoverUrl = await uploadsApi.uploadCoverPhoto(coverFile);
      }

      const routeLabel = cityNames.length > 0 ? cityNames.join(' → ') : 'Trip';
      const tripName =
        name.trim() ||
        (asDraft ? `Draft: ${routeLabel}` : primaryCity ? `Trip to ${primaryCity.name}` : 'My Trip');

      const createdTrip = await tripsApi.createTrip({
        name: tripName,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        description: description.trim() || undefined,
        cover_photo_url: resolvedCoverUrl,
        save_as_draft: asDraft,
      });

      const effectiveStart = startDate || createdTrip.start_date;
      const daysPerCity = cityIds.map((id) => cityDays[id] || 1);
      const dateSegments =
        startDate && endDate ? splitTripDatesByCityDays(effectiveStart, daysPerCity) : [];

      const stops = [];
      for (let i = 0; i < cityIds.length; i++) {
        const seg = dateSegments[i];
        const stop = await stopsApi.createStop(createdTrip.id, {
          city_id: cityIds[i],
          arrival_date: seg?.arrival_date,
          departure_date: seg?.departure_date,
          order_index: i + 1,
        });
        stops.push({ ...stop, city_id: cityIds[i] });
      }

      if (!asDraft && startDate && endDate) {
        const activitiesByCityMap = new Map<number, typeof suggestedActivities>();
        for (const cityId of cityIds) {
          const pool = activitiesByCity[cityId] || [];
          const selected = pool.filter((a) => selectedActivityIds.includes(a.id));
          const numDays = cityDays[cityId] || 1;
          activitiesByCityMap.set(
            cityId,
            selected.length > 0 ? selected : suggestActivitiesForCity(pool, numDays)
          );
        }

        const stopWindows = stops.map((stop, i) => ({
          cityId: cityIds[i],
          arrivalDate: dateSegments[i]?.arrival_date || effectiveStart,
          departureDate: dateSegments[i]?.departure_date || effectiveStart,
        }));

        const schedule = buildActivitySchedule(stopWindows, activitiesByCityMap);
        const stopByCityId = new Map(stops.map((s) => [s.city_id, s]));

        if (schedule.length > 0) {
          for (const slot of schedule) {
            const stop = stopByCityId.get(slot.cityId);
            if (!stop) continue;
            await sectionsApi.createSection(createdTrip.id, stop.id, {
              title: `${slot.startTime} — ${slot.activity.name}`,
              type: 'activity',
              date_range_start: slot.date,
              date_range_end: slot.date,
              budget: slot.activity.cost || 50,
              notes: slot.activity.description,
              order_index: slot.orderIndex,
            });
          }
        } else {
          for (let i = 0; i < stops.length; i++) {
            const stop = stops[i];
            const seg = dateSegments[i];
            await sectionsApi.createSection(createdTrip.id, stop.id, {
              title: `Day 1 in ${selectedCities[i]?.name || 'destination'} — Arrival & explore`,
              type: 'travel',
              date_range_start: seg?.arrival_date || effectiveStart,
              date_range_end: seg?.arrival_date || effectiveStart,
              budget: 150,
              notes: 'Arrival, check-in, and local exploration.',
              order_index: i + 1,
            });
          }
        }
      }

      showToast(
        'success',
        asDraft ? 'Trip saved as draft. You can finish planning anytime.' : 'Trip confirmed! Your travel plan is ready.'
      );
      navigate(asDraft ? `/trips/${createdTrip.id}` : `/trips/${createdTrip.id}/confirmed`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save trip.';
      showToast('error', message);
    } finally {
      setIsSubmitting(false);
      setIsSavingDraft(false);
    }
  };

  const handleSaveDraft = () => {
    void persistTrip(true);
  };

  const handleSubmit = async () => {
    await persistTrip(false);
  };

  const setDayTrip = () => {
    const today = new Date().toISOString().split('T')[0];
    const base = startDate || today;
    setStartDate(base);
    setEndDate(base);
  };

  return (
    <div className="max-w-3xl mx-auto pb-32 sm:pb-16 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Plan a New Trip
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Start from a template or build step-by-step with the wizard.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('templates')}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
              mode === 'templates' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Templates
          </button>
          <button
            type="button"
            onClick={() => setMode('wizard')}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
              mode === 'wizard' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Custom wizard
          </button>
          <button
            type="button"
            onClick={() => navigate('/trips')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Cancel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mode === 'templates' ? (
        <TripTemplatePicker onUseWizard={() => setMode('wizard')} />
      ) : (
        <>
      <WizardSteps
        currentStep={step}
        onStepClick={(s) => {
          if (s < step) setStep(s);
        }}
      />

      <div className="min-h-[320px]">
        {step === 1 && (
          <WizardStepRoute
            cities={cities}
            cityIds={cityIds}
            onAddCity={addCity}
            onRemoveCity={removeCity}
            onSetPrimary={setPrimaryCity}
            pickerCityId={pickerCityId}
            onPickerChange={handlePickerChange}
          />
        )}

        {step === 2 && (
          <WizardStepDates
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onDayTrip={setDayTrip}
          />
        )}

        {step === 3 && (
          <WizardStepCityDays
            cities={cities}
            cityIds={cityIds}
            cityDays={cityDays}
            totalTripDays={dayCount}
            onCityDaysChange={setCityDays}
            onAutoDistribute={handleAutoDistributeDays}
          />
        )}

        {step === 4 && (
          <WizardStepActivities
            cities={cities}
            cityIds={cityIds}
            cityDays={cityDays}
            activitiesByCity={activitiesByCity}
            selectedIds={selectedActivityIds}
            onToggle={(a) => toggleActivity(a.id)}
            loading={activitiesLoading}
          />
        )}

        {step === 5 && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCoverFile(file);
              }}
            />
            <WizardStepReview
              name={name}
              description={description}
              startDate={startDate}
              endDate={endDate}
              cityNames={cityNames}
              estimatedBudget={estimatedBudget}
              coverPreview={coverPreview}
              coverPhotoUrl={coverPhotoUrl}
              coverFile={coverFile}
              selectedActivityCount={selectedActivityIds.length}
              dayCount={dayCount}
              onNameChange={setName}
              onDescriptionChange={setDescription}
              onCoverUrlChange={(url) => {
                setCoverPhotoUrl(url);
                setCoverPreview(url || null);
              }}
              onClearCover={() => {
                setCoverFile(null);
                setCoverPhotoUrl('');
                setCoverPreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              onPickFile={() => fileInputRef.current?.click()}
            />
          </>
        )}
      </div>

      <WizardStickyFooter
        showBack={step > 1}
        onBack={prevStep}
        onContinue={handleContinue}
        onSaveDraft={handleSaveDraft}
        continueLabel={step === 5 ? 'Confirm trip' : 'Continue'}
        isLoading={isSubmitting}
        isSavingDraft={isSavingDraft}
      />
        </>
      )}
    </div>
  );
};
