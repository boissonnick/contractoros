/**
 * Invoice PDF Template
 * Generates a PDF document for invoices using @react-pdf/renderer
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import { Organization, Invoice } from '@/types';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils/formatters';

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#7c3aed',
    paddingBottom: 20,
  },
  logo: {
    width: 120,
    height: 40,
    objectFit: 'contain',
  },
  companyInfo: {
    alignItems: 'flex-end',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1f2937',
  },
  companyDetail: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#7c3aed',
    marginBottom: 5,
  },
  invoiceNumber: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  statusBadge: {
    fontSize: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  statusPaid: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  statusOverdue: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  col: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#7c3aed',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    color: '#1f2937',
    marginBottom: 6,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#ede9fe',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 700,
    color: '#5b21b6',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  tableRowAlt: {
    backgroundColor: '#faf5ff',
  },
  tableCell: {
    fontSize: 9,
    color: '#1f2937',
  },
  tableCellDesc: {
    flex: 3,
  },
  tableCellQty: {
    flex: 0.8,
    textAlign: 'center',
  },
  tableCellPrice: {
    flex: 1,
    textAlign: 'right',
  },
  tableCellTotal: {
    flex: 1,
    textAlign: 'right',
  },
  totalsSection: {
    marginTop: 10,
    marginLeft: 'auto',
    width: 250,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  totalLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 10,
    color: '#1f2937',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 2,
    borderTopColor: '#7c3aed',
    marginTop: 5,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1f2937',
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: 700,
    color: '#7c3aed',
  },
  amountDueBox: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#7c3aed',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountDueLabel: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 700,
  },
  amountDueValue: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 700,
  },
  notesSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  notesText: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.5,
  },
  paymentInfo: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#ede9fe',
    borderRadius: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
});

interface InvoicePdfProps {
  invoice: Invoice;
  organization: Organization;
}

function formatDate(date: Date | string | undefined): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMMM d, yyyy');
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'paid':
      return styles.statusPaid;
    case 'overdue':
      return styles.statusOverdue;
    default:
      return styles.statusPending;
  }
}

export default function InvoicePdf({ invoice, organization }: InvoicePdfProps) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {organization.logoURL ? (
              <Image src={organization.logoURL} style={styles.logo} />
            ) : (
              <Text style={styles.companyName}>{organization.name}</Text>
            )}
          </View>
          <View style={styles.companyInfo}>
            {organization.logoURL && (
              <Text style={styles.companyName}>{organization.name}</Text>
            )}
            {organization.address && (
              <Text style={styles.companyDetail}>{organization.address}</Text>
            )}
            {organization.phone && (
              <Text style={styles.companyDetail}>{organization.phone}</Text>
            )}
            {organization.email && (
              <Text style={styles.companyDetail}>{organization.email}</Text>
            )}
            {organization.taxConfig?.taxIdEin && (
              <Text style={styles.companyDetail}>Tax ID: {organization.taxConfig.taxIdEin}</Text>
            )}
          </View>
        </View>

        {/* Title and Status */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <View>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.number}</Text>
          </View>
          <Text style={[styles.statusBadge, getStatusStyle(invoice.status)]}>
            {invoice.status}
          </Text>
        </View>

        {/* Bill To & Invoice Details */}
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={styles.infoValue}>{invoice.clientName}</Text>
            {invoice.clientEmail && (
              <Text style={styles.infoValue}>{invoice.clientEmail}</Text>
            )}
            {invoice.clientPhone && (
              <Text style={styles.infoValue}>{invoice.clientPhone}</Text>
            )}
            {invoice.billingAddress && (
              <Text style={styles.infoValue}>{invoice.billingAddress}</Text>
            )}
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Project</Text>
            {invoice.projectName && (
              <Text style={styles.infoValue}>{invoice.projectName}</Text>
            )}
            {invoice.projectAddress && (
              <Text style={styles.infoValue}>{invoice.projectAddress}</Text>
            )}
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Invoice Details</Text>
            <Text style={styles.infoLabel}>Invoice Date</Text>
            <Text style={styles.infoValue}>{formatDate(invoice.createdAt)}</Text>
            <Text style={styles.infoLabel}>Due Date</Text>
            <Text style={[styles.infoValue, { color: '#dc2626', fontWeight: 700 }]}>
              {formatDate(invoice.dueDate)}
            </Text>
            <Text style={styles.infoLabel}>Payment Terms</Text>
            <Text style={styles.infoValue}>{invoice.paymentTerms}</Text>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.tableCellDesc]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.tableCellQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.tableCellPrice]}>Unit Price</Text>
            <Text style={[styles.tableHeaderCell, styles.tableCellTotal]}>Amount</Text>
          </View>
          {invoice.lineItems.map((item, index) => (
            <View
              key={item.id}
              style={index % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}
            >
              <View style={styles.tableCellDesc}>
                <Text style={styles.tableCell}>{item.description}</Text>
              </View>
              <Text style={[styles.tableCell, styles.tableCellQty]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.tableCellPrice]}>
                {formatCurrency(item.unitPrice)}
              </Text>
              <Text style={[styles.tableCell, styles.tableCellTotal]}>
                {formatCurrency(item.amount)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          {invoice.discount && invoice.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Discount {invoice.discountType === 'percent' ? `(${invoice.discount}%)` : ''}
              </Text>
              <Text style={[styles.totalValue, { color: '#059669' }]}>
                -{formatCurrency(
                  invoice.discountType === 'percent'
                    ? invoice.subtotal * (invoice.discount / 100)
                    : invoice.discount
                )}
              </Text>
            </View>
          )}
          {invoice.taxRate && invoice.taxRate > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({invoice.taxRate}%)</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(invoice.taxAmount || 0)}
              </Text>
            </View>
          )}
          {invoice.retainageAmount && invoice.retainageAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Retainage ({invoice.retainage}%)</Text>
              <Text style={styles.totalValue}>
                -{formatCurrency(invoice.retainageAmount)}
              </Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total)}</Text>
          </View>
          {invoice.amountPaid > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Amount Paid</Text>
              <Text style={[styles.totalValue, { color: '#059669' }]}>
                -{formatCurrency(invoice.amountPaid)}
              </Text>
            </View>
          )}
        </View>

        {/* Amount Due Box */}
        <View style={styles.amountDueBox}>
          <Text style={styles.amountDueLabel}>AMOUNT DUE</Text>
          <Text style={styles.amountDueValue}>{formatCurrency(invoice.amountDue)}</Text>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={[styles.sectionTitle, { color: '#6b7280', marginBottom: 5 }]}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Payment Information */}
        <View style={styles.paymentInfo}>
          <Text style={[styles.sectionTitle, { marginBottom: 5 }]}>Payment Information</Text>
          <Text style={styles.notesText}>
            Please make payment by the due date. For questions regarding this invoice,
            contact {organization.email || organization.phone || organization.name}.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            {organization.name} | Invoice {invoice.number} | Page 1 of 1
          </Text>
          <Text style={{ marginTop: 3 }}>
            Thank you for your business!
          </Text>
        </View>
      </Page>
    </Document>
  );
}
