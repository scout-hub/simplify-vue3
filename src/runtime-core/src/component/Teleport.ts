/*
 * @Author: Zhouqi
 * @Date: 2022-04-17 10:16:39
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-17 10:17:40
 */
// 判断是否是Telepor组件
export const isTeleport = (type: any): boolean => type.__isTeleport;

export const Teleport = {
  __isTeleport: true,
};
