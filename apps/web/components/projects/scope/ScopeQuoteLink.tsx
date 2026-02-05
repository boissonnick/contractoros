"use client";

import React, { useState } from 'react';
import { ScopeItem, QuoteSection } from '@/types';
import { LinkIcon, QuestionMarkCircleIcon, ArrowRightIcon, DocumentDuplicateIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';

interface ScopeQuoteLinkProps {
  items: ScopeItem[];
  quoteSections: QuoteSection[];
  scopeStatus?: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'superseded';
  onGenerateQuote?: () => void;
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function ScopeQuoteLink({ items, quoteSections, scopeStatus, onGenerateQuote }: ScopeQuoteLinkProps) {
  const [showHelp, setShowHelp] = useState(false);
  const _linked = items.filter(item => item.quoteSectionId);
  const unlinked = items.filter(item => !item.quoteSectionId);

  if (quoteSections.length === 0) {
    return (
      <div className="text-sm text-gray-400">
        No quote sections available to link.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-gray-900">SOW ↔ Quote Links</h4>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            aria-label="Help"
          >
            <QuestionMarkCircleIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">SOW</span>
          <ArrowRightIcon className="h-3 w-3" />
          <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded">Quote</span>
        </div>
      </div>

      {/* Help tooltip */}
      {showHelp && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <p className="font-medium text-blue-900 mb-2">Understanding SOW & Quote Relationship</p>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-24 font-bold">SOW:</span>
              <span>The <strong>Scope of Work</strong> defines exactly what work will be performed, materials needed, and your estimated costs. This is your internal document for planning.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-24 font-bold">Quote:</span>
              <span>The <strong>Quote</strong> is the price you present to the client. It&apos;s typically based on the SOW with your markup applied. This is the client-facing document.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-24 font-bold">Linking:</span>
              <span>Connect SOW items to quote sections to track your true costs against quoted prices. This helps you understand profit margins per line item.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-24 font-bold">Workflow:</span>
              <span>Create SOW → Get client approval → Generate Quote → Send Quote for signature</span>
            </li>
          </ul>
          <div className="mt-3 pt-3 border-t border-blue-200 flex items-center gap-2">
            <InformationCircleIcon className="h-4 w-4 text-blue-500" />
            <p className="text-xs text-blue-600">
              Once a SOW is approved, you can automatically generate a quote with your standard markup applied.
            </p>
          </div>
        </div>
      )}

      {/* Generate Quote button for approved SOW */}
      {scopeStatus === 'approved' && onGenerateQuote && quoteSections.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DocumentDuplicateIcon className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">SOW Approved - Ready to Quote</p>
              <p className="text-xs text-green-700">Generate a quote from this approved scope of work.</p>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={onGenerateQuote} icon={<ArrowRightIcon className="h-4 w-4" />}>
            Generate Quote
          </Button>
        </div>
      )}

      {/* Summary table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Quote Section</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Linked Items</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Quote Cost</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">SOW Est.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {quoteSections.map((qs) => {
              const sectionItems = items.filter(item => item.quoteSectionId === qs.id);
              const sowCost = sectionItems.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
              const quoteCost = qs.laborCost + qs.materialCost;

              return (
                <tr key={qs.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1.5">
                      {sectionItems.length > 0 && <LinkIcon className="h-3.5 w-3.5 text-blue-500" />}
                      <span className="text-gray-900">{qs.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {sectionItems.length > 0
                      ? sectionItems.map(i => i.title).join(', ')
                      : <span className="text-gray-300">No links</span>
                    }
                  </td>
                  <td className="px-4 py-2 text-right text-gray-900">{fmt(quoteCost)}</td>
                  <td className="px-4 py-2 text-right text-gray-900">{sectionItems.length > 0 ? fmt(sowCost) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {unlinked.length > 0 && (
        <div className="text-xs text-yellow-600 bg-yellow-50 rounded-lg px-3 py-2">
          {unlinked.length} SOW item{unlinked.length !== 1 ? 's' : ''} not linked to any quote section.
        </div>
      )}
    </div>
  );
}
