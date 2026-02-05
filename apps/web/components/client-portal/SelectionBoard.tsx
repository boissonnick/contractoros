'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Selection } from '@/types';
import {
  ArrowsRightLeftIcon,
  CheckIcon,
  XMarkIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

type SelectionCategory = 'flooring' | 'countertops' | 'fixtures' | 'cabinets' | 'appliances' | 'paint' | 'tile' | 'other';

const CATEGORY_LABELS: Record<SelectionCategory, string> = {
  flooring: 'Flooring',
  countertops: 'Countertops',
  fixtures: 'Fixtures',
  cabinets: 'Cabinets',
  appliances: 'Appliances',
  paint: 'Paint',
  tile: 'Tile',
  other: 'Other',
};

interface SelectionBoardProps {
  selections: Selection[];
  onApprove?: (selectionId: string, optionId: string) => void;
  onRequestChange?: (selectionId: string, optionId: string, notes: string) => void;
  readOnly?: boolean;
}

export function SelectionBoard({
  selections,
  onApprove,
  onRequestChange,
  readOnly = false,
}: SelectionBoardProps) {
  const [activeCategory, setActiveCategory] = useState<SelectionCategory | 'all'>('all');
  const [compareMode, setCompareMode] = useState(false);
  const [compareItems, setCompareItems] = useState<string[]>([]);
  const [changeRequestNotes, setChangeRequestNotes] = useState('');
  const [showChangeModal, setShowChangeModal] = useState<string | null>(null);

  // Get categories with selections
  const categories = useMemo(() => {
    const cats = new Set<SelectionCategory>();
    selections.forEach((s) => {
      if (s.categoryId) cats.add(s.categoryId as SelectionCategory);
    });
    return Array.from(cats);
  }, [selections]);

  // Filter selections by category
  const filteredSelections = useMemo(() => {
    if (activeCategory === 'all') return selections;
    return selections.filter((s) => s.categoryId === activeCategory);
  }, [selections, activeCategory]);

  // Get items being compared
  const compareSelections = useMemo(() => {
    if (!compareMode || compareItems.length < 2) return [];
    return selections.filter((s) => compareItems.includes(s.id)).slice(0, 2);
  }, [compareMode, compareItems, selections]);

  const toggleCompare = (selectionId: string) => {
    setCompareItems((prev) => {
      if (prev.includes(selectionId)) {
        return prev.filter((id) => id !== selectionId);
      }
      if (prev.length >= 2) {
        return [prev[1], selectionId];
      }
      return [...prev, selectionId];
    });
  };

  const handleRequestChange = (selectionId: string) => {
    if (onRequestChange && changeRequestNotes.trim()) {
      const selection = selections.find((s) => s.id === selectionId);
      if (selection?.selectedOptionId) {
        onRequestChange(selectionId, selection.selectedOptionId, changeRequestNotes);
      }
    }
    setShowChangeModal(null);
    setChangeRequestNotes('');
  };

  if (selections.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <PhotoIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No selections available yet</p>
        <p className="text-sm text-gray-400 mt-1">Your contractor will add selection options here</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Selections</h3>
        <button
          onClick={() => {
            setCompareMode(!compareMode);
            if (compareMode) setCompareItems([]);
          }}
          className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
            compareMode
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ArrowsRightLeftIcon className="h-4 w-4" />
          Compare
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex overflow-x-auto border-b px-4 gap-1">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
            activeCategory === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeCategory === cat
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      {/* Compare View */}
      {compareMode && compareSelections.length === 2 && (
        <div className="p-4 bg-blue-50 border-b">
          <div className="grid grid-cols-2 gap-4">
            {compareSelections.map((selection) => {
              const selectedOption = selection.options?.find(
                (o) => o.id === selection.selectedOptionId
              );
              return (
                <div key={selection.id} className="bg-white rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{selection.categoryName}</h4>
                  {selectedOption && (
                    <>
                      {selectedOption.imageURL && (
                        <Image
                          src={selectedOption.imageURL}
                          alt={selectedOption.name}
                          width={400}
                          height={128}
                          className="w-full h-32 object-cover rounded mb-2"
                        />
                      )}
                      <p className="text-sm text-gray-600">{selectedOption.name}</p>
                      {selectedOption.price !== undefined && (
                        <p className="text-lg font-semibold text-gray-900 mt-1">
                          ${selectedOption.price.toLocaleString()}
                        </p>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selection Cards */}
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSelections.map((selection) => {
            const selectedOption = selection.options?.find(
              (o) => o.id === selection.selectedOptionId
            );
            const isComparing = compareItems.includes(selection.id);

            return (
              <div
                key={selection.id}
                className={`border rounded-lg overflow-hidden transition-all ${
                  isComparing ? 'ring-2 ring-blue-500' : 'border-gray-200'
                }`}
              >
                {/* Image */}
                {selectedOption?.imageURL ? (
                  <div className="relative aspect-video bg-gray-100">
                    <Image
                      src={selectedOption.imageURL}
                      alt={selectedOption.name}
                      fill
                      className="object-cover"
                    />
                    {selection.status === 'approved' && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                        <CheckCircleSolidIcon className="h-3 w-3" />
                        Selected
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <PhotoIcon className="h-8 w-8 text-gray-300" />
                  </div>
                )}

                {/* Content */}
                <div className="p-3">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-medium text-gray-900 text-sm">{selection.categoryName}</h4>
                    {compareMode && (
                      <button
                        onClick={() => toggleCompare(selection.id)}
                        className={`p-1 rounded ${
                          isComparing ? 'text-blue-600' : 'text-gray-400'
                        }`}
                      >
                        <ArrowsRightLeftIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {selectedOption && (
                    <>
                      <p className="text-sm text-gray-600">{selectedOption.name}</p>
                      {selectedOption.price !== undefined && (
                        <p className="text-base font-semibold text-gray-900 mt-1">
                          ${selectedOption.price.toLocaleString()}
                        </p>
                      )}
                    </>
                  )}

                  {/* Actions */}
                  {!readOnly && selection.status === 'pending' && (
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <button
                        onClick={() => selectedOption && onApprove?.(selection.id, selectedOption.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-sm text-green-700 bg-green-50 hover:bg-green-100 rounded transition-colors"
                      >
                        <CheckIcon className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => setShowChangeModal(selection.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-sm text-orange-700 bg-orange-50 hover:bg-orange-100 rounded transition-colors"
                      >
                        <XMarkIcon className="h-4 w-4" />
                        Request Change
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Change Request Modal */}
      {showChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Request Change</h3>
            </div>
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What would you like to change?
              </label>
              <textarea
                value={changeRequestNotes}
                onChange={(e) => setChangeRequestNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Describe your preferred changes..."
              />
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button
                onClick={() => {
                  setShowChangeModal(null);
                  setChangeRequestNotes('');
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRequestChange(showChangeModal)}
                className="px-4 py-2 text-sm text-white bg-orange-600 hover:bg-orange-700 rounded-md"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SelectionBoard;
