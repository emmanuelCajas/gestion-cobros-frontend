import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Loan, Payment } from '@/types';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottom: '1px solid #ddd',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  label: {
    fontSize: 10,
    color: '#666',
  },
  value: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #ddd',
    padding: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #eee',
    padding: 5,
  },
  col: {
    flex: 1,
  },
  colWide: {
    flex: 2,
  },
  headerCell: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cell: {
    fontSize: 9,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
    paddingTop: 10,
    borderTop: '2px solid #333',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 10,
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

interface PaymentPDFProps {
  loan: Loan;
  payments: Payment[];
}

export function PaymentPDF({ loan, payments }: PaymentPDFProps) {
  const totalPagado = payments.reduce((sum, p) => sum + Number(p.monto), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Historial de Pagos</Text>
          <Text style={styles.subtitle}>
            Préstamo #{loan.id.slice(0, 8)} - {loan.cliente?.nombre}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Préstamo</Text>
          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Monto Original</Text>
              <Text style={styles.value}>${Number(loan.montoOriginal).toLocaleString()}</Text>
            </View>
            <View>
              <Text style={styles.label}>Total con Interés</Text>
              <Text style={styles.value}>${Number(loan.totalConInteres).toLocaleString()}</Text>
            </View>
            <View>
              <Text style={styles.label}>Saldo Pendiente</Text>
              <Text style={styles.value}>${Number(loan.saldoPendiente).toLocaleString()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalle de Pagos</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.col]}>#</Text>
              <Text style={[styles.headerCell, styles.col]}>Fecha</Text>
              <Text style={[styles.headerCell, styles.col]}>Hora</Text>
              <Text style={[styles.headerCell, styles.col]}>Monto</Text>
              <Text style={[styles.headerCell, styles.col]}>Saldo Restante</Text>
              <Text style={[styles.headerCell, styles.colWide]}>Observación</Text>
            </View>
            {payments.map((payment, index) => (
              <View style={styles.tableRow} key={payment.id}>
                <Text style={[styles.cell, styles.col]}>{index + 1}</Text>
                <Text style={[styles.cell, styles.col]}>
                  {format(new Date(payment.fechaPago), 'dd/MM/yyyy')}
                </Text>
                <Text style={[styles.cell, styles.col]}>
                  {format(new Date(payment.horaRegistro), 'HH:mm')}
                </Text>
                <Text style={[styles.cell, styles.col, { color: '#16a34a' }]}>
                  +${Number(payment.monto).toLocaleString()}
                </Text>
                <Text style={[styles.cell, styles.col]}>
                  ${(payment.saldoRestante ?? 0).toLocaleString()}
                </Text>
                <Text style={[styles.cell, styles.colWide]}>
                  {payment.observacion || '-'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Pagado:</Text>
          <Text style={[styles.totalValue, { color: '#16a34a' }]}>
            ${totalPagado.toLocaleString()}
          </Text>
        </View>

        <Text style={{ marginTop: 30, fontSize: 8, color: '#999', textAlign: 'center' }}>
          Generado el {format(new Date(), 'dd/MM/yyyy HH:mm')} - Sistema de Gestión de Cobros
        </Text>
      </Page>
    </Document>
  );
}