/**
 * components/onboarding/VehiclePhotos.tsx
 * ---------------------------------------------------------------------------
 * The photo strip under a SAVED vehicle in the onboarding wizard. A thin
 * wrapper around the shared strip (components/vehicles/VehiclePhotoStrip.tsx)
 * that connects it to the wizard's upload and delete actions.
 */
import type { OnboardingApi } from "../../hooks/useOnboarding";
import type { Vehicle } from "../../types";
import { VehiclePhotoStrip } from "../vehicles/VehiclePhotoStrip";

type Props = {
    vehicle: Vehicle;
    ob: OnboardingApi;
};

export function VehiclePhotos({ vehicle, ob }: Props) {
    return (
        <VehiclePhotoStrip
            vehicle={vehicle}
            busy={ob.busy}
            onUpload={(files) => void ob.uploadVehicleImages(vehicle.vehicle_id, files)}
            onDelete={(imageId) =>
                void ob.deleteVehicleImage(vehicle.vehicle_id, imageId)
            }
        />
    );
}