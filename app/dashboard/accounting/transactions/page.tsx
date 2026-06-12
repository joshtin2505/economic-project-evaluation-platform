"use client";

import { useCallback, useEffect, useState } from "react";
import { TransactionForm } from "@/components/accounting/transaction-form";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { fetchTransactionCategories } from "@/lib/services/accounting-setup";
import { fetchContacts } from "@/lib/services/accounting-contacts";
import {
  fetchTransactions,
  recordExpense,
  recordIncome,
  voidTransaction,
  type JournalEntryRow,
} from "@/lib/services/accounting-transactions";
import { fetchProjects } from "@/lib/services/projects";
import {
  formatAccountingDate,
  formatCop,
} from "@/lib/utils/accounting-format";
import { toast } from "sonner";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<JournalEntryRow[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<
    { id: string; name: string }[]
  >([]);
  const [expenseCategories, setExpenseCategories] = useState<
    { id: string; name: string }[]
  >([]);
  const [contacts, setContacts] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [txs, incCats, expCats, contactList, projectList] =
        await Promise.all([
          fetchTransactions(),
          fetchTransactionCategories("income"),
          fetchTransactionCategories("expense"),
          fetchContacts(),
          fetchProjects(),
        ]);
      setTransactions(txs);
      setIncomeCategories(incCats.map((c) => ({ id: c.id, name: c.name })));
      setExpenseCategories(expCats.map((c) => ({ id: c.id, name: c.name })));
      setContacts(contactList.map((c) => ({ id: c.id, name: c.name })));
      setProjects(
        (projectList ?? []).map((p: { id: string; name: string }) => ({
          id: p.id,
          name: p.name,
        })),
      );
    } catch (err) {
      toast.error("Error al cargar transacciones");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleIncome = async (data: Parameters<typeof recordIncome>[0]) => {
    await recordIncome(data);
    toast.success("Ingreso registrado");
    await loadData();
  };

  const handleExpense = async (data: Parameters<typeof recordExpense>[0]) => {
    await recordExpense(data);
    toast.success("Gasto registrado");
    await loadData();
  };

  const handleVoid = async (id: string) => {
    if (!confirm("¿Anular esta transacción?")) return;
    try {
      await voidTransaction(id);
      toast.success("Transacción anulada");
      await loadData();
    } catch (err) {
      toast.error("Error al anular");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Transacciones</h1>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Historial</TabsTrigger>
          <TabsTrigger value="income">Nuevo ingreso</TabsTrigger>
          <TabsTrigger value="expense">Nuevo gasto</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Movimientos registrados</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Cargando...</p>
              ) : transactions.length === 0 ? (
                <p className="text-muted-foreground">
                  No hay transacciones. Registra tu primer ingreso o gasto.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Proyecto</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          {formatAccountingDate(tx.entry_date)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              tx.transaction_type === "income"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {tx.transaction_type === "income"
                              ? "Ingreso"
                              : "Gasto"}
                          </Badge>
                        </TableCell>
                        <TableCell>{tx.description}</TableCell>
                        <TableCell>
                          {tx.projects?.name ?? "—"}
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium ${tx.transaction_type === "income" ? "text-green-600" : "text-red-600"}`}
                        >
                          {tx.transaction_type === "income" ? "+" : "-"}
                          {formatCop(Number(tx.amount))}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVoid(tx.id)}
                          >
                            Anular
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Registrar ingreso</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionForm
                type="income"
                categories={incomeCategories}
                contacts={contacts}
                projects={projects}
                onSubmit={handleIncome}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expense" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Registrar gasto</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionForm
                type="expense"
                categories={expenseCategories}
                contacts={contacts}
                projects={projects}
                onSubmit={handleExpense}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
