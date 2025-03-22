/**
 * @fileoverview ESLint plugin for enforcing domain-specific naming conventions
 * @author DevPreview UI Team
 */
"use strict";

module.exports = {
  rules: {
    'enforce-content-suffix': require('./rules/enforce-content-suffix'),
    'enforce-metadata-suffix': require('./rules/enforce-metadata-suffix'),
    'enforce-settings-suffix': require('./rules/enforce-settings-suffix'),
    'enforce-event-suffix': require('./rules/enforce-event-suffix'),
    'enforce-request-suffix': require('./rules/enforce-request-suffix'),
    'enforce-response-suffix': require('./rules/enforce-response-suffix'),
  },
  configs: {
    recommended: {
      rules: {
        'domain-specific-naming/enforce-content-suffix': 'error',
        'domain-specific-naming/enforce-metadata-suffix': 'error',
        'domain-specific-naming/enforce-settings-suffix': 'error',
        'domain-specific-naming/enforce-event-suffix': 'error',
        'domain-specific-naming/enforce-request-suffix': 'error',
        'domain-specific-naming/enforce-response-suffix': 'error',
      },
    },
  },
};