// src/components/dashboard/InventoryAlertCard.tsx
import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AlertTriangle, Calendar, Package } from 'lucide-react';
import { formatDate } from '@/utils/helpers';

export interface InventoryAlert {
  id: string;
  medicineName: string;
  genericName?: string;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
  expiryDate?: string | null;
  campName?: string;
}

export const InventoryAlertCard: React.FC<{ item: InventoryAlert; onRestock?: (id: string) => void }> = ({
  item,
  onRestock,
}) => {
  const isLowStock = item.quantity <= item.lowStockThreshold;
  const isExpiringSoon =
    item.expiryDate &&
    new Date(item.expiryDate).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;

  return (
    <Card hover className="p-4 border-l-4 border-l-amber-500 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {item.medicineName}
              </h4>
              {item.genericName && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {item.genericName}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            {isLowStock && (
              <Badge variant="warning" size="sm">
                Low Stock
              </Badge>
            )}
            {isExpiringSoon && (
              <Badge variant="danger" size="sm">
                Expiring Soon
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs">
          <div>
            <span className="text-slate-400 text-[10px] block">Stock Level</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {item.quantity} {item.unit}
            </span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block">Threshold</span>
            <span className="text-slate-600 dark:text-slate-300">
              {item.lowStockThreshold} {item.unit}
            </span>
          </div>
        </div>

        {item.expiryDate && (
          <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-slate-500 dark:text-slate-400">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>Expires: {formatDate(item.expiryDate)}</span>
          </div>
        )}
      </div>

      {onRestock && (
        <button
          onClick={() => onRestock(item.id)}
          className="mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-colors text-center"
        >
          Request Reorder
        </button>
      )}
    </Card>
  );
};

export default InventoryAlertCard;

