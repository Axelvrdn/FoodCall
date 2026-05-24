import { useState, useRef, type ChangeEvent } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { usersService } from '@/services/users-service';
import { Hero } from '@/components/ui';

const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

function isAllowedImageFile(file: File): boolean {
  if (file.type && ALLOWED_CONTENT_TYPES.includes(file.type)) return true;
  const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  return ALLOWED_EXTENSIONS.includes(ext);
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const reputationScore = user?.reputationScore ?? 0;
  const avatarUrl = user?.avatarUrl ?? null;
  const initial = (user?.displayName ?? '?')[0].toUpperCase();

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setProfileError(null);
    setSuccessMessage(null);
    try {
      const updated = await usersService.updateMe({ displayName, email });
      setUser(updated);
      setSuccessMessage('Profil mis à jour.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour.';
      setProfileError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);

    if (!isAllowedImageFile(file)) {
      setAvatarError('Formats acceptés : JPEG, PNG ou WebP.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const contentType = file.type || (file.name.toLowerCase().endsWith('.png') ? 'image/png' : file.name.toLowerCase().endsWith('.webp') ? 'image/webp' : 'image/jpeg');
      const updated = await usersService.uploadAvatar({
        filename: file.name,
        contentType,
        base64,
      });
      setUser(updated);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors du Téléchargement.';
      setAvatarError(message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDeleteAvatar() {
    setUploading(true);
    setAvatarError(null);
    try {
      const updated = await usersService.deleteAvatar();
      setUser(updated);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression.';
      setAvatarError(message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Hero
        eyebrow="Profil"
        title={user?.displayName ?? 'Profil'}
        subtitle="Gère ton identité, ton adresse e-mail et ta photo de profil."
      />

      <section className="rounded-2xl bg-surface p-6 shadow-soft">
        <h2 className="font-display text-xl text-fg">Identité</h2>

        <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-2">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user?.displayName ?? 'Avatar'}
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-3xl font-bold text-white">
                {initial}
              </div>
            )}

            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
                aria-label="Changer la photo"
                data-testid="avatar-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="rounded-full bg-surface px-3 py-1.5 text-sm font-semibold text-fg transition-transform duration-150 ease-out hover:bg-soft active:scale-[0.97] disabled:opacity-50"
              >
                {uploading ? 'Chargement…' : 'Changer la photo'}
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleDeleteAvatar}
                  disabled={uploading}
                  className="rounded-full bg-danger/10 px-3 py-1.5 text-sm font-semibold text-danger transition-transform duration-150 ease-out hover:bg-danger/20 active:scale-[0.97] disabled:opacity-50"
                  aria-label="Supprimer la photo"
                >
                  Supprimer la photo
                </button>
              )}
            </div>

            {avatarError && (
              <p role="alert" className="text-sm text-danger">{avatarError}</p>
            )}
          </div>

          <div className="flex-1">
            <div className="rounded-2xl bg-surface-warm p-4 text-center">
              <p className="font-mono text-3xl font-bold text-primary">{reputationScore.toLocaleString('fr-FR')}</p>
              <p className="mt-1 text-sm font-semibold text-muted">Score de réputation</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-surface p-6 shadow-soft">
        <h2 className="font-display text-xl text-fg">Modifier le profil</h2>

        <form onSubmit={handleSaveProfile} className="mt-4 grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="profile-displayName" className="text-sm font-semibold text-fg">Nom affiché</label>
            <input
              id="profile-displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="rounded-2xl border border-border bg-surface-warm px-4 py-2.5 text-fg transition-colors duration-150 ease-out focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="profile-email" className="text-sm font-semibold text-fg">Adresse e-mail</label>
            <input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-2xl border border-border bg-surface-warm px-4 py-2.5 text-fg transition-colors duration-150 ease-out focus:border-primary focus:outline-none"
            />
          </div>

          {profileError && (
            <p role="alert" className="text-sm text-danger">{profileError}</p>
          )}

          {successMessage && (
            <p className="text-sm text-success">{successMessage}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-primary px-6 py-2.5 font-semibold text-white transition-transform duration-150 ease-out hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
      </section>
    </div>
  );
}