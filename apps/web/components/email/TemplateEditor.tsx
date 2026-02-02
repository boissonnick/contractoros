'use client';

import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { EmailTemplateFormData } from '@/lib/email/types';
import { previewTemplate, extractVariables } from '@/lib/email/template-engine';
import { FormModal } from '@/components/ui/FormModal';
import { Input } from '@/components/ui';
import { VariablePicker } from './VariablePicker';
import { EyeIcon, CodeBracketIcon } from '@heroicons/react/24/outline';

interface TemplateEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EmailTemplateFormData) => Promise<void>;
  initialData?: EmailTemplateFormData;
  title?: string;
  loading?: boolean;
}

export function TemplateEditor({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title = 'Edit Email Template',
  loading = false,
}: TemplateEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EmailTemplateFormData>({
    defaultValues: initialData || {
      name: '',
      subject: '',
      body: '',
    },
  });

  const watchedBody = watch('body');
  const watchedSubject = watch('subject');

  const handleVariableInsert = (variable: string) => {
    if (bodyRef.current) {
      const start = bodyRef.current.selectionStart;
      const end = bodyRef.current.selectionEnd;
      const currentValue = bodyRef.current.value;
      const newValue =
        currentValue.substring(0, start) + variable + currentValue.substring(end);
      setValue('body', newValue);

      // Move cursor after inserted variable
      setTimeout(() => {
        if (bodyRef.current) {
          bodyRef.current.focus();
          bodyRef.current.selectionStart = start + variable.length;
          bodyRef.current.selectionEnd = start + variable.length;
        }
      }, 0);
    }
  };

  const detectedVariables = extractVariables(watchedSubject + ' ' + watchedBody);

  const handleFormSubmit = async (data: EmailTemplateFormData) => {
    await onSubmit(data);
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      onSubmit={handleSubmit(handleFormSubmit)}
      submitLabel="Save Template"
      loading={loading}
      size="lg"
    >
      <div className="space-y-4">
        {/* Template Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Template Name *
          </label>
          <Input
            {...register('name', { required: 'Template name is required' })}
            placeholder="e.g., Invoice Due Reminder"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Subject *
          </label>
          <Input
            {...register('subject', { required: 'Subject is required' })}
            placeholder="e.g., Invoice {{invoiceNumber}} is due on {{invoiceDueDate}}"
          />
          {errors.subject && (
            <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
          )}
        </div>

        {/* Body with Variable Picker */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Email Body *
            </label>
            <div className="flex items-center gap-2">
              <VariablePicker onSelect={handleVariableInsert} />
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {showPreview ? (
                  <>
                    <CodeBracketIcon className="h-4 w-4" />
                    Edit
                  </>
                ) : (
                  <>
                    <EyeIcon className="h-4 w-4" />
                    Preview
                  </>
                )}
              </button>
            </div>
          </div>

          {showPreview ? (
            <div className="w-full min-h-[200px] p-4 border border-gray-300 rounded-lg bg-gray-50">
              <p className="text-sm text-gray-500 mb-2 font-medium">
                Subject: {previewTemplate(watchedSubject)}
              </p>
              <div className="border-t border-gray-200 pt-2">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                  {previewTemplate(watchedBody)}
                </pre>
              </div>
            </div>
          ) : (
            <textarea
              {...register('body', { required: 'Body is required' })}
              ref={(e) => {
                register('body').ref(e);
                (bodyRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = e;
              }}
              rows={10}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary resize-y"
              placeholder="Hi {{clientName}},&#10;&#10;Your invoice {{invoiceNumber}} for {{invoiceAmount}} is due...&#10;&#10;Best regards,&#10;{{companyName}}"
            />
          )}
          {errors.body && (
            <p className="mt-1 text-sm text-red-600">{errors.body.message}</p>
          )}
        </div>

        {/* Detected Variables */}
        {detectedVariables.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 mb-2">
              Variables used in this template:
            </p>
            <div className="flex flex-wrap gap-2">
              {detectedVariables.map((variable) => (
                <span
                  key={variable}
                  className="px-2 py-1 text-xs bg-white border border-gray-200 rounded text-gray-700"
                >
                  {`{{${variable}}}`}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </FormModal>
  );
}

export default TemplateEditor;
