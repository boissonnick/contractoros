/**
 * Change Order PDF Template
 * Generates a PDF document for change orders using @react-pdf/renderer
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
import { Organization, ChangeOrder } from '@/types';
import { format } from 'date-fns';
import { formatCurrencySigned as formatCurrency } from '@/lib/utils/formatters';

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
    borderBottomColor: '#f59e0b',
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
    fontSize: 24,
    fontWeight: 700,
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 5,
  },
  badge: {
    fontSize: 10,
    backgroundColor: '#fef3c7',
    color: '#92400e',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'center',
    marginBottom: 20,
    textTransform: 'uppercase',
    fontWeight: 700,
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
    color: '#f59e0b',
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
  section: {
    marginTop: 15,
    marginBottom: 15,
  },
  paragraph: {
    fontSize: 10,
    color: '#4b5563',
    lineHeight: 1.6,
    marginBottom: 10,
    textAlign: 'justify',
  },
  table: {
    marginTop: 10,
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 700,
    color: '#92400e',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableCell: {
    fontSize: 9,
    color: '#1f2937',
  },
  tableCellDesc: {
    flex: 3,
  },
  tableCellAmount: {
    flex: 1,
    textAlign: 'right',
  },
  impactSection: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#fffbeb',
    borderRadius: 8,
  },
  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  impactLabel: {
    fontSize: 10,
    color: '#92400e',
  },
  impactValue: {
    fontSize: 10,
    fontWeight: 700,
    color: '#1f2937',
  },
  impactPositive: {
    color: '#059669',
  },
  impactNegative: {
    color: '#dc2626',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 2,
    borderTopColor: '#f59e0b',
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#1f2937',
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 700,
    color: '#f59e0b',
  },
  signatureSection: {
    marginTop: 30,
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
    marginRight: 20,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    marginBottom: 5,
    height: 35,
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
});

interface ChangeOrderPdfProps {
  changeOrder: ChangeOrder;
  organization: Organization;
}

function formatDate(date: Date | string | undefined): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMMM d, yyyy');
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Draft',
    pending: 'Pending Approval',
    approved: 'Approved',
    rejected: 'Rejected',
  };
  return labels[status] || status;
}

export default function ChangeOrderPdf({ changeOrder, organization }: ChangeOrderPdfProps) {
  const { impact } = changeOrder;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {organization.logoURL ? (
              /* eslint-disable-next-line jsx-a11y/alt-text */
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
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>CHANGE ORDER</Text>
        <Text style={styles.subtitle}>{changeOrder.number}</Text>
        <Text style={styles.badge}>{getStatusLabel(changeOrder.status)}</Text>

        {/* Change Order Info */}
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Change Order Details</Text>
            <Text style={styles.infoLabel}>Title</Text>
            <Text style={styles.infoValue}>{changeOrder.title}</Text>
            <Text style={styles.infoLabel}>Date Submitted</Text>
            <Text style={styles.infoValue}>{formatDate(changeOrder.createdAt)}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Project Reference</Text>
            <Text style={styles.infoLabel}>Project ID</Text>
            <Text style={styles.infoValue}>{changeOrder.projectId}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.paragraph}>{changeOrder.description}</Text>
        </View>

        {/* Reason */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reason for Change</Text>
          <Text style={styles.paragraph}>{changeOrder.reason}</Text>
        </View>

        {/* Scope Changes */}
        {changeOrder.scopeChanges && changeOrder.scopeChanges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scope Changes</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.tableCellDesc]}>Description</Text>
                <Text style={[styles.tableHeaderCell, styles.tableCellAmount]}>Amount</Text>
              </View>
              {changeOrder.scopeChanges.map((change, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.tableCellDesc]}>{change.proposedDescription}</Text>
                  <Text style={[styles.tableCell, styles.tableCellAmount]}>
                    {formatCurrency(change.costImpact || 0)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Impact Summary */}
        <View style={styles.impactSection}>
          <Text style={[styles.sectionTitle, { color: '#92400e', marginBottom: 12 }]}>
            Impact Summary
          </Text>
          <View style={styles.impactRow}>
            <Text style={styles.impactLabel}>Cost Impact:</Text>
            <Text style={[
              styles.impactValue,
              impact.costChange >= 0 ? styles.impactNegative : styles.impactPositive
            ]}>
              {formatCurrency(impact.costChange)}
            </Text>
          </View>
          <View style={styles.impactRow}>
            <Text style={styles.impactLabel}>Schedule Impact:</Text>
            <Text style={[
              styles.impactValue,
              impact.scheduleChange > 0 ? styles.impactNegative : styles.impactPositive
            ]}>
              {impact.scheduleChange > 0 ? '+' : ''}{impact.scheduleChange} days
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Net Cost Change:</Text>
            <Text style={styles.totalValue}>{formatCurrency(impact.costChange)}</Text>
          </View>
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <Text style={styles.sectionTitle}>Authorization</Text>
          <Text style={styles.paragraph}>
            By signing below, the parties agree to the scope changes and cost/schedule adjustments
            described in this change order. This change order becomes part of the original contract.
          </Text>
          <View style={styles.signatureBox}>
            <View style={styles.signatureField}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Contractor Signature</Text>
            </View>
            <View style={styles.signatureField}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Client/Owner Signature</Text>
            </View>
            <View style={[styles.signatureField, { marginRight: 0, flex: 0.7 }]}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Date</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            {organization.name} | Change Order {changeOrder.number} | Page 1 of 1
          </Text>
        </View>
      </Page>
    </Document>
  );
}
