/*
 * @Author: Zhouqi
 * @Date: 2022-05-03 19:40:14
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-05-05 15:01:03
 */
export const enum PatchFlags {
  // 动态文本节点
  TEXT = 1,
  CLASS = 1 << 1,
  PROPS = 1 << 3,
  UNKEYED_FRAGMENT = 1 << 8,
  NEED_PATCH = 1 << 9,
}
