/* eslint-disable react/prop-types */
// Jest 环境下的 echarts-for-react 替身：jsdom 没有 2D canvas，这里不真正渲染，
// 只把每帧传入的 option 收集起来供测试断言。
const captured = [];

function ReactEChartsMock({ option }) {
  captured.push(option);
  return null;
}

module.exports = ReactEChartsMock;
module.exports.default = ReactEChartsMock;
module.exports.capturedOptions = captured;
