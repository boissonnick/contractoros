/**
 * Change Order Detector Utility
 * Compares SOW versions and detects changes requiring change orders
 */

export interface ScopeItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  category?: string;
  phaseId?: string;
}

export interface ChangeDetection {
  type: 'added' | 'removed' | 'modified';
  itemId: string;
  itemName: string;
  originalItem?: ScopeItem;
  currentItem?: ScopeItem;
  costImpact: number;
  quantityChange?: number;
  priceChange?: number;
  description: string;
  requiresApproval: boolean;
}

export interface ChangeOrderDraft {
  title: string;
  description: string;
  changes: ChangeDetection[];
  totalCostImpact: number;
  requiresClientApproval: boolean;
  generatedAt: Date;
}

export interface ChangeDetectionSummary {
  added: ChangeDetection[];
  removed: ChangeDetection[];
  modified: ChangeDetection[];
  totalAdditions: number;
  totalRemovals: number;
  totalModifications: number;
  netCostImpact: number;
  changeOrderDraft: ChangeOrderDraft;
}

const APPROVAL_THRESHOLD = 500; // Changes over $500 require approval

/**
 * Calculate the total cost of a scope item
 */
function calculateItemTotal(item: ScopeItem): number {
  return item.quantity * item.unitPrice;
}

/**
 * Detect added items (in current but not in original)
 */
function detectAddedItems(original: ScopeItem[], current: ScopeItem[]): ChangeDetection[] {
  const originalIds = new Set(original.map(item => item.id));

  return current
    .filter(item => !originalIds.has(item.id))
    .map(item => {
      const costImpact = calculateItemTotal(item);
      return {
        type: 'added' as const,
        itemId: item.id,
        itemName: item.name,
        currentItem: item,
        costImpact,
        description: `New item added: ${item.name} (${item.quantity} ${item.unit} @ $${item.unitPrice})`,
        requiresApproval: costImpact >= APPROVAL_THRESHOLD,
      };
    });
}

/**
 * Detect removed items (in original but not in current)
 */
function detectRemovedItems(original: ScopeItem[], current: ScopeItem[]): ChangeDetection[] {
  const currentIds = new Set(current.map(item => item.id));

  return original
    .filter(item => !currentIds.has(item.id))
    .map(item => {
      const costImpact = -calculateItemTotal(item);
      return {
        type: 'removed' as const,
        itemId: item.id,
        itemName: item.name,
        originalItem: item,
        costImpact,
        description: `Item removed: ${item.name} (${item.quantity} ${item.unit} @ $${item.unitPrice})`,
        requiresApproval: Math.abs(costImpact) >= APPROVAL_THRESHOLD,
      };
    });
}

/**
 * Detect modified items (same id but different values)
 */
function detectModifiedItems(original: ScopeItem[], current: ScopeItem[]): ChangeDetection[] {
  const originalMap = new Map(original.map(item => [item.id, item]));
  const modifications: ChangeDetection[] = [];

  current.forEach(currentItem => {
    const originalItem = originalMap.get(currentItem.id);
    if (!originalItem) return; // New item, handled by detectAddedItems

    // Check for changes
    const quantityChange = currentItem.quantity - originalItem.quantity;
    const priceChange = currentItem.unitPrice - originalItem.unitPrice;
    const originalTotal = calculateItemTotal(originalItem);
    const currentTotal = calculateItemTotal(currentItem);
    const costImpact = currentTotal - originalTotal;

    // Only report if there's an actual change
    if (quantityChange !== 0 || priceChange !== 0 || currentItem.name !== originalItem.name) {
      const changes: string[] = [];

      if (currentItem.name !== originalItem.name) {
        changes.push(`name changed from "${originalItem.name}" to "${currentItem.name}"`);
      }
      if (quantityChange !== 0) {
        changes.push(`quantity ${quantityChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(quantityChange)} ${currentItem.unit}`);
      }
      if (priceChange !== 0) {
        changes.push(`unit price ${priceChange > 0 ? 'increased' : 'decreased'} by $${Math.abs(priceChange).toFixed(2)}`);
      }

      modifications.push({
        type: 'modified' as const,
        itemId: currentItem.id,
        itemName: currentItem.name,
        originalItem,
        currentItem,
        costImpact,
        quantityChange: quantityChange !== 0 ? quantityChange : undefined,
        priceChange: priceChange !== 0 ? priceChange : undefined,
        description: `${currentItem.name}: ${changes.join(', ')}`,
        requiresApproval: Math.abs(costImpact) >= APPROVAL_THRESHOLD,
      });
    }
  });

  return modifications;
}

