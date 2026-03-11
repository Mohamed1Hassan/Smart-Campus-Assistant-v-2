import {
  NotificationTemplate,
  TemplateService,
  TemplateFilters,
  TemplateValidationResult,
  TemplateVariable,
  NotificationType,
} from "./types";

/**
 * Notification Templates Service
 * Handles template management, multi-language support, and dynamic content generation
 */
export class NotificationTemplatesService implements TemplateService {
  private templates: Map<string, NotificationTemplate> = new Map();
  private templateVersions: Map<string, NotificationTemplate[]> = new Map();
  private templateCache: Map<string, string> = new Map();
  private supportedLanguages: string[] = [
    "en",
    "es",
    "fr",
    "de",
    "zh",
    "ja",
    "ko",
    "ar",
  ];
  private templateEngine: TemplateEngine;

  constructor() {
    this.templateEngine = new TemplateEngine();
    this.initializeDefaultTemplates();
  }

  /**
   * Create new template
   */
  public async createTemplate(
    template: NotificationTemplate,
  ): Promise<NotificationTemplate> {
    try {
      // Validate template
      const validation = await this.validateTemplate(template);
      if (!validation.isValid) {
        throw new Error(
          `Template validation failed: ${validation.errors.join(", ")}`,
        );
      }

      // Generate template ID if not provided
      if (!template.id) {
        template.id = this.generateTemplateId(template.name, template.language);
      }

      // Set metadata
      template.metadata = {
        created: new Date(),
        updated: new Date(),
        author: "system",
        tags: template.metadata?.tags || [],
      };

      // Store template
      this.templates.set(template.id, template);

      // Store version
      const versions = this.templateVersions.get(template.id) || [];
      versions.push(template);
      this.templateVersions.set(template.id, versions);

      // Clear cache
      this.templateCache.delete(template.id);

      this.logInfo("Template created", {
        templateId: template.id,
        name: template.name,
      });
      return template;
    } catch (error) {
      this.logError("Failed to create template", error, {
        templateName: template.name,
      });
      throw error;
    }
  }

  /**
   * Update existing template
   */
  public async updateTemplate(
    templateId: string,
    updates: Partial<NotificationTemplate>,
  ): Promise<NotificationTemplate> {
    try {
      const existingTemplate = this.templates.get(templateId);
      if (!existingTemplate) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // Create updated template
      const updatedTemplate: NotificationTemplate = {
        ...existingTemplate,
        ...updates,
        id: templateId,
        version: this.incrementVersion(existingTemplate.version),
        metadata: {
          ...existingTemplate.metadata,
          updated: new Date(),
          author: updates.metadata?.author || existingTemplate.metadata.author,
        },
      };

      // Validate updated template
      const validation = await this.validateTemplate(updatedTemplate);
      if (!validation.isValid) {
        throw new Error(
          `Template validation failed: ${validation.errors.join(", ")}`,
        );
      }

      // Store updated template
      this.templates.set(templateId, updatedTemplate);

      // Store new version
      const versions = this.templateVersions.get(templateId) || [];
      versions.push(updatedTemplate);
      this.templateVersions.set(templateId, versions);

      // Clear cache
      this.templateCache.delete(templateId);

      this.logInfo("Template updated", {
        templateId,
        version: updatedTemplate.version,
      });
      return updatedTemplate;
    } catch (error) {
      this.logError("Failed to update template", error, { templateId });
      throw error;
    }
  }

  /**
   * Delete template
   */
  public async deleteTemplate(templateId: string): Promise<void> {
    try {
      if (!this.templates.has(templateId)) {
        throw new Error(`Template not found: ${templateId}`);
      }

      this.templates.delete(templateId);
      this.templateVersions.delete(templateId);
      this.templateCache.delete(templateId);

      this.logInfo("Template deleted", { templateId });
    } catch (error) {
      this.logError("Failed to delete template", error, { templateId });
      throw error;
    }
  }

