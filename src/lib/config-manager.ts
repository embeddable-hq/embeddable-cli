import { homedir } from 'os';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { Config, Region } from '../types/api-types.js';

export class ConfigManager {
  private static CONFIG_DIR = join(homedir(), '.embeddable');
  private static CONFIG_FILE = join(ConfigManager.CONFIG_DIR, 'config.json');

  static ensureConfigDir(): void {
    if (!existsSync(this.CONFIG_DIR)) {
      mkdirSync(this.CONFIG_DIR, { recursive: true });
    }
  }

  static configExists(): boolean {
    return existsSync(this.CONFIG_FILE);
  }

  static getConfigPath(): string {
    return this.CONFIG_FILE;
  }

  static getConfig(): Config | null {
    if (!this.configExists()) {
      return null;
    }

    try {
      const data = readFileSync(this.CONFIG_FILE, 'utf-8');
      return JSON.parse(data) as Config;
    } catch (error) {
      console.error('Error reading config file:', error);
      return null;
    }
  }

  static saveConfig(config: Config): void {
    this.ensureConfigDir();
    
    try {
      writeFileSync(this.CONFIG_FILE, JSON.stringify(config, null, 2));
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error}`);
    }
  }

  static updateConfig(updates: Partial<Config>): void {
    const currentConfig = this.getConfig();
    if (!currentConfig) {
      throw new Error('No configuration found. Run "embed init" first.');
    }

    const newConfig = { ...currentConfig, ...updates };
    this.saveConfig(newConfig);
  }

  static deleteConfig(): void {
    if (existsSync(this.CONFIG_FILE)) {
      try {
        unlinkSync(this.CONFIG_FILE);
      } catch (error) {
        throw new Error(`Failed to delete configuration: ${error}`);
      }
    }
  }

  static getApiUrl(region: Region): string {
    const baseUrls: Record<Region, string> = {
      'EU': 'https://api.eu.embeddable.com/api/v1',
      'US': 'https://api.us.embeddable.com/api/v1',
      'Dev': 'https://api.dev.embeddable.com/api/v1'
    };

    return baseUrls[region];
  }

  static getRegionDisplay(region: Region): string {
    const displays: Record<Region, string> = {
      'EU': '🇪🇺 EU',
      'US': '🇺🇸 US',
      'Dev': '🛠️  Dev'
    };
    return displays[region] || region;
  }
}