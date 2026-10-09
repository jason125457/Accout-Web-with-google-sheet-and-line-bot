#!/usr/bin/env node
/**
 * One-command GAS release: push gas/ -> create a new version -> point the existing
 * web app deployment at it. The deployment URL never changes, so LINE and the
 * dashboard keep working without any settings change.
 *
 * Usage: npm run gas:deploy [-- "release note"]
 * Needs: .clasp.json and .gas-deploy.json (see the *.example files), and `npx clasp login`.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Run clasp's own entry script with Node: no shell, so arguments with spaces need no quoting.
const claspDir = join('node_modules', '@google', 'clasp');
const claspPkg = JSON.parse(readFileSync(join(claspDir, 'package.json'), 'utf8'));
const claspBin = join(claspDir, typeof claspPkg.bin === 'string' ? claspPkg.bin : claspPkg.bin.clasp);
const clasp = (args, opts = {}) =>
  execFileSync(process.execPath, [claspBin, ...args], { encoding: 'utf8', ...opts });

const fail = (msg) => {
  console.error(`\n✖ ${msg}`);
  process.exit(1);
};

if (!existsSync('.clasp.json')) fail('找不到 .clasp.json，請參考 .clasp.json.example 建立。');
const deploymentId =
  process.env.GAS_DEPLOYMENT_ID ||
  (existsSync('.gas-deploy.json') && JSON.parse(readFileSync('.gas-deploy.json', 'utf8')).deploymentId);
if (!deploymentId) fail('找不到部署 ID，請參考 .gas-deploy.json.example 建立 .gas-deploy.json。');

let commit = 'local';
try {
  commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
} catch {}
// npm drops the quotes around the note, so rejoin all words.
const note = (process.argv.slice(2).join(' ') || 'release').slice(0, 80);
const description = `${note} (${commit})`;

console.log('① 推送 gas/ 到 Apps Script…');
clasp(['push', '--force'], { stdio: 'inherit' });

console.log('② 建立新版本…');
const versionOut = clasp(['create-version', description, '--json']);
const version = Number((versionOut.match(/"?versionNumber"?\s*:\s*(\d+)/) || versionOut.match(/(\d+)/) || [])[1]);
if (!version) fail(`無法從輸出判斷版本號：\n${versionOut}`);

console.log(`③ 把部署指向第 ${version} 版…`);
clasp(['update-deployment', deploymentId, '-V', String(version), '-d', description], { stdio: 'inherit' });

console.log(`\n✔ 完成：部署已更新到第 ${version} 版（${description}）。LINE 與網站網址不變。`);
