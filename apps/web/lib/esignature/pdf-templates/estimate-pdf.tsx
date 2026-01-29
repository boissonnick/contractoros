/**
 * Estimate PDF Template
 * Generates a PDF document for estimates using @react-pdf/renderer
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';
import { Estimate, Organization } from '@/types';
import { format } from 'date-fns';

// Register default fonts
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#1f2937',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
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
    fontSize: 18,
    fontWeight: 700,
    color: '#1f2937',
  },
  companyDetail: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#1f2937',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 20,
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
    fontWeight: 600,
    color: '#2563eb',
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
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 600,
    color: '#374151',
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
    backgroundColor: '#fafafa',
  },
  tableCell: {
    fontSize: 9,
    color: '#1f2937',
  },
  tableCellDesc: {
    flex: 3,
  },
  tableCellQty: {
    flex: 1,
    textAlign: 'center',
  },
  tableCellUnit: {
    flex: 1,
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
    marginTop: 20,
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
    borderTopColor: '#2563eb',
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
    color: '#2563eb',
  },
  section: {
    marginTop: 30,
  },
  paragraph: {
    fontSize: 10,
    color: '#4b5563',
    lineHeight: 1.5,
    marginBottom: 10,
  },
  signatureSection: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  signatureBox: {
    marginTop: 15,
    flexDirection: 'row',
  },
  signatureField: {
    flex: 1,
    marginRight: 30,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    marginBottom: 5,
    height: 40,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#6b7280',
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
  badge: {
    fontSize: 8,
    backgroundColor: '#fef3c7',
    color: '#92400e',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  validUntil: {
    fontSize: 10,
    color: '#dc2626',
    fontWeight: 600,
    marginTop: 10,
  },
});

interface EstimatePdfProps {
  estimate: Estimate;
  organization: Organization;
  includeSignatureFields?: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(date: Date | string | undefined): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMMM d, yyyy');
}

export default function EstimatePdf({
  estimate,
  organization,
  includeSignatureFields = true,
}: EstimatePdfProps) {
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
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>ESTIMATE</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Text style={styles.subtitle}>#{estimate.number}</Text>
          {estimate.status === 'draft' && <Text style={styles.badge}>DRAFT</Text>}
        </View>

        {/* Client & Project Info */}
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={styles.infoValue}>{estimate.clientName}</Text>
            {estimate.clientEmail && (
              <Text style={styles.infoValue}>{estimate.clientEmail}</Text>
            )}
            {estimate.clientPhone && (
              <Text style={styles.infoValue}>{estimate.clientPhone}</Text>
            )}
            {estimate.clientAddress && (
              <Text style={styles.infoValue}>{estimate.clientAddress}</Text>
            )}
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Project Details</Text>
            {estimate.projectName && (
              <>
                <Text style={styles.infoLabel}>Project</Text>
                <Text style={styles.infoValue}>{estimate.projectName}</Text>
              </>
            )}
            {estimate.projectAddress && (
              <>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{estimate.projectAddress}</Text>
              </>
            )}
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Estimate Details</Text>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{formatDate(estimate.createdAt)}</Text>
            <Text style={styles.infoLabel}>Valid Until</Text>
            <Text style={[styles.infoValue, { color: '#dc2626' }]}>
              {formatDate(estimate.validUntil)}
            </Text>
            {estimate.revisionNumber > 1 && (
              <>
                <Text style={styles.infoLabel}>Revision</Text>
                <Text style={styles.infoValue}>v{estimate.revisionNumber}</Text>
              </>
            )}
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.tableCellDesc]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.tableCellQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.tableCellUnit]}>Unit</Text>
            <Text style={[styles.tableHeaderCell, styles.tableCellPrice]}>Price</Text>
            <Text style={[styles.tableHeaderCell, styles.tableCellTotal]}>Total</Text>
          </View>
          {estimate.lineItems.map((item, index) => (
            <View
              key={item.id}
              style={index % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}
            >
              <View style={styles.tableCellDesc}>
                <Text style={[styles.tableCell, { fontWeight: 600 }]}>{item.name}</Text>
                {item.description && (
                  <Text style={[styles.tableCell, { color: '#6b7280', marginTop: 2 }]}>
                    {item.description}
                  </Text>
                )}
                {item.isOptional && (
                  <Text style={[styles.badge, { marginTop: 4 }]}>Optional</Text>
                )}
              </View>
              <Text style={[styles.tableCell, styles.tableCellQty]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.tableCellUnit]}>{item.unit}</Text>
              <Text style={[styles.tableCell, styles.tableCellPrice]}>
                {formatCurrency(item.unitCost)}
              </Text>
              <Text style={[styles.tableCell, styles.tableCellTotal]}>
                {formatCurrency(item.totalCost)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(estimate.subtotal)}</Text>
          </View>
          {estimate.discount && estimate.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Discount {estimate.discountType === 'percent' ? `(${estimate.discount}%)` : ''}
              </Text>
              <Text style={[styles.totalValue, { color: '#059669' }]}>
                -{formatCurrency(
                  estimate.discountType === 'percent'
                    ? estimate.subtotal * (estimate.discount / 100)
                    : estimate.discount
                )}
              </Text>
            </View>
          )}
          {estimate.taxRate && estimate.taxRate > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({estimate.taxRate}%)</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(estimate.taxAmount || 0)}
              </Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(estimate.total)}</Text>
          </View>
          {estimate.depositRequired && estimate.depositRequired > 0 && (
            <View style={[styles.totalRow, { borderBottomWidth: 0, marginTop: 5 }]}>
              <Text style={[styles.totalLabel, { fontWeight: 600 }]}>
                Deposit Required ({estimate.depositPercent || 0}%)
              </Text>
              <Text style={[styles.totalValue, { fontWeight: 600 }]}>
                {formatCurrency(estimate.depositRequired)}
              </Text>
            </View>
          )}
        </View>

        {/* Scope of Work */}
        {estimate.scopeOfWork && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scope of Work</Text>
            <Text style={styles.paragraph}>{estimate.scopeOfWork}</Text>
          </View>
        )}

        {/* Exclusions */}
        {estimate.exclusions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exclusions</Text>
            <Text style={styles.paragraph}>{estimate.exclusions}</Text>
          </View>
        )}

        {/* Payment Terms */}
        {estimate.paymentTerms && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Terms</Text>
            <Text style={styles.paragraph}>{estimate.paymentTerms}</Text>
          </View>
        )}

        {/* Terms and Conditions */}
        {estimate.termsAndConditions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Terms and Conditions</Text>
            <Text style={styles.paragraph}>{estimate.termsAndConditions}</Text>
          </View>
        )}

        {/* Signature Section */}
        {includeSignatureFields && (
          <View style={styles.signatureSection}>
            <Text style={styles.sectionTitle}>Acceptance</Text>
            <Text style={styles.paragraph}>
              By signing below, I accept this estimate and authorize {organization.name} to proceed
              with the work as described above.
            </Text>
            <View style={styles.signatureBox}>
              <View style={styles.signatureField}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>Client Signature</Text>
              </View>
              <View style={styles.signatureField}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>Printed Name</Text>
              </View>
              <View style={[styles.signatureField, { marginRight: 0 }]}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>Date</Text>
              </View>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            {organization.name} | Estimate #{estimate.number} | Page 1 of 1
          </Text>
          <Text style={{ marginTop: 3 }}>
            This estimate is valid until {formatDate(estimate.validUntil)}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
