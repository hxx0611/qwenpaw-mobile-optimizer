// 官方页面索引（C1-b / C2-f 共用）。路径全部来自 bundle 静态提取并逐个实测渲染：
// scripts/probe-routes.py 输出见 memory 2026-10-23 笔记 —— 12 个页面 document.title 均正常、
// 无 404。不要凭印象往这里加路径，加之前先跑 probe-routes.py。

export var PAGES = [
  { key: 'sessions', label: '会话', path: '/sessions', icon: 'MessageOutlined' },
  { key: 'token-usage', label: 'Token 消耗', path: '/token-usage', icon: 'BarChartOutlined' },
  { key: 'files', label: '文件', path: '/files', icon: 'FolderOpenOutlined' },
  { key: 'skills', label: '技能', path: '/skills', icon: 'ThunderboltOutlined' },
  { key: 'mcp', label: 'MCP', path: '/mcp', icon: 'ApiOutlined' },
  { key: 'checkpoints', label: '检查点', path: '/checkpoints', icon: 'HistoryOutlined' },
  { key: 'cron-jobs', label: '定时任务', path: '/cron-jobs', icon: 'ClockCircleOutlined' },
  { key: 'agents', label: '智能体', path: '/agents', icon: 'TeamOutlined' },
  { key: 'security', label: '安全', path: '/security', icon: 'SafetyCertificateOutlined' },
  { key: 'backups', label: '备份', path: '/backups', icon: 'CloudDownloadOutlined' },
  { key: 'environments', label: '环境变量', path: '/environments', icon: 'SettingOutlined' },
  { key: 'debug', label: '调试', path: '/debug', icon: 'BugOutlined' },
];