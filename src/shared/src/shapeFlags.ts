/*
 * @Author: Zhouqi
 * @Date: 2022-03-27 15:12:52
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-06 17:24:36
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
  ELEMENT = 1, // 000001
  FUNCTIONAL_COMPONENT = 1 << 1, // 000010
  STATEFUL_COMPONENT = 1 << 2, // 000100
  TEXT_CHILDREN = 1 << 3, // 001000
  ARRAY_CHILDREN = 1 << 4, // 010000
  SLOTS_CHILDREN = 1 << 5, // 100000
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT,
}
