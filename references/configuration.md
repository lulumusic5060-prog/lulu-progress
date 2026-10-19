# 配置说明

复制 examples/demo.json，修改后交给导出脚本或编辑器。

| 字段 | 含义 |
| --- | --- |
| width / height | 原视频画布尺寸，正偶数 |
| fps | 帧率，默认 30；如已知原视频帧率则匹配 |
| duration | 视频真实总时长，秒；不一定等于最后字幕结束时间 |
| style | lulu 连续滑动 / lulu-hop 章节跳跃 / lulu-cells 分段填充 |
| position | top 或 bottom，完整画布下生效 |
| compact | true 只输出条带区域，保留 width，动态计算偶数 height |
| image / alternateImage | public 内图片相对路径；第二张按章节交替。不填则显示通用星星 |
| avatarSize | 40–180 像素，默认 84；包含白色边框 |
| barHeight | 6–44 像素，默认 24 |
| margin | 左右边距占宽度的百分比，3–18，默认 5.5 |
| offset | 距画面边缘的额外百分比，0–25；紧凑模式忽略 |
| accent / track / ink | 主色、底色、文字色，六位十六进制颜色 |
| labels | 是否显示章节标题 |
| labelMode | auto 自动判断拥挤 / current 当前章 / all 全部章 |
| chapters | label 和 start（秒），从 0 开始严格递增，且小于 duration |

assetBase 仅供本地预览使用，不应写进交付配置。导出末帧按完整进度绘制；时间总长向上对齐到完整一帧，误差小于一帧。

连续滑动主题按时间比例放置节点和文字。跳跃/分段主题使用等宽章节格，但切换时刻仍严格使用章节时间。

保留的经典主题：line、segments、type、fill、cream、burger。其参数沿用上游（例如 mascot: star 或 croissant，image 可替换 cream/burger 贴纸）。紧凑输出与本地编辑器仅支持三款头像主题。
