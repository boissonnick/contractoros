/**
 * Scope of Work PDF Template
 * Generates a PDF document for scope of work documents using @react-pdf/renderer
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
    borderBottomColor: '#059669',
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
  versionBadge: {
    fontSize: 10,
    backgroundColor: '#d1fae5',
    color: '#065f46',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'center',
    marginBottom: 20,
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
    color: '#059669',
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
  listSection: {
    marginTop: 10,
    paddingLeft: 10,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  bullet: {
    fontSize: 10,
    color: '#059669',
    marginRight: 8,
    width: 15,
  },
  listText: {
    fontSize: 10,
    color: '#4b5563',
    flex: 1,
    lineHeight: 1.4,
  },
  highlightBox: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
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

interface ScopeOfWorkData {
  id: string;
  number: string;
  projectName: string;
  projectAddress?: string;
  clientName: string;
  version: number;
  scope: string;
  inclusions?: string[];
  exclusions?: string[];
  assumptions?: string[];
  deliverables?: string[];
  createdAt: Date;
}

interface ScopeOfWorkPdfProps {
  scopeOfWork: ScopeOfWorkData;
  organization: Organization;
}

function formatDate(date: Date | string | undefined): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMMM d, yyyy');
}

export default function ScopeOfWorkPdf({ scopeOfWork, organization }: ScopeOfWorkPdfProps) {
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
        <Text style={styles.title}>SCOPE OF WORK</Text>
        <Text style={styles.subtitle}>{scopeOfWork.number}</Text>
        <Text style={styles.versionBadge}>Version {scopeOfWork.version}</Text>

        {/* Project Info */}
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Project Information</Text>
            <Text style={styles.infoLabel}>Project Name</Text>
            <Text style={styles.infoValue}>{scopeOfWork.projectName}</Text>
            {scopeOfWork.projectAddress && (
              <>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{scopeOfWork.projectAddress}</Text>
              </>
            )}
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Client</Text>
            <Text style={styles.infoValue}>{scopeOfWork.clientName}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Document Details</Text>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{formatDate(scopeOfWork.createdAt)}</Text>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>{scopeOfWork.version}</Text>
          </View>
        </View>

        {/* Scope Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scope Description</Text>
          <Text style={styles.paragraph}>{scopeOfWork.scope}</Text>
        </View>

        {/* Inclusions */}
        {scopeOfWork.inclusions && scopeOfWork.inclusions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Included</Text>
            <View style={styles.listSection}>
              {scopeOfWork.inclusions.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Exclusions */}
        {scopeOfWork.exclusions && scopeOfWork.exclusions.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: '#dc2626' }]}>Work Excluded</Text>
            <View style={styles.listSection}>
              {scopeOfWork.exclusions.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={[styles.bullet, { color: '#dc2626' }]}>×</Text>
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Assumptions */}
        {scopeOfWork.assumptions && scopeOfWork.assumptions.length > 0 && (
          <View style={styles.highlightBox}>
            <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Assumptions</Text>
            <View style={styles.listSection}>
              {scopeOfWork.assumptions.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.bullet}>→</Text>
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Deliverables */}
        {scopeOfWork.deliverables && scopeOfWork.deliverables.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deliverables</Text>
            <View style={styles.listSection}>
              {scopeOfWork.deliverables.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.bullet}>✓</Text>
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <Text style={styles.sectionTitle}>Acknowledgment</Text>
          <Text style={styles.paragraph}>
            By signing below, the client acknowledges they have reviewed and understood the scope of work
            described in this document. Any work outside of this scope will require a change order.
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
            <View style={[styles.signatureField, { marginRight: 0, flex: 0.7 }]}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Date</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            {organization.name} | {scopeOfWork.number} v{scopeOfWork.version} | Page 1 of 1
          </Text>
        </View>
      </Page>
    </Document>
  );
}
