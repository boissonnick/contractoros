/**
 * Estimate PDF Template
 * Generates a PDF document for estimates using @react-pdf/renderer
 * Supports customizable templates for branded PDF generation
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
import { Estimate, Organization, QuotePdfTemplate, createDefaultQuotePdfTemplate } from '@/types';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils/formatters';

// Register fonts
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2', fontWeight: 700 },
  ],
});

Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9fBBc9.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc9.woff2', fontWeight: 700 },
  ],
});

Font.register({
  family: 'Open Sans',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/opensans/v36/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVI.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/opensans/v36/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1x4gaVI.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/opensans/v36/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsgH1x4gaVI.woff2', fontWeight: 700 },
  ],
});

Font.register({
  family: 'Lato',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHjx4wWw.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/lato/v24/S6u9w4BMUTPHh6UVSwiPHA.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/lato/v24/S6u9w4BMUTPHh6UVSwaPHA.woff2', fontWeight: 700 },
  ],
});

Font.register({
  family: 'Poppins',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLEj6Z1xlFQ.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLCz7Z1xlFQ.woff2', fontWeight: 700 },
  ],
});

// Font mapping
const fontMap: Record<string, string> = {
  inter: 'Inter',
  roboto: 'Roboto',
  'open-sans': 'Open Sans',
  lato: 'Lato',
  poppins: 'Poppins',
};

// Create dynamic styles based on template
const createStyles = (template: QuotePdfTemplate) => {
  const fontFamily = fontMap[template.font] || 'Inter';

  return StyleSheet.create({
    page: {
      padding: 40,
      fontFamily,
      fontSize: 10,
      color: template.textColor,
      backgroundColor: template.backgroundColor,
    },
    // Header styles based on headerStyle
    header: {
      flexDirection: template.headerStyle === 'logo-right' ? 'row-reverse' : 'row',
      justifyContent: template.headerStyle === 'centered' ? 'center' : 'space-between',
      alignItems: template.headerStyle === 'centered' ? 'center' : 'flex-start',
      marginBottom: 30,
      borderBottomWidth: template.layout === 'minimal' ? 0 : 2,
      borderBottomColor: template.primaryColor,
      paddingBottom: 20,
    },
    headerCentered: {
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: 30,
      borderBottomWidth: template.layout === 'minimal' ? 0 : 2,
      borderBottomColor: template.primaryColor,
      paddingBottom: 20,
    },
    headerBanner: {
      backgroundColor: template.primaryColor,
      padding: 20,
      marginHorizontal: -40,
      marginTop: -40,
      marginBottom: 30,
    },
    logo: {
      width: template.header.logoSize === 'small' ? 80 : template.header.logoSize === 'large' ? 160 : 120,
      height: template.header.logoSize === 'small' ? 27 : template.header.logoSize === 'large' ? 54 : 40,
      objectFit: 'contain',
    },
    companyInfo: {
      alignItems: template.headerStyle === 'logo-right' ? 'flex-start' : 'flex-end',
    },
    companyInfoCentered: {
      alignItems: 'center',
      marginTop: 10,
    },
    companyName: {
      fontSize: 18,
      fontWeight: 700,
      color: template.textColor,
    },
    companyNameBanner: {
      fontSize: 20,
      fontWeight: 700,
      color: '#ffffff',
    },
    companyDetail: {
      fontSize: 9,
      color: '#6b7280',
      marginTop: 2,
    },
    companyDetailBanner: {
      fontSize: 9,
      color: 'rgba(255,255,255,0.9)',
      marginTop: 2,
    },
    tagline: {
      fontSize: 10,
      fontStyle: 'italic',
      color: '#6b7280',
      marginTop: 5,
    },
    title: {
      fontSize: 24,
      fontWeight: 700,
      color: template.textColor,
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
      color: template.primaryColor,
      marginBottom: 8,
      textTransform: template.layout === 'professional' ? 'uppercase' : 'none',
      letterSpacing: template.layout === 'professional' ? 0.5 : 0,
    },
    infoLabel: {
      fontSize: 9,
      color: '#6b7280',
      marginBottom: 2,
    },
    infoValue: {
      fontSize: 10,
      color: template.textColor,
      marginBottom: 6,
    },
    table: {
      marginTop: 20,
      marginBottom: 20,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: template.tableHeaderBg,
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
      backgroundColor: template.tableAltRowBg,
    },
    tableCell: {
      fontSize: 9,
      color: template.textColor,
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
      color: template.textColor,
    },
    grandTotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderTopWidth: 2,
      borderTopColor: template.primaryColor,
      marginTop: 5,
    },
    grandTotalLabel: {
      fontSize: 14,
      fontWeight: 700,
      color: template.textColor,
    },
    grandTotalValue: {
      fontSize: 14,
      fontWeight: 700,
      color: template.primaryColor,
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
      borderBottomColor: template.textColor,
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
      borderTopWidth: template.layout === 'minimal' ? 0 : 1,
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
};

interface EstimatePdfProps {
  estimate: Estimate;
  organization: Organization;
  includeSignatureFields?: boolean;
  template?: QuotePdfTemplate;
}

function formatDate(date: Date | string | undefined): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMMM d, yyyy');
}

// Header component for different styles
function PdfHeader({
  organization,
  template,
  styles,
}: {
  organization: Organization;
  template: QuotePdfTemplate;
  styles: ReturnType<typeof createStyles>;
}) {
  const { header } = template;

  // Full-width banner style
  if (template.headerStyle === 'full-width-banner') {
    return (
      <View style={styles.headerBanner}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          {header.showLogo && organization.logoURL ? (
            /* eslint-disable-next-line jsx-a11y/alt-text */
            <Image src={organization.logoURL} style={styles.logo} />
          ) : (
            header.showCompanyName && (
              <Text style={styles.companyNameBanner}>{organization.name}</Text>
            )
          )}
          <View style={{ alignItems: 'flex-end' }}>
            {header.showLogo && organization.logoURL && header.showCompanyName && (
              <Text style={styles.companyNameBanner}>{organization.name}</Text>
            )}
            {header.showAddress && organization.address && (
              <Text style={styles.companyDetailBanner}>{organization.address}</Text>
            )}
            {header.showPhone && organization.phone && (
              <Text style={styles.companyDetailBanner}>{organization.phone}</Text>
            )}
            {header.showEmail && organization.email && (
              <Text style={styles.companyDetailBanner}>{organization.email}</Text>
            )}
            {organization.taxConfig?.taxIdEin && (
              <Text style={styles.companyDetailBanner}>Tax ID: {organization.taxConfig.taxIdEin}</Text>
            )}
          </View>
        </View>
        {header.customTagline && (
          <Text style={[styles.tagline, { color: 'rgba(255,255,255,0.8)', marginTop: 8 }]}>
            {header.customTagline}
          </Text>
        )}
      </View>
    );
  }

  // Centered style
  if (template.headerStyle === 'centered') {
    return (
      <View style={styles.headerCentered}>
        {header.showLogo && organization.logoURL && (
          /* eslint-disable-next-line jsx-a11y/alt-text */
          <Image src={organization.logoURL} style={styles.logo} />
        )}
        <View style={styles.companyInfoCentered}>
          {header.showCompanyName && (
            <Text style={styles.companyName}>{organization.name}</Text>
          )}
          {header.customTagline && (
            <Text style={styles.tagline}>{header.customTagline}</Text>
          )}
          {header.showAddress && organization.address && (
            <Text style={styles.companyDetail}>{organization.address}</Text>
          )}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 2 }}>
            {header.showPhone && organization.phone && (
              <Text style={styles.companyDetail}>{organization.phone}</Text>
            )}
            {header.showEmail && organization.email && (
              <Text style={styles.companyDetail}>{organization.email}</Text>
            )}
          </View>
          {organization.taxConfig?.taxIdEin && (
            <Text style={[styles.companyDetail, { marginTop: 2 }]}>Tax ID: {organization.taxConfig.taxIdEin}</Text>
          )}
        </View>
      </View>
    );
  }

  // Default: logo-left or logo-right
  return (
    <View style={styles.header}>
      <View>
        {header.showLogo && organization.logoURL ? (
          /* eslint-disable-next-line jsx-a11y/alt-text */
          <Image src={organization.logoURL} style={styles.logo} />
        ) : (
          header.showCompanyName && (
            <Text style={styles.companyName}>{organization.name}</Text>
          )
        )}
      </View>
      <View style={styles.companyInfo}>
        {header.showLogo && organization.logoURL && header.showCompanyName && (
          <Text style={styles.companyName}>{organization.name}</Text>
        )}
        {header.customTagline && (
          <Text style={styles.tagline}>{header.customTagline}</Text>
        )}
        {header.showAddress && organization.address && (
          <Text style={styles.companyDetail}>{organization.address}</Text>
        )}
        {header.showPhone && organization.phone && (
          <Text style={styles.companyDetail}>{organization.phone}</Text>
        )}
        {header.showEmail && organization.email && (
          <Text style={styles.companyDetail}>{organization.email}</Text>
        )}
        {organization.taxConfig?.taxIdEin && (
          <Text style={styles.companyDetail}>Tax ID: {organization.taxConfig.taxIdEin}</Text>
        )}
      </View>
    </View>
  );
}

