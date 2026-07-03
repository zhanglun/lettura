# Claude Code 项目配置

## 提交规范

- 使用中文 Conventional Commit 格式：`type(scope): 描述`
- **不要**在提交信息中添加 `Co-Authored-By` 行
- 每个主题独立提交，不要合并不相关的变更

## 注意事项

- 不要提交 `.sisyphus/run-continuation/*.json`
- 生产 SQLite 在 `~/.lettura/lettura.db`，不要执行清库或迁移重建
- 不要恢复 DnD 订阅树
- 用中文沟通
