// Jest 环境下的 electron-log 替身：只记录调用，不写任何日志文件。
const noop = () => {};

const logger = {
  error: noop,
  warn: noop,
  info: noop,
  verbose: noop,
  debug: noop,
  log: noop,
  transports: { console: {}, file: {} },
};

module.exports = logger;
