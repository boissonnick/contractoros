/**
 * Lien Waiver PDF Template
 * Generates a PDF document for lien waivers using @react-pdf/renderer
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
import { Organization, LienWaiver } from '@/types';
import { format } from 'date-fns';

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    paddingBottom: 15,
  },
  logo: {
    width: 100,
    height: 35,
    objectFit: 'contain',
  },
  companyInfo: {
    alignItems: 'flex-end',
  },
  companyName: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1f2937',
  },
  companyDetail: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 25,
  },
  typeBadge: {
    fontSize: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    fontWeight: 700,
    textTransform: 'uppercase',
    alignSelf: 'center',
    marginBottom: 25,
  },
  conditionalBadge: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  unconditionalBadge: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#4b5563',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paragraph: {
    fontSize: 11,
    color: '#374151',
    lineHeight: 1.7,
    textAlign: 'justify',
    marginBottom: 15,
  },
  infoBox: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 6,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 10,
    color: '#6b7280',
    width: 120,
  },
  infoValue: {
    fontSize: 10,
    color: '#1f2937',
    flex: 1,
    fontWeight: 600,
  },
  amountBox: {
    backgroundColor: '#ecfdf5',
    padding: 15,
    borderRadius: 6,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  amountLabel: {
    fontSize: 11,
    color: '#065f46',
    fontWeight: 600,
  },
  amountValue: {
    fontSize: 14,
    color: '#065f46',
    fontWeight: 700,
  },
  exceptionsBox: {
    backgroundColor: '#fef2f2',
    padding: 15,
    borderRadius: 6,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  exceptionsLabel: {
    fontSize: 10,
    color: '#991b1b',
    fontWeight: 700,
    marginBottom: 5,
  },
  exceptionsValue: {
    fontSize: 10,
    color: '#7f1d1d',
  },
  legalText: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.6,
    textAlign: 'justify',
    marginTop: 15,
    marginBottom: 25,
    fontStyle: 'italic',
  },
  signatureSection: {
    marginTop: 30,
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
    marginRight: 25,
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
  notarySection: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  notaryTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#374151',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  notaryText: {
    fontSize: 9,
    color: '#4b5563',
    lineHeight: 1.6,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
  },
});

interface LienWaiverPdfProps {
  lienWaiver: LienWaiver;
  organization: Organization;
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

function getWaiverTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    conditional_progress: 'Conditional Waiver - Progress Payment',
    unconditional_progress: 'Unconditional Waiver - Progress Payment',
    conditional_final: 'Conditional Waiver - Final Payment',
    unconditional_final: 'Unconditional Waiver - Final Payment',
  };
  return labels[type] || type;
}

function isConditional(type: string): boolean {
  return type.startsWith('conditional');
}

function isFinal(type: string): boolean {
  return type.includes('final');
}

export default function LienWaiverPdf({ lienWaiver, organization }: LienWaiverPdfProps) {
  const conditional = isConditional(lienWaiver.type);
  const final = isFinal(lienWaiver.type);

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
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {conditional ? 'Conditional' : 'Unconditional'} Waiver and Release
        </Text>
        <Text style={styles.subtitle}>
          {final ? 'Upon Final Payment' : 'Upon Progress Payment'}
        </Text>
        <Text style={[
          styles.typeBadge,
          conditional ? styles.conditionalBadge : styles.unconditionalBadge
        ]}>
          {getWaiverTypeLabel(lienWaiver.type)}
        </Text>

        {/* Project & Party Information */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Property Owner:</Text>
            <Text style={styles.infoValue}>{lienWaiver.ownerName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Property Address:</Text>
            <Text style={styles.infoValue}>{lienWaiver.propertyAddress}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Claimant:</Text>
            <Text style={styles.infoValue}>{lienWaiver.claimantName}</Text>
          </View>
          {lienWaiver.claimantAddress && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Claimant Address:</Text>
              <Text style={styles.infoValue}>{lienWaiver.claimantAddress}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Through Date:</Text>
            <Text style={styles.infoValue}>{formatDate(lienWaiver.throughDate)}</Text>
          </View>
        </View>

        {/* Amount */}
        <View style={styles.amountBox}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>
              {conditional ? 'Payment Amount (Conditional Upon Receipt):' : 'Payment Amount Received:'}
            </Text>
            <Text style={styles.amountValue}>{formatCurrency(lienWaiver.amount)}</Text>
          </View>
        </View>

        {/* Exceptions */}
        {lienWaiver.exceptionsAmount && lienWaiver.exceptionsAmount > 0 && (
          <View style={styles.exceptionsBox}>
            <Text style={styles.exceptionsLabel}>
              Exceptions: {formatCurrency(lienWaiver.exceptionsAmount)}
            </Text>
            {lienWaiver.exceptionsDescription && (
              <Text style={styles.exceptionsValue}>{lienWaiver.exceptionsDescription}</Text>
            )}
          </View>
        )}

        {/* Waiver Text */}
        <View style={styles.section}>
          {conditional ? (
            <Text style={styles.paragraph}>
              Upon receipt of the sum of {formatCurrency(lienWaiver.amount)}, the undersigned waives and
              releases any and all lien rights, stop payment notice rights, payment bond rights, and any
              other rights the undersigned has against the property described above, the owner, the direct
              contractor, and the surety for labor, service, equipment, or materials provided through
              {formatDate(lienWaiver.throughDate)}.
            </Text>
          ) : (
            <Text style={styles.paragraph}>
              The undersigned has been paid and has received a progress payment in the sum of{' '}
              {formatCurrency(lienWaiver.amount)} for labor, services, equipment, or materials furnished
              to the above-described property and/or the above-described improvements and does hereby
              waive and release any and all lien rights, stop payment notice rights, payment bond rights,
              and any other rights the undersigned has against the property, the owner, the direct contractor,
              and the surety for labor, service, equipment, or materials provided through{' '}
              {formatDate(lienWaiver.throughDate)}.
            </Text>
          )}

          {final && (
            <Text style={styles.paragraph}>
              This waiver covers the final payment for all work performed. The undersigned further certifies
              that all persons and firms who have furnished labor, materials, services, or equipment to the
              undersigned for use at the subject property have been paid in full.
            </Text>
          )}
        </View>

        {/* Legal Notice */}
        <Text style={styles.legalText}>
          NOTICE: This document waives rights unconditionally and states that you have been paid for giving
          up those rights. This document is enforceable against you if you sign it, even if you have not been
          paid. If you have not been paid, use a conditional release form.
        </Text>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <Text style={styles.sectionTitle}>Claimant Signature</Text>
          <View style={styles.signatureBox}>
            <View style={styles.signatureField}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Signature</Text>
            </View>
            <View style={styles.signatureField}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Printed Name & Title</Text>
            </View>
            <View style={[styles.signatureField, { marginRight: 0, flex: 0.7 }]}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Date</Text>
            </View>
          </View>
        </View>

        {/* Notary Section (Optional) */}
        <View style={styles.notarySection}>
          <Text style={styles.notaryTitle}>Notary Acknowledgment (If Required)</Text>
          <Text style={styles.notaryText}>
            State of _________________ County of _________________
          </Text>
          <Text style={[styles.notaryText, { marginTop: 10 }]}>
            On this _____ day of _____________, 20___, before me personally appeared
            _________________________, known to me (or proved to me on the basis of
            satisfactory evidence) to be the person whose name is subscribed to the within
            instrument and acknowledged to me that he/she executed the same in his/her
            authorized capacity.
          </Text>
          <View style={[styles.signatureBox, { marginTop: 20 }]}>
            <View style={styles.signatureField}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Notary Public Signature</Text>
            </View>
            <View style={[styles.signatureField, { marginRight: 0 }]}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Commission Expiration</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            {organization.name} | Lien Waiver | {formatDate(new Date())}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
