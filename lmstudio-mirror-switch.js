/**
 * LM Studio 镜像切换脚本
 * 将 huggingface.co 替换为 hf-mirror.com，解决国内网络无法访问问题
 *
 * 用法: node scripts/lmstudio-mirror-switch.js
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

async function main() {
  console.log('=== LM Studio 镜像切换工具 ===\n');

  // 检测常见安装路径
  const commonPaths = [
    'D:\\Game and Files\\AI\\LM Studio',
    'C:\\Users\\Administrator\\AppData\\Local\\Programs\\LM Studio',
    'C:\\Program Files\\LM Studio',
    'C:\\Program Files (x86)\\LM Studio',
  ];

  let detectedPath = null;
  for (const p of commonPaths) {
    const jsPath = path.join(p, 'resources', 'app', '.webpack', 'main', 'index.js');
    if (fs.existsSync(jsPath)) {
      detectedPath = p;
      break;
    }
  }

  const defaultPath = detectedPath || '';
  const installPath = await ask(`LM Studio 安装目录${defaultPath ? ` (检测到: ${defaultPath})` : ''}:\n> `);
  const finalPath = installPath.trim() || defaultPath;

  if (!finalPath || !fs.existsSync(finalPath)) {
    console.error('错误: 路径不存在');
    rl.close();
    return;
  }

  const mainFile = path.join(finalPath, 'resources', 'app', '.webpack', 'main', 'index.js');
  const rendererFile = path.join(finalPath, 'resources', 'app', '.webpack', 'renderer', 'main_window.js');

  if (!fs.existsSync(mainFile) || !fs.existsSync(rendererFile)) {
    console.error('错误: 未找到 LM Studio 核心文件，请确认路径正确');
    console.error(`  查找位置: ${mainFile}`);
    rl.close();
    return;
  }

  // 可选：模型存储目录
  const modelPath = await ask('\n模型下载目录（可选，留空跳过）:\n> ');

  console.log('\n处理中...');

  // 备份 & 替换 main/index.js
  const mainBak = mainFile + '.bak';
  if (!fs.existsSync(mainBak)) {
    fs.copyFileSync(mainFile, mainBak);
    console.log('  ✓ 已备份 main/index.js.bak');
  }
  let mainContent = fs.readFileSync(mainFile, 'utf-8');
  const mainCount = (mainContent.match(/https:\/\/huggingface\.co/g) || []).length;
  mainContent = mainContent.replace(/https:\/\/huggingface\.co/g, 'https://hf-mirror.com');
  fs.writeFileSync(mainFile, mainContent, 'utf-8');
  console.log(`  ✓ main/index.js 替换 ${mainCount} 处`);

  // 备份 & 替换 renderer/main_window.js
  const rendererBak = rendererFile + '.bak';
  if (!fs.existsSync(rendererBak)) {
    fs.copyFileSync(rendererFile, rendererBak);
    console.log('  ✓ 已备份 main_window.js.bak');
  }
  let rendererContent = fs.readFileSync(rendererFile, 'utf-8');
  const rendererCount = (rendererContent.match(/https:\/\/huggingface\.co/g) || []).length;
  rendererContent = rendererContent.replace(/https:\/\/huggingface\.co/g, 'https://hf-mirror.com');
  fs.writeFileSync(rendererFile, rendererContent, 'utf-8');
  console.log(`  ✓ main_window.js 替换 ${rendererCount} 处`);

  console.log(`\n✅ 完成！共替换 ${mainCount + rendererCount} 处`);
  console.log('请重启 LM Studio 生效。如遇问题，删除 .bak 后缀恢复备份。\n');
  rl.close();
}

main().catch(err => {
  console.error('出错:', err);
  rl.close();
});
