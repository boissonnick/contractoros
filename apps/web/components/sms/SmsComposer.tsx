"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button, Input } from '@/components/ui';
import { SmsTemplate, SmsTemplateType } from '@/types';
import { formatPhoneForDisplay, formatToE164 } from '@/lib/sms/phoneUtils';
import {
  calculateSmsSegments,
  estimateSmsCost,
  renderTemplate,
  getOptOutMessage,
} from '@/lib/sms/smsUtils';
import {
  PaperAirplaneIcon,
  DocumentTextIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

export interface SmsComposerProps {
  to?: string;
  recipientName?: string;
  recipientId?: string;
  recipientType?: 'user' | 'client' | 'subcontractor';
  projectId?: string;
  invoiceId?: string;
  taskId?: string;
  templates?: SmsTemplate[];
  onSend?: (params: {
    to: string;
    message: string;
    recipientId?: string;
    recipientType?: 'user' | 'client' | 'subcontractor';
    recipientName?: string;
    projectId?: string;
    invoiceId?: string;
    taskId?: string;
    templateId?: string;
    templateVariables?: Record<string, string>;
  }) => Promise<unknown>;
  defaultVariables?: Record<string, string>;
  className?: string;
  compact?: boolean;
}

/**
 * SmsComposer - Compose and send SMS messages
 *
 * Features:
 * - Free-form message input
 * - Template selection
 * - Variable substitution
 * - Character count with segment info
 * - Opt-out compliance
 */
export default function SmsComposer({
  to: initialTo = '',
  recipientName,
  recipientId,
  recipientType,
  projectId,
  invoiceId,
  taskId,
  templates = [],
  onSend,
  defaultVariables = {},
  className,
  compact = false,
}: SmsComposerProps) {
  const [to, setTo] = useState(initialTo);
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<SmsTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>(defaultVariables);
  const [sending, setSending] = useState(false);
  const [includeOptOut, setIncludeOptOut] = useState(true);

  // Calculate final message with opt-out
  const finalMessage = includeOptOut
    ? `${message}\n\n${getOptOutMessage()}`
    : message;

  // Get segment info
  const segmentInfo = calculateSmsSegments(finalMessage);
  const costEstimate = estimateSmsCost(segmentInfo.segments);

  const handleTemplateSelect = (template: SmsTemplate) => {
    setSelectedTemplate(template);
    // Pre-fill with default variables
    const rendered = renderTemplate(template.body, {
      ...defaultVariables,
      ...templateVariables,
    });
    setMessage(rendered);
  };

  const handleVariableChange = (name: string, value: string) => {
    const newVars = { ...templateVariables, [name]: value };
    setTemplateVariables(newVars);

    if (selectedTemplate) {
      const rendered = renderTemplate(selectedTemplate.body, {
        ...defaultVariables,
        ...newVars,
      });
      setMessage(rendered);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !to) return;

    setSending(true);
    try {
      if (onSend) {
        await onSend({
          to: formatToE164(to),
          message: finalMessage,
          recipientId,
          recipientType,
          recipientName,
          projectId,
          invoiceId,
          taskId,
          templateId: selectedTemplate?.id,
          templateVariables,
        });
      } else {
        // Use the default API if no onSend provided
        const response = await fetch('/api/sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: formatToE164(to),
            message: finalMessage,
            recipientId,
            recipientType,
            recipientName,
            projectId,
            invoiceId,
            taskId,
            templateId: selectedTemplate?.id,
            templateVariables,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to send message');
        }
      }
      setMessage('');
      setSelectedTemplate(null);
      setTemplateVariables(defaultVariables);
    } finally {
      setSending(false);
    }
  };

  // Sync to state when initialTo changes
  React.useEffect(() => {
    if (initialTo) {
      setTo(initialTo);
    }
  }, [initialTo]);

  return (
    <div className={cn(
      compact ? '' : 'bg-white rounded-lg border border-gray-200 p-4',
      className
    )}>
      {/* Recipient input/header */}
      {!initialTo ? (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient Phone Number
          </label>
          <Input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="(555) 123-4567"
            type="tel"
          />
        </div>
      ) : !compact && (
        <div className="mb-4">
          <p className="text-sm text-gray-500">To</p>
          <p className="font-medium text-gray-900">
            {recipientName || formatPhoneForDisplay(to)}
          </p>
          {recipientName && (
            <p className="text-sm text-gray-500">{formatPhoneForDisplay(to)}</p>
          )}
        </div>
      )}

      {/* Template selector */}
      {templates.length > 0 && !compact && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DocumentTextIcon className="h-4 w-4 inline mr-1" />
            Use Template
          </label>
          <select
            value={selectedTemplate?.id || ''}
            onChange={(e) => {
              const template = templates.find((t) => t.id === e.target.value);
              if (template) handleTemplateSelect(template);
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            <option value="">Write custom message</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Template variables */}
      {selectedTemplate && selectedTemplate.variables.length > 0 && !compact && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg space-y-3">
          <p className="text-sm font-medium text-gray-700">Fill in template variables:</p>
          {selectedTemplate.variables
            .filter((v) => !defaultVariables[v.name])
            .map((variable) => (
              <div key={variable.name}>
                <label className="block text-xs text-gray-500 mb-1">
                  {variable.description}
                  {variable.required && <span className="text-red-500">*</span>}
                </label>
                <Input
                  value={templateVariables[variable.name] || ''}
                  onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                  placeholder={variable.defaultValue || variable.name}
                  className="py-1.5 text-sm"
                />
              </div>
            ))}
        </div>
      )}

      {/* Message input */}
      <div className={compact ? '' : 'mb-3'}>
        {compact ? (
          <div className="flex gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || !to || sending}
              loading={sending}
              className="px-4"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
          />
        )}
      </div>

      {!compact && (
        <>
          {/* Segment info */}
          <div className="mb-4 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span>
                {segmentInfo.charactersUsed} chars • {segmentInfo.segments} segment{segmentInfo.segments !== 1 ? 's' : ''}
              </span>
              <span className="text-gray-300">|</span>
              <span>~${costEstimate.perMessage.toFixed(4)}</span>
            </div>
            <span className={segmentInfo.encoding === 'Unicode' ? 'text-yellow-600' : ''}>
              {segmentInfo.encoding}
            </span>
          </div>

          {/* Opt-out toggle */}
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={includeOptOut}
              onChange={(e) => setIncludeOptOut(e.target.checked)}
              className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
            />
            <span className="text-sm text-gray-600">Include opt-out message (recommended)</span>
          </label>

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={!message.trim() || !to || sending}
            loading={sending}
            className="w-full"
          >
            <PaperAirplaneIcon className="h-4 w-4 mr-2" />
            Send Message
          </Button>

          {/* Compliance note */}
          <p className="mt-3 text-xs text-gray-400 flex items-start gap-1">
            <InformationCircleIcon className="h-4 w-4 flex-shrink-0" />
            <span>
              Messages are sent via SMS and standard carrier rates may apply to recipients.
              Ensure you have consent before sending.
            </span>
          </p>
        </>
      )}
    </div>
  );
}
