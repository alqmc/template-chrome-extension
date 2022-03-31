// 生成uuid
export const UUID = (): string => {
  let d = new Date().getTime();
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c === 'x' ? r : (r & 0x7) | 0x8).toString(16);
  });
  return uuid;
};

/**
 * url参数提取
 * @returns
 */
export const getQueryString = (url: string) => {
  // 定义返回结果
  if (url.lastIndexOf('?') !== -1) {
    return url.slice(url.lastIndexOf('?') + 1);
  }
};

/**
 * 广播消息
 * @param EventMessage 数据
 * @param url 目标地址 默认'*'
 */
export const windowPostMessage = (EventMessage: PostMessage, url = '*') => {
  window.postMessage(EventMessage, url);
};
