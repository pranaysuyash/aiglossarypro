import { useCallback } from 'react';
import { useGA4 } from '@/types/analytics';

interface FormSubmissionTrackerProps {
  /** Type of form being tracked */
  formType: 'contact' | 'newsletter' | 'signup' | 'feedback';
  /** Location/section where form appears */
  formLocation: string;
  /** Form identifier for analytics */
  formId?: string;
  /** Additional metadata to include */
  metadata?: Record<string, any>;
  /** Callback fired after tracking is complete */
  onTrackingComplete?: () => void;
}

export interface FormTrackingData {
  formType: 'contact' | 'newsletter' | 'signup' | 'feedback';
  formLocation: string;
  formId?: string;
  success: boolean;
  errorMessage?: string;
  fieldErrors?: string[];
  submissionTime?: number;
  formData?: Record<string, any>;
  metadata?: Record<string, any>;
}

// Hook for form submission tracking
export function useFormTracking({
  formType,
  formLocation,
  formId,
  metadata,
  onTrackingComplete,
}: FormSubmissionTrackerProps) {
  const { trackFormSubmission: trackFormSubmissionGA4 } = useGA4();

  const trackFormStart = useCallback(() => {
    // Track form interaction start
    trackFormSubmissionGA4(formType, `${formLocation}_start`);

    if (import.meta.env.NODE_ENV === 'development') {
      console.log(`Form start tracked: ${formType} at ${formLocation}`);
    }
  }, [formType, formLocation, trackFormSubmissionGA4]);

  const trackFieldInteraction = useCallback(
    (fieldName: string, fieldType = 'input') => {
      // Track individual field interactions for funnel analysis
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'form_field_interaction', {
          event_category: 'form_engagement',
          event_label: `${formType}_${fieldName}`,
          custom_parameters: {
            form_type: formType,
            form_location: formLocation,
            field_name: fieldName,
            field_type: fieldType,
            form_id: formId,
          },
        });
      }
    },
    [formType, formLocation, formId]
  );

  const trackFormSubmissionData = useCallback(
    async (data: FormTrackingData) => {
      const startTime = performance.now();

      try {
        // Track with GA4
        trackFormSubmissionGA4(data.formType, data.formLocation);

        // Enhanced GA4 tracking with detailed data
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'form_submit', {
            event_category: 'conversion',
            event_label: `${data.formType}_${data.success ? 'success' : 'error'}`,
            value: data.success ? 1 : 0,
            custom_parameters: {
              form_type: data.formType,
              form_location: data.formLocation,
              form_id: data.formId || 'unknown',
              success: data.success,
              error_message: data.errorMessage || '',
              field_errors: data.fieldErrors?.join(',') || '',
              submission_time: data.submissionTime || 0,
              ...data.metadata,
            },
          });

          // Track specific form conversion events
          if (data.success) {
            switch (data.formType) {
              case 'newsletter':
                window.gtag('event', 'newsletter_signup', {
                  event_category: 'conversion',
                  event_label: data.formLocation,
                  value: 1,
                });
                break;
              case 'contact':
                window.gtag('event', 'contact_form_submit', {
                  event_category: 'conversion',
                  event_label: data.formLocation,
                  value: 1,
                });
                break;
              case 'signup':
                window.gtag('event', 'signup_complete', {
                  event_category: 'conversion',
                  event_label: data.formLocation,
                  value: 10, // Higher value for signups
                });
                break;
              case 'feedback':
                window.gtag('event', 'feedback_submit', {
                  event_category: 'engagement',
                  event_label: data.formLocation,
                  value: 1,
                });
                break;
            }
          }
        }

        const endTime = performance.now();

        if (import.meta.env.NODE_ENV === 'development') {
          console.log(`Form submission tracked: ${data.formType} at ${data.formLocation}`, {
            success: data.success,
            trackingTime: endTime - startTime,
            data,
          });
        }

        onTrackingComplete?.();
      } catch (error: Error | unknown) {
        console.error('Error tracking form submission:', error);
      }
    },
    [trackFormSubmissionGA4, onTrackingComplete]
  );

  const trackFormAbandon = useCallback(
    (fieldName?: string, timeSpent?: number) => {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'form_abandon', {
          event_category: 'form_engagement',
          event_label: `${formType}_abandon`,
          value: timeSpent || 0,
          custom_parameters: {
            form_type: formType,
            form_location: formLocation,
            form_id: formId || 'unknown',
            last_field: fieldName || 'unknown',
            time_spent: timeSpent || 0,
            ...metadata,
          },
        });
      }

      if (import.meta.env.NODE_ENV === 'development') {
        console.log(`Form abandon tracked: ${formType} at ${formLocation}`, {
          lastField: fieldName,
          timeSpent,
        });
      }
    },
    [formType, formLocation, formId, metadata]
  );

  const trackFormError = useCallback(
    (errorType: string, errorMessage: string, fieldName?: string) => {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'form_error', {
          event_category: 'form_engagement',
          event_label: `${formType}_error_${errorType}`,
          custom_parameters: {
            form_type: formType,
            form_location: formLocation,
            form_id: formId || 'unknown',
            error_type: errorType,
            error_message: errorMessage,
            field_name: fieldName || 'unknown',
            ...metadata,
          },
        });
      }

      if (import.meta.env.NODE_ENV === 'development') {
        console.log(`Form error tracked: ${formType} at ${formLocation}`, {
          errorType,
          errorMessage,
          fieldName,
        });
      }
    },
    [formType, formLocation, formId, metadata]
  );

  return {
    trackFormStart,
    trackFieldInteraction,
    trackFormSubmission: trackFormSubmissionData,
    trackFormAbandon,
    trackFormError,
  };
}

// Form wrapper component with automatic tracking
export default function FormSubmissionTracker({
  children,
  formType,
  formLocation,
  formId,
  metadata,
  onTrackingComplete,
  ...trackerProps
}: FormSubmissionTrackerProps & {
  children: React.ReactNode;
}) {
  const {
    trackFormStart,
    trackFormSubmission,
  } = useFormTracking({
    formType,
    formLocation,
    formId,
    metadata,
    onTrackingComplete,
  });

  return (
    <div
      onFocusCapture={_e => {
        // Track when user first interacts with form
        trackFormStart();
      }}
      onSubmit={e => {
        // Track form submission attempt
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const data: Record<string, any> = {};

        formData.forEach((value, key) => {
          data[key] = value;
        });

        const trackerConfig: FormSubmissionTrackerProps = {
          formType,
          formLocation,
        };
        if (formId) {
          trackerConfig.formId = formId;
        }
        if (metadata) {
          trackerConfig.metadata = metadata;
        }
        if (onTrackingComplete) {
          trackerConfig.onTrackingComplete = onTrackingComplete;
        }

        const submissionData: FormTrackingData = {
          formType,
          formLocation,
          success: true, // Will be updated based on actual result
          formData: data,
        };
        if (formId) {
          submissionData.formId = formId;
        }
        if (metadata) {
          submissionData.metadata = metadata;
        }

        trackFormSubmission(submissionData);
      }}
      {...trackerProps}
    >
      {children}
    </div>
  );
}

// Higher-order component for wrapping forms with tracking
export function withFormTracking<T extends {}>(
  WrappedComponent: React.ComponentType<T>,
  trackingConfig: FormSubmissionTrackerProps
) {
  return function FormTrackedComponent(props: T) {
    return (
      <FormSubmissionTracker {...trackingConfig}>
        <WrappedComponent {...props} />
      </FormSubmissionTracker>
    );
  };
}