export default function EstimatePdf({
  estimate,
  organization,
  includeSignatureFields = true,
  template,
}: EstimatePdfProps) {
  // Use provided template or create default
  const effectiveTemplate = template || (createDefaultQuotePdfTemplate(organization.id) as QuotePdfTemplate);
  const styles = createStyles(effectiveTemplate);
  const { tableSettings, sections } = effectiveTemplate;

  // Determine which content to show
  const scopeOfWork = estimate.scopeOfWork || effectiveTemplate.defaultContent.scopeOfWork;
  const exclusions = estimate.exclusions || effectiveTemplate.defaultContent.exclusions;
  const paymentTerms = estimate.paymentTerms || effectiveTemplate.defaultContent.paymentTerms;
  const termsAndConditions = estimate.termsAndConditions || effectiveTemplate.defaultContent.termsAndConditions;
  const acceptanceText = effectiveTemplate.defaultContent.acceptanceText ||
    `By signing below, I accept this estimate and authorize ${organization.name} to proceed with the work as described above.`;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <PdfHeader
          organization={organization}
          template={effectiveTemplate}
          styles={styles}
        />

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
            {sections.showValidUntil && (
              <>
                <Text style={styles.infoLabel}>Valid Until</Text>
                <Text style={[styles.infoValue, { color: '#dc2626' }]}>
                  {formatDate(estimate.validUntil)}
                </Text>
              </>
            )}
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
            {tableSettings.showQuantity && (
              <Text style={[styles.tableHeaderCell, styles.tableCellQty]}>Qty</Text>
            )}
            {tableSettings.showUnit && (
              <Text style={[styles.tableHeaderCell, styles.tableCellUnit]}>Unit</Text>
            )}
            {tableSettings.showUnitPrice && (
              <Text style={[styles.tableHeaderCell, styles.tableCellPrice]}>Price</Text>
            )}
            <Text style={[styles.tableHeaderCell, styles.tableCellTotal]}>Total</Text>
          </View>
          {estimate.lineItems.map((item, index) => (
            <View
              key={item.id}
              style={index % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}
            >
              <View style={styles.tableCellDesc}>
                <Text style={[styles.tableCell, { fontWeight: 600 }]}>{item.name}</Text>
                {tableSettings.showDescription && item.description && (
                  <Text style={[styles.tableCell, { color: '#6b7280', marginTop: 2 }]}>
                    {item.description}
                  </Text>
                )}
                {tableSettings.showOptionalBadge && item.isOptional && (
                  <Text style={[styles.badge, { marginTop: 4 }]}>Optional</Text>
                )}
              </View>
              {tableSettings.showQuantity && (
                <Text style={[styles.tableCell, styles.tableCellQty]}>{item.quantity}</Text>
              )}
              {tableSettings.showUnit && (
                <Text style={[styles.tableCell, styles.tableCellUnit]}>{item.unit}</Text>
              )}
              {tableSettings.showUnitPrice && (
                <Text style={[styles.tableCell, styles.tableCellPrice]}>
                  {formatCurrency(item.unitCost)}
                </Text>
              )}
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
          {sections.showDepositInfo && estimate.depositRequired && estimate.depositRequired > 0 && (
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
        {sections.showScopeOfWork && scopeOfWork && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scope of Work</Text>
            <Text style={styles.paragraph}>{scopeOfWork}</Text>
          </View>
        )}

        {/* Exclusions */}
        {sections.showExclusions && exclusions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exclusions</Text>
            <Text style={styles.paragraph}>{exclusions}</Text>
          </View>
        )}

        {/* Payment Terms */}
        {sections.showPaymentTerms && paymentTerms && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Terms</Text>
            <Text style={styles.paragraph}>{paymentTerms}</Text>
          </View>
        )}

        {/* Terms and Conditions */}
        {sections.showTermsAndConditions && termsAndConditions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Terms and Conditions</Text>
            <Text style={styles.paragraph}>{termsAndConditions}</Text>
          </View>
        )}

        {/* Signature Section */}
        {sections.showSignatureBlock && includeSignatureFields && (
          <View style={styles.signatureSection}>
            <Text style={styles.sectionTitle}>Acceptance</Text>
            <Text style={styles.paragraph}>{acceptanceText}</Text>
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
          {effectiveTemplate.footer.showEstimateNumber && (
            <Text>
              {organization.name} | Estimate #{estimate.number} | Page 1 of 1
            </Text>
          )}
          {effectiveTemplate.footer.showValidUntil && sections.showValidUntil && (
            <Text style={{ marginTop: 3 }}>
              This estimate is valid until {formatDate(estimate.validUntil)}
            </Text>
          )}
          {effectiveTemplate.footer.customText && (
            <Text style={{ marginTop: 3 }}>{effectiveTemplate.footer.customText}</Text>
          )}
        </View>
      </Page>
    </Document>
  );
}
