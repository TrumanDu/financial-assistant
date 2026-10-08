// Jest 环境下的 lottie-web 替身：真实实现会在加载时读取 canvas context，
// 而 jsdom 没有 2D canvas。测试里不播放动画，这里只给出会被调用的方法。
const noop = () => {};

const createAnimation = () => ({
  addEventListener: noop,
  destroy: noop,
  goToAndStop: noop,
  pause: noop,
  play: noop,
  setDirection: noop,
  setSpeed: noop,
  stop: noop,
  updateDocumentData: noop,
});

module.exports = {
  loadAnimation: () => createAnimation(),
  setSubframe: noop,
  version: '0.0.0-test',
};
