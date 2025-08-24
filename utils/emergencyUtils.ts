import { EMERGENCY_TYPES, EmergencyType } from '../types/emergency';
import { AmbulanceType, Hospital } from '../types/patient';

/**
 * Filter ambulance types based on emergency requirements
 */
export function getAvailableAmbulanceTypes(emergencyId: string): AmbulanceType[] {
  const emergency = EMERGENCY_TYPES.find(e => e.id === emergencyId);
  if (!emergency) {
    // If no emergency selected, show all types
    return ['bls', 'als', 'ccs', 'auto', 'bike'];
  }
  return emergency.requiredAmbulanceTypes;
}

/**
 * Filter hospitals based on emergency services required
 */
export function filterHospitalsByEmergency(hospitals: Hospital[], emergencyId: string): Hospital[] {
  const emergency = EMERGENCY_TYPES.find(e => e.id === emergencyId);
  if (!emergency) {
    // If no emergency selected, show all hospitals
    return hospitals;
  }

  return hospitals.filter(hospital => {
    // If hospital doesn't have services data, include it (backward compatibility)
    if (!hospital.emergencyServices || hospital.emergencyServices.length === 0) {
      return true;
    }

    // Normalize required and hospital services
    const required = emergency.requiredHospitalServices.map(s => s.trim().toLowerCase());
    const services = hospital.emergencyServices.map(s => s.trim().toLowerCase());

    // Fallback alternatives logic
    function matchesService(requiredService: string): boolean {
      if (services.includes(requiredService)) return true;
      if (requiredService === 'pulmonology' && services.includes('intensive_care')) return true;
      if (requiredService === 'cardiology' && services.includes('intensive_care')) return true;
      if (requiredService === 'cardiac_catheterization' && (services.includes('cardiology') || services.includes('intensive_care'))) return true;
      if (requiredService === 'neurology' && services.includes('intensive_care')) return true;
      if (requiredService === 'cardiac_surgery' && (services.includes('surgery') || services.includes('cardiology'))) return true;
      if (requiredService === 'trauma_surgery' && services.includes('surgery')) return true;
      if (requiredService === 'blood_bank' && services.includes('surgery')) return true;
      return false;
    }

    // Count matches (including fallbacks)
    const matchCount = required.filter(matchesService).length;

    if (required.length === 1) return matchCount === 1;
    if (required.length === 2) return matchCount === 2;
    if (required.length >= 3) return matchCount >= 2;
    return false;
  });
}

/**
 * Check if a hospital is suitable for an emergency
 */
export function isHospitalSuitableForEmergency(hospital: Hospital, emergencyId: string): boolean {
  const emergency = EMERGENCY_TYPES.find(e => e.id === emergencyId);
  if (!emergency) return true;

  const required = emergency.requiredHospitalServices.map(s => s.trim().toLowerCase());
  const services = (hospital.emergencyServices || []).map(s => s.trim().toLowerCase());

  function matchesService(requiredService: string): boolean {
    if (services.includes(requiredService)) return true;
    if (requiredService === 'pulmonology' && services.includes('intensive_care')) return true;
    if (requiredService === 'cardiology' && services.includes('intensive_care')) return true;
    if (requiredService === 'cardiac_catheterization' && (services.includes('cardiology') || services.includes('intensive_care'))) return true;
    if (requiredService === 'neurology' && services.includes('intensive_care')) return true;
    if (requiredService === 'cardiac_surgery' && (services.includes('surgery') || services.includes('cardiology'))) return true;
    if (requiredService === 'trauma_surgery' && services.includes('surgery')) return true;
    if (requiredService === 'blood_bank' && services.includes('surgery')) return true;
    return false;
  }

  // For suitability, require all required services to be matched (including fallbacks)
  return required.every(matchesService);
}

/**
 * Get emergency details by ID
 */
export function getEmergencyById(emergencyId: string): EmergencyType | undefined {
  return EMERGENCY_TYPES.find(e => e.id === emergencyId);
}

/**
 * Get priority color for emergency
 */
export function getEmergencyPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return '#ef4444';
    case 'high': return '#f59e0b';
    case 'medium': return '#3b82f6';
    case 'low': return '#10b981';
    default: return '#6b7280';
  }
}

/**
 * Get suggested ambulance type for emergency (most appropriate one)
 */
