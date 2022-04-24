/*
 * @Author: Zhouqi
 * @Date: 2022-04-24 21:49:02
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-24 21:50:05
 */
export let currentRenderInstance = null;

// 设置当前渲染实例
export function setCurrentRenderingInstance(instance) {
  currentRenderInstance = instance;
}
