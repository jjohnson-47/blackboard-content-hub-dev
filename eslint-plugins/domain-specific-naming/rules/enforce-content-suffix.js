/**
 * @fileoverview Rule to enforce the *Content suffix for content-related interfaces
 * @author DevPreview UI Team
 */
"use strict";

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce *Content suffix for content-related interfaces",
      category: "Domain-Specific Naming",
      recommended: true,
    },
    fixable: "code",
    schema: [], // no options
    messages: {
      contentSuffixRequired: "Interface '{{name}}' contains content-related properties but doesn't use the *Content suffix",
      suggestRename: "Rename to '{{suggestion}}'"
    }
  },

  create: function(context) {
    // Content-related property names
    const contentPropertyNames = ["html", "css", "js", "content", "code"];
    
    return {
      // Look for interface declarations
      TSInterfaceDeclaration(node) {
        const interfaceName = node.id.name;
        
        // Skip if already has Content suffix
        if (interfaceName.endsWith("Content")) {
          return;
        }
        
        // Check if interface has content-related properties
        const hasContentProperties = node.body.body.some(property => {
          if (property.type === "TSPropertySignature" && property.key.type === "Identifier") {
            return contentPropertyNames.includes(property.key.name);
          }
          return false;
        });
        
        if (hasContentProperties) {
          // Suggest a name with Content suffix
          const suggestedName = `${interfaceName}Content`;
          
          context.report({
            node: node.id,
            messageId: "contentSuffixRequired",
            data: {
              name: interfaceName
            },
            fix: function(fixer) {
              return fixer.replaceText(node.id, suggestedName);
            },
            suggest: [
              {
                messageId: "suggestRename",
                data: {
                  suggestion: suggestedName
                },
                fix: function(fixer) {
                  return fixer.replaceText(node.id, suggestedName);
                }
              }
            ]
          });
        }
      }
    };
  }
};