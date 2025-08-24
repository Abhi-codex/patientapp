export type Hospital = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance: number;
  rating?: number;
  photoUrl?: string;
  emergencyServices?: string[];
  placeId?: string;
  specialties?: string[];
  emergencyCapabilityScore?: number;
  emergencyFeatures?: string[];
  isEmergencyVerified?: boolean;
  recommendation?: string;
  address?: string;
  isOpen?: boolean;
  priceLevel?: number;
  photos?: Array<{
    photoReference: string;
    width: number;
    height: number;
  }>;
};

export type AmbulanceType = 'bls' | 'als' | 'ccs' | 'auto' | 'bike';

export interface AmbulanceOption {
  key: AmbulanceType;
  label: string;
  desc: string;
  icon: string;
}