export function getSuggestedAmbulanceType(emergencyId: string): AmbulanceType {
  const emergency = EMERGENCY_TYPES.find(e => e.id === emergencyId);
  if (!emergency || emergency.requiredAmbulanceTypes.length === 0) {
    return 'bls'; // Default
  }

  // Return the most advanced ambulance type for the emergency
  const types = emergency.requiredAmbulanceTypes;
  if (types.includes('ccs')) return 'ccs';
  if (types.includes('als')) return 'als';
  if (types.includes('bls')) return 'bls';
  if (types.includes('auto')) return 'auto';
  return 'bike';
}

/**
 * Enhanced hospital search with Google Places API integration
 */
export async function searchHospitalsWithEmergencyServices(
  location: { latitude: number; longitude: number },
  emergencyId: string,
    radius: number = 5000
): Promise<Hospital[]> {
  const emergency = EMERGENCY_TYPES.find(e => e.id === emergencyId);
  if (!emergency) return [];

  // Build search query based on emergency type
  let searchQuery = 'hospital emergency';
  
  // Add specific search terms based on emergency type
  switch (emergency.category) {
    case 'cardiac':
      searchQuery += ' cardiology heart cardiac catheterization';
      break;
    case 'trauma':
      searchQuery += ' trauma center orthopedics surgery blood bank';
      break;
    case 'neurological':
      searchQuery += ' neurology stroke center ct scan neurosurgery brain';
      break;
    case 'pediatric':
      searchQuery += ' pediatric children nicu baby infant';
      break;
    case 'obstetric':
      searchQuery += ' maternity obstetrics gynecology delivery room pregnancy birth labor';
      break;
    case 'burns':
      searchQuery += ' burn unit plastic surgery';
      break;
    case 'psychiatric':
      searchQuery += ' psychiatric mental health suicide depression';
      break;
    case 'poisoning':
      searchQuery += ' toxicology poisoning overdose intensive care';
      break;
    case 'general':
      searchQuery += ' general medicine urgent care endocrinology';
      break;
    default:
      searchQuery += ' emergency urgent care hospital';
      break;
  }
  return [];
}

/**
 * Infer available services from Google Places result
 */
function inferServicesFromPlace(place: any, emergency: EmergencyType): string[] {
  let services: string[] = ['emergency_room']; // All hospitals have ER

  // Infer services based on place name and types
  const name = place.name.toLowerCase();
  const types = place.types || [];

  if (name.includes('cardiac') || name.includes('heart')) {
    services.push('cardiology', 'cardiac_catheterization');
  }

  if (name.includes('trauma') || name.includes('medical center')) {
    services.push('trauma_center', 'surgery', 'blood_bank');
  }

  if (name.includes('children') || name.includes('pediatric')) {
    services.push('pediatrics', 'nicu');
  }

  if (name.includes('maternity') || name.includes('women')) {
    services.push('obstetrics', 'gynecology', 'delivery_room');
  }

  if (name.includes('neuro') || name.includes('brain')) {
    services.push('neurology', 'neurosurgery', 'stroke_center');
  }

  if (name.includes('burn')) {
    services.push('burn_unit', 'plastic_surgery');
  }

  // Add general services for larger hospitals
  if (name.includes('medical center') || name.includes('general hospital')) {
    services.push('intensive_care', 'ct_scan', 'surgery', 'blood_bank');
  }

  // Normalize all inferred services
  services = services.map(s => s.trim().toLowerCase());
  return services;
}

/**
 * Extract specialties from Google Places types
 */
function extractSpecialties(types: string[], emergencyCategory: string): string[] {
  const specialties: string[] = [];
  
  if (types.includes('hospital')) {
    specialties.push('General Medicine');
  }
  
  switch (emergencyCategory) {
    case 'cardiac':
      specialties.push('Cardiology', 'Emergency Medicine');
      break;
    case 'trauma':
      specialties.push('Trauma Surgery', 'Orthopedics', 'Emergency Medicine');
      break;
    case 'neurological':
      specialties.push('Neurology', 'Neurosurgery', 'Emergency Medicine');
      break;
    case 'pediatric':
      specialties.push('Pediatrics', 'Emergency Medicine');
      break;
    case 'obstetric':
      specialties.push('Obstetrics', 'Gynecology');
      break;
    case 'respiratory':
      specialties.push('Pulmonology', 'Emergency Medicine');
      break;
    case 'burns':
      specialties.push('Burn Care', 'Plastic Surgery');
      break;
    case 'psychiatric':
      specialties.push('Psychiatry', 'Mental Health');
      break;
    default:
      specialties.push('Emergency Medicine');
  }
  
  return specialties;
}
