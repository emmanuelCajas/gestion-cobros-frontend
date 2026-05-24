import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import type { Client } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Search, Trash2, Eye, Loader2, BarChart3 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { z } from 'zod';

const clientSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  telefono: z.string().min(1, 'El teléfono es requerido'),
  direccion: z.string().min(1, 'La dirección es requerida'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  cedula: z.string().min(1, 'La cédula es requerida'),
});

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    email: '',
    cedula: '',
  });

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => api.clients.getAll(search || undefined),
  });

  const createMutation = useMutation({
    mutationFn: api.clients.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowForm(false);
      setFormData({ nombre: '', telefono: '', direccion: '', email: '', cedula: '' });
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: api.clients.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = clientSchema.safeParse(formData);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    createMutation.mutate({
      ...formData,
      email: formData.email || undefined,
    });
  };

  const calculateClientProgress = (client: Client) => {
    if (!client.prestamos || client.prestamos.length === 0) return 0;
    const totalOriginal = client.prestamos.reduce((sum, p) => sum + Number(p.montoOriginal), 0);
    const totalSaldo = client.prestamos.reduce((sum, p) => sum + Number(p.saldoPendiente), 0);
    if (totalOriginal === 0) return 100;
    return Math.round(((totalOriginal - totalSaldo) / totalOriginal) * 100);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold">Clientes</h2>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          <span className="sm:hidden">Nuevo</span>
          <span className="hidden sm:inline">Nuevo Cliente</span>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {showForm && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Crear Cliente</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cédula</Label>
                  <Input
                    value={formData.cedula}
                    onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email (opcional)</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-11"
                  />
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <Label>Dirección</Label>
                  <Input
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" disabled={createMutation.isPending} className="h-11">
                  {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Crear Cliente
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="h-11">
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="p-6 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
        </div>
      ) : (
        <div className="hidden sm:block">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cédula</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Préstamos</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients?.map((client: Client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.nombre}</TableCell>
                      <TableCell>{client.cedula}</TableCell>
                      <TableCell>{client.telefono}</TableCell>
                      <TableCell>{client.prestamos?.length || 0}</TableCell>
                      <TableCell className="w-48">
                        <div className="flex items-center gap-2">
                          <Progress value={calculateClientProgress(client)} className="h-2 flex-1" />
                          <BarChart3 className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600">
                            {calculateClientProgress(client)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Link to={`/clients/${client.id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(client.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="sm:hidden space-y-3">
        {clients?.map((client: Client) => (
          <Card key={client.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-base">{client.nombre}</p>
                  <p className="text-sm text-slate-500">{client.cedula}</p>
                  <p className="text-sm text-slate-500">{client.telefono}</p>
                </div>
                <div className="flex gap-1">
                  <Link to={`/clients/${client.id}`}>
                    <Button variant="ghost" size="icon">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(client.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-500">Préstamos: {client.prestamos?.length || 0}</span>
                  <span className="font-medium">{calculateClientProgress(client)}% pagado</span>
                </div>
                <Progress value={calculateClientProgress(client)} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}