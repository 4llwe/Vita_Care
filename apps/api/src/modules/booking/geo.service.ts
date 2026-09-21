import { Injectable } from '@nestjs/common';

export type LatLng = { lat: number; lng: number };

@Injectable()
export class GeoService {
  /** Jarak haversine dalam meter antara dua koordinat. */
  distanceMeters(a: LatLng, b: LatLng): number {
    const R = 6_371_000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  /** Pilih kandidat terdekat dari titik asal. */
  nearest<T extends { lat?: number | null; lng?: number | null }>(
    origin: LatLng,
    candidates: T[],
  ): T | undefined {
    return [...candidates]
      .filter((c) => c.lat != null && c.lng != null)
      .sort(
        (x, y) =>
          this.distanceMeters(origin, { lat: x.lat!, lng: x.lng! }) -
          this.distanceMeters(origin, { lat: y.lat!, lng: y.lng! }),
      )[0];
  }
}
