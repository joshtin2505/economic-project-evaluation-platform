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
import {
  createContact,
  deleteContact,
  fetchContacts,
  type ContactRow,
} from "@/lib/services/accounting-contacts";
import { toast } from "sonner";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    contact_type: "customer" as "customer" | "supplier" | "both",
    tax_id: "",
    name: "",
    email: "",
    phone: "",
  });

  const loadContacts = useCallback(async () => {
    try {
      const data = await fetchContacts();
      setContacts(data);
    } catch {
      toast.error("Error al cargar contactos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await createContact(form);
      toast.success("Contacto creado");
      setForm({ contact_type: "customer", tax_id: "", name: "", email: "", phone: "" });
      await loadContacts();
    } catch {
      toast.error("Error al crear contacto");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este contacto?")) return;
    try {
      await deleteContact(id);
      toast.success("Contacto eliminado");
      await loadContacts();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const typeLabel = (type: string) => {
    if (type === "customer") return "Cliente";
    if (type === "supplier") return "Proveedor";
    return "Ambos";
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Clientes y proveedores</h1>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="new">Nuevo contacto</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <p className="text-muted-foreground">Cargando...</p>
              ) : contacts.length === 0 ? (
                <p className="text-muted-foreground">No hay contactos registrados.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>NIT/CC</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.tax_id || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{typeLabel(c.contact_type)}</Badge>
                        </TableCell>
                        <TableCell>{c.email || "—"}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(c.id)}
                          >
                            Eliminar
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

        <TabsContent value="new" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Nuevo contacto</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4 max-w-lg">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={form.contact_type}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        contact_type: v as typeof form.contact_type,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Cliente</SelectItem>
                      <SelectItem value="supplier">Proveedor</SelectItem>
                      <SelectItem value="both">Cliente y proveedor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre / Razón social</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_id">NIT / Cédula</Label>
                  <Input
                    id="tax_id"
                    value={form.tax_id}
                    onChange={(e) => setForm((f) => ({ ...f, tax_id: e.target.value }))}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Crear contacto"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
