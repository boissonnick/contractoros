'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import BaseModal from '@/components/ui/BaseModal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  QuotePdfTemplate,
  QuotePdfLayout,
  QuotePdfFont,
  QuotePdfHeaderStyle,
  QUOTE_PDF_LAYOUTS,
  QUOTE_PDF_FONTS,
  QUOTE_PDF_HEADER_STYLES,
} from '@/types';
import {
  DocumentTextIcon,
  PaintBrushIcon,
  Cog6ToothIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';

const templateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  layout: z.string(),
  font: z.string(),
  headerStyle: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  textColor: z.string(),
  backgroundColor: z.string(),
  tableHeaderBg: z.string(),
  tableAltRowBg: z.string(),
  // Header settings
  showLogo: z.boolean(),
  logoSize: z.string(),
  showCompanyName: z.boolean(),
  showAddress: z.boolean(),
  showPhone: z.boolean(),
  showEmail: z.boolean(),
  showWebsite: z.boolean(),
  customTagline: z.string().optional(),
  // Footer settings
  showPageNumbers: z.boolean(),
  showValidUntil: z.boolean(),
  showEstimateNumber: z.boolean(),
  customFooterText: z.string().optional(),
  // Table settings
  tableShowQuantity: z.boolean(),
  tableShowUnit: z.boolean(),
  tableShowUnitPrice: z.boolean(),
  tableShowDescription: z.boolean(),
  tableShowOptionalBadge: z.boolean(),
  tableGroupBySection: z.boolean(),
  // Section settings
  sectionShowScopeOfWork: z.boolean(),
  sectionShowExclusions: z.boolean(),
  sectionShowPaymentTerms: z.boolean(),
  sectionShowTermsAndConditions: z.boolean(),
  sectionShowSignatureBlock: z.boolean(),
  sectionShowDepositInfo: z.boolean(),
  sectionShowValidUntil: z.boolean(),
  // Default content
  defaultScopeOfWork: z.string().optional(),
  defaultExclusions: z.string().optional(),
  defaultPaymentTerms: z.string().optional(),
  defaultTermsAndConditions: z.string().optional(),
  defaultAcceptanceText: z.string().optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface QuoteTemplateFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<QuotePdfTemplate>) => Promise<void>;
  template?: QuotePdfTemplate;
  mode?: 'create' | 'edit';
}

type TabId = 'basic' | 'colors' | 'layout' | 'content';

