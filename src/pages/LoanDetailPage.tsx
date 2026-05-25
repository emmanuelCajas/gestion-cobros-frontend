import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Payment } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { PaymentPDF } from '@/components/PDFGenerator';
import { PDFDownloadLink } from '@react-pdf/renderer';

export default function LoanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [error, setError] = useState('');

  const [paymentForm, setPaymentForm] = useState({
    monto: '',
    fechaPago: new Date().toISOString().split('T')[0],
    observacion: '',
  });

  const { data: loan, isLoading } = useQuery({
    queryKey: ['loan', id],
    queryFn: () => api.loans.getOne(id!),
  });

  const { data: payments } = useQuery({
    queryKey: ['payments', id],
    queryFn: () => api.payments.getByLoan(id!),
  });

  const createPaymentMutation = useMutation({
    mutationFn: api.payments.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan', id] });
      queryClient.invalidateQueries({ queryKey: ['payments', id] });
      setShowPaymentForm(false);
      setPaymentForm({ monto: '', fechaPago: new Date().toISOString().split('T')[0], observacion: '' });
    },
    onError: (err: Error) => setError(err.message),
  });

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!loan) return;

    const monto = parseFloat(paymentForm.monto);
    const saldoPendiente = Number(loan.saldoPendiente);

    if (monto > saldoPendiente) {
      setError(`El monto no puede ser mayor al saldo pendiente (€${saldoPendiente.toLocaleString('es-ES')})`);
      return;
    }

    createPaymentMutation.mutate({
      prestamoId: id!,
      monto,
      fechaPago: paymentForm.fechaPago,
      observacion: paymentForm.observacion || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!loan) {
    return <div className="text-center py-12 text-slate-500">Préstamo no encontrado</div>;
  }

  const totalPagado = Number(loan.totalConInteres) - Number(loan.saldoPendiente);
  const porcentaje = Number(loan.totalConInteres) > 0
    ? (totalPagado / Number(loan.totalConInteres)) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-2xl font-bold">Préstamo #{loan.id.slice(0, 8)}</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{loan.cliente?.nombre}</p>
            <p className="text-sm text-slate-500">Cédula: {loan.cliente?.cedula}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Fecha de Creación</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{format(new Date(loan.fechaCreacion), 'dd/MM/yyyy')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Monto Original</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">€{Number(loan.montoOriginal).toLocaleString('es-ES')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Total con Interés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">€{Number(loan.totalConInteres).toLocaleString('es-ES')}</p>
            {loan.tasaInteresMensual && (
              <p className="text-xs text-slate-500">
                Tasa: {(Number(loan.tasaInteresMensual) * 100).toFixed(2)}% mensual
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Total Pagado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">€{totalPagado.toLocaleString('es-ES')}</p>
            <p className="text-xs text-slate-500">{Math.round(porcentaje)}% del total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Saldo Pendiente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">€{Number(loan.saldoPendiente).toLocaleString('es-ES')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Historial de Pagos</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPaymentForm(!showPaymentForm)}>
            Registrar Pago
          </Button>
          {payments && payments.length > 0 && (
            <PDFDownloadLink
              document={<PaymentPDF loan={loan} payments={payments} />}
              fileName={`pagos-prestamo-${loan.id.slice(0, 8)}.pdf`}
            >
              {({ loading }) => (
                <Button variant="outline" disabled={loading}>
                  <FileText className="w-4 h-4 mr-2" />
                  {loading ? 'Generando...' : 'Exportar PDF'}
                </Button>
              )}
            </PDFDownloadLink>
          )}
        </div>
      </div>

      {showPaymentForm && (
        <Card>
          <CardHeader>
            <CardTitle>Registrar Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monto</Label>
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

                <div className="col-span-2 space-y-2">
                  <Label>Observación (opcional)</Label>
                  <Input
                    value={paymentForm.observacion}
                    onChange={(e) => setPaymentForm({ ...paymentForm, observacion: e.target.value })}
                    placeholder="Ej: Pago parcial, Pago completo..."
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createPaymentMutation.isPending}>
                  {createPaymentMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Registrar
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowPaymentForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Saldo Restante</TableHead>
                <TableHead>Registrado por</TableHead>
                <TableHead>Observación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments?.map((payment: Payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{format(new Date(payment.fechaPago), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{format(new Date(payment.horaRegistro), 'HH:mm')}</TableCell>
<TableCell className="font-medium text-green-600">
                      +€{Number(payment.monto).toLocaleString('es-ES')}
                    </TableCell>
                    <TableCell className="text-orange-600">
                      €{(payment.saldoRestante ?? 0).toLocaleString('es-ES')}
                  </TableCell>
                  <TableCell>{payment.registradoPor?.nombre || 'N/A'}</TableCell>
                  <TableCell className="text-slate-500">{payment.observacion || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(!payments || payments.length === 0) && (
            <div className="text-center py-8 text-slate-500">
              No hay pagos registrados para este préstamo
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}