"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Category {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
}

interface TransactionFormProps {
  type: "income" | "expense";
  categories: Category[];
  contacts: Contact[];
  projects: Project[];
  onSubmit: (data: {
    entry_date: string;
    description: string;
    amount: number;
    category_id: string;
    contact_id?: string;
    project_id?: string;
  }) => Promise<void>;
  onCancel?: () => void;
}

export function TransactionForm({
  type,
  categories,
  contacts,
  projects,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const [entryDate, setEntryDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const NONE = "__none__";
  const [contactId, setContactId] = useState(NONE);
  const [projectId, setProjectId] = useState(NONE);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !amount) return;
    setLoading(true);
    try {
      await onSubmit({
        entry_date: entryDate,
        description: description || (type === "income" ? "Ingreso" : "Gasto"),
        amount: parseFloat(amount),
        category_id: categoryId,
        contact_id: contactId !== NONE ? contactId : undefined,
        project_id: projectId !== NONE ? projectId : undefined,
      });
      setDescription("");
      setAmount("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="entry_date">Fecha</Label>
          <Input
            id="entry_date"
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Monto (COP)</Label>
          <Input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={
            type === "income" ? "Ej: Venta de productos" : "Ej: Pago de arriendo"
          }
        />
      </div>

      <div className="space-y-2">
        <Label>Categoría</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar categoría" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Cliente / Proveedor (opcional)</Label>
          <Select value={contactId} onValueChange={setContactId}>
            <SelectTrigger>
              <SelectValue placeholder="Ninguno" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Ninguno</SelectItem>
              {contacts.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Proyecto (opcional)</Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Ninguno" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Ninguno</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : type === "income" ? "Registrar ingreso" : "Registrar gasto"}
        </Button>
      </div>
    </form>
  );
}
