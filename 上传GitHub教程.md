# 第一次上传 GitHub

先使用 scripts/package_skill.py 生成默认公开包，解压后上传其中的项目文件。公开包使用通用星星，不包含个人头像和用户上传。个人包请自行保留。工具名暂定，上传前可以统一修改。

1. 在 github.com 注册账号并验证邮箱。不要把密码或验证码发给 AI。
2. 登录后点击右上角加号，选择 New repository。
3. Repository name 填 `lulu-progress`，Description 填「可定制的粉色头像视频进度条 Skill」。选择 Public（所有人可见）或 Private（仅授权用户可见）。
4. 勾选 Add a README file，点击 Create repository。
5. 进入仓库，选择 Add file → Upload files。打开本地 lulu-progress 文件夹，把里面的项目文件与子文件夹拖入上传区域。不要上传整个外层文件夹形成多一层目录；根目录应直接看到 SKILL.md、package.json、src 等。
6. 不上传 node_modules、out、.cache、缓存、个人视频、账号凭据。public 中的头像若不想让别人下载，应在公开前换为占位图；不要只删除本地头像却仍声称默认 LuLu 示例可直接运行。
7. 页面下方 Commit changes 写「Initial version」，点击提交。大文件或大量文件改用 GitHub Desktop；透明 MOV 演示不要直接塞进源码仓库。
8. 回到仓库首页检查 README 是否显示，SKILL.md、src、scripts、examples、public 和锁定依赖文件是否齐全。点击 Code → Download ZIP，下载到一个新目录，按 README 完整安装并渲染短样片，验证别人可以复现。
9. 将仓库链接发给别人。对方需要能执行代码的 AI 环境，以及 README 所列运行依赖；GitHub 保存源码本身不会提供在线视频渲染服务。

如果修改自上游，保留 LICENSE 和 README 来源说明。公开可见不等于素材无条件授权；头像授权请在 README 单独写明。
