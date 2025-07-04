import { Logger } from '../utils/logger.js';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import packageJson from '../../package.json' with { type: 'json' };
import semver from 'semver';

const { version: currentVersion } = packageJson;
const UPDATE_CHECK_FILE = join(homedir(), '.embeddable', '.update-check');
const CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

interface UpdateCheckData {
  lastCheck: number;
  lastVersion?: string;
  available?: boolean;
}

export async function checkForUpdatesInBackground(): Promise<void> {
  try {
    // Check if update checks are disabled
    if (process.env.EMBED_NO_UPDATE_CHECK === '1') {
      return;
    }
    
    // Check if we should run the update check
    if (!shouldCheckForUpdates()) {
      return;
    }

    // Run the check in the background
    checkForUpdates().catch(() => {
      // Ignore errors in background check
    });
  } catch {
    // Ignore all errors in background check
  }
}

function shouldCheckForUpdates(): boolean {
  try {
    if (existsSync(UPDATE_CHECK_FILE)) {
      const data: UpdateCheckData = JSON.parse(readFileSync(UPDATE_CHECK_FILE, 'utf8'));
      const timeSinceLastCheck = Date.now() - data.lastCheck;
      
      // Don't check if we checked recently
      if (timeSinceLastCheck < CHECK_INTERVAL) {
        // But still show message if update is available
        if (data.available && data.lastVersion) {
          Logger.info(`\n📦 Update available: v${data.lastVersion} (current: v${currentVersion})`);
          Logger.log(`Run 'embed version --update' to update\n`);
        }
        return false;
      }
    }
    
    return true;
  } catch {
    return true;
  }
}

async function checkForUpdates(): Promise<void> {
  try {
    const response = await fetch('https://api.github.com/repos/embeddable-hq/embeddable-cli/releases/latest', {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    
    if (!response.ok) {
      saveCheckResult({ lastCheck: Date.now() });
      return;
    }
    
    const release = await response.json() as any;
    const latestVersion = release.tag_name.replace(/^v/, '');
    
    if (semver.gt(latestVersion, currentVersion)) {
      saveCheckResult({
        lastCheck: Date.now(),
        lastVersion: latestVersion,
        available: true,
      });
      
      Logger.info(`\n📦 Update available: v${latestVersion} (current: v${currentVersion})`);
      Logger.log(`Run 'embed version --update' to update\n`);
    } else {
      saveCheckResult({
        lastCheck: Date.now(),
        available: false,
      });
    }
  } catch {
    // Save that we tried to check
    saveCheckResult({ lastCheck: Date.now() });
  }
}

function saveCheckResult(data: UpdateCheckData): void {
  try {
    const configDir = join(homedir(), '.embeddable');
    if (!existsSync(configDir)) {
      return; // Don't create config dir just for update checks
    }
    
    writeFileSync(UPDATE_CHECK_FILE, JSON.stringify(data, null, 2));
  } catch {
    // Ignore errors saving check result
  }
}