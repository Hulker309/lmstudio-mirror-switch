# LM Studio 镜像切换工具

国内网络环境下，一键将 LM Studio 中的 huggingface.co 替换为国内镜像 hf-mirror.com，解决模型列表加载、搜索和下载的网络问题。

## 使用场景

- LM Studio "发现"页模型列表加载为空白
- 搜索模型时提示"从 Hugging Face 获取结果时出现错误"
- 点击下载模型没反应或超时
- 不想开代理，想直接用国内镜像

## 使用方法

### Windows 用户（推荐）

双击 lmstudio-mirror-switch.bat 运行，按提示操作即可：

1. 脚本自动检测 LM Studio 安装目录
2. 自动备份原文件（生成 .bak 备份）
3. 一键替换所有 huggingface.co 为 hf-mirror.com
4. 重启 LM Studio 生效

### Node.js 用户

node lmstudio-mirror-switch.js

交互式操作，自动检测安装路径，也支持自定义输入。

## 还原方法

LM Studio 更新后会覆盖修改，重新运行本工具即可。

如需手动还原，删除对应 .bak 文件后缀：

- resources\app\.webpack\main\index.js.bak → 重命名为 index.js
- resources\app\.webpack\renderer\main_window.js.bak → 重命名为 main_window.js

## 原理

LM Studio 基于 Electron，核心请求逻辑打包在 main/index.js 和 renderer/main_window.js 中。通过将硬编码的 huggingface.co 域名替换为国内镜像 hf-mirror.com，使所有 API 请求和模型下载走镜像加速。

## 注意事项

- 本工具仅修改 LM Studio 安装目录下的文件，不影响系统
- hf-mirror.com 是 Hugging Face 官方镜像，数据实时同步
- 如遇杀毒软件误报，信任即可（脚本仅做字符串替换）
