/**
 * ProfitabilityForecastCard Component
 *
 * Displays profitability forecast with revenue, costs, and margin.
 */

'use client';

import React from 'react';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { ProfitabilityForecast } from '@/types';

interface ProfitabilityForecastCardProps {
  forecast: ProfitabilityForecast;
  showDetails?: boolean;
  className?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getMarginColor(margin: number): string {
  if (margin >= 25) return 'text-green-600';
  if (margin >= 15) return 'text-emerald-600';
  if (margin >= 10) return 'text-yellow-600';
  return 'text-red-600';
}

function getMarginBg(margin: number): string {
  if (margin >= 25) return 'bg-green-100';
  if (margin >= 15) return 'bg-emerald-100';
  if (margin >= 10) return 'bg-yellow-100';
  return 'bg-red-100';
}

export function ProfitabilityForecastCard({
  forecast,
  showDetails = true,
  className = '',
}: ProfitabilityForecastCardProps) {
  const {
    estimatedRevenue,
    estimatedCosts,
    estimatedProfit,
    estimatedMargin,
    confidence,
    factors,
    comparison,
  } = forecast;

  const isProfitable = estimatedProfit > 0;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Profitability Forecast</h3>
            <p className="text-sm text-gray-500">
              Confidence: {confidence}%
            </p>
          </div>
          <div
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${getMarginBg(estimatedMargin)} ${getMarginColor(estimatedMargin)}`}
          >
            {estimatedMargin.toFixed(1)}% margin
          </div>
        </div>
      </div>

      {/* Main metrics */}
      <div className="p-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Revenue</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(estimatedRevenue)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Costs</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(estimatedCosts)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Profit</p>
          <p className={`text-lg font-semibold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
            {isProfitable ? '+' : ''}{formatCurrency(estimatedProfit)}
          </p>
        </div>
      </div>

      {/* Visual margin bar */}
      <div className="px-4 pb-4">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              estimatedMargin >= 20 ? 'bg-green-500' :
              estimatedMargin >= 15 ? 'bg-emerald-500' :
              estimatedMargin >= 10 ? 'bg-yellow-500' :
              estimatedMargin >= 0 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, estimatedMargin * 2.5))}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>20%</span>
          <span>40%</span>
        </div>
      </div>

      {/* Comparison */}
      {comparison && showDetails && (
        <div className="px-4 pb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <InformationCircleIcon className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Market Comparison</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-gray-500">Similar Projects</p>
                <p className="font-medium">{comparison.similarProjects}</p>
              </div>
              <div>
                <p className="text-gray-500">Avg Margin</p>
                <p className="font-medium">{comparison.avgMargin}%</p>
              </div>
              <div>
                <p className="text-gray-500">Your Percentile</p>
                <p className={`font-medium ${
                  comparison.percentile >= 75 ? 'text-green-600' :
                  comparison.percentile >= 50 ? 'text-gray-900' : 'text-yellow-600'
                }`}>
                  {comparison.percentile}th
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Factors */}
      {factors.length > 0 && showDetails && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Key Factors</h4>
          <div className="space-y-2">
            {factors.map((factor, i) => (
              <div key={i} className="flex items-start gap-2">
                {factor.impact === 'positive' ? (
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                ) : factor.impact === 'negative' ? (
                  <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-gray-300 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{factor.factor}</p>
                  <p className="text-xs text-gray-500">{factor.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfitabilityForecastCard;
