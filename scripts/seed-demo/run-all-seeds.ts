/**
 * Master Seed Runner - Sprint 38
 * Runs all seed scripts in the correct order
 *
 * Usage: npx ts-node run-all-seeds.ts [--skip-existing] [--only=quotes,submittals]
 */

import { execSync } from 'child_process';

// Color helpers
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message: string) {
  console.log('\n' + '='.repeat(60));
  log(message, colors.bold + colors.cyan);
  console.log('='.repeat(60) + '\n');
}

function logSuccess(message: string) {
  log(`✅ ${message}`, colors.green);
}

function logError(message: string) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

// Seed scripts in execution order
const SEED_SCRIPTS = [
  // Phase 1: Foundation (existing + updates)
  { name: 'update-project-categories', file: 'update-project-categories.ts', description: 'Update project categories' },
  { name: 'clients', file: 'seed-clients.ts', description: 'Seed demo clients', existing: true },
  { name: 'update-project-clients', file: 'update-project-clients.ts', description: 'Link clients to projects' },

  // Phase 2: Project data
  { name: 'quotes', file: 'seed-quotes.ts', description: 'Seed quote line items' },
  { name: 'scopes', file: 'seed-scopes.ts', description: 'Seed scope of work' },
  { name: 'tasks', file: 'seed-tasks.ts', description: 'Seed tasks with dependencies', existing: true },

  // Phase 3: Subcontractor ecosystem
  { name: 'subcontractors', file: 'seed-subcontractors.ts', description: 'Seed subcontractors, bids, solicitations', existing: true },

  // Phase 4: Documentation
  { name: 'rfis', file: 'seed-rfis.ts', description: 'Seed RFIs', existing: true },
  { name: 'submittals', file: 'seed-submittals.ts', description: 'Seed submittals' },
  { name: 'punch-list', file: 'seed-punch-list.ts', description: 'Seed punch list items' },
  { name: 'change-orders', file: 'seed-change-orders.ts', description: 'Seed change orders' },

  // Phase 5: Team & scheduling
  { name: 'schedule-events', file: 'seed-schedule-events.ts', description: 'Seed schedule events' },
  { name: 'crew-availability', file: 'seed-crew-availability.ts', description: 'Seed crew availability' },
  { name: 'time-off', file: 'seed-time-off.ts', description: 'Seed time off requests' },
  { name: 'daily-logs', file: 'seed-daily-logs.ts', description: 'Seed daily logs' },

  // Phase 6: Client preferences
  { name: 'client-preferences', file: 'seed-client-preferences.ts', description: 'Seed client preferences' },

  // Phase 7: Financial data
  { name: 'finances', file: 'seed-finances.ts', description: 'Seed comprehensive finance data' },
  { name: 'payroll', file: 'seed-payroll.ts', description: 'Seed payroll data' },
  { name: 'reports-data', file: 'seed-reports-data.ts', description: 'Seed historical reports data' },
];

interface RunOptions {
  skipExisting: boolean;
  only: string[];
  dryRun: boolean;
}

function parseArgs(): RunOptions {
  const args = process.argv.slice(2);
  const options: RunOptions = {
    skipExisting: false,
    only: [],
    dryRun: false,
  };

  for (const arg of args) {
    if (arg === '--skip-existing') {
      options.skipExisting = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--only=')) {
      options.only = arg.replace('--only=', '').split(',');
    } else if (arg === '--help') {
      console.log(`
Usage: npx ts-node run-all-seeds.ts [options]

Options:
  --skip-existing    Skip scripts marked as existing (already run)
  --only=a,b,c       Only run specific scripts by name
  --dry-run          Show what would run without executing
  --help             Show this help message

Available scripts:
${SEED_SCRIPTS.map(s => `  ${s.name.padEnd(25)} ${s.description}${s.existing ? ' (existing)' : ''}`).join('\n')}
      `);
      process.exit(0);
    }
  }

  return options;
}

async function runSeed(scriptFile: string, description: string): Promise<boolean> {
  try {
    log(`\nRunning: ${description}`, colors.cyan);
    log(`File: ${scriptFile}`, colors.yellow);

    execSync(`npx ts-node ${scriptFile}`, {
      stdio: 'inherit',
      cwd: __dirname,
    });

    logSuccess(`Completed: ${description}`);
    return true;
  } catch (error) {
    logError(`Failed: ${description}`);
    if (error instanceof Error) {
      console.error(error.message);
    }
    return false;
  }
}

async function main() {
  const options = parseArgs();

  logHeader('ContractorOS Demo Data Seeder - Sprint 38');

  log('Options:', colors.yellow);
  log(`  Skip existing: ${options.skipExisting}`);
  log(`  Only: ${options.only.length > 0 ? options.only.join(', ') : 'all'}`);
  log(`  Dry run: ${options.dryRun}`);

  const scriptsToRun = SEED_SCRIPTS.filter(script => {
    // Filter by --only
    if (options.only.length > 0 && !options.only.includes(script.name)) {
      return false;
    }

    // Filter by --skip-existing
    if (options.skipExisting && script.existing) {
      return false;
    }

    return true;
  });

  log(`\nScripts to run: ${scriptsToRun.length}`, colors.cyan);
  scriptsToRun.forEach(s => log(`  - ${s.name}: ${s.description}`));

  if (options.dryRun) {
    logWarning('\nDry run - no scripts will be executed');
    process.exit(0);
  }

  console.log('\n' + '-'.repeat(60));

  const results: { name: string; success: boolean }[] = [];

  for (const script of scriptsToRun) {
    const success = await runSeed(script.file, script.description);
    results.push({ name: script.name, success });

    if (!success) {
      logWarning(`Script ${script.name} failed. Continuing with remaining scripts...`);
    }
  }

  // Summary
  logHeader('Execution Summary');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  if (successful.length > 0) {
    logSuccess(`Successful (${successful.length}):`);
    successful.forEach(r => log(`  ✅ ${r.name}`));
  }

  if (failed.length > 0) {
    logError(`Failed (${failed.length}):`);
    failed.forEach(r => log(`  ❌ ${r.name}`));
  }

  console.log('\n' + '='.repeat(60));
  log(`Total: ${results.length} scripts`, colors.bold);
  log(`Success: ${successful.length}`, colors.green);
  log(`Failed: ${failed.length}`, failed.length > 0 ? colors.red : colors.green);
  console.log('='.repeat(60) + '\n');

  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch(error => {
  logError('Fatal error:');
  console.error(error);
  process.exit(1);
});
