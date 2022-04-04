/*
 * @Author: Zhouqi
 * @Date: 2022-03-28 22:34:06
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-03-28 22:38:13
 */
/**
 * @description: 初始化props
 * @param instance 组件实例
 * @param rawProps 初始状态下的props
 */
export function initProps(instance, rawProps) {
  instance.props = rawProps || {};
}