export function QuoteTemplateFormModal({
  open,
  onClose,
  onSubmit,
  template,
  mode = 'create',
}: QuoteTemplateFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('basic');

  const defaultValues = useMemo(() => template
    ? {
        name: template.name,
        description: template.description || '',
        layout: template.layout,
        font: template.font,
        headerStyle: template.headerStyle,
        primaryColor: template.primaryColor,
        secondaryColor: template.secondaryColor,
        textColor: template.textColor,
        backgroundColor: template.backgroundColor,
        tableHeaderBg: template.tableHeaderBg,
        tableAltRowBg: template.tableAltRowBg,
        showLogo: template.header.showLogo,
        logoSize: template.header.logoSize,
        showCompanyName: template.header.showCompanyName,
        showAddress: template.header.showAddress,
        showPhone: template.header.showPhone,
        showEmail: template.header.showEmail,
        showWebsite: template.header.showWebsite,
        customTagline: template.header.customTagline || '',
        showPageNumbers: template.footer.showPageNumbers,
        showValidUntil: template.footer.showValidUntil,
        showEstimateNumber: template.footer.showEstimateNumber,
        customFooterText: template.footer.customText || '',
        tableShowQuantity: template.tableSettings.showQuantity,
        tableShowUnit: template.tableSettings.showUnit,
        tableShowUnitPrice: template.tableSettings.showUnitPrice,
        tableShowDescription: template.tableSettings.showDescription,
        tableShowOptionalBadge: template.tableSettings.showOptionalBadge,
        tableGroupBySection: template.tableSettings.groupBySection,
        sectionShowScopeOfWork: template.sections.showScopeOfWork,
        sectionShowExclusions: template.sections.showExclusions,
        sectionShowPaymentTerms: template.sections.showPaymentTerms,
        sectionShowTermsAndConditions: template.sections.showTermsAndConditions,
        sectionShowSignatureBlock: template.sections.showSignatureBlock,
        sectionShowDepositInfo: template.sections.showDepositInfo,
        sectionShowValidUntil: template.sections.showValidUntil,
        defaultScopeOfWork: template.defaultContent.scopeOfWork || '',
        defaultExclusions: template.defaultContent.exclusions || '',
        defaultPaymentTerms: template.defaultContent.paymentTerms || '',
        defaultTermsAndConditions: template.defaultContent.termsAndConditions || '',
        defaultAcceptanceText: template.defaultContent.acceptanceText || '',
      }
    : {
        name: '',
        description: '',
        layout: 'modern' as const,
        font: 'inter' as const,
        headerStyle: 'logo-left' as const,
        primaryColor: '#2563eb',
        secondaryColor: '#1e40af',
        textColor: '#1f2937',
        backgroundColor: '#ffffff',
        tableHeaderBg: '#f3f4f6',
        tableAltRowBg: '#fafafa',
        showLogo: true,
        logoSize: 'medium' as const,
        showCompanyName: true,
        showAddress: true,
        showPhone: true,
        showEmail: true,
        showWebsite: false,
        customTagline: '',
        showPageNumbers: true,
        showValidUntil: true,
        showEstimateNumber: true,
        customFooterText: '',
        tableShowQuantity: true,
        tableShowUnit: true,
        tableShowUnitPrice: true,
        tableShowDescription: true,
        tableShowOptionalBadge: true,
        tableGroupBySection: false,
        sectionShowScopeOfWork: true,
        sectionShowExclusions: true,
        sectionShowPaymentTerms: true,
        sectionShowTermsAndConditions: true,
        sectionShowSignatureBlock: true,
        sectionShowDepositInfo: true,
        sectionShowValidUntil: true,
        defaultScopeOfWork: '',
        defaultExclusions: '',
        defaultPaymentTerms: '',
        defaultTermsAndConditions: '',
        defaultAcceptanceText: '',
      }, [template]);

  const {
    register,
    handleSubmit,
    control: _control,
    watch,
    reset,
    formState: { errors },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues,
  });

  // Reset form when template changes
  useEffect(() => {
    if (open) {
      reset(defaultValues);
      setActiveTab('basic');
    }
  }, [open, template, reset, defaultValues]);

  const watchedPrimaryColor = watch('primaryColor');

  const handleFormSubmit = async (data: TemplateFormData) => {
    setIsSubmitting(true);
    try {
      const templateData: Partial<QuotePdfTemplate> = {
        name: data.name,
        description: data.description || undefined,
        layout: data.layout as QuotePdfLayout,
        font: data.font as QuotePdfFont,
        headerStyle: data.headerStyle as QuotePdfHeaderStyle,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        textColor: data.textColor,
        backgroundColor: data.backgroundColor,
        tableHeaderBg: data.tableHeaderBg,
        tableAltRowBg: data.tableAltRowBg,
        header: {
          showLogo: data.showLogo,
          logoSize: data.logoSize as 'small' | 'medium' | 'large',
          showCompanyName: data.showCompanyName,
          showAddress: data.showAddress,
          showPhone: data.showPhone,
          showEmail: data.showEmail,
          showWebsite: data.showWebsite,
          customTagline: data.customTagline || undefined,
        },
        footer: {
          showPageNumbers: data.showPageNumbers,
          showValidUntil: data.showValidUntil,
          showEstimateNumber: data.showEstimateNumber,
          customText: data.customFooterText || undefined,
        },
        tableSettings: {
          showQuantity: data.tableShowQuantity,
          showUnit: data.tableShowUnit,
          showUnitPrice: data.tableShowUnitPrice,
          showDescription: data.tableShowDescription,
          showOptionalBadge: data.tableShowOptionalBadge,
          groupBySection: data.tableGroupBySection,
        },
        sections: {
          showScopeOfWork: data.sectionShowScopeOfWork,
          showExclusions: data.sectionShowExclusions,
          showPaymentTerms: data.sectionShowPaymentTerms,
          showTermsAndConditions: data.sectionShowTermsAndConditions,
          showSignatureBlock: data.sectionShowSignatureBlock,
          showDepositInfo: data.sectionShowDepositInfo,
          showValidUntil: data.sectionShowValidUntil,
        },
        defaultContent: {
          scopeOfWork: data.defaultScopeOfWork || undefined,
          exclusions: data.defaultExclusions || undefined,
          paymentTerms: data.defaultPaymentTerms || undefined,
          termsAndConditions: data.defaultTermsAndConditions || undefined,
          acceptanceText: data.defaultAcceptanceText || undefined,
        },
      };

      await onSubmit(templateData);
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs: { id: TabId; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
    { id: 'basic', label: 'Basic', icon: DocumentTextIcon },
    { id: 'colors', label: 'Colors', icon: PaintBrushIcon },
    { id: 'layout', label: 'Layout', icon: Cog6ToothIcon },
    { id: 'content', label: 'Content', icon: DocumentIcon },
  ];

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={mode === 'edit' ? 'Edit Quote Template' : 'Create Quote Template'}
      size="xl"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 ${
                    activeTab === tab.id
                      ? 'border-brand-primary text-brand-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px] max-h-[500px] overflow-y-auto">
          {/* Basic Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register('name')}
                  placeholder="e.g., Professional Blue"
                  error={errors.name?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Input {...register('description')} placeholder="Brief description of this template" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Layout Style</label>
                  <select
                    {...register('layout')}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20 sm:text-sm"
                  >
                    {QUOTE_PDF_LAYOUTS.map((layout) => (
                      <option key={layout.value} value={layout.value}>
                        {layout.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {QUOTE_PDF_LAYOUTS.find((l) => l.value === watch('layout'))?.description}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
                  <select
                    {...register('font')}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20 sm:text-sm"
                  >
                    {QUOTE_PDF_FONTS.map((font) => (
                      <option key={font.value} value={font.value}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Header Style</label>
                <select
                  {...register('headerStyle')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20 sm:text-sm"
                >
                  {QUOTE_PDF_HEADER_STYLES.map((style) => (
                    <option key={style.value} value={style.value}>
                      {style.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Tagline</label>
                <Input
                  {...register('customTagline')}
                  placeholder="e.g., Quality Construction Since 1985"
                />
              </div>
            </div>
          )}

          {/* Colors Tab */}
          {activeTab === 'colors' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      {...register('primaryColor')}
                      className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
                    />
                    <Input {...register('primaryColor')} className="flex-1" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      {...register('secondaryColor')}
                      className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
                    />
                    <Input {...register('secondaryColor')} className="flex-1" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      {...register('textColor')}
                      className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
                    />
                    <Input {...register('textColor')} className="flex-1" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      {...register('backgroundColor')}
                      className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
                    />
                    <Input {...register('backgroundColor')} className="flex-1" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Table Header Background</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      {...register('tableHeaderBg')}
                      className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
                    />
                    <Input {...register('tableHeaderBg')} className="flex-1" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Table Alternating Row</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      {...register('tableAltRowBg')}
                      className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
                    />
                    <Input {...register('tableAltRowBg')} className="flex-1" />
                  </div>
                </div>
              </div>

              {/* Color Preview */}
              <div
                className="mt-4 p-4 rounded-lg border"
                style={{ backgroundColor: watch('backgroundColor') }}
              >
                <div
                  className="h-3 w-full mb-2 rounded"
                  style={{ backgroundColor: watchedPrimaryColor }}
                />
                <p style={{ color: watch('textColor') }} className="text-sm font-semibold">
                  Sample Text Preview
                </p>
                <p style={{ color: watch('textColor') }} className="text-xs opacity-75">
                  This is how your text will appear in the PDF
                </p>
              </div>
            </div>
          )}

          {/* Layout Tab */}
          {activeTab === 'layout' && (
            <div className="space-y-6">
              {/* Header Settings */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Header Settings</h4>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('showLogo')} className="rounded" />
                    <span className="text-sm">Show Logo</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('showCompanyName')} className="rounded" />
                    <span className="text-sm">Show Company Name</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('showAddress')} className="rounded" />
                    <span className="text-sm">Show Address</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('showPhone')} className="rounded" />
                    <span className="text-sm">Show Phone</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('showEmail')} className="rounded" />
                    <span className="text-sm">Show Email</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('showWebsite')} className="rounded" />
                    <span className="text-sm">Show Website</span>
                  </label>
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo Size</label>
                  <select
                    {...register('logoSize')}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20 sm:text-sm"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
              </div>

              {/* Table Settings */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Line Items Table</h4>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('tableShowQuantity')} className="rounded" />
                    <span className="text-sm">Show Quantity</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('tableShowUnit')} className="rounded" />
                    <span className="text-sm">Show Unit</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('tableShowUnitPrice')} className="rounded" />
                    <span className="text-sm">Show Unit Price</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('tableShowDescription')} className="rounded" />
                    <span className="text-sm">Show Description</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('tableShowOptionalBadge')} className="rounded" />
                    <span className="text-sm">Show &quot;Optional&quot; Badge</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('tableGroupBySection')} className="rounded" />
                    <span className="text-sm">Group by Section</span>
                  </label>
                </div>
              </div>

              {/* Section Settings */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">PDF Sections</h4>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('sectionShowScopeOfWork')} className="rounded" />
                    <span className="text-sm">Scope of Work</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('sectionShowExclusions')} className="rounded" />
                    <span className="text-sm">Exclusions</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('sectionShowPaymentTerms')} className="rounded" />
                    <span className="text-sm">Payment Terms</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('sectionShowTermsAndConditions')} className="rounded" />
                    <span className="text-sm">Terms & Conditions</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('sectionShowSignatureBlock')} className="rounded" />
                    <span className="text-sm">Signature Block</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('sectionShowDepositInfo')} className="rounded" />
                    <span className="text-sm">Deposit Info</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('sectionShowValidUntil')} className="rounded" />
                    <span className="text-sm">Valid Until Date</span>
                  </label>
                </div>
              </div>

              {/* Footer Settings */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Footer Settings</h4>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('showPageNumbers')} className="rounded" />
                    <span className="text-sm">Show Page Numbers</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('showEstimateNumber')} className="rounded" />
                    <span className="text-sm">Show Estimate Number</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('showValidUntil')} className="rounded" />
                    <span className="text-sm">Show Valid Until in Footer</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custom Footer Text</label>
                  <Input
                    {...register('customFooterText')}
                    placeholder="e.g., Thank you for your business!"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">
                Set default content that will be used when creating new estimates with this template.
                These can be overridden on individual estimates.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Scope of Work
                </label>
                <textarea
                  {...register('defaultScopeOfWork')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20 sm:text-sm"
                  rows={3}
                  placeholder="Enter default scope of work text..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Exclusions</label>
                <textarea
                  {...register('defaultExclusions')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20 sm:text-sm"
                  rows={3}
                  placeholder="Enter default exclusions..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Payment Terms</label>
                <textarea
                  {...register('defaultPaymentTerms')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20 sm:text-sm"
                  rows={3}
                  placeholder="e.g., 50% due upon contract signing, 50% due upon completion"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Terms and Conditions
                </label>
                <textarea
                  {...register('defaultTermsAndConditions')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20 sm:text-sm"
                  rows={4}
                  placeholder="Enter default terms and conditions..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Acceptance Text
                </label>
                <textarea
                  {...register('defaultAcceptanceText')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20 sm:text-sm"
                  rows={2}
                  placeholder="By signing below, I accept this estimate and authorize..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Template'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
