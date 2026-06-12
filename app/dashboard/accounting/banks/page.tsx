"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Textarea } from "@/components/ui/textarea";
import {
  createBankAccount,
  fetchBankAccounts,
  fetchUnreconciledTransactions,
  importBankCsv,
  reconcileBankTransaction,
} from "@/lib/services/accounting-banks";
import { fetchTransactionCategories } from "@/lib/services/accounting-setup";
import { formatAccountingDate, formatCop } from "@/lib/utils/accounting-format";
import { toast } from "sonner";

export default function BanksPage() {
  const [accounts, setAccounts] = useState<
    Awaited<ReturnType<typeof fetchBankAccounts>>
  >([]);
  const [unreconciled, setUnreconciled] = useState<
    Awaited<ReturnType<typeof fetchUnreconciledTransactions>>
  >([]);
  const [incomeCategories, setIncomeCategories] = useState<
    { id: string; name: string }[]
  >([]);
  const [expenseCategories, setExpenseCategories] = useState<
    { id: string; name: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [csvContent, setCsvContent] = useState("");
  const [importing, setImporting] = useState(false);
  const [accountForm, setAccountForm] = useState({
    name: "",
    bank_name: "",
    account_number: "",
  });
  const [reconcileCategory, setReconcileCategory] = useState<
    Record<string, string>
  >({});

  const loadData = useCallback(async () => {
    try {
      const [accs, unrec, incCats, expCats] = await Promise.all([
        fetchBankAccounts(),
        fetchUnreconciledTransactions(),
        fetchTransactionCategories("income"),
        fetchTransactionCategories("expense"),
      ]);
      setAccounts(accs);
      setUnreconciled(unrec);
      setIncomeCategories(incCats.map((c) => ({ id: c.id, name: c.name })));
      setExpenseCategories(expCats.map((c) => ({ id: c.id, name: c.name })));
      if (accs.length > 0 && !selectedAccount) {
        setSelectedAccount(accs[0].id);
      }
    } catch {
      toast.error("Error al cargar bancos");
    } finally {
      setLoading(false);
    }
  }, [selectedAccount]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.name.trim()) return;
    try {
      await createBankAccount(accountForm);
      toast.success("Cuenta bancaria creada");
      setAccountForm({ name: "", bank_name: "", account_number: "" });
      await loadData();
    } catch {
      toast.error("Error al crear cuenta");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCsvContent((ev.target?.result as string) ?? "");
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!selectedAccount || !csvContent) {
      toast.error("Seleccione cuenta y archivo CSV");
      return;
    }
    setImporting(true);
    try {
      const result = await importBankCsv(selectedAccount, csvContent);
      toast.success(`${result.imported} movimientos importados`);
      setCsvContent("");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al importar");
    } finally {
      setImporting(false);
    }
  };

  const handleReconcile = async (txId: string, isIncome: boolean) => {
    const categoryId = reconcileCategory[txId];
    if (!categoryId) {
      toast.error("Seleccione una categoría");
      return;
    }
    try {
      await reconcileBankTransaction(txId, { category_id: categoryId });
      toast.success("Movimiento conciliado");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al conciliar");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bancos y conciliación</h1>

      <Tabs defaultValue="reconcile">
        <TabsList>
          <TabsTrigger value="reconcile">Conciliar</TabsTrigger>
          <TabsTrigger value="import">Importar CSV</TabsTrigger>
          <TabsTrigger value="accounts">Cuentas</TabsTrigger>
        </TabsList>

        <TabsContent value="reconcile" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Movimientos sin conciliar ({unreconciled.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Cargando...</p>
              ) : unreconciled.length === 0 ? (
                <p className="text-muted-foreground">
                  No hay movimientos pendientes de conciliar.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cuenta</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unreconciled.map((tx) => {
                      const isIncome = Number(tx.amount) >= 0;
                      const cats = isIncome ? incomeCategories : expenseCategories;
                      return (
                        <TableRow key={tx.id}>
                          <TableCell>
                            {formatAccountingDate(tx.transaction_date)}
                          </TableCell>
                          <TableCell>
                            {(tx.bank_accounts as { name?: string })?.name}
                          </TableCell>
                          <TableCell>{tx.description}</TableCell>
                          <TableCell
                            className={`text-right font-medium ${isIncome ? "text-green-600" : "text-red-600"}`}
                          >
                            {formatCop(Number(tx.amount))}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={reconcileCategory[tx.id] ?? ""}
                              onValueChange={(v) =>
                                setReconcileCategory((prev) => ({
                                  ...prev,
                                  [tx.id]: v,
                                }))
                              }
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Categoría" />
                              </SelectTrigger>
                              <SelectContent>
                                {cats.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => handleReconcile(tx.id, isIncome)}
                            >
                              Conciliar
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Importar extracto CSV</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              <div className="space-y-2">
                <Label>Cuenta bancaria</Label>
                <Select
                  value={selectedAccount}
                  onValueChange={setSelectedAccount}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} {a.bank_name ? `(${a.bank_name})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Archivo CSV</Label>
                <Input type="file" accept=".csv,.txt" onChange={handleFileUpload} />
                <p className="text-xs text-muted-foreground">
                  Columnas esperadas: fecha, descripción, monto (separador , o ;)
                </p>
              </div>
              {csvContent && (
                <div className="space-y-2">
                  <Label>Vista previa</Label>
                  <Textarea
                    value={csvContent.split("\n").slice(0, 5).join("\n")}
                    readOnly
                    rows={4}
                  />
                </div>
              )}
              <Button
                onClick={handleImport}
                disabled={importing || !csvContent || !selectedAccount}
              >
                {importing ? "Importando..." : "Importar movimientos"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Cuentas registradas</CardTitle>
              </CardHeader>
              <CardContent>
                {accounts.length === 0 ? (
                  <p className="text-muted-foreground">No hay cuentas bancarias.</p>
                ) : (
                  <div className="space-y-3">
                    {accounts.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium">{a.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {a.bank_name} {a.account_number && `· ${a.account_number}`}
                          </p>
                        </div>
                        <Badge variant="outline">{a.currency.toUpperCase()}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Nueva cuenta bancaria</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateAccount} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="acc_name">Nombre</Label>
                    <Input
                      id="acc_name"
                      value={accountForm.name}
                      onChange={(e) =>
                        setAccountForm((f) => ({ ...f, name: e.target.value }))
                      }
                      placeholder="Ej: Cuenta corriente principal"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Banco</Label>
                    <Input
                      id="bank_name"
                      value={accountForm.bank_name}
                      onChange={(e) =>
                        setAccountForm((f) => ({
                          ...f,
                          bank_name: e.target.value,
                        }))
                      }
                      placeholder="Ej: Bancolombia"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account_number">Número de cuenta</Label>
                    <Input
                      id="account_number"
                      value={accountForm.account_number}
                      onChange={(e) =>
                        setAccountForm((f) => ({
                          ...f,
                          account_number: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <Button type="submit">Agregar cuenta</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
