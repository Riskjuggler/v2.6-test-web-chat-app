#!/usr/bin/env ts-node
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';

/**
 * Verification script for LLM environment configuration
 * Checks:
 * 1. Required environment variables are present
 * 2. llm_call.py file exists at configured path
 * 3. Python 3 is available in PATH
 * 4. Python can execute a simple command
 */

let exitCode = 0;

console.log('🔍 Environment Configuration Verification\n');

// Check required environment variables
const requiredEnvVars = [
  'PORT',
  'CORS_ORIGIN',
  'LLM_CLI_PATH',
  'PYTHON_PATH',
  'LLM_TIMEOUT_MS'
];

console.log('📋 Checking environment variables:');
for (const envVar of requiredEnvVars) {
  const value = process.env[envVar];
  if (!value) {
    console.error(`  ❌ ${envVar}: NOT SET`);
    exitCode = 1;
  } else {
    console.log(`  ✅ ${envVar}: ${value}`);
  }
}
console.log();

// Check LLM_CLI_PATH file existence
const llmCliPath = process.env.LLM_CLI_PATH;
if (llmCliPath) {
  console.log('📁 Checking LLM CLI path:');
  const absolutePath = path.resolve(__dirname, '../', llmCliPath);
  console.log(`  Path: ${absolutePath}`);

  if (fs.existsSync(absolutePath)) {
    console.log(`  ✅ File exists`);
  } else {
    console.error(`  ❌ File NOT FOUND`);
    console.error(`  Please ensure llm_call.py is at the configured path.`);
    exitCode = 1;
  }
  console.log();
}

// Check Python availability
const pythonPath = process.env.PYTHON_PATH || 'python3';
console.log('🐍 Checking Python availability:');
console.log(`  Command: ${pythonPath}`);

const pythonCheck = spawnSync(pythonPath, ['--version'], {
  encoding: 'utf-8'
});

if (pythonCheck.error) {
  console.error(`  ❌ Python NOT FOUND in PATH`);
  console.error(`  Error: ${pythonCheck.error.message}`);
  exitCode = 1;
} else if (pythonCheck.status !== 0) {
  console.error(`  ❌ Python execution failed`);
  console.error(`  stderr: ${pythonCheck.stderr}`);
  exitCode = 1;
} else {
  const version = (pythonCheck.stdout || pythonCheck.stderr).trim();
  console.log(`  ✅ ${version}`);
}
console.log();

// Test simple Python execution
console.log('🧪 Testing Python execution:');
const testExec = spawnSync(pythonPath, ['-c', 'print("Hello from Python")'], {
  encoding: 'utf-8'
});

if (testExec.error || testExec.status !== 0) {
  console.error(`  ❌ Cannot execute Python commands`);
  if (testExec.stderr) {
    console.error(`  stderr: ${testExec.stderr}`);
  }
  exitCode = 1;
} else {
  console.log(`  ✅ Execution successful: ${testExec.stdout.trim()}`);
}
console.log();

// Final result
if (exitCode === 0) {
  console.log('✅ All verification checks passed!');
  console.log('   Environment is ready for LLM integration.\n');
} else {
  console.error('❌ Verification failed. Please fix the issues above.\n');
}

process.exit(exitCode);
