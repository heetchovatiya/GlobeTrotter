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
import { useTripWizardStore, WizardStepId } from '../store/tripWizardStore';
import { validateTripDates, isValidHttpUrl, tripDurationDays } from '../utils/validation';
import { splitTripDatesForStops } from '../utils/tripDates';
import { WizardSteps } from '../components/wizard/WizardSteps';
import { WizardStickyFooter } from '../components/wizard/WizardStickyFooter';
import { WizardStepRoute } from '../components/wizard/WizardStepRoute';
import { WizardStepDates } from '../components/wizard/WizardStepDates';
import { WizardStepActivities } from '../components/wizard/WizardStepActivities';
import { WizardStepReview } from '../components/wizard/WizardStepReview';
import { TripTemplatePicker } from '../components/wizard/TripTemplatePicker';

export const CreateTrip: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pickerCityId, setPickerCityId] = React.useState(0);
  const [activitiesLoading, setActivitiesLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSavingDraft, setIsSavingDraft] = React.useState(false);
  const [mode, setMode] = React.useState<'templates' | 'wizard'>('templates');

  const {
    step,
    cityIds,
    startDate,
    endDate,
    name,
    description,
    coverPhotoUrl,
    coverPreview,
    coverFile,
    selectedActivityIds,
    suggestedActivities,
    cities,
    setStep,
    nextStep,
    prevStep,
    setCities,
    addCity,
    removeCity,
    setPrimaryCity,
    setStartDate,
    setEndDate,
    setName,
    setDescription,
    setCoverPhotoUrl,
    setCoverPreview,
    setCoverFile,
    setSuggestedActivities,
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
        if (cityList.length > 0) {
          const firstId = cityList[0].id;
          setPickerCityId(firstId);
          addCity(firstId);
          const chosen = cityList[0];
          setCoverPhotoUrl(chosen.image_url);
          setCoverPreview(chosen.image_url);
        }
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
    if (!primaryCityId) return;
    setActivitiesLoading(true);
    activitiesApi
      .getActivities({ city_id: primaryCityId })
      .then(setSuggestedActivities)
      .catch(console.error)
      .finally(() => setActivitiesLoading(false));
  }, [primaryCityId, setSuggestedActivities]);

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
      if (s === 4) {
        if (!name.trim()) return 'Please name your trip.';
        if (coverPhotoUrl && !coverFile && !isValidHttpUrl(coverPhotoUrl)) {
          return 'Cover photo URL must be a valid http or https link.';
        }
      }
      return null;
    },
    [cityIds, startDate, endDate, name, coverPhotoUrl, coverFile]
  );

  const handleContinue = () => {
    const err = validateStep(step);
    if (err) {
      showToast('error', err);
      return;
    }
    if (step === 4) {
      handleSubmit();
    } else {
      nextStep();
    }
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
      const err = validateStep(4);
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
      const effectiveEnd = endDate || createdTrip.end_date;
      const dateSegments =
        startDate && endDate
          ? splitTripDatesForStops(effectiveStart, effectiveEnd, cityIds.length)
          : [];

      const stops = [];
      for (let i = 0; i < cityIds.length; i++) {
        const seg = dateSegments[i];
        const stop = await stopsApi.createStop(createdTrip.id, {
          city_id: cityIds[i],
          arrival_date: seg?.arrival_date,
          departure_date: seg?.departure_date,
          order_index: i + 1,
        });
        stops.push(stop);
      }

      if (!asDraft) {
        const primaryStop = stops[0];
        if (selectedActivityIds.length > 0) {
          const selectedActs = suggestedActivities.filter((a) =>
            selectedActivityIds.includes(a.id)
          );
          for (let i = 0; i < selectedActs.length; i++) {
            const act = selectedActs[i];
            await sectionsApi.createSection(createdTrip.id, primaryStop.id, {
              title: `Section ${i + 1}: ${act.name}`,
              type: 'activity',
              date_range_start: effectiveStart,
              date_range_end: effectiveStart,
              budget: act.cost || 50,
              notes: act.description,
              order_index: i + 1,
            });
          }
        } else {
          await sectionsApi.createSection(createdTrip.id, primaryStop.id, {
            title: 'Section 1: Inbound Arrival & Welcome Tour',
            type: 'travel',
            date_range_start: effectiveStart,
            date_range_end: effectiveStart,
            budget: 150,
            notes: 'Flight arrival and check-in.',
            order_index: 1,
          });
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
          <WizardStepActivities
            activities={suggestedActivities}
            selectedIds={selectedActivityIds}
            onToggle={(a) => toggleActivity(a.id)}
            loading={activitiesLoading}
            cityName={primaryCity?.name}
          />
        )}

        {step === 4 && (
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
        continueLabel={step === 4 ? 'Confirm trip' : 'Continue'}
        isLoading={isSubmitting}
        isSavingDraft={isSavingDraft}
      />
        </>
      )}
    </div>
  );
};
