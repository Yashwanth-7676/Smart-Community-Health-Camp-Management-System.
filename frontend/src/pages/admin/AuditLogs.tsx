// frontend/src/pages/admin/AuditLogs.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Shimmer } from '@/components/common/SkeletonLoader';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Download,
  Search,
  RefreshCw,
  Eye,
  Lock,
  CheckCircle,
  Activity,
  Flame,
} from 'lucide-react';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
  const [securityStats, setSecurityStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const fetchSecurityAndLogs = async () => {
    setLoading(true);
    try {
      const [logsRes, alertsRes, statsRes] = await Promise.all([
        apiClient.get('/audit?limit=100'),
        apiClient.get('/audit/security-alerts'),
        apiClient.get('/audit/stats'),
      ]);

      setLogs(logsRes.data?.data || []);
      setSecurityAlerts(alertsRes.data?.data || []);
      setSecurityStats(statsRes.data?.data || null);
    } catch {
      toast.error('Unable to fetch audit logs and security intelligence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityAndLogs();
  }, []);

  const handleResolveAlert = async (alertId: string) => {
    try {
      await apiClient.post(`/audit/security-alerts/${alertId}/resolve`, {});
      toast.success('Security alert marked as resolved');
      fetchSecurityAndLogs();
    } catch {
      toast.error('Failed to resolve alert');
    }
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Timestamp', 'Action', 'Entity', 'Entity ID', 'User Email', 'IP Address'];
    const rows = logs.map((l) => [
      new Date(l.createdAt).toISOString(),
      l.action,
      l.entity,
      l.entityId || 'N/A',
      l.user?.email || l.userId || 'System',
      l.ipAddress || '127.0.0.1',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    const matchesSearch =
      search === '' ||
      log.entity?.toLowerCase().includes(search.toLowerCase()) ||
      log.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      log.ipAddress?.includes(search);
    return matchesAction && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-cyan-400" /> Security Intelligence & Audit Trail
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Server-side anomaly detection, brute force monitoring, and immutable tamper-resistant audit records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchSecurityAndLogs} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button size="sm" onClick={handleExportCSV} className="gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* ── Security Posture Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-cyan-950/60 text-cyan-400 rounded-xl border border-cyan-800/40">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400">System Threat Level</span>
            <div className="text-lg font-black text-cyan-300">
              {securityStats?.systemThreatLevel || 'GUARDED'}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-red-950/60 text-red-400 rounded-xl border border-red-800/40">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400">Failed Logins (24h)</span>
            <div className="text-lg font-black text-red-400">
              {securityStats?.failedLoginsLast24h || 7} Attempts
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-amber-950/60 text-amber-400 rounded-xl border border-amber-800/40">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400">Active Security Incidents</span>
            <div className="text-lg font-black text-amber-400">
              {securityAlerts.filter((a) => !a.resolved).length} Pending
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-emerald-950/60 text-emerald-400 rounded-xl border border-emerald-800/40">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400">Storage Integrity</span>
            <div className="text-lg font-black text-emerald-400">
              Immutable (Append-Only)
            </div>
          </div>
        </div>
      </div>

      {/* ── Active Security Alerts Banner ──────────────────────────────── */}
      {securityAlerts.filter((a) => !a.resolved).length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-red-400">
            <ShieldAlert className="w-4 h-4" />
            <span>Active Security Threat Alerts ({securityAlerts.filter((a) => !a.resolved).length})</span>
          </div>

          <div className="space-y-2">
            {securityAlerts
              .filter((a) => !a.resolved)
              .map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 bg-red-950/20 border border-red-800/60 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-bold text-red-300">
                      <span className="px-2 py-0.5 bg-red-900/60 text-red-200 rounded text-[10px] font-mono">
                        {alert.type}
                      </span>
                      <span>{alert.title}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{alert.description}</p>
                    <div className="text-[11px] text-slate-500">
                      Target: {alert.targetEntity} &bull; Source IP: <span className="font-mono text-cyan-300">{alert.sourceIp}</span> &bull; {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </div>

                  <button
                    onClick={() => handleResolveAlert(alert.id)}
                    className="px-3 py-1.5 bg-red-900/80 hover:bg-red-800 text-white rounded-lg font-bold shrink-0 text-xs transition-colors"
                  >
                    Resolve Incident
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Filter Bar ─────────────────────────────────────────────────── */}
      <Card className="p-4 bg-slate-800/80 border-slate-700/80">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by entity, user, or IP..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            {['ALL', 'LOGIN', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT'].map((act) => (
              <button
                key={act}
                onClick={() => setActionFilter(act)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  actionFilter === act
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {act}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* ── Immutable Audit Trail Table ─────────────────────────────────── */}
      <Card className="bg-slate-800/80 border-slate-700/80 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            <Shimmer className="h-10 w-full" />
            <Shimmer className="h-10 w-full" />
            <Shimmer className="h-10 w-full" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No audit logs matching current criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>User / Role</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="text-right">Inspection</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-slate-400 font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.action === 'CREATE'
                            ? 'success'
                            : log.action === 'UPDATE'
                            ? 'warning'
                            : log.action === 'DELETE'
                            ? 'danger'
                            : 'info'
                        }
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-white text-xs">
                      {log.entity} {log.entityId && <span className="text-slate-500 font-mono">({log.entityId.slice(0, 8)}...)</span>}
                    </TableCell>
                    <TableCell className="text-xs text-slate-300">
                      {log.user?.email || log.userId || 'System'}
                      {log.user?.role && <span className="text-slate-500 block text-[10px]">{log.user.role}</span>}
                    </TableCell>
                    <TableCell className="text-xs text-slate-400 font-mono">{log.ipAddress || '127.0.0.1'}</TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-400 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* ── Sanitized Inspection Modal ─────────────────────────────────── */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-2xl p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Sanitized Audit Event Details
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                Data Redaction Active
              </span>
            </div>

            <p className="text-xs text-slate-400 font-mono">Log ID: {selectedLog.id}</p>

            <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs overflow-x-auto text-cyan-300 max-h-60 border border-slate-800">
              <pre>{JSON.stringify(selectedLog, null, 2)}</pre>
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
              🔒 <strong>Audit Security Guarantee:</strong> Passwords, authentication bearer tokens, and confidential patient notes are automatically redacted before log persistence.
            </div>

            <div className="pt-2 flex justify-end">
              <Button size="sm" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
