#!/usr/bin/env node

/**
 * Script to configure LMS Copilot security settings
 * This will add the necessary settings to allow agent mode file operations
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// VS Code settings path varies by OS
function getVSCodeSettingsPath() {
    const platform = os.platform();
    const homeDir = os.homedir();
    
    switch (platform) {
        case 'darwin': // macOS
            return path.join(homeDir, 'Library', 'Application Support', 'Code', 'User', 'settings.json');
        case 'win32': // Windows
            return path.join(homeDir, 'AppData', 'Roaming', 'Code', 'User', 'settings.json');
        case 'linux': // Linux
            return path.join(homeDir, '.config', 'Code', 'User', 'settings.json');
        default:
            throw new Error(`Unsupported platform: ${platform}`);
    }
}

// Required settings for LMS Copilot agent mode
const requiredSettings = {
    "lmsCopilot.securityLevel": "disabled",
    "lmsCopilot.allowDangerousCommands": true
};

function configureSettings() {
    try {
        const settingsPath = getVSCodeSettingsPath();
        console.log(`VS Code settings path: ${settingsPath}`);
        
        let currentSettings = {};
        
        // Read existing settings if file exists
        if (fs.existsSync(settingsPath)) {
            const settingsContent = fs.readFileSync(settingsPath, 'utf8');
            try {
                currentSettings = JSON.parse(settingsContent);
                console.log('✓ Loaded existing settings');
            } catch (parseError) {
                console.warn('⚠️  Settings file exists but contains invalid JSON, creating backup...');
                fs.writeFileSync(`${settingsPath}.backup`, settingsContent);
                currentSettings = {};
            }
        } else {
            console.log('ℹ️  No existing settings file found, creating new one...');
            // Ensure directory exists
            fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
        }
        
        // Merge required settings
        const updatedSettings = { ...currentSettings, ...requiredSettings };
        
        // Write updated settings
        fs.writeFileSync(settingsPath, JSON.stringify(updatedSettings, null, 2));
        
        console.log('\n✅ Successfully configured LMS Copilot settings:');
        console.log(`   - Security Level: ${requiredSettings["lmsCopilot.securityLevel"]}`);
        console.log(`   - Allow Dangerous Commands: ${requiredSettings["lmsCopilot.allowDangerousCommands"]}`);
        console.log('\n📋 Next steps:');
        console.log('   1. Restart VS Code');
        console.log('   2. Press F5 to launch Extension Development Host');
        console.log('   3. Test file creation via agent mode');
        
    } catch (error) {
        console.error('❌ Error configuring settings:', error.message);
        console.log('\n🔧 Manual configuration:');
        console.log('   1. Open VS Code');
        console.log('   2. Press Cmd+Shift+P (Command Palette)');
        console.log('   3. Type: "Preferences: Open Settings (JSON)"');
        console.log('   4. Add these lines:');
        console.log('   {');
        console.log('     "lmsCopilot.securityLevel": "disabled",');
        console.log('     "lmsCopilot.allowDangerousCommands": true');
        console.log('   }');
    }
}

// Run the configuration
configureSettings();
