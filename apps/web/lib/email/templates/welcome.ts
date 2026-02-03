/**
 * Welcome Email Template for New Users
 *
 * Sent when a user is added to an organization (manually or via directory sync)
 */

import { EmailTemplate } from '../types';

export const welcomeUserTemplate: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Welcome User',
  subject: 'Welcome to {{companyName}} on ContractorOS!',
  body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to {{companyName}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a56db 0%, #1e40af 100%); padding: 40px 40px 30px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Welcome to the Team!</h1>
              <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">You've been invited to join {{companyName}}</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hi {{userName}},
              </p>

              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                You've been added to <strong>{{companyName}}</strong> as a <strong>{{role}}</strong>. Welcome aboard!
              </p>

              {{#if customMessage}}
              <div style="margin: 24px 0; padding: 16px; background-color: #f3f4f6; border-radius: 8px; border-left: 4px solid #1a56db;">
                <p style="margin: 0; color: #4b5563; font-size: 14px; font-style: italic;">
                  "{{customMessage}}"
                </p>
              </div>
              {{/if}}

              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                ContractorOS is your all-in-one platform for construction project management. Here's what you can do:
              </p>

              <!-- Features based on role -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 12px; background-color: #f9fafb; border-radius: 8px; margin-bottom: 12px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td width="40" valign="top">
                          <div style="width: 32px; height: 32px; background-color: #dbeafe; border-radius: 8px; text-align: center; line-height: 32px;">
                            <span style="font-size: 16px;">&#128204;</span>
                          </div>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0; color: #111827; font-size: 14px; font-weight: 600;">View Your Tasks & Schedule</p>
                          <p style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">See what's assigned to you and manage your work</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td height="8"></td></tr>
                <tr>
                  <td style="padding: 12px; background-color: #f9fafb; border-radius: 8px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td width="40" valign="top">
                          <div style="width: 32px; height: 32px; background-color: #dcfce7; border-radius: 8px; text-align: center; line-height: 32px;">
                            <span style="font-size: 16px;">&#128247;</span>
                          </div>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0; color: #111827; font-size: 14px; font-weight: 600;">Document Your Work</p>
                          <p style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">Upload photos and track progress on job sites</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td height="8"></td></tr>
                <tr>
                  <td style="padding: 12px; background-color: #f9fafb; border-radius: 8px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td width="40" valign="top">
                          <div style="width: 32px; height: 32px; background-color: #fef3c7; border-radius: 8px; text-align: center; line-height: 32px;">
                            <span style="font-size: 16px;">&#9200;</span>
                          </div>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0; color: #111827; font-size: 14px; font-weight: 600;">Track Your Time</p>
                          <p style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">Clock in and out to log hours accurately</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="{{loginUrl}}" style="display: inline-block; background: linear-gradient(135deg, #1a56db 0%, #1e40af 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(26, 86, 219, 0.25);">
                      Get Started
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                You can log in using the email address: <strong>{{userEmail}}</strong>
              </p>

              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If you have any questions, reach out to your team at {{supportEmail}} or call {{companyPhone}}.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">
                This email was sent by <strong>{{companyName}}</strong> via ContractorOS.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                ContractorOS - Construction Project Management Made Simple
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  variables: [
    'userName',
    'userEmail',
    'role',
    'companyName',
    'companyPhone',
    'loginUrl',
    'customMessage',
    'supportEmail',
  ],
};

/**
 * Plain text version of the welcome email
 */
export const welcomeUserTextTemplate = `
Welcome to {{companyName}}!

Hi {{userName}},

You've been added to {{companyName}} as a {{role}}. Welcome aboard!

{{#if customMessage}}
Personal message: "{{customMessage}}"
{{/if}}

ContractorOS is your all-in-one platform for construction project management.

Get started by logging in at: {{loginUrl}}

Your login email: {{userEmail}}

If you have any questions, contact your team at {{supportEmail}} or call {{companyPhone}}.

---
This email was sent by {{companyName}} via ContractorOS.
`;

export default welcomeUserTemplate;
