"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchProjectAccountingComparison,
  syncProjectCashFlowsFromAccounting,
} from "@/lib/services/accounting-project-bridge";
import { formatCop } from "@/lib/utils/accounting-format";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ProjectAccountingPanelProps {
  projectId: string;
}

export function ProjectAccountingPanel({ projectId }: ProjectAccountingPanelProps) {
  const [comparison, setComparison] = useState<
    Awaited<ReturnType<typeof fetchProjectAccountingComparison>>
  >([]);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadComparison = useCallback(async () => {
    try {
      const data = await fetchProjectAccountingComparison(projectId);
      setComparison(data);
    } catch {
      toast.error("Error al cargar datos contables del proyecto");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadComparison();
  }, [loadComparison]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncProjectCashFlowsFromAccounting(projectId);
      toast.success(
        `Flujos actualizados desde contabilidad (${result.periodsUpdated} períodos)`,
      );
      await loadComparison();
    } catch (err) {
      toast.error("Error al sincronizar flujos");
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Datos reales desde contabilidad</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Compara flujos proyectados vs transacciones contables etiquetadas con este proyecto
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleSync}
          disabled={syncing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          Sincronizar flujos
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-sm">Cargando...</p>
        ) : comparison.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Etiqueta transacciones con este proyecto en Contabilidad → Transacciones,
            luego sincroniza para alimentar los flujos de caja.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Proyectado</TableHead>
                <TableHead className="text-right">Real</TableHead>
                <TableHead className="text-right">Desviación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparison.map((row) => (
                <TableRow key={row.period}>
                  <TableCell>{row.period}</TableCell>
                  <TableCell className="text-right">
                    {formatCop(row.projectedNet)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCop(row.actualNet)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${row.variance >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {row.variance >= 0 ? "+" : ""}
                    {formatCop(row.variance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
