// Jest 环境下的 @mdx-js/mdx 替身：semi 的 MarkdownRender 会在模块加载时就
// require 它，而该包是 ESM-only，jest 默认不转换 node_modules。
// 测试里不会真正渲染 Markdown，这里只提供会被调用到的导出。
module.exports = {
  compile: async () => ({ value: '' }),
  compileSync: () => ({ value: '' }),
  evaluate: async () => ({ default: () => null }),
  evaluateSync: () => ({ default: () => null }),
  run: async () => ({}),
  runSync: () => ({}),
  createProcessor: () => ({}),
  nodeTypes: [],
};
