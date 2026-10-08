/**
 * Classifies how a visitor arrived when a recovery link was opened.
 *
 * Supabase recovery emails can reach the app in three different shapes
 * depending on which email template is installed:
 *
 * 1. Already exchanged by the Supabase client, which happens with the default
 *    `{{ .ConfirmationURL }}` template:
 *      #access_token=...&refresh_token=...&type=recovery
 *    The session is then the only proof of email ownership.
 *
 * 2. Unconsumed, verified by this app on submit (the recommended template):
 *      #token_hash=...&type=recovery
 *
 * 3. Rejected by Supabase before the app could act:
 *      #error=access_denied&error_code=otp_expired&error_description=...
 */

export const RECOVERY_LINK_STATES = {
  NONE: 'none',
  PENDING: 'pending',
  EXCHANGED: 'exchanged',
  EXPIRED: 'expired'
};

const readError = (params) => {
  const description = params.get('error_description');
  if (description) return description.replace(/\+/g, ' ');
  return 'This recovery link is invalid or has expired. Request a new link.';
};

export const classifyRecoveryLanding = (params) => {
  const errorCode = params.get('error_code') || params.get('error');
  if (errorCode) {
    return {
      recoveryRequired: true,
      recoveryLinkState: RECOVERY_LINK_STATES.EXPIRED,
      recoveryError: readError(params)
    };
  }

  const linkType = params.get('type');
  const isRecoveryType = linkType === 'recovery';

  if (isRecoveryType && params.get('access_token')) {
    return {
      recoveryRequired: true,
      recoveryLinkState: RECOVERY_LINK_STATES.EXCHANGED,
      recoveryError: ''
    };
  }

  // A token without a type comes from the SkillMatchPH recovery template. An
  // explicit non-recovery type (signup, magiclink, invite, email_change) is
  // handled by its own screen and must not be captured by the recovery guard.
  if (params.get('token_hash') && (!linkType || isRecoveryType)) {
    return {
      recoveryRequired: true,
      recoveryLinkState: RECOVERY_LINK_STATES.PENDING,
      recoveryError: ''
    };
  }

  // A recovery-typed link that lost its token cannot be completed.
  if (isRecoveryType) {
    return {
      recoveryRequired: true,
      recoveryLinkState: RECOVERY_LINK_STATES.EXPIRED,
      recoveryError: 'This recovery link is missing its verification token. Request a new link.'
    };
  }

  return {
    recoveryRequired: false,
    recoveryLinkState: RECOVERY_LINK_STATES.NONE,
    recoveryError: ''
  };
};
