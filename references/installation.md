# 安装与验证

这是多文件 Skill，需要完整代码、配置、脚本和资源。不要只保存说明文件。

1. 将完整项目放到工具支持的技能目录，或作为工作副本让 AI 读取。保存、注册和可运行是不同状态，需要分别说明。
2. 安装 Node.js 22+、pnpm；字幕解析脚本另需 Python 3。运行 pnpm install --frozen-lockfile。
3. 运行 pnpm check 和 pnpm test。
4. 运行 pnpm editor，检查三款主题、头像上传、SRT/VTT 导入、配置导入/保存、深浅背景和预览进度。
5. 用 examples/smoke.json 分别导出短 MOV 和 WebM，确认实际渲染可用。首次运行可能需要下载浏览器。
6. 使用 ffprobe 或 Remotion 自带工具核对尺寸、时长、帧率、编码。独立解码检查透明与不透明像素。WebM 使用支持 alpha 的 VP9 解码器（如 libvpx-vp9）；默认解码器可能忽略 alpha。
7. 在目标剪辑软件实际叠加后，才能声称该软件兼容。

检查现有安装或更新时，保留用户文件和 public/uploads。已修改的安装不可无提示覆盖。工作副本或临时测试不能声称已经永久安装到账号。
