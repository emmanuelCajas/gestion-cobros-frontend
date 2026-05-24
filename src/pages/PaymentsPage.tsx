import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Client, Loan } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, UserCircle, Receipt, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const [paymentForm, setPaymentForm] = useState({
    monto: '',
    fechaPago: new Date().toISOString().split('T')[0],
    observacion: '',
  });

  const { data: clients } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => api.clients.getAll(search || undefined),
  });

  const { data: loans } = useQuery({
    queryKey: ['loans', selectedClient?.id],
    queryFn: () => api.loans.getByClient(selectedClient!.id),
    enabled: !!selectedClient,
  });

  const createPaymentMutation = useMutation({
    mutationFn: api.payments.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans', selectedClient?.id] });
      setPaymentForm({ monto: '', fechaPago: new Date().toISOString().split('T')[0], observacion: '' });
      setSelectedLoan(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedLoan) return;

    const monto = parseFloat(paymentForm.monto);
    const saldoPendiente = Number(selectedLoan.saldoPendiente);

    if (monto > saldoPendiente) {
      setError(`El monto no puede ser mayor al saldo pendiente ($${saldoPendiente.toLocaleString()})`);
      return;
    }

    createPaymentMutation.mutate({
      prestamoId: selectedLoan.id,
      monto,
      fechaPago: paymentForm.fechaPago,
      observacion: paymentForm.observacion || undefined,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold">Registrar Pago</h2>

      <Card className="sm:hidden">
        <CardContent className="p-4">
          {!selectedClient ? (
            <div className="space-y-4">
              <Label>Buscar Cliente</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Nombre o cédula..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {clients?.map((client: Client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => {
                      setSelectedClient(client);
                      setSelectedLoan(null);
                      setSearch('');
                    }}
                    className="w-full text-left p-3 rounded border border-slate-200 hover:border-primary transition-colors"
                  >
                    <p className="font-medium">{client.nombre}</p>
                    <p className="text-sm text-slate-500">{client.cedula}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : !selectedLoan ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{selectedClient.nombre}</p>
                  <p className="text-sm text-slate-500">{selectedClient.cedula}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedClient(null)}>
                  Cambiar
                </Button>
              </div>
              <Label> Seleccionar Préstamo</Label>
              {loans && loans.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {loans.map((loan: Loan) => {
                    const saldo = Number(loan.saldoPendiente);
                    return (
                      <button
                        key={loan.id}
                        type="button"
                        onClick={() => setSelectedLoan(loan)}
                        className="w-full text-left p-3 rounded border border-slate-200 hover:border-primary transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">#{loan.id.slice(0, 8)}</p>
                            <p className="text-sm text-slate-500">
                              {format(new Date(loan.fechaCreacion), 'dd/MM/yyyy')}
                            </p>
                          </div>
                          <p className="font-semibold text-orange-600">${saldo.toLocaleString()}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-4">Este cliente no tiene préstamos activos</p>
              )}
            </div>
          ) : (
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                <div>
                  <p className="text-sm text-slate-500">Préstamo #{selectedLoan.id.slice(0, 8)}</p>
                  <p className="font-semibold text-orange-600">
                    ${Number(selectedLoan.saldoPendiente).toLocaleString()} saldo
                  </p>
                </div>
                <Button variant="ghost" size="sm" type="button" onClick={() => setSelectedLoan(null)}>
                  Cambiar
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Monto del Pago</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={paymentForm.monto}
                  onChange={(e) => setPaymentForm({ ...paymentForm, monto: e.target.value })}
                  required
                  className="h-12 text-lg"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label>Fecha de Pago</Label>
                <Input
                  type="date"
                  value={paymentForm.fechaPago}
                  onChange={(e) => setPaymentForm({ ...paymentForm, fechaPago: e.target.value })}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label>Observación (opcional)</Label>
                <Input
                  value={paymentForm.observacion}
                  onChange={(e) => setPaymentForm({ ...paymentForm, observacion: e.target.value })}
                  placeholder="Ej: Pago parcial..."
                  className="h-12"
                />
              </div>

              <Button type="submit" className="w-full h-12" disabled={createPaymentMutation.isPending}>
                {createPaymentMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Registrar Pago
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="hidden sm:block">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="w-5 h-5" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar cliente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="mt-4 max-h-64 overflow-y-auto space-y-2">
                {clients?.map((client: Client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => {
                      setSelectedClient(client);
                      setSelectedLoan(null);
                      setSearch('');
                    }}
                    className={`w-full text-left p-3 rounded border transition-colors ${
                      selectedClient?.id === client.id
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-medium">{client.nombre}</p>
                    <p className="text-sm text-slate-500">{client.cedula}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Préstamo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedClient ? (
                <p className="text-slate-500 text-center py-8">Seleccione un cliente primero</p>
              ) : loans && loans.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {loans.map((loan: Loan) => {
                    const saldo = Number(loan.saldoPendiente);
                    return (
                      <button
                        key={loan.id}
                        type="button"
                        onClick={() => setSelectedLoan(loan)}
                        className={`w-full text-left p-3 rounded border transition-colors ${
                          selectedLoan?.id === loan.id
                            ? 'border-primary bg-primary/5'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">#{loan.id.slice(0, 8)}</p>
                            <p className="text-sm text-slate-500">
                              {format(new Date(loan.fechaCreacion), 'dd/MM/yyyy')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-orange-600">${saldo.toLocaleString()}</p>
                            <p className="text-xs text-slate-500">saldo</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">Este cliente no tiene préstamos activos</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Registrar Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedLoan ? (
                <p className="text-slate-500 text-center py-8">Seleccione un préstamo primero</p>
              ) : (
                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="p-3 bg-slate-50 rounded">
                    <p className="text-sm text-slate-500">Saldo pendiente</p>
                    <p className="text-xl font-bold text-orange-600">
                      ${Number(selectedLoan.saldoPendiente).toLocaleString()}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Monto del Pago</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={paymentForm.monto}
                      onChange={(e) => setPaymentForm({ ...paymentForm, monto: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha de Pago</Label>
                    <Input
                      type="date"
                      value={paymentForm.fechaPago}
                      onChange={(e) => setPaymentForm({ ...paymentForm, fechaPago: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Observación (opcional)</Label>
                    <Input
                      value={paymentForm.observacion}
                      onChange={(e) => setPaymentForm({ ...paymentForm, observacion: e.target.value })}
                      placeholder="Ej: Pago parcial, Pago completo..."
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={createPaymentMutation.isPending}>
                    {createPaymentMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Registrar Pago
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}