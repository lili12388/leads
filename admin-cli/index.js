#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Configuration
const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';
const ADMIN_SECRET = process.env.ADMIN_SECRET;

if (!ADMIN_SECRET) {
  console.error(chalk.red('Error: ADMIN_SECRET not set in environment'));
  process.exit(1);
}

/**
 * Make authenticated API request
 */
async function apiRequest(method, endpoint, body = null) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_SECRET}`,
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || `HTTP ${response.status}`);
  }
  
  return data;
}

// ===========================================
// CREATE LICENSE COMMAND
// ===========================================
program
  .command('create')
  .description('Create a new license')
  .option('-p, --plan <plan>', 'License plan (monthly, yearly, lifetime)', 'monthly')
  .option('-m, --max-activations <number>', 'Maximum activations', '2')
  .option('-e, --expires <date>', 'Expiry date (ISO format)')
  .option('--email <email>', 'Customer email')
  .option('--name <name>', 'Customer name')
  .option('--notes <notes>', 'Admin notes')
  .action(async (options) => {
    const spinner = ora('Creating license...').start();
    
    try {
      const body = {
        plan: options.plan,
        max_activations: parseInt(options.maxActivations),
      };
      
      if (options.expires) body.expires_at = options.expires;
      if (options.email) body.customer_email = options.email;
      if (options.name) body.customer_name = options.name;
      if (options.notes) body.notes = options.notes;
      
      const result = await apiRequest('POST', '/api/v1/admin/licenses/create', body);
      
      spinner.succeed('License created successfully');
      
      console.log('\n' + chalk.green('═'.repeat(60)));
      console.log(chalk.bold.white('  LICENSE KEY (save this - shown only once):'));
      console.log(chalk.green('═'.repeat(60)));
      console.log(chalk.bold.cyan(`  ${result.license_key}`));
      console.log(chalk.green('═'.repeat(60)) + '\n');
      
      console.log(chalk.gray('Details:'));
      console.log(`  ID:              ${result.license_id}`);
      console.log(`  Plan:            ${result.plan}`);
      console.log(`  Max Activations: ${result.max_activations}`);
      console.log(`  Expires:         ${result.expires_at || 'Never (lifetime)'}`);
      console.log(`  Status:          ${result.status}`);
      
    } catch (error) {
      spinner.fail(`Failed to create license: ${error.message}`);
      process.exit(1);
    }
  });

// ===========================================
// LIST LICENSES COMMAND
// ===========================================
program
  .command('list')
  .description('List all licenses')
  .option('-p, --page <number>', 'Page number', '1')
  .option('-l, --limit <number>', 'Results per page', '20')
  .option('-s, --status <status>', 'Filter by status (active, revoked, expired)')
  .option('--plan <plan>', 'Filter by plan')
  .option('-q, --search <query>', 'Search by email or name')
  .action(async (options) => {
    const spinner = ora('Fetching licenses...').start();
    
    try {
      const params = new URLSearchParams({
        page: options.page,
        limit: options.limit,
      });
      
      if (options.status) params.append('status', options.status);
      if (options.plan) params.append('plan', options.plan);
      if (options.search) params.append('search', options.search);
      
      const result = await apiRequest('GET', `/api/v1/admin/licenses?${params}`);
      
      spinner.stop();
      
      if (result.licenses.length === 0) {
        console.log(chalk.yellow('No licenses found'));
        return;
      }
      
      const tableData = [
        [
          chalk.bold('License Key'),
          chalk.bold('Plan'),
          chalk.bold('Status'),
          chalk.bold('Activations'),
          chalk.bold('Customer'),
          chalk.bold('Expires'),
        ],
        ...result.licenses.map(l => [
          l.license_key_plaintext || 'N/A',
          l.plan,
          l.status === 'active' ? chalk.green(l.status) : chalk.red(l.status),
          `${l.active_activations}/${l.max_activations}`,
          l.customer_email || '-',
          l.expires_at ? new Date(l.expires_at).toLocaleDateString() : 'Never',
        ]),
      ];
      
      console.log(table(tableData));
      console.log(chalk.gray(`Page ${result.pagination.page} of ${result.pagination.total_pages} (${result.pagination.total} total)`));
      
    } catch (error) {
      spinner.fail(`Failed to list licenses: ${error.message}`);
      process.exit(1);
    }
  });

// ===========================================
// GET LICENSE STATUS COMMAND
// ===========================================
program
  .command('status <id>')
  .description('Get detailed status of a license')
  .action(async (id) => {
    const spinner = ora('Fetching license status...').start();
    
    try {
      const result = await apiRequest('GET', `/api/v1/admin/licenses/${id}`);
      
      spinner.stop();
      
      const activeActivations = result.activations.filter(a => a.is_active).length;
      
      console.log(chalk.bold('\n📋 License Details:'));
      console.log('─'.repeat(50));
      console.log(`  License Key:     ${result.license.license_key_plaintext || 'N/A'}`);
      console.log(`  ID:              ${result.license.id}`);
      console.log(`  Plan:            ${result.license.plan}`);
      console.log(`  Status:          ${result.license.status === 'active' ? chalk.green(result.license.status) : chalk.red(result.license.status)}`);
      console.log(`  Activations:     ${activeActivations}/${result.license.max_activations}`);
      console.log(`  Expires:         ${result.license.expires_at ? new Date(result.license.expires_at).toLocaleString() : 'Never'}`);
      console.log(`  Customer Email:  ${result.license.customer_email || '-'}`);
      console.log(`  Customer Name:   ${result.license.customer_name || '-'}`);
      console.log(`  Suspicious:      ${result.license.suspicious_score > 0 ? chalk.red(result.license.suspicious_score) : chalk.green('0')}`);
      console.log(`  Created:         ${new Date(result.license.created_at).toLocaleString()}`);
      
      if (result.activations.length > 0) {
        console.log(chalk.bold('\n🖥️  Active Devices:'));
        console.log('─'.repeat(50));
        
        result.activations.forEach(a => {
          if (a.is_active) {
            console.log(`  Slot ${a.slot_index}:`);
            console.log(`    Extension ID: ${a.extension_id}`);
            console.log(`    Browser:      ${a.browser || 'Unknown'}`);
            console.log(`    OS:           ${a.os || 'Unknown'}`);
            console.log(`    Last IP:      ${a.last_ip || 'Unknown'}`);
            console.log(`    Last Used:    ${a.last_validated ? new Date(a.last_validated).toLocaleString() : 'Never'}`);
          }
        });
      }
      
      if (result.recent_activity.length > 0) {
        console.log(chalk.bold('\n📜 Recent Activity:'));
        console.log('─'.repeat(50));
        
        result.recent_activity.slice(0, 10).forEach(log => {
          const time = new Date(log.timestamp).toLocaleString();
          const event = log.event;
          const color = event.includes('FAIL') || event.includes('SUSPICIOUS') ? chalk.red : chalk.gray;
          console.log(`  ${color(time)} - ${event}`);
        });
      }
      
    } catch (error) {
      spinner.fail(`Failed to get status: ${error.message}`);
      process.exit(1);
    }
  });

// ===========================================
// REVOKE LICENSE COMMAND
// ===========================================
program
  .command('revoke <id>')
  .description('Revoke a license')
  .option('-r, --reason <reason>', 'Reason for revocation')
  .action(async (id, options) => {
    const spinner = ora('Revoking license...').start();
    
    try {
      const body = {};
      
      // Check if ID is a license key or UUID
      if (id.startsWith('LIC-')) {
        body.license_key = id;
      } else {
        body.license_id = id;
      }
      
      if (options.reason) body.reason = options.reason;
      
      const result = await apiRequest('POST', '/api/v1/admin/licenses/revoke', body);
      
      spinner.succeed(`License ${result.license_id} has been revoked`);
      
    } catch (error) {
      spinner.fail(`Failed to revoke license: ${error.message}`);
      process.exit(1);
    }
  });

// ===========================================
// RESET ACTIVATIONS COMMAND
// ===========================================
program
  .command('reset <id>')
  .description('Reset all activations for a license')
  .option('-r, --reason <reason>', 'Reason for reset')
  .action(async (id, options) => {
    const spinner = ora('Resetting activations...').start();
    
    try {
      const body = {};
      
      if (id.startsWith('LIC-')) {
        body.license_key = id;
      } else {
        body.license_id = id;
      }
      
      if (options.reason) body.reason = options.reason;
      
      const result = await apiRequest('POST', '/api/v1/admin/licenses/reset-activations', body);
      
      spinner.succeed(`Deactivated ${result.deactivated_count} device(s) for license ${result.license_id}`);
      
    } catch (error) {
      spinner.fail(`Failed to reset activations: ${error.message}`);
      process.exit(1);
    }
  });

// ===========================================
// DEACTIVATE SPECIFIC SLOT COMMAND
// ===========================================
program
  .command('deactivate <id>')
  .description('Deactivate a specific slot or all slots')
  .option('-s, --slot <number>', 'Specific slot index to deactivate')
  .option('-a, --all', 'Deactivate all slots')
  .action(async (id, options) => {
    if (!options.slot && !options.all) {
      console.error(chalk.red('Error: Specify --slot <number> or --all'));
      process.exit(1);
    }
    
    const spinner = ora('Deactivating...').start();
    
    try {
      const body = {};
      
      if (id.startsWith('LIC-')) {
        body.license_key = id;
      } else {
        body.license_id = id;
      }
      
      if (options.all) {
        body.all = true;
      } else {
        body.slot_index = parseInt(options.slot);
      }
      
      const result = await apiRequest('POST', '/api/v1/admin/licenses/deactivate', body);
      
      spinner.succeed(`Deactivated ${result.deactivated_count} device(s)`);
      
    } catch (error) {
      spinner.fail(`Failed to deactivate: ${error.message}`);
      process.exit(1);
    }
  });

// ===========================================
// AUDIT LOG COMMAND
// ===========================================
program
  .command('audit <id>')
  .description('View audit log for a license')
  .option('-p, --page <number>', 'Page number', '1')
  .option('-l, --limit <number>', 'Results per page', '30')
  .option('-e, --event <event>', 'Filter by event type')
  .action(async (id, options) => {
    const spinner = ora('Fetching audit log...').start();
    
    try {
      const params = new URLSearchParams({
        page: options.page,
        limit: options.limit,
      });
      
      if (options.event) params.append('event', options.event);
      
      const result = await apiRequest('GET', `/api/v1/admin/licenses/${id}/audit?${params}`);
      
      spinner.stop();
      
      if (result.logs.length === 0) {
        console.log(chalk.yellow('No audit logs found'));
        return;
      }
      
      console.log(chalk.bold(`\n📜 Audit Log for ${id}:`));
      console.log('─'.repeat(70));
      
      result.logs.forEach(log => {
        const time = new Date(log.timestamp).toLocaleString();
        const event = log.event;
        let color = chalk.gray;
        
        if (event.includes('FAIL') || event.includes('SUSPICIOUS') || event === 'LICENSE_REVOKED') {
          color = chalk.red;
        } else if (event === 'ACTIVATE' || event === 'LICENSE_CREATED') {
          color = chalk.green;
        } else if (event === 'VALIDATE') {
          color = chalk.blue;
        }
        
        console.log(`${chalk.gray(time)} ${color(event.padEnd(20))} ${chalk.gray(log.ip || '')}`);
        
        if (log.details && Object.keys(log.details).length > 0) {
          const details = JSON.stringify(log.details);
          if (details.length < 100) {
            console.log(`  ${chalk.dim(details)}`);
          }
        }
      });
      
      console.log('─'.repeat(70));
      console.log(chalk.gray(`Page ${result.pagination.page} of ${result.pagination.total_pages} (${result.pagination.total} total)`));
      
    } catch (error) {
      spinner.fail(`Failed to get audit log: ${error.message}`);
      process.exit(1);
    }
  });

// ===========================================
// STATS COMMAND
// ===========================================
program
  .command('stats')
  .description('View system statistics')
  .action(async () => {
    const spinner = ora('Fetching statistics...').start();
    
    try {
      const result = await apiRequest('GET', '/api/v1/admin/stats');
      
      spinner.stop();
      
      console.log(chalk.bold('\n📊 License System Statistics'));
      console.log('═'.repeat(50));
      
      console.log(chalk.bold('\n🔑 Licenses:'));
      console.log(`  Total:            ${result.licenses.total}`);
      console.log(`  Active:           ${chalk.green(result.licenses.active)}`);
      console.log(`  Revoked:          ${chalk.red(result.licenses.revoked)}`);
      console.log(`  Expired:          ${chalk.yellow(result.licenses.expired)}`);
      console.log(`  Suspicious:       ${result.licenses.suspicious > 0 ? chalk.red(result.licenses.suspicious) : '0'}`);
      console.log(`  New (7 days):     ${result.licenses.new_last_7_days}`);
      console.log(`  New (30 days):    ${result.licenses.new_last_30_days}`);
      
      console.log(chalk.bold('\n📋 By Plan:'));
      Object.entries(result.licenses.by_plan).forEach(([plan, count]) => {
        console.log(`  ${plan.padEnd(15)} ${count}`);
      });
      
      console.log(chalk.bold('\n🖥️  Activations:'));
      console.log(`  Total:            ${result.activations.total}`);
      console.log(`  Active:           ${chalk.green(result.activations.active)}`);
      console.log(`  New (30 days):    ${result.activations.new_last_30_days}`);
      
      console.log(chalk.bold('\n📜 Recent Activity:'));
      Object.entries(result.recent_activity.event_breakdown)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([event, count]) => {
          console.log(`  ${event.padEnd(25)} ${count}`);
        });
      
      console.log('\n' + chalk.gray(`Generated: ${result.generated_at}`));
      
    } catch (error) {
      spinner.fail(`Failed to get stats: ${error.message}`);
      process.exit(1);
    }
  });

// Parse arguments
program
  .name('license-admin')
  .description('Admin CLI for managing the license system')
  .version('1.0.0');

program.parse();
