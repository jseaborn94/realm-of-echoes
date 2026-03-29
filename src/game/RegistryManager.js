/**
 * RegistryManager.js
 * 
 * Centralized validation and safe access to all game registries.
 * Prevents crashes from missing imports or invalid registry data.
 */

class RegistryManager {
  constructor() {
    this.registries = {};
    this.validationRules = {};
    this.initialized = false;
  }

  /**
   * Register a data source with validation rules
   */
  register(name, data, rules = {}) {
    if (!name || typeof name !== 'string') {
      console.error(`[Registry] Invalid registry name: ${name}`);
      return false;
    }

    // Validate the data exists
    if (!data) {
      console.warn(`[Registry] ${name} is empty or undefined`);
      this.registries[name] = {};
      return false;
    }

    // Store registry
    this.registries[name] = data;
    this.validationRules[name] = rules;

    // Run validation
    const isValid = this._validate(name);
    if (!isValid) {
      console.warn(`[Registry] ${name} validation failed, but storing anyway`);
    }

    return isValid;
  }

  /**
   * Get a registry by name with safe fallback
   */
  get(name) {
    if (!this.registries[name]) {
      console.warn(`[Registry] ${name} not found, returning empty object`);
      return {};
    }
    return this.registries[name];
  }

  /**
   * Get a single item from a registry
   */
  getItem(registryName, itemId) {
    const registry = this.get(registryName);
    const item = registry[itemId];
    if (!item) {
      console.warn(`[Registry] ${registryName}.${itemId} not found`);
      return null;
    }
    return item;
  }

  /**
   * Get all items from a registry as array
   */
  getAll(registryName) {
    const registry = this.get(registryName);
    return Object.values(registry) || [];
  }

  /**
   * Filter items from a registry
   */
  filter(registryName, predicate) {
    const registry = this.get(registryName);
    return Object.values(registry).filter(predicate) || [];
  }

  /**
   * Check if registry has an item
   */
  has(registryName, itemId) {
    const registry = this.get(registryName);
    return itemId in registry;
  }

  /**
   * Validate a registry against its rules
   */
  _validate(name) {
    const data = this.registries[name];
    const rules = this.validationRules[name];

    if (!rules) return true; // No rules, consider valid

    // Check if data matches expected type
    if (rules.type === 'object' && typeof data !== 'object') {
      console.error(`[Registry] ${name} should be object, got ${typeof data}`);
      return false;
    }

    if (rules.type === 'array' && !Array.isArray(data)) {
      console.error(`[Registry] ${name} should be array, got ${typeof data}`);
      return false;
    }

    // Check required fields on each item
    if (rules.requiredFields) {
      for (const itemId in data) {
        const item = data[itemId];
        for (const field of rules.requiredFields) {
          if (!(field in item)) {
            console.error(`[Registry] ${name}.${itemId} missing required field: ${field}`);
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Initialize all registries at game start
   */
  initAll() {
    if (this.initialized) return true;

    const registryNames = Object.keys(this.registries);
    let anyFailed = false;

    for (const name of registryNames) {
      const isValid = this._validate(name);
      if (!isValid) {
        console.warn(`[Registry] ${name} failed validation but continuing`);
        anyFailed = true;
      }
    }

    this.initialized = true;
    return !anyFailed;
  }

  /**
   * Get initialization status report
   */
  getStatus() {
    return {
      initialized: this.initialized,
      registries: Object.keys(this.registries),
      counts: Object.fromEntries(
        Object.entries(this.registries).map(([name, data]) => [
          name,
          Array.isArray(data) ? data.length : Object.keys(data).length,
        ])
      ),
    };
  }
}

export const registryManager = new RegistryManager();