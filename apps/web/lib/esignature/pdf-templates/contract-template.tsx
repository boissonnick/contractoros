/**
 * Contract PDF Template
 * Generates a PDF document for contracts using @react-pdf/renderer
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
import { Organization } from '@/types';
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
    marginBottom: 30,
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
  section: {
    marginTop: 20,
    marginBottom: 15,
  },
  paragraph: {
    fontSize: 10,
    color: '#4b5563',
    lineHeight: 1.6,
    marginBottom: 10,
    textAlign: 'justify',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 10,
    borderTopWidth: 2,
    borderTopColor: '#2563eb',
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1f2937',
    marginRight: 20,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 700,
    color: '#2563eb',
  },
  signatureSection: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  signatureBox: {
    marginTop: 20,
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
});

interface ContractData {
  id: string;
  number: string;
  projectName: string;
  projectAddress?: string;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  contractAmount: number;
  startDate?: Date;
  endDate?: Date;
  scopeOfWork: string;
  paymentTerms?: string;
  termsAndConditions?: string;
  createdAt: Date;
}

interface ContractPdfProps {
  contract: ContractData;
  organization: Organization;
}

function formatDate(date: Date | string | undefined): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMMM d, yyyy');
}

export default function ContractPdf({ contract, organization }: ContractPdfProps) {
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
            {organization.email && (
              <Text style={styles.companyDetail}>{organization.email}</Text>
            )}
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>CONSTRUCTION CONTRACT</Text>
        <Text style={styles.subtitle}>Contract #{contract.number}</Text>

        {/* Parties Info */}
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Contractor</Text>
            <Text style={styles.infoValue}>{organization.name}</Text>
            {organization.address && (
              <Text style={styles.infoValue}>{organization.address}</Text>
            )}
            {organization.phone && (
              <Text style={styles.infoValue}>{organization.phone}</Text>
            )}
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Client</Text>
            <Text style={styles.infoValue}>{contract.clientName}</Text>
            {contract.clientAddress && (
              <Text style={styles.infoValue}>{contract.clientAddress}</Text>
            )}
            {contract.clientEmail && (
              <Text style={styles.infoValue}>{contract.clientEmail}</Text>
            )}
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Project Details</Text>
            <Text style={styles.infoLabel}>Project</Text>
            <Text style={styles.infoValue}>{contract.projectName}</Text>
            {contract.projectAddress && (
              <>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{contract.projectAddress}</Text>
              </>
            )}
            <Text style={styles.infoLabel}>Contract Date</Text>
            <Text style={styles.infoValue}>{formatDate(contract.createdAt)}</Text>
          </View>
        </View>

        {/* Project Timeline */}
        {(contract.startDate || contract.endDate) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Project Timeline</Text>
            <View style={styles.row}>
              {contract.startDate && (
                <View style={styles.col}>
                  <Text style={styles.infoLabel}>Start Date</Text>
                  <Text style={styles.infoValue}>{formatDate(contract.startDate)}</Text>
                </View>
              )}
              {contract.endDate && (
                <View style={styles.col}>
                  <Text style={styles.infoLabel}>Estimated Completion</Text>
                  <Text style={styles.infoValue}>{formatDate(contract.endDate)}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Contract Amount */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Contract Amount:</Text>
          <Text style={styles.totalValue}>{formatCurrency(contract.contractAmount)}</Text>
        </View>

        {/* Scope of Work */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scope of Work</Text>
          <Text style={styles.paragraph}>{contract.scopeOfWork}</Text>
        </View>

        {/* Payment Terms */}
        {contract.paymentTerms && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Terms</Text>
            <Text style={styles.paragraph}>{contract.paymentTerms}</Text>
          </View>
        )}

        {/* Terms and Conditions */}
        {contract.termsAndConditions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Terms and Conditions</Text>
            <Text style={styles.paragraph}>{contract.termsAndConditions}</Text>
          </View>
        )}

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <Text style={styles.sectionTitle}>Agreement</Text>
          <Text style={styles.paragraph}>
            By signing below, both parties agree to the terms and conditions outlined in this contract.
            This contract is legally binding upon execution by both parties.
          </Text>
          <View style={styles.signatureBox}>
            <View style={styles.signatureField}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Contractor Signature</Text>
            </View>
            <View style={styles.signatureField}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Client Signature</Text>
            </View>
            <View style={[styles.signatureField, { marginRight: 0 }]}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Date</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            {organization.name} | Contract #{contract.number} | Page 1 of 1
          </Text>
        </View>
      </Page>
    </Document>
  );
}
