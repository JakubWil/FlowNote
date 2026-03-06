/**
 * FlowNote — Secure API Key Storage
 *
 * We store API keys in the macOS Keychain — NOT in plain text files.
 * This is the same place that Safari stores your passwords.
 *
 * Library: keytar (wraps the native macOS Security framework)
 *
 * Never store secrets in:
 *   ❌ electron-store (plain text JSON on disk)
 *   ❌ localStorage (accessible to renderer)
 *   ❌ environment variables (visible in process list)
 *
 * Always use:
 *   ✅ keytar → macOS Keychain
 */

const keytar = require('keytar');

const SERVICE_NAME = 'FlowNote';

const KEY_NAMES = {
  openai: 'openai-api-key',
  anthropic: 'anthropic-api-key',
};

async function getApiKey(service) {
  const keyName = KEY_NAMES[service];
  if (!keyName) throw new Error(`Unknown service: ${service}`);
  return await keytar.getPassword(SERVICE_NAME, keyName);
}

async function setApiKey(service, key) {
  const keyName = KEY_NAMES[service];
  if (!keyName) throw new Error(`Unknown service: ${service}`);
  await keytar.setPassword(SERVICE_NAME, keyName, key);
}

async function deleteApiKey(service) {
  const keyName = KEY_NAMES[service];
  if (!keyName) throw new Error(`Unknown service: ${service}`);
  await keytar.deletePassword(SERVICE_NAME, keyName);
}

module.exports = { getApiKey, setApiKey, deleteApiKey };
