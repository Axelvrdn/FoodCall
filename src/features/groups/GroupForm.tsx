import { useState, useCallback } from 'react';
import { useCreateGroupMutation, useUpdateGroupMutation } from './group-queries';
import { formatBudget } from '@/lib/formatters';
import type { Group, GroupCreateRequest, GroupUpdateRequest } from '@/types/api';

interface GroupFormProps {
  mode: 'create' | 'edit';
  group?: Group;
  readOnly?: boolean;
  onSuccess?: () => void;
}

export function GroupForm({ mode, group, readOnly, onSuccess }: GroupFormProps) {
  const [name, setName] = useState(group?.name ?? '');
  const [description, setDescription] = useState(group?.description ?? '');
  const [budgetMax, setBudgetMax] = useState(
    group?.budgetMax != null ? String(Number(group.budgetMax)) : '',
  );
  const [defaultStartAddress, setDefaultStartAddress] = useState(group?.defaultStartAddress ?? '');
  const [defaultLatitude, setDefaultLatitude] = useState(group?.defaultStartLatitude ?? '');
  const [defaultLongitude, setDefaultLongitude] = useState(group?.defaultStartLongitude ?? '');
  const [defaultSearchRadiusMeters, setDefaultSearchRadiusMeters] = useState(
    group?.defaultSearchRadiusMeters != null ? String(group.defaultSearchRadiusMeters) : '',
  );
  const [nameError, setNameError] = useState<string | null>(null);
  const [coordError, setCoordError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const createMutation = useCreateGroupMutation();
  const updateMutation = useUpdateGroupMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const validate = useCallback((): boolean => {
    let valid = true;
    setNameError(null);
    setCoordError(null);

    if (!name.trim()) {
      setNameError('Le nom du groupe est requis.');
      valid = false;
    }

    const hasLat = defaultLatitude.trim() !== '';
    const hasLng = defaultLongitude.trim() !== '';
    if (hasLat !== hasLng) {
      setCoordError('La latitude et la longitude doivent être renseignées ensemble ou laissées vides.');
      valid = false;
    }

    return valid;
  }, [name, defaultLatitude, defaultLongitude]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    setSubmitError(null);
    setSubmitSuccess(null);
    if (!validate()) return;

    const hasLat = defaultLatitude.trim() !== '';
    const hasLng = defaultLongitude.trim() !== '';

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      budgetMax: budgetMax.trim() ? Number(budgetMax) : null,
      defaultStartAddress: defaultStartAddress.trim() || null,
      defaultStartLatitude: hasLat ? Number(defaultLatitude) : null,
      defaultStartLongitude: hasLng ? Number(defaultLongitude) : null,
      defaultSearchRadiusMeters: defaultSearchRadiusMeters.trim() ? Number(defaultSearchRadiusMeters) : null,
    };

    if (mode === 'create') {
      createMutation.mutate(payload as GroupCreateRequest, {
          onSuccess: () => {
            setName('');
          setDescription('');
          setBudgetMax('');
          setDefaultStartAddress('');
          setDefaultLatitude('');
            setDefaultLongitude('');
            setDefaultSearchRadiusMeters('');
            setSubmitSuccess('Groupe créé.');
            onSuccess?.();
          },
        onError: (err) => {
          setSubmitError(err.message ?? 'Erreur lors de la création du groupe.');
        },
      });
    } else if (group) {
      updateMutation.mutate(
        { id: group.id, payload: payload as GroupUpdateRequest },
        {
          onSuccess: () => {
            setSubmitSuccess('Groupe mis à jour.');
            onSuccess?.();
          },
          onError: (err) => {
            setSubmitError(err.message ?? 'Erreur lors de la mise à jour du groupe.');
          },
        },
      );
    }
  };

  const inputBase = 'w-full rounded-radius border border-border bg-surface px-4 py-2.5 text-sm text-fg outline-primary placeholder:text-muted';
  const readOnlyInput = 'w-full rounded-radius border border-border bg-soft px-4 py-2.5 text-sm text-muted';
  const inputClass = readOnly ? readOnlyInput : inputBase;

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <label htmlFor="group-name" className="text-sm font-semibold text-fg">
          Nom du groupe
        </label>
        <input
          id="group-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          readOnly={readOnly}
          className={inputClass}
          placeholder="Ex. Lille Lunch Crew"
        />
        {nameError && <p className="text-sm text-danger">{nameError}</p>}
      </div>

      <div className="grid gap-2">
        <label htmlFor="group-description" className="text-sm font-semibold text-fg">
          Description
        </label>
        <textarea
          id="group-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          readOnly={readOnly}
          className={`${inputClass} min-h-[80px] resize-none`}
          placeholder="Une courte description du groupe..."
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="group-budget" className="text-sm font-semibold text-fg">
          Budget maximum (EUR)
        </label>
        <input
          id="group-budget"
          type="number"
          step="0.01"
          min="0"
          value={budgetMax}
          onChange={(e) => setBudgetMax(e.target.value)}
          readOnly={readOnly}
          className={inputClass}
          placeholder="20.00"
        />
        {group?.budgetMax && readOnly && (
          <p className="text-xs text-muted">
            Actuel : {formatBudget(group.budgetMax)}
          </p>
        )}
      </div>

      <div className="mt-2">
        <h4 className="text-sm font-semibold text-fg">Paramètres par défaut du groupe</h4>
        <p className="mt-1 text-xs text-muted">Utilisés par les nouvelles sessions de vote.</p>
      </div>

      <div className="grid gap-2">
        <label htmlFor="group-address" className="text-sm font-semibold text-fg">
          Adresse de départ
        </label>
        <input
          id="group-address"
          type="text"
          value={defaultStartAddress}
          onChange={(e) => setDefaultStartAddress(e.target.value)}
          readOnly={readOnly}
          className={inputClass}
          placeholder="Ex. Place du Général de Gaulle, Lille"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="group-lat" className="text-sm font-semibold text-fg">
            Latitude
          </label>
          <input
            id="group-lat"
            type="number"
            step="any"
            value={defaultLatitude}
            onChange={(e) => setDefaultLatitude(e.target.value)}
            readOnly={readOnly}
            className={inputClass}
            placeholder="50.6292"
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="group-lng" className="text-sm font-semibold text-fg">
            Longitude
          </label>
          <input
            id="group-lng"
            type="number"
            step="any"
            value={defaultLongitude}
            onChange={(e) => setDefaultLongitude(e.target.value)}
            readOnly={readOnly}
            className={inputClass}
            placeholder="3.0573"
          />
        </div>
      </div>
      {coordError && <p className="text-sm text-danger">{coordError}</p>}

      <div className="grid gap-2">
        <label htmlFor="group-radius" className="text-sm font-semibold text-fg">
          Rayon de recherche (mètres)
        </label>
        <input
          id="group-radius"
          type="number"
          step="1"
          min="0"
          value={defaultSearchRadiusMeters}
          onChange={(e) => setDefaultSearchRadiusMeters(e.target.value)}
          readOnly={readOnly}
          className={inputClass}
          placeholder="2000"
        />
      </div>

      {submitError && (
        <div role="alert" className="rounded bg-danger/10 p-3 text-sm text-danger">
          {submitError}
        </div>
      )}

      {submitSuccess && (
        <div role="status" className="rounded bg-primary/10 p-3 text-sm font-semibold text-primary">
          {submitSuccess}
        </div>
      )}

      {!readOnly && (
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-radius bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
          >
            {isPending
              ? mode === 'create'
                ? 'Création...'
                : 'Enregistrement...'
              : mode === 'create'
                ? 'Créer le groupe'
                : 'Enregistrer les modifications'}
          </button>
        </div>
      )}
    </form>
  );
}
