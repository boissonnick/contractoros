import { LegacyPayrollEntry, PayrollConfig } from '@/types';

interface TimeData {
  userId: string;
  userName: string;
  hourlyRate: number;
  totalHours: number;
}

export function calculatePayroll(
  timeData: TimeData[],
  config: PayrollConfig
): { entries: LegacyPayrollEntry[]; totalRegular: number; totalOvertime: number; totalPay: number } {
  const entries: LegacyPayrollEntry[] = timeData.map(td => {
    const rate = td.hourlyRate || config.defaultHourlyRate;
    const regularHours = Math.min(td.totalHours, config.overtimeThresholdHours);
    const overtimeHours = Math.max(0, td.totalHours - config.overtimeThresholdHours);
    const regularPay = regularHours * rate;
    const overtimePay = overtimeHours * rate * config.overtimeMultiplier;

    return {
      userId: td.userId,
      userName: td.userName,
      regularHours: Math.round(regularHours * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      hourlyRate: rate,
      regularPay: Math.round(regularPay * 100) / 100,
      overtimePay: Math.round(overtimePay * 100) / 100,
      totalPay: Math.round((regularPay + overtimePay) * 100) / 100,
    };
  });

  return {
    entries,
    totalRegular: entries.reduce((s, e) => s + e.regularPay, 0),
    totalOvertime: entries.reduce((s, e) => s + e.overtimePay, 0),
    totalPay: entries.reduce((s, e) => s + e.totalPay, 0),
  };
}
