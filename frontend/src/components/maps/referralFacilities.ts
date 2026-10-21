// src/components/maps/referralFacilities.ts

export interface ReferralHospital {
  id: string;
  name: string;
  district: string;
  type: 'Tertiary Medical College' | 'District Civil Hospital' | 'Specialty Institute';
  latitude: number;
  longitude: number;
  beds: number;
  emergencyServices: boolean;
  phone: string;
  specialties: string[];
}

export const VERIFIED_REFERRAL_HOSPITALS: ReferralHospital[] = [
  {
    id: 'hosp-1',
    name: 'Victoria Hospital & BMCRI',
    district: 'Bengaluru Urban',
    type: 'Tertiary Medical College',
    latitude: 12.9629,
    longitude: 77.5739,
    beds: 1200,
    emergencyServices: true,
    phone: '+91 80 2670 1150',
    specialties: ['General Surgery', 'Cardiology', 'Emergency Trauma', 'Neurology'],
  },
  {
    id: 'hosp-2',
    name: 'NIMHANS',
    district: 'Bengaluru Urban',
    type: 'Specialty Institute',
    latitude: 12.9392,
    longitude: 77.5959,
    beds: 950,
    emergencyServices: true,
    phone: '+91 80 2699 5000',
    specialties: ['Neurology', 'Psychiatry', 'Neurosurgery', 'Mental Health'],
  },
  {
    id: 'hosp-3',
    name: 'Karnataka Institute of Medical Sciences (KIMS)',
    district: 'Hubballi-Dharwad',
    type: 'Tertiary Medical College',
    latitude: 15.3619,
    longitude: 75.1278,
    beds: 1100,
    emergencyServices: true,
    phone: '+91 836 237 0057',
    specialties: ['Cardiology', 'Pediatrics', 'Oncology', 'Orthopedics'],
  },
  {
    id: 'hosp-4',
    name: 'KR Hospital & MMCRI',
    district: 'Mysuru',
    type: 'Tertiary Medical College',
    latitude: 12.3168,
    longitude: 76.6508,
    beds: 1050,
    emergencyServices: true,
    phone: '+91 821 252 0512',
    specialties: ['General Medicine', 'Ophthalmology', 'Obstetrics', 'Dialysis'],
  },
  {
    id: 'hosp-5',
    name: 'District Civil Hospital (BIMS)',
    district: 'Belagavi',
    type: 'District Civil Hospital',
    latitude: 15.8569,
    longitude: 74.5097,
    beds: 750,
    emergencyServices: true,
    phone: '+91 831 242 1464',
    specialties: ['Emergency Trauma', 'General Surgery', 'Pediatrics'],
  },
  {
    id: 'hosp-6',
    name: 'Government Wenlock Hospital',
    district: 'Dakshina Kannada (Mangaluru)',
    type: 'District Civil Hospital',
    latitude: 12.8687,
    longitude: 74.8427,
    beds: 800,
    emergencyServices: true,
    phone: '+91 824 242 4444',
    specialties: ['Coastal Emergency', 'Infectious Diseases', 'Cardiology'],
  },
  {
    id: 'hosp-7',
    name: 'Gulbarga Institute of Medical Sciences (GIMS)',
    district: 'Kalaburagi',
    type: 'Tertiary Medical College',
    latitude: 17.3361,
    longitude: 76.8375,
    beds: 700,
    emergencyServices: true,
    phone: '+91 8472 278 600',
    specialties: ['General Medicine', 'Pulmonology', 'Dermatology'],
  },
  {
    id: 'hosp-8',
    name: 'Vijayanagar Institute of Medical Sciences (VIMS)',
    district: 'Ballari',
    type: 'Tertiary Medical College',
    latitude: 15.1432,
    longitude: 76.9248,
    beds: 680,
    emergencyServices: true,
    phone: '+91 8392 235 204',
    specialties: ['Orthopedics', 'Pediatrics', 'Ophthalmology'],
  },
  {
    id: 'hosp-9',
    name: 'District Hospital Davanagere',
    district: 'Davanagere',
    type: 'District Civil Hospital',
    latitude: 14.4682,
    longitude: 75.9189,
    beds: 450,
    emergencyServices: true,
    phone: '+91 8192 231 100',
    specialties: ['General Surgery', 'Obstetrics', 'Dialysis'],
  },
  {
    id: 'hosp-10',
    name: 'McGann District Teaching Hospital (SIMS)',
    district: 'Shivamogga',
    type: 'Tertiary Medical College',
    latitude: 13.9324,
    longitude: 75.5712,
    beds: 550,
    emergencyServices: true,
    phone: '+91 8182 222 291',
    specialties: ['General Medicine', 'Cardiology', 'Pediatrics'],
  },
];
