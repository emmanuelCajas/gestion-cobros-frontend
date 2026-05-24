import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Loan } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, ArrowLeft, Loader2, BarChart3 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [error, setError] = useState('');

  const [loanForm, setLoanForm] = useState({
    montoOriginal: '',
    tasaInteresMensual: '',
  });

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => api.clients.getOne(id!),
  });

  const createLoanMutation = useMutation({
    mutationFn: api.loans.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      setShowLoanForm(false);
      setLoanForm({ montoOriginal: '', tasaInteresMensual: '' });
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const data: { montoOriginal: number; tasaInteresMensual?: number; clienteId: string } = {
      montoOriginal: parseFloat(loanForm.montoOriginal),
      clienteId: id!,
    };

    if (loanForm.tasaInteresMensual) {
      data.tasaInteresMensual = parseFloat(loanForm.tasaInteresMensual);
    }

    createLoanMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!client) {
    return <div className="text-center py-12 text-slate-500">Cliente no encontrado</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h2 className="text-2xl font-bold">{client.nombre}</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Cédula</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{client.cedula}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Teléfono</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{client.telefono}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Dirección</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{client.direccion}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{client.email || 'No registrado'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Préstamos</h3>
        <Button onClick={() => setShowLoanForm(!showLoanForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Préstamo
        </Button>
      </div>

      {showLoanForm && (
        <Card>
          <CardHeader>
            <CardTitle>Crear Préstamo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLoanSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monto Original</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={loanForm.montoOriginal}
                    onChange={(e) => setLoanForm({ ...loanForm, montoOriginal: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tasa de Interés Mensual (opcional)</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    min="0"
                    max="1"
                    placeholder="0.05 = 5%"
                    value={loanForm.tasaInteresMensual}
                    onChange={(e) => setLoanForm({ ...loanForm, tasaInteresMensual: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createLoanMutation.isPending}>
                  {createLoanMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Crear Préstamo
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowLoanForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {client.prestamos?.map((loan: Loan) => {
          const totalPagado = Number(loan.totalConInteres) - Number(loan.saldoPendiente);
          const porcentaje = Number(loan.totalConInteres) > 0
            ? (totalPagado / Number(loan.totalConInteres)) * 100
            : 0;

          return (
            <Card key={loan.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Préstamo #{loan.id.slice(0, 8)}</CardTitle>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium">{Math.round(porcentaje)}% pagado</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-slate-500">Monto Original</p>
                    <p className="text-lg font-semibold">€{Number(loan.montoOriginal).toLocaleString('es-ES')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total con Interés</p>
                    <p className="text-lg font-semibold">€{Number(loan.totalConInteres).toLocaleString('es-ES')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total Pagado</p>
                    <p className="text-lg font-semibold text-green-600">€{totalPagado.toLocaleString('es-ES')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Saldo Pendiente</p>
                    <p className="text-lg font-semibold text-orange-600">€{Number(loan.saldoPendiente).toLocaleString('es-ES')}</p>
                  </div>
                </div>

                <Progress value={porcentaje} className="h-3 mb-4" />

                <div className="flex gap-2">
                  <Link to={`/loans/${loan.id}`}>
                    <Button variant="outline" size="sm">Ver Detalle</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {(!client.prestamos || client.prestamos.length === 0) && (
          <div className="text-center py-8 text-slate-500">
            Este cliente no tiene préstamos registrados
          </div>
        )}
      </div>
    </div>
  );
}