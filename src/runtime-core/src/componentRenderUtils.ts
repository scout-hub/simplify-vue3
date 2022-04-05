/*
 * @Author: Zhouqi
 * @Date: 2022-04-05 20:00:07
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-05 20:55:03
 */

/**
 * @description: 是否需要更新组件
 * @param n1 旧的虚拟节点
 * @param n2 新的虚拟节点
 */
export function shouldUpdateComponent(n1, n2) {
  const { props: prevProps } = n1;
  const { props: nextProps } = n2;
  for (const key in nextProps) {
    if (nextProps[key] !== prevProps[key]) {
      return true;
    }
  }
  return false;
}