  /**
   * Get template by ID
   */
  public async getTemplate(templateId: string): Promise<NotificationTemplate> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    return template;
  }

  /**
   * Get templates with filters
   */
  public async getTemplates(
    filters?: TemplateFilters,
  ): Promise<NotificationTemplate[]> {
    let templates = Array.from(this.templates.values());

    if (filters) {
      if (filters.type) {
        templates = templates.filter((t) => t.type === filters.type);
      }
      if (filters.category) {
        templates = templates.filter((t) => t.category === filters.category);
      }
      if (filters.language) {
        templates = templates.filter((t) => t.language === filters.language);
      }
      if (filters.tags && filters.tags.length > 0) {
        templates = templates.filter((t) =>
          filters.tags!.some((tag) => t.metadata.tags.includes(tag)),
        );
      }
    }

    return templates;
  }

  /**
   * Render template with variables
   */
  public async renderTemplate(
    templateId: string,
    variables: Record<string, unknown>,
  ): Promise<string> {
    try {
      // Check cache first
      const cacheKey = `${templateId}_${JSON.stringify(variables)}`;
      if (this.templateCache.has(cacheKey)) {
        return this.templateCache.get(cacheKey)!;
      }

      // Get template
      const template = await this.getTemplate(templateId);

      // Render template
      const rendered = await this.templateEngine.render(template, variables);

      // Cache result
      this.templateCache.set(cacheKey, rendered);

      this.logInfo("Template rendered", {
        templateId,
        variablesCount: Object.keys(variables).length,
      });
      return rendered;
    } catch (error) {
      this.logError("Failed to render template", error, { templateId });
      throw error;
    }
  }

  /**
   * Validate template
   */
  public async validateTemplate(
    template: NotificationTemplate,
  ): Promise<TemplateValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const variables: TemplateVariable[] = [];

    // Validate required fields
    if (!template.id) {
      errors.push("Template ID is required");
    }
    if (!template.name) {
      errors.push("Template name is required");
    }
    if (!template.type) {
      errors.push("Template type is required");
    }
    if (!template.category) {
      errors.push("Template category is required");
    }
    if (!template.language) {
      errors.push("Template language is required");
    }
    if (!template.content) {
      errors.push("Template content is required");
    }

    // Validate language
    if (
      template.language &&
      !this.supportedLanguages.includes(template.language)
    ) {
      warnings.push(`Unsupported language: ${template.language}`);
    }

    // Validate template syntax
    try {
      const syntaxValidation = this.templateEngine.validateSyntax(
        template.content,
      );
      if (!syntaxValidation.isValid) {
        errors.push(...syntaxValidation.errors);
      }
    } catch (error) {
      errors.push(
        `Template syntax error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    // Extract variables from template
    const extractedVariables = this.extractVariables(template.content);
    variables.push(...extractedVariables);

    // Check for missing required variables
    const requiredVariables = template.variables.filter((v) => v.required);
    for (const requiredVar of requiredVariables) {
      if (!extractedVariables.some((v) => v.name === requiredVar.name)) {
        errors.push(
          `Required variable '${requiredVar.name}' not found in template`,
        );
      }
    }

    // Check for unused variables
    const definedVariables = template.variables.map((v) => v.name);
    for (const extractedVar of extractedVariables) {
      if (!definedVariables.includes(extractedVar.name)) {
        warnings.push(
          `Variable '${extractedVar.name}' found in template but not defined`,
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      variables,
    };
  }

  /**
   * Get template versions
   */
  public async getTemplateVersions(
    templateId: string,
  ): Promise<NotificationTemplate[]> {
    return this.templateVersions.get(templateId) || [];
  }

  /**
   * Get template by version
   */
  public async getTemplateByVersion(
    templateId: string,
    version: string,
  ): Promise<NotificationTemplate> {
    const versions = this.templateVersions.get(templateId) || [];
    const template = versions.find((t) => t.version === version);
    if (!template) {
      throw new Error(`Template version not found: ${templateId}@${version}`);
    }
    return template;
  }

  /**
   * Clone template
   */
  public async cloneTemplate(
    templateId: string,
    newName: string,
    newLanguage?: string,
  ): Promise<NotificationTemplate> {
    try {
      const originalTemplate = await this.getTemplate(templateId);

      const clonedTemplate: NotificationTemplate = {
        ...originalTemplate,
        id: this.generateTemplateId(
          newName,
          newLanguage || originalTemplate.language,
        ),
        name: newName,
        language: newLanguage || originalTemplate.language,
        version: "1.0",
        metadata: {
          ...originalTemplate.metadata,
          created: new Date(),
          updated: new Date(),
          author: "system",
          tags: [...originalTemplate.metadata.tags, "cloned"],
        },
      };

      return this.createTemplate(clonedTemplate);
    } catch (error) {
      this.logError("Failed to clone template", error, { templateId, newName });
      throw error;
    }
  }

  /**
   * Search templates
   */
  public async searchTemplates(query: string): Promise<NotificationTemplate[]> {
    const templates = Array.from(this.templates.values());
    const searchTerms = query.toLowerCase().split(" ");

    return templates.filter((template) => {
      const searchableText = [
        template.name,
        template.category,
        template.content,
        ...template.metadata.tags,
      ]
        .join(" ")
        .toLowerCase();

      return searchTerms.every((term) => searchableText.includes(term));
    });
  }

  /**
   * Get template statistics
   */
  public async getTemplateStatistics(): Promise<{
    totalTemplates: number;
    templatesByType: Record<string, number>;
    templatesByLanguage: Record<string, number>;
    templatesByCategory: Record<string, number>;
    averageVariables: number;
  }> {
    const templates = Array.from(this.templates.values());

    const templatesByType: Record<string, number> = {};
    const templatesByLanguage: Record<string, number> = {};
    const templatesByCategory: Record<string, number> = {};

    let totalVariables = 0;

    for (const template of templates) {
      templatesByType[template.type] =
        (templatesByType[template.type] || 0) + 1;
      templatesByLanguage[template.language] =
        (templatesByLanguage[template.language] || 0) + 1;
      templatesByCategory[template.category] =
        (templatesByCategory[template.category] || 0) + 1;
      totalVariables += template.variables.length;
    }

    return {
      totalTemplates: templates.length,
      templatesByType,
      templatesByLanguage,
      templatesByCategory,
      averageVariables:
        templates.length > 0 ? totalVariables / templates.length : 0,
    };
  }

  /**
   * Initialize default templates
   */
  private initializeDefaultTemplates(): void {
    // Attendance confirmation template
    this.createTemplate({
      id: "attendance-confirmation-en",
      name: "Attendance Confirmation",
      type: NotificationType.ATTENDANCE,
      category: "attendance",
      language: "en",
      version: "1.0",
      subject: "Attendance Confirmed - {{sessionId}}",
      content: `
        Dear {{firstName}} {{lastName}},
        
        Your attendance has been successfully recorded for session {{sessionId}}.
        
        Details:
        - Status: {{status}}
        - Time: {{timestamp}}
        - Location: {{location}}
        
        Thank you for your attendance.
        
        Best regards,
        Smart Campus Assistant
      `,
      variables: [
        {
          name: "firstName",
          type: "STRING",
          required: true,
          description: "Student first name",
        },
        {
          name: "lastName",
          type: "STRING",
          required: true,
          description: "Student last name",
        },
        {
          name: "sessionId",
          type: "STRING",
          required: true,
          description: "Session ID",
        },
        {
          name: "status",
          type: "STRING",
          required: true,
          description: "Attendance status",
        },
        {
          name: "timestamp",
          type: "DATE",
          required: true,
          description: "Attendance timestamp",
        },
        {
          name: "location",
          type: "STRING",
          required: false,
          description: "Attendance location",
        },
      ],
      metadata: {
        created: new Date(),
        updated: new Date(),
        author: "system",
        tags: ["attendance", "confirmation"],
      },
    });

    // Fraud alert template
    this.createTemplate({
      id: "fraud-alert-en",
      name: "Fraud Alert",
      type: NotificationType.FRAUD_ALERT,
      category: "security",
      language: "en",
      version: "1.0",
      subject: "Security Alert: {{alertType}}",
      content: `
        Security Alert
        
        A potential security issue has been detected:
        
        Type: {{alertType}}
        Severity: {{severity}}
        Description: {{description}}
        Risk Score: {{riskScore}}
        Time: {{timestamp}}
        
        Please review your account activity and contact support if you have any concerns.
        
        Best regards,
        Security Team
      `,
      variables: [
        {
          name: "alertType",
          type: "STRING",
          required: true,
          description: "Type of alert",
        },
        {
          name: "severity",
          type: "STRING",
          required: true,
          description: "Alert severity",
        },
        {
          name: "description",
          type: "STRING",
          required: true,
          description: "Alert description",
        },
        {
          name: "riskScore",
          type: "NUMBER",
          required: true,
          description: "Risk score",
        },
        {
          name: "timestamp",
          type: "DATE",
          required: true,
          description: "Alert timestamp",
        },
      ],
      metadata: {
        created: new Date(),
        updated: new Date(),
        author: "system",
        tags: ["security", "fraud", "alert"],
      },
    });

    // Emergency notification template
    this.createTemplate({
      id: "emergency-notification-en",
      name: "Emergency Notification",
      type: NotificationType.EMERGENCY,
      category: "emergency",
      language: "en",
      version: "1.0",
      subject: "EMERGENCY: {{emergencyType}}",
      content: `
        EMERGENCY NOTIFICATION
        
        Type: {{emergencyType}}
        Severity: {{severity}}
        Message: {{message}}
        
        Instructions:
        {{#each instructions}}
        - {{this}}
        {{/each}}
        
        Contact Information:
        Phone: {{contactPhone}}
        Email: {{contactEmail}}
        Emergency: {{emergencyContact}}
        
        Please follow the instructions above and stay safe.
        
        Best regards,
        Emergency Response Team
      `,
      variables: [
        {
          name: "emergencyType",
          type: "STRING",
          required: true,
          description: "Type of emergency",
        },
        {
          name: "severity",
          type: "STRING",
          required: true,
          description: "Emergency severity",
        },
        {
          name: "message",
          type: "STRING",
          required: true,
          description: "Emergency message",
        },
        {
          name: "instructions",
          type: "OBJECT",
          required: true,
          description: "Emergency instructions",
        },
        {
          name: "contactPhone",
          type: "STRING",
          required: true,
          description: "Contact phone",
        },
        {
          name: "contactEmail",
          type: "STRING",
          required: true,
          description: "Contact email",
        },
        {
          name: "emergencyContact",
          type: "STRING",
          required: true,
          description: "Emergency contact",
        },
      ],
      metadata: {
        created: new Date(),
        updated: new Date(),
        author: "system",
        tags: ["emergency", "safety"],
      },
    });
  }

  /**
   * Extract variables from template content
   */
  private extractVariables(content: string): TemplateVariable[] {
    const variables: TemplateVariable[] = [];
    const variableRegex = /\{\{(\w+)\}\}/g;
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
      const variableName = match[1];
      if (!variables.some((v) => v.name === variableName)) {
        variables.push({
          name: variableName,
          type: "STRING",
          required: false,
          description: `Variable: ${variableName}`,
        });
      }
    }

    return variables;
  }

  /**
   * Generate template ID
   */
  private generateTemplateId(name: string, language: string): string {
    const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    return `${sanitizedName}-${language}`;
  }

  /**
   * Increment version number
   */
  private incrementVersion(version: string): string {
    const parts = version.split(".");
    const major = parseInt(parts[0]) || 0;
    const minor = parseInt(parts[1]) || 0;
    return `${major}.${minor + 1}`;
  }

  /**
   * Log info message
   */
  private logInfo(message: string, data?: unknown): void {
    console.log(`[NotificationTemplates] ${message}`, data || "");
  }

  /**
   * Log error message
   */
  private logError(message: string, error: unknown, data?: unknown): void {
    console.error(`[NotificationTemplates] ${message}`, error, data || "");
  }
}

/**
 * Template Engine
 * Handles template rendering and syntax validation
 */
class TemplateEngine {
  /**
   * Render template with variables
   */
  public async render(
    template: NotificationTemplate,
    variables: Record<string, unknown>,
  ): Promise<string> {
    let content = template.content;

    // Replace simple variables {{variable}}
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      content = content.replace(placeholder, String(value));
    }

    // Handle conditional blocks {{#if condition}}...{{/if}}
    content = this.processConditionals(content, variables);

    // Handle loops {{#each array}}...{{/each}}
    content = this.processLoops(content, variables);

    // Handle partials {{> partialName}}
    content = this.processPartials(content);

    return content;
  }

  /**
   * Validate template syntax
   */
  public validateSyntax(content: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check for unmatched braces
    const openBraces = (content.match(/\{\{/g) || []).length;
    const closeBraces = (content.match(/\}\}/g) || []).length;

    if (openBraces !== closeBraces) {
      errors.push("Unmatched template braces");
    }

    // Check for invalid conditional syntax
    const conditionalRegex = /\{\{#if\s+(\w+)\}\}(.*?)\{\{\/if\}\}/g;
    while (conditionalRegex.exec(content) !== null) {
      // Validate conditional syntax
    }

    // Check for invalid loop syntax
    const loopRegex = /\{\{#each\s+(\w+)\}\}(.*?)\{\{\/each\}\}/g;
    while (loopRegex.exec(content) !== null) {
      // Validate loop syntax
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Process conditional blocks
   */
  private processConditionals(
    content: string,
    variables: Record<string, unknown>,
  ): string {
    const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

    return content.replace(conditionalRegex, (match, condition, block) => {
      const value = variables[condition];
      if (value && value !== false && value !== 0 && value !== "") {
        return block;
      }
      return "";
    });
  }

  /**
   * Process loop blocks
   */
  private processLoops(
    content: string,
    variables: Record<string, unknown>,
  ): string {
    const loopRegex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;

    return content.replace(loopRegex, (match, arrayName, block) => {
      const array = variables[arrayName];
      if (Array.isArray(array)) {
        return array
          .map((item) => {
            let itemBlock = block;
            // Replace {{this}} with current item
            itemBlock = itemBlock.replace(/\{\{this\}\}/g, String(item));
            return itemBlock;
          })
          .join("");
      }
      return "";
    });
  }

  /**
   * Process partials
   */
  private processPartials(content: string): string {
    const partialRegex = /\{\{>\s*(\w+)\s*\}\}/g;

    return content.replace(partialRegex, (match, partialName) => {
      // In a real implementation, you would load the partial template
      return `[Partial: ${partialName}]`;
    });
  }
}
