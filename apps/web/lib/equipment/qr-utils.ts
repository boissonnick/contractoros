import type { EquipmentItem } from '@/types';

const QR_PROTOCOL = 'contractoros';
const QR_TYPE = 'equipment';

export interface EquipmentQRData {
  protocol: string;
  type: string;
  id: string;
  name: string;
  serialNumber?: string;
  assetTag?: string;
}

/**
 * Generate QR code data for an equipment item
 * Format: contractoros://equipment/{id}?name={name}&serial={serial}&tag={tag}
 */
export function generateEquipmentQRData(equipment: EquipmentItem): string {
  const baseUrl = `${QR_PROTOCOL}://${QR_TYPE}/${equipment.id}`;
  const params = new URLSearchParams();

  params.set('name', equipment.name);
  if (equipment.serialNumber) params.set('serial', equipment.serialNumber);
  if (equipment.assetTag) params.set('tag', equipment.assetTag);

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Parse QR code data back into equipment info
 */
export function parseEquipmentQRCode(data: string): EquipmentQRData | null {
  try {
    // Handle the custom protocol format
    const protocolMatch = data.match(/^(\w+):\/\/(\w+)\/([^?]+)(?:\?(.*))?$/);

    if (!protocolMatch) return null;

    const [, protocol, type, id, queryString] = protocolMatch;

    if (protocol !== QR_PROTOCOL || type !== QR_TYPE) {
      return null;
    }

    const params = new URLSearchParams(queryString || '');

    return {
      protocol,
      type,
      id,
      name: params.get('name') || '',
      serialNumber: params.get('serial') || undefined,
      assetTag: params.get('tag') || undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Validate if a string is a valid ContractorOS equipment QR code
 */
export function isValidEquipmentQRCode(data: string): boolean {
  return parseEquipmentQRCode(data) !== null;
}

/**
 * Generate a simple URL for web-based QR scanning
 * This redirects to the equipment detail page
 */
export function generateEquipmentWebUrl(equipment: EquipmentItem, baseUrl: string): string {
  return `${baseUrl}/dashboard/equipment/${equipment.id}`;
}

/**
 * Generate QR code content that works both as deep link and web URL
 * Uses Universal Links / App Links pattern
 */
export function generateUniversalEquipmentUrl(equipment: EquipmentItem, webBaseUrl: string): string {
  const params = new URLSearchParams();
  params.set('deeplink', generateEquipmentQRData(equipment));
  return `${webBaseUrl}/scan/equipment/${equipment.id}?${params.toString()}`;
}
