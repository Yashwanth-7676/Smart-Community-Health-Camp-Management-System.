// src/pages/doctor/DoctorPatients.tsx
import React, { useState, useEffect } from 'react';
import { SearchBar } from '@/components/common/SearchBar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CheckupForm } from '@/components/forms/CheckupForm';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { Users, Stethoscope, Phone, Calendar, HeartPulse } from 'lucide-react';
import apiClient from '@/api/client';
import { formatDate } from '@/utils/helpers';

export const DoctorPatients: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCheckup, setActiveCheckup] = useState<any>(null);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/doctors/patients');
      setPatients(res.data?.data || []);
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter((p: any) => {
    const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
    const phone = p.phone || '';
    return fullName.includes(search.toLowerCase()) || phone.includes(search);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            Clinical Records
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Assigned Patients
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review patient health backgrounds, ongoing allergies, and consultation history.
          </p>
        </div>
      </div>

      <SearchBar
        value={search}
        onSearch={setSearch}
        placeholder="Search patient by name or phone..."
      />

      {isLoading ? (
        <div className="space-y-3">
          <SkeletonLoader.CardSkeleton />
          <SkeletonLoader.CardSkeleton />
        </div>
      ) : filteredPatients.length === 0 ? (
        <Card className="p-8 text-center text-slate-500">
          No patients found matching your search.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPatients.map((patient: any) => {
            const name = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patient.email;
            return (
              <Card key={patient.id} hover className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 font-bold flex items-center justify-center">
                        {name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{name}</h3>
                        <p className="text-xs text-slate-500">{patient.phone || patient.email}</p>
                      </div>
                    </div>
                    {patient.patientProfile?.bloodGroup && (
                      <Badge variant="danger" size="sm">
                        {patient.patientProfile.bloodGroup.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl mb-4">
                    <p>
                      <strong>Gender:</strong> {patient.patientProfile?.gender || 'Not specified'}
                    </p>
                    {patient.patientProfile?.medicalHistory && (
                      <p>
                        <strong>History:</strong> {patient.patientProfile.medicalHistory}
                      </p>
                    )}
                    {patient.patientProfile?.allergies?.length > 0 && (
                      <p className="text-rose-600 dark:text-rose-400 font-medium">
                        <strong>Allergies:</strong> {patient.patientProfile.allergies.join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setActiveCheckup(patient)}
                  leftIcon={<Stethoscope className="w-3.5 h-3.5" />}
                >
                  Conduct Health Checkup
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {activeCheckup && (
        <Modal
          isOpen={Boolean(activeCheckup)}
          onClose={() => setActiveCheckup(null)}
          title="Clinical Examination Form"
          maxWidth="lg"
        >
          <CheckupForm
            patientId={activeCheckup.id}
            patientName={`${activeCheckup.firstName || ''} ${activeCheckup.lastName || ''}`.trim() || 'Patient'}
            campId={activeCheckup.campId || 'default-camp'}
            onSuccess={() => {
              setActiveCheckup(null);
              fetchPatients();
            }}
            onCancel={() => setActiveCheckup(null)}
          />
        </Modal>
      )}
    </div>
  );
};

export default DoctorPatients;

