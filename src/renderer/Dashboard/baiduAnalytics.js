/* eslint-disable */
const baiduAnalyticsRenderer = (siteId, initCallback) => {


  // 添加默认行为避免报错
  window._hmt = window._hmt || [];

  window.electron.ipcRenderer.on('baidu-analytics-electron-reply', (args) => {
    const { text } = args;
    window._hmt = window._hmt || [];

    if (initCallback && typeof initCallback === 'function') {
      initCallback(window._hmt);
    }

    const hm = document.createElement('script');
    hm.text = text;

    const head = document.getElementsByTagName('head')[0];
    head.appendChild(hm);
  });

  window.electron.ipcRenderer.sendMessage(
    'baidu-analytics-electron-message',
    siteId,
  );
};

export default baiduAnalyticsRenderer;
