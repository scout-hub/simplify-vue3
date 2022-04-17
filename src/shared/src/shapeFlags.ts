/*
 * @Author: Zhouqi
 * @Date: 2022-03-27 15:12:52
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-17 10:15:34
 */
/**
 * 用二进制表示组件类型，在判断组件类型和修改类型的时候通过位运算的方式去判断或者比较，性能更优，但是代码可读性相对更低
 *
 * | 运算 同位置上都为0才为0，否则为1
 * & 运算 同位置上都为1才为1，否则为0
 *
 * 0001 | 0000 = 0001; 0000 | 0000 = 0000; 0100 | 0001 = 0101
 * 0001 & 0001 = 0001; 0000 | 0001 = 0000; 0100 & 0101 = 0100
 *
 * 在修改vnode类型的时候可以用 | 运算，在查找vnode类型的时候可以用 & 运算
 */
export const enum ShapeFlags {
  ELEMENT = 1, // 0000000001
  FUNCTIONAL_COMPONENT = 1 << 1, // 0000000010
  STATEFUL_COMPONENT = 1 << 2, // 0000000100
  TEXT_CHILDREN = 1 << 3, // 0000001000
  ARRAY_CHILDREN = 1 << 4, // 0000010000
  SLOTS_CHILDREN = 1 << 5, // 0000100000
  TELEPORT = 1 << 6, // 0001000000
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8, // 0100000000
  COMPONENT_KEPT_ALIVE = 1 << 9, // 1000000000
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT, // 0000000110
}
