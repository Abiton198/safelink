/**
 * lib/vehicleImages.ts
 * ---------------------------------------------------------------------------
 * Shared pieces for vehicle photos.
 *
 * The backend returns each vehicle with `images: [{ image_id, url }]`. The
 * `url` is a temporary link (about an hour) to a PRIVATE photo, which is why
 * the list is reloaded after every change rather than cached for long.
 */
import type { Vehicle } from "../types";

/** Maximum photos per vehicle. Keep in step with the backend constant. */
export const MAX_VEHICLE_IMAGES = 5;

export type VehicleImage = {
    image_id: string;
    /** Temporary link, or null if the server could not create one. */
    url: string | null;
};

/**
 * The photos of a vehicle. Written so it works even if your `Vehicle` type in
 * src/types.ts has no `images` field yet (add `images?: VehicleImage[]` there
 * when convenient, then this cast is no longer needed).
 */
export function imagesOf(vehicle: Vehicle): VehicleImage[] {
    return (vehicle as Vehicle & { images?: VehicleImage[] }).images ?? [];
}

/**
 * Photo links on the PUBLIC scan page. After verification the backend sends
 * each vehicle with `photos: string[]` (temporary links, about 10 minutes).
 * Written as a cast so it works even if `EmergencyData` in src/types.ts has
 * no `photos` field yet.
 */
export function scanPhotosOf(vehicle: object): string[] {
    return (vehicle as unknown as { photos?: string[] }).photos ?? [];
}