/**
 * Generate a change order draft from detected changes
 */
function generateChangeOrderDraft(
  added: ChangeDetection[],
  removed: ChangeDetection[],
  modified: ChangeDetection[]
): ChangeOrderDraft {
  const allChanges = [...added, ...removed, ...modified];
  const totalCostImpact = allChanges.reduce((sum, change) => sum + change.costImpact, 0);
  const requiresClientApproval = allChanges.some(change => change.requiresApproval);

  // Generate title
  const parts: string[] = [];
  if (added.length > 0) parts.push(`${added.length} addition${added.length > 1 ? 's' : ''}`);
  if (removed.length > 0) parts.push(`${removed.length} removal${removed.length > 1 ? 's' : ''}`);
  if (modified.length > 0) parts.push(`${modified.length} modification${modified.length > 1 ? 's' : ''}`);

  const title = `Scope Change: ${parts.join(', ')}`;

  // Generate description
  const descriptionParts: string[] = [
    'The following scope changes have been detected:',
    '',
  ];

  if (added.length > 0) {
    descriptionParts.push('**Added Items:**');
    added.forEach(item => descriptionParts.push(`- ${item.description}`));
    descriptionParts.push('');
  }

  if (removed.length > 0) {
    descriptionParts.push('**Removed Items:**');
    removed.forEach(item => descriptionParts.push(`- ${item.description}`));
    descriptionParts.push('');
  }

  if (modified.length > 0) {
    descriptionParts.push('**Modified Items:**');
    modified.forEach(item => descriptionParts.push(`- ${item.description}`));
    descriptionParts.push('');
  }

  descriptionParts.push(`**Net Cost Impact:** ${totalCostImpact >= 0 ? '+' : ''}$${totalCostImpact.toFixed(2)}`);

  return {
    title,
    description: descriptionParts.join('\n'),
    changes: allChanges,
    totalCostImpact,
    requiresClientApproval,
    generatedAt: new Date(),
  };
}

/**
 * Main function: Detect all changes between original and current scope
 */
export function detectChanges(
  originalScope: ScopeItem[],
  currentScope: ScopeItem[]
): ChangeDetection[] {
  const added = detectAddedItems(originalScope, currentScope);
  const removed = detectRemovedItems(originalScope, currentScope);
  const modified = detectModifiedItems(originalScope, currentScope);

  return [...added, ...removed, ...modified];
}

/**
 * Extended function: Get full change detection summary with draft
 */
export function analyzeChanges(
  originalScope: ScopeItem[],
  currentScope: ScopeItem[]
): ChangeDetectionSummary {
  const added = detectAddedItems(originalScope, currentScope);
  const removed = detectRemovedItems(originalScope, currentScope);
  const modified = detectModifiedItems(originalScope, currentScope);

  const totalAdditions = added.reduce((sum, c) => sum + c.costImpact, 0);
  const totalRemovals = removed.reduce((sum, c) => sum + c.costImpact, 0);
  const totalModifications = modified.reduce((sum, c) => sum + c.costImpact, 0);
  const netCostImpact = totalAdditions + totalRemovals + totalModifications;

  return {
    added,
    removed,
    modified,
    totalAdditions,
    totalRemovals,
    totalModifications,
    netCostImpact,
    changeOrderDraft: generateChangeOrderDraft(added, removed, modified),
  };
}
