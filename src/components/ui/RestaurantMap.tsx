import { useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getRestaurantCoordinates, type Coordinates } from '@/lib';
import type { Restaurant } from '@/types/api';
import type { Map, StyleSpecification } from 'maplibre-gl';

interface RestaurantMapProps {
  origin: Coordinates | null;
  restaurants: Restaurant[];
  detail: string;
}

const OSM_RASTER_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

function canUseMapLibre() {
  if (typeof window === 'undefined') return false;
  const canvas = document.createElement('canvas');
  return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
}

export function RestaurantMap({ origin, restaurants, detail }: RestaurantMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function setupMap() {
      if (!containerRef.current || !origin || !canUseMapLibre()) {
        return;
      }

      setMapError(null);

      const maplibregl = await import('maplibre-gl');
      if (cancelled || !containerRef.current) return;

      mapRef.current?.remove();

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: OSM_RASTER_STYLE,
        center: [origin.lng, origin.lat],
        zoom: 13,
      });
      mapRef.current = map;

      map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), 'top-right');

      map.on('error', (e: unknown) => {
        if (cancelled) return;
        const error = e as { error?: Error };
        console.error('MapLibre error:', error.error?.message || error);
        setMapError(error.error?.message || 'Erreur de chargement de la carte.');
      });

      map.on('load', () => {
        if (cancelled) return;

        new maplibregl.Marker({ color: '#2563eb' })
          .setLngLat([origin.lng, origin.lat])
          .setPopup(new maplibregl.Popup().setText('Position de départ'))
          .addTo(map);

        restaurants.forEach((restaurant) => {
          const coords = getRestaurantCoordinates(restaurant);
          if (!coords) return;

          new maplibregl.Marker({ color: '#f97316' })
            .setLngLat([coords.lng, coords.lat])
            .setPopup(new maplibregl.Popup().setText(restaurant.name))
            .addTo(map);
        });

        map.resize();
        setMapReady(true);
      });
    }

    setupMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
      setMapError(null);
    };
  }, [origin, restaurants]);

  const webglAvailable = canUseMapLibre();
  const showFallback = !mapReady && !mapError && webglAvailable;
  const showError = !!mapError;
  const showNoWebGL = !webglAvailable && !mapError;

  return (
    <section
      aria-label="Carte des restaurants"
      className="overflow-hidden rounded-[26px] border border-border bg-soft"
      role="region"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border bg-surface/80 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Carte interactive</p>
          <p className="text-sm text-muted">{detail}</p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {mapReady ? 'MapLibre' : showError ? 'Erreur' : showNoWebGL ? 'Mode limité' : 'Aperçu'}
        </span>
      </div>
      <div className="relative min-h-[320px]">
        {webglAvailable && (
          <div ref={containerRef} data-testid="restaurant-map-canvas" className="absolute inset-0 z-10" />
        )}
        
        {showFallback && (
          <div
            data-testid="restaurant-map-fallback"
            className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-[radial-gradient(circle_at_30%_20%,rgba(244,114,22,0.18),transparent_28%),linear-gradient(135deg,rgba(37,99,235,0.12),rgba(255,255,255,0.82))] p-6"
          >
            <div className="w-full max-w-md rounded-card bg-surface/90 p-4 shadow-soft backdrop-blur">
              <p className="text-sm font-semibold text-fg">
                {origin ? 'Position utilisée pour la recherche' : 'Saisis une adresse ou active la localisation'}
              </p>
              <p className="mt-1 font-mono text-xs text-muted">
                {origin ? `${origin.lat.toFixed(5)}, ${origin.lng.toFixed(5)}` : 'Aucune coordonnée active'}
              </p>
              {restaurants.length > 0 && (
                <ul className="mt-4 grid gap-2 text-sm text-fg">
                  {restaurants.slice(0, 4).map((restaurant) => (
                    <li key={restaurant.id} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      {restaurant.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {showError && (
          <div
            data-testid="restaurant-map-error"
            className="absolute inset-0 z-20 grid place-items-center bg-danger/5 p-6"
          >
            <div className="w-full max-w-md rounded-card bg-surface p-4 shadow-card">
              <p className="text-sm font-semibold text-danger">Impossible d'afficher la carte</p>
              <p className="mt-1 text-xs text-muted">{mapError}</p>
              <p className="mt-2 text-xs text-muted">
                Vérifie que WebGL est activé dans ton navigateur et que tu n'utilises pas de mode headless ou de VM sans accélération graphique.
              </p>
            </div>
          </div>
        )}

        {showNoWebGL && (
          <div
            data-testid="restaurant-map-nowebgl"
            className="absolute inset-0 z-20 grid place-items-center bg-surface p-6"
          >
            <div className="w-full max-w-md rounded-card bg-surface p-4 shadow-card text-center">
              <p className="text-sm font-semibold text-fg">Carte non disponible</p>
              <p className="mt-1 text-xs text-muted">
                WebGL n'est pas activé dans ce navigateur. La carte interactive nécessite WebGL pour fonctionner.
              </p>
              {origin && (
                <p className="mt-2 font-mono text-xs text-muted">
                  Position : {origin.lat.toFixed(5)}, {origin.lng.toFixed(5)}
                </p>
              )}
              {restaurants.length > 0 && (
                <ul className="mt-4 grid gap-2 text-sm text-fg text-left">
                  {restaurants.slice(0, 6).map((restaurant) => (
                    <li key={restaurant.id} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      {restaurant.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {mapReady && <span className="sr-only">Contrôles carte actifs</span>}
      </div>
    </section>
  );
}
