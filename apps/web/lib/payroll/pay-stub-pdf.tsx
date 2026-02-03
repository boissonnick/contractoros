/**
 * Pay Stub PDF Template
 * Generates professional pay stub PDFs using @react-pdf/renderer
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { PayStub, Organization } from '@/types';
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

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Inter',
    fontSize: 9,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
  },
  companyInfo: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1e40af',
    marginBottom: 4,
  },
  companyAddress: {
    fontSize: 8,
    color: '#6b7280',
    lineHeight: 1.4,
  },
  payStubTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1f2937',
    textAlign: 'right',
  },
  payPeriodInfo: {
    textAlign: 'right',
    marginTop: 4,
  },
  label: {
    fontSize: 8,
    color: '#6b7280',
  },
  value: {
    fontSize: 9,
    fontWeight: 600,
    color: '#1f2937',
  },
  employeeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 4,
    marginBottom: 20,
  },
  employeeInfo: {
    flexDirection: 'column',
  },
  employeeName: {
    fontSize: 11,
    fontWeight: 600,
    marginBottom: 2,
  },
  grid: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  column: {
    flex: 1,
    marginRight: 10,
  },
  columnLast: {
    flex: 1,
    marginRight: 0,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#1e40af',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  table: {
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableHeaderCell: {
    fontSize: 7,
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableCell: {
    fontSize: 8,
    color: '#374151',
  },
  tableCellBold: {
    fontSize: 8,
    fontWeight: 600,
    color: '#1f2937',
  },
  totalRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#f9fafb',
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
    marginTop: 4,
  },
  netPaySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e40af',
    padding: 15,
    borderRadius: 4,
    marginBottom: 20,
  },
  netPayLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#ffffff',
  },
  netPayAmount: {
    fontSize: 18,
    fontWeight: 700,
    color: '#ffffff',
  },
  ytdSection: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 4,
    marginBottom: 20,
  },
  ytdTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#374151',
    marginBottom: 8,
  },
  ytdGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  ytdItem: {
    width: '25%',
    marginBottom: 6,
  },
  ytdLabel: {
    fontSize: 7,
    color: '#6b7280',
  },
  ytdValue: {
    fontSize: 9,
    fontWeight: 600,
    color: '#1f2937',
  },
  balancesSection: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  balanceBox: {
    flex: 1,
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 4,
    marginRight: 10,
  },
  balanceBoxLast: {
    flex: 1,
    backgroundColor: '#dbeafe',
    padding: 10,
    borderRadius: 4,
    marginRight: 0,
  },
  balanceLabel: {
    fontSize: 7,
    color: '#92400e',
    marginBottom: 2,
  },
  balanceLabelBlue: {
    fontSize: 7,
    color: '#1e40af',
    marginBottom: 2,
  },
  balanceValue: {
    fontSize: 11,
    fontWeight: 700,
    color: '#92400e',
  },
  balanceValueBlue: {
    fontSize: 11,
    fontWeight: 700,
    color: '#1e40af',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 7,
    color: '#9ca3af',
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: 7,
    color: '#f59e0b',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  // Column widths for earnings table
  descCol: { width: '40%' },
  hoursCol: { width: '15%', textAlign: 'right' },
  rateCol: { width: '20%', textAlign: 'right' },
  amountCol: { width: '25%', textAlign: 'right' },
  // Column widths for deductions table
  deductionDescCol: { width: '60%' },
  deductionAmountCol: { width: '40%', textAlign: 'right' },
});

// Format date
const formatDate = (date: Date): string => {
  return format(date, 'MMM d, yyyy');
};

interface PayStubPdfProps {
  payStub: PayStub;
  organization?: Partial<Organization>;
}

export function PayStubPdf({ payStub, organization }: PayStubPdfProps) {
  const earnings = payStub.currentEarnings;
  const deductions = payStub.currentDeductions;

  // Build earnings rows
  const earningsRows = [
    earnings.regular.hours > 0 && {
      description: 'Regular Pay',
      hours: earnings.regular.hours,
      rate: earnings.regular.rate,
      amount: earnings.regular.amount,
    },
    earnings.overtime.hours > 0 && {
      description: 'Overtime Pay (1.5x)',
      hours: earnings.overtime.hours,
      rate: earnings.overtime.rate,
      amount: earnings.overtime.amount,
    },
    earnings.doubleTime.hours > 0 && {
      description: 'Double Time (2x)',
      hours: earnings.doubleTime.hours,
      rate: earnings.doubleTime.rate,
      amount: earnings.doubleTime.amount,
    },
    earnings.pto.hours > 0 && {
      description: 'PTO',
      hours: earnings.pto.hours,
      rate: earnings.pto.rate,
      amount: earnings.pto.amount,
    },
    earnings.sick.hours > 0 && {
      description: 'Sick Leave',
      hours: earnings.sick.hours,
      rate: earnings.sick.rate,
      amount: earnings.sick.amount,
    },
    earnings.holiday.hours > 0 && {
      description: 'Holiday Pay',
      hours: earnings.holiday.hours,
      rate: earnings.holiday.rate,
      amount: earnings.holiday.amount,
    },
    earnings.bonuses > 0 && {
      description: 'Bonuses',
      hours: null,
      rate: null,
      amount: earnings.bonuses,
    },
    earnings.commissions > 0 && {
      description: 'Commissions',
      hours: null,
      rate: null,
      amount: earnings.commissions,
    },
    earnings.reimbursements > 0 && {
      description: 'Reimbursements',
      hours: null,
      rate: null,
      amount: earnings.reimbursements,
      nonTaxable: true,
    },
  ].filter(Boolean) as Array<{
    description: string;
    hours: number | null;
    rate: number | null;
    amount: number;
    nonTaxable?: boolean;
  }>;

  // Build deduction rows
  const deductionRows = [
    deductions.federal > 0 && { description: 'Federal Income Tax', amount: deductions.federal },
    deductions.state > 0 && { description: 'State Income Tax', amount: deductions.state },
    deductions.socialSecurity > 0 && { description: 'Social Security (6.2%)', amount: deductions.socialSecurity },
    deductions.medicare > 0 && { description: 'Medicare (1.45%)', amount: deductions.medicare },
    deductions.local > 0 && { description: 'Local Tax', amount: deductions.local },
    deductions.retirement > 0 && { description: '401(k) Contribution', amount: deductions.retirement },
    deductions.healthInsurance > 0 && { description: 'Health Insurance', amount: deductions.healthInsurance },
    deductions.other > 0 && { description: 'Other Deductions', amount: deductions.other },
  ].filter(Boolean) as Array<{ description: string; amount: number }>;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>
              {payStub.employer.name || organization?.name || 'Company Name'}
            </Text>
            {payStub.employer.address && (
              <Text style={styles.companyAddress}>{payStub.employer.address}</Text>
            )}
            {payStub.employer.ein && (
              <Text style={styles.companyAddress}>EIN: {payStub.employer.ein}</Text>
            )}
          </View>
          <View>
            <Text style={styles.payStubTitle}>PAY STUB</Text>
            <View style={styles.payPeriodInfo}>
              <Text style={styles.label}>Pay Date</Text>
              <Text style={styles.value}>{formatDate(payStub.payDate)}</Text>
              {payStub.checkNumber && (
                <>
                  <Text style={[styles.label, { marginTop: 4 }]}>Check #</Text>
                  <Text style={styles.value}>{payStub.checkNumber}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Employee Info */}
        <View style={styles.employeeSection}>
          <View style={styles.employeeInfo}>
            <Text style={styles.employeeName}>{payStub.employee.name}</Text>
            <Text style={styles.label}>Employee ID: {payStub.employee.id}</Text>
            {payStub.employee.address && (
              <Text style={[styles.label, { marginTop: 2 }]}>{payStub.employee.address}</Text>
            )}
            {payStub.employee.ssn && (
              <Text style={[styles.label, { marginTop: 2 }]}>SSN: {payStub.employee.ssn}</Text>
            )}
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={styles.label}>Pay Period</Text>
            <Text style={styles.value}>{payStub.payPeriod.label}</Text>
            <Text style={[styles.label, { marginTop: 4 }]}>
              {formatDate(payStub.payPeriod.startDate)} - {formatDate(payStub.payPeriod.endDate)}
            </Text>
          </View>
        </View>

        {/* Main Grid: Earnings and Deductions */}
        <View style={styles.grid}>
          {/* Earnings Column */}
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>EARNINGS</Text>
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.descCol]}>Description</Text>
                <Text style={[styles.tableHeaderCell, styles.hoursCol]}>Hours</Text>
                <Text style={[styles.tableHeaderCell, styles.rateCol]}>Rate</Text>
                <Text style={[styles.tableHeaderCell, styles.amountCol]}>Amount</Text>
              </View>
              {/* Table Rows */}
              {earningsRows.map((row, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.descCol]}>{row.description}</Text>
                  <Text style={[styles.tableCell, styles.hoursCol]}>
                    {row.hours !== null ? row.hours.toFixed(2) : '-'}
                  </Text>
                  <Text style={[styles.tableCell, styles.rateCol]}>
                    {row.rate !== null ? formatCurrency(row.rate) : '-'}
                  </Text>
                  <Text style={[styles.tableCellBold, styles.amountCol]}>
                    {formatCurrency(row.amount)}
                  </Text>
                </View>
              ))}
              {/* Gross Total */}
              <View style={styles.totalRow}>
                <Text style={[styles.tableCellBold, styles.descCol]}>GROSS PAY</Text>
                <Text style={[styles.tableCell, styles.hoursCol]}></Text>
                <Text style={[styles.tableCell, styles.rateCol]}></Text>
                <Text style={[styles.tableCellBold, styles.amountCol]}>
                  {formatCurrency(earnings.grossPay)}
                </Text>
              </View>
            </View>
          </View>

          {/* Deductions Column */}
          <View style={styles.columnLast}>
            <Text style={styles.sectionTitle}>DEDUCTIONS</Text>
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.deductionDescCol]}>Description</Text>
                <Text style={[styles.tableHeaderCell, styles.deductionAmountCol]}>Amount</Text>
              </View>
              {/* Table Rows */}
              {deductionRows.map((row, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.deductionDescCol]}>{row.description}</Text>
                  <Text style={[styles.tableCellBold, styles.deductionAmountCol, { color: '#dc2626' }]}>
                    -{formatCurrency(row.amount)}
                  </Text>
                </View>
              ))}
              {/* Total Deductions */}
              <View style={styles.totalRow}>
                <Text style={[styles.tableCellBold, styles.deductionDescCol]}>TOTAL DEDUCTIONS</Text>
                <Text style={[styles.tableCellBold, styles.deductionAmountCol, { color: '#dc2626' }]}>
                  -{formatCurrency(deductions.total)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Net Pay */}
        <View style={styles.netPaySection}>
          <Text style={styles.netPayLabel}>NET PAY (This Period)</Text>
          <Text style={styles.netPayAmount}>{formatCurrency(payStub.netPay)}</Text>
        </View>

        {/* PTO/Sick Balances */}
        {(payStub.ptoBalance !== undefined || payStub.sickBalance !== undefined) && (
          <View style={styles.balancesSection}>
            {payStub.ptoBalance !== undefined && (
              <View style={styles.balanceBox}>
                <Text style={styles.balanceLabel}>PTO Balance</Text>
                <Text style={styles.balanceValue}>{payStub.ptoBalance.toFixed(1)} hrs</Text>
              </View>
            )}
            {payStub.sickBalance !== undefined && (
              <View style={styles.balanceBoxLast}>
                <Text style={styles.balanceLabelBlue}>Sick Leave Balance</Text>
                <Text style={styles.balanceValueBlue}>{payStub.sickBalance.toFixed(1)} hrs</Text>
              </View>
            )}
          </View>
        )}

        {/* Year-to-Date */}
        <View style={styles.ytdSection}>
          <Text style={styles.ytdTitle}>YEAR-TO-DATE TOTALS</Text>
          <View style={styles.ytdGrid}>
            <View style={styles.ytdItem}>
              <Text style={styles.ytdLabel}>Gross Earnings</Text>
              <Text style={styles.ytdValue}>{formatCurrency(payStub.ytdEarnings.gross)}</Text>
            </View>
            <View style={styles.ytdItem}>
              <Text style={styles.ytdLabel}>Federal Tax</Text>
              <Text style={styles.ytdValue}>{formatCurrency(payStub.ytdDeductions.federal)}</Text>
            </View>
            <View style={styles.ytdItem}>
              <Text style={styles.ytdLabel}>State Tax</Text>
              <Text style={styles.ytdValue}>{formatCurrency(payStub.ytdDeductions.state)}</Text>
            </View>
            <View style={styles.ytdItem}>
              <Text style={styles.ytdLabel}>Social Security</Text>
              <Text style={styles.ytdValue}>{formatCurrency(payStub.ytdDeductions.socialSecurity)}</Text>
            </View>
            <View style={styles.ytdItem}>
              <Text style={styles.ytdLabel}>Medicare</Text>
              <Text style={styles.ytdValue}>{formatCurrency(payStub.ytdDeductions.medicare)}</Text>
            </View>
            <View style={styles.ytdItem}>
              <Text style={styles.ytdLabel}>401(k)</Text>
              <Text style={styles.ytdValue}>{formatCurrency(payStub.ytdDeductions.retirement)}</Text>
            </View>
            <View style={styles.ytdItem}>
              <Text style={styles.ytdLabel}>Health Ins.</Text>
              <Text style={styles.ytdValue}>{formatCurrency(payStub.ytdDeductions.healthInsurance)}</Text>
            </View>
            <View style={styles.ytdItem}>
              <Text style={styles.ytdLabel}>Net Pay</Text>
              <Text style={[styles.ytdValue, { color: '#059669' }]}>{formatCurrency(payStub.ytdNetPay)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This is a system-generated pay stub. Please retain for your records.
          </Text>
          <Text style={styles.disclaimer}>
            Tax calculations are estimates only. Consult a tax professional for official tax advice.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

// Helper to convert PayrollEntry to PayStub
// This function accepts the PayrollEntry type from types/index.ts
export function payrollEntryToPayStub(
  entry: {
    id: string;
    employeeId: string;
    employeeName: string;
    employeeType: 'hourly' | 'salaried' | 'site_manager';
    regularHours: number;
    overtimeHours: number;
    doubleTimeHours: number;
    ptoHours: number;
    sickHours: number;
    holidayHours?: number;
    regularRate: number;
    overtimeRate: number;
    doubleTimeRate: number;
    regularPay: number;
    overtimePay: number;
    doubleTimePay: number;
    ptoPay: number;
    sickPay: number;
    holidayPay?: number;
    bonuses: number;
    commissions?: number;
    reimbursements: number;
    grossPay: number;
    federalWithholding: number;
    stateWithholding: number;
    localTax?: number;
    socialSecurity: number;
    medicare: number;
    retirement401k: number;
    healthInsurance: number;
    otherDeductions: number;
    totalDeductions: number;
    netPay: number;
    ytdGrossPay: number;
    ytdFederalWithholding: number;
    ytdStateWithholding: number;
    ytdSocialSecurity: number;
    ytdMedicare: number;
  },
  payPeriod: { label: string; startDate: Date; endDate: Date; payDate: Date },
  employer: { name: string; address?: string; ein?: string },
  ptoBalance?: number,
  sickBalance?: number
): PayStub {
  // Calculate YTD net pay from available YTD data
  const ytdTotalDeductions =
    entry.ytdFederalWithholding +
    entry.ytdStateWithholding +
    entry.ytdSocialSecurity +
    entry.ytdMedicare;
  const ytdNetPay = entry.ytdGrossPay - ytdTotalDeductions;

  return {
    employee: {
      name: entry.employeeName,
      id: entry.employeeId,
    },
    employer,
    payPeriod: {
      id: '',
      type: 'bi-weekly' as const,
      label: payPeriod.label,
      startDate: payPeriod.startDate,
      endDate: payPeriod.endDate,
      payDate: payPeriod.payDate,
    },
    payDate: payPeriod.payDate,
    currentEarnings: {
      regular: { hours: entry.regularHours, rate: entry.regularRate, amount: entry.regularPay },
      overtime: { hours: entry.overtimeHours, rate: entry.overtimeRate, amount: entry.overtimePay },
      doubleTime: { hours: entry.doubleTimeHours, rate: entry.doubleTimeRate, amount: entry.doubleTimePay },
      pto: { hours: entry.ptoHours, rate: entry.regularRate, amount: entry.ptoPay },
      sick: { hours: entry.sickHours, rate: entry.regularRate, amount: entry.sickPay },
      holiday: { hours: entry.holidayHours ?? 0, rate: entry.regularRate, amount: entry.holidayPay ?? 0 },
      bonuses: entry.bonuses,
      commissions: entry.commissions ?? 0,
      reimbursements: entry.reimbursements,
      grossPay: entry.grossPay,
    },
    currentDeductions: {
      federal: entry.federalWithholding,
      state: entry.stateWithholding,
      socialSecurity: entry.socialSecurity,
      medicare: entry.medicare,
      local: entry.localTax ?? 0,
      retirement: entry.retirement401k,
      healthInsurance: entry.healthInsurance,
      other: entry.otherDeductions,
      total: entry.totalDeductions,
    },
    netPay: entry.netPay,
    ytdEarnings: {
      gross: entry.ytdGrossPay,
      regular: 0, // Not tracked separately in PayrollEntry
      overtime: 0, // Not tracked separately in PayrollEntry
      bonuses: 0, // Not tracked separately in PayrollEntry
      pto: 0, // Not tracked separately in PayrollEntry
    },
    ytdDeductions: {
      federal: entry.ytdFederalWithholding,
      state: entry.ytdStateWithholding,
      socialSecurity: entry.ytdSocialSecurity,
      medicare: entry.ytdMedicare,
      retirement: 0, // Not tracked separately in PayrollEntry
      healthInsurance: 0, // Not tracked separately in PayrollEntry
      total: ytdTotalDeductions,
    },
    ytdNetPay,
    ptoBalance: ptoBalance ?? 0,
    sickBalance: sickBalance ?? 0,
  };
}

export default PayStubPdf;
