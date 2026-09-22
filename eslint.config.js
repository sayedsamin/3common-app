const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/**', '.expo/**', '.expo-scaffold/**', 'backend/ai/dist/**', 'backend/ai/node_modules/**', 'backend/ai/.aws-sam/**'] },
]);
