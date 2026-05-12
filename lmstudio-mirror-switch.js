/**
 * LM Studio 镜像切换脚本
 * 将 huggingface.co 替换为 hf-mirror.com，解决国内网络无法访问问题
 * 同时注入 NODE_TLS_REJECT_UNAUTHORIZED=0 处理镜像站 SSL 证书问题
 *
 * 用法:
 *   node scripts/lmstudio-mirror-switch.js          # 应用镜像
 *   node scripts/lmstudio-mirror-switch.js --revert # 恢复备份
 *
 * 兼容版本: LM Studio 0.39 ~ 0.48
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function findInstallPath() {
  const commonPaths = [
    'D:\\Game and Files\\AI\\LM Studio',
    'C:\\Users\\Administrator\\AppData\\Local\\Programs\\LM Studio',
    'C:\\Program Files\\LM Studio',
    'C:\\Program Files (x86)\\LM Studio',
  ];

  for (const p of commonPaths) {
    const jsPath = path.join(p, 'resources', 'app', '.webpack', 'main', 'index.js');
    if (fs.existsSync(jsPath)) return p;
  }
  return null;
}

async function revert(finalPath) {
  const mainFile = path.join(finalPath, 'resources', 'app', '.webpack', 'main', 'index.js');
  const mainBak = mainFile + '.bak';
  const rendererFile = path.join(finalPath, 'resources', 'app', '.webpack', 'renderer', 'main_window.js');
  const rendererBak = rendererFile + '.bak';

  let reverted = 0;
  if (fs.existsSync(mainBak)) {
    fs.copyFileSync(mainBak, mainFile);
    fs.unlinkSync(mainBak);
    console.log('  ✓ 已恢复 main/index.js');
    reverted++;
  } else {
    console.log('  - main/index.js.bak 不存在，跳过');
  }
  if (fs.existsSync(rendererBak)) {
    fs.copyFileSync(rendererBak, rendererFile);
    fs.unlinkSync(rendererBak);
    console.log('  ✓ 已恢复 main_window.js');
    reverted++;
  } else {
    console.log('  - main_window.js.bak 不存在，跳过');
  }

  if (reverted > 0) {
    console.log(`\n✅ 已恢复 ${reverted} 个文件。请重启 LM Studio 生效。\n`);
  } else {
    console.log('\n⚠ 没有找到备份文件，无需恢复。\n');
  }
}

function injectTLSOverride(content) {
  // Only inject if not already present
  if (content.includes('NODE_TLS_REJECT_UNAUTHORIZED')) return { content, injected: false };
  return {
    content: 'process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";\n' + content,
    injected: true
  };
}

async function apply(finalPath) {
  const mainFile = path.join(finalPath, 'resources', 'app', '.webpack', 'main', 'index.js');
  const rendererFile = path.join(finalPath, 'resources', 'app', '.webpack', 'renderer', 'main_window.js');

  if (!fs.existsSync(mainFile) || !fs.existsSync(rendererFile)) {
    console.error('错误: 未找到 LM Studio 核心文件');
    console.error(`  主进程: ${mainFile}`);
    console.error(`  渲染进程: ${rendererFile}`);
    return;
  }

  console.log('\n处理中...');

  let totalReplacements = 0;
  let totalTLS = false;

  // 1. 处理 main/index.js
  const mainBak = mainFile + '.bak';
  if (!fs.existsSync(mainBak)) {
    fs.copyFileSync(mainFile, mainBak);
    console.log('  ✓ 已备份 main/index.js.bak');
  }
  let mainContent = fs.readFileSync(mainFile, 'utf-8');
  const mainURLCount = (mainContent.match(/https:\/\/huggingface\.co/g) || []).length;
  mainContent = mainContent.replace(/https:\/\/huggingface\.co/g, 'https://hf-mirror.com');

  const tlsResult = injectTLSOverride(mainContent);
  mainContent = tlsResult.content;
  if (tlsResult.injected) { console.log('  ✓ 已注入 TLS 跳过（处理 hf-mirror.com SSL 证书问题）'); totalTLS = true; }

  fs.writeFileSync(mainFile, mainContent, 'utf-8');
  console.log(`  ✓ main/index.js 替换 URL ${mainURLCount} 处`);
  totalReplacements += mainURLCount;

  // 2. 处理 renderer/main_window.js
  const rendererBak = rendererFile + '.bak';
  if (!fs.existsSync(rendererBak)) {
    fs.copyFileSync(rendererFile, rendererBak);
    console.log('  ✓ 已备份 main_window.js.bak');
  }
  let rendererContent = fs.readFileSync(rendererFile, 'utf-8');
  const rendererURLCount = (rendererContent.match(/https:\/\/huggingface\.co/g) || []).length;
  rendererContent = rendererContent.replace(/https:\/\/huggingface\.co/g, 'https://hf-mirror.com');
  fs.writeFileSync(rendererFile, rendererContent, 'utf-8');
  console.log(`  ✓ main_window.js 替换 URL ${rendererURLCount} 处`);
  totalReplacements += rendererURLCount;

  console.log(`\n✅ 完成！URL 替换 ${totalReplacements} 处` + (totalTLS ? '，TLS 校验已跳过' : ''));
  console.log('请重启 LM Studio 生效。');
  console.log('还原: node scripts/lmstudio-mirror-switch.js --revert\n');
}

async function main() {
  console.log('=== LM Studio 镜像切换工具 (0.39 ~ 0.48) ===\n');

  const revertMode = process.argv.includes('--revert');

  const detectedPath = findInstallPath();
  const defaultPath = detectedPath || '';
  const prompt = revertMode
    ? `LM Studio 安装目录${defaultPath ? ` (检测到: ${defaultPath})` : ''}:\n> `
    : `LM Studio 安装目录${defaultPath ? ` (检测到: ${defaultPath})` : ''}:\n> `;

  const installPath = await ask(prompt);
  const finalPath = installPath.trim() || defaultPath;

  if (!finalPath || !fs.existsSync(finalPath)) {
    console.error('错误: 路径不存在');
    rl.close();
    return;
  }

  if (revertMode) {
    await revert(finalPath);
  } else {
    await apply(finalPath);
  }
  rl.close();
}

main().catch(err => {
  console.error('出错:', err);
  rl.close();
});
