import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Shimmer } from '@/components/common/SkeletonLoader';
import { Shield, CheckCircle, XCircle, RefreshCw, Lock } from 'lucide-react';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

export const ConsentManagement: React.FC = () => {
  const [consents, setConsents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');

  const fetchConsents = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/consent/all');
      setConsents(res.data?.data || []);
    } catch {
      toast.error('Unable to fetch consent records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsents();
  }, []);

  const filteredConsents = consents.filter((c) => {
    if (filterType === 'ALL') return true;
    return c.consentType === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Lock className="w-6 h-6 text-cyan-400" /> DPDP Patient Consent Governance
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Tracking voluntary consent grants and revocations in compliance with Indian healthcare regulations.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchConsents} disabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-slate-800/80 border-slate-700/80">
          <div className="text-slate-400 text-xs font-medium">Treatment Consents</div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">
            {consents.filter((c) => c.consentType === 'TREATMENT' && c.granted).length} Active
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Primary care authorization</div>
        </Card>

        <Card className="p-5 bg-slate-800/80 border-slate-700/80">
          <div className="text-slate-400 text-xs font-medium">Data Sharing Consents</div>
          <div className="text-2xl font-bold text-cyan-400 mt-2">
            {consents.filter((c) => c.consentType === 'DATA_SHARING' && c.granted).length} Active
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Referral hospital continuity</div>
        </Card>

        <Card className="p-5 bg-slate-800/80 border-slate-700/80">
          <div className="text-slate-400 text-xs font-medium">Revocation Rate</div>
          <div className="text-2xl font-bold text-amber-300 mt-2">
            {consents.filter((c) => !c.granted).length} Revoked
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Patient-requested withdrawal</div>
        </Card>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2">
        {['ALL', 'TREATMENT', 'DATA_SHARING', 'RESEARCH'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === type ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="bg-slate-800/80 border-slate-700/80 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            <Shimmer className="h-10 w-full" />
            <Shimmer className="h-10 w-full" />
            <Shimmer className="h-10 w-full" />
          </div>
        ) : filteredConsents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No consent records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User / Patient</TableHead>
                  <TableHead>Consent Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Granted Date</TableHead>
                  <TableHead>Revocation Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConsents.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs text-white">
                      {c.user?.firstName ? `${c.user.firstName} ${c.user.lastName}` : c.userId}
                      <span className="block text-[11px] text-slate-400">{c.user?.email || 'Registered User'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-xs text-cyan-300 font-mono">{c.consentType}</span>
                    </TableCell>
                    <TableCell>
                      {c.granted ? (
                        <Badge variant="success" className="gap-1 inline-flex items-center">
                          <CheckCircle className="w-3 h-3" /> Granted
                        </Badge>
                      ) : (
                        <Badge variant="danger" className="gap-1 inline-flex items-center">
                          <XCircle className="w-3 h-3" /> Revoked
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-400 font-mono">
                      {new Date(c.grantedAt || c.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-xs text-slate-400 font-mono">
                      {c.revokedAt ? new Date(c.revokedAt).toLocaleDateString() : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ConsentManagement;
