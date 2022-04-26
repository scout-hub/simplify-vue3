/*
 * @Author: Zhouqi
 * @Date: 2022-04-17 10:16:39
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-26 09:41:39
 */
import { ShapeFlags } from "@simplify-vue/shared";

// 判断是否是Telepor组件
export const isTeleport = (type: any): boolean => type.__isTeleport;

// 判断是否设置了disabled属性
const isTeleportDisabled = (props): boolean =>
  props && (props.disabled || props.disabled === "");

export const Teleport = {
  __isTeleport: true,

  // 将teleport的渲染逻辑抽离到这个方法上，避免渲染器代码过多，并且当不用teleport时也利于treeshaking机制，在生成bundle过程中将其逻辑删除
  process(n1, n2, container, anchor, parentComponent, internals) {
    const {
      mc: mountChildren,
      pc: patchChildren,
      o: { insert, querySelector, createComment },
    } = internals;

    const { props, shapeFlag, children } = n2;

    const disabled = isTeleportDisabled(props);

    if (n1 == null) {
      // 挂载
      // 同fragment节点，teleport组件本身不渲染任何元素，只是渲染插槽内的元素，因此需要建立锚点节点，防止更新的时候
      // 找不到锚点节点导致元素插入位置不对
      const startAnchor = (n2.el = createComment("teleport start"));
      const endAnchor = (n2.anchor = createComment("teleport end"));

      // 将锚点插入到原本的容器中
      insert(startAnchor, container, anchor);
      insert(endAnchor, container, anchor);

      // 找到要挂载到的目标节点
      const target = (n2.target = querySelector(props.to));

      // 定义挂载函数
      const mount = (container, anchor) => {
        // Teleport的子组件一定是Children类型的
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(children, container, anchor, parentComponent);
        }
      };

      if (disabled) {
        // 禁用条件下依旧渲染到原来的位置
        mount(container, endAnchor);
      } else if (target) {
        mount(target, null);
      }
    } else {
      // 更新
      n2.el = n1.el;
      const mainAnchor = (n2.anchor = n1.anchor);
      const target = (n2.target = n1.target)!;
      const targetAnchor = (n2.targetAnchor = n1.targetAnchor)!;
      const hasDisabled = isTeleportDisabled(n1.props);
      // 根据disabled属性获取对应的容器和锚点节点
      const currentContainer = hasDisabled ? container : target;
      const currentAnchor = hasDisabled ? mainAnchor : targetAnchor;

      // 进行节点更新
      patchChildren(n1, n2, currentContainer, currentAnchor, parentComponent);

      if (disabled) {
        // 如果之前是将插槽渲染到指定位置，现在不是的话，需要把插槽节点从指定位置移到原本位置
        if (!hasDisabled) {
          moveTeleport(n2, container, mainAnchor, internals);
        }
      } else {
        const { props: oldProps } = n1;
        const { props: newProps } = n2;

        // 指定位置的源变了，需要进行移动
        if ((newProps && newProps.to) !== (oldProps && oldProps.to)) {
          // 找到新的源
          const nextTarget = (n2.target = querySelector(newProps.to));
          nextTarget && moveTeleport(n2, nextTarget, null, internals);
        } else if (hasDisabled) {
          // 如果之前是将插槽节点渲染到原本位置，现在不是的话，需要把节点从原本位置移动到指定位置
          moveTeleport(n2, target, targetAnchor, internals);
        }
      }
    }
  },
};

/**
 * @author: Zhouqi
 * @description: 移动节点
 * @param vnode 新的虚拟节点
 * @param container 容器
 * @param parentAnchor 锚点
 * @param internals dom操作集合
 */
function moveTeleport(vnode, container, parentAnchor, internals) {
  const { shapeFlag, children } = vnode;
  const { m: move } = internals;

  // 将子节点全部移动过去
  const length = children.length;
  if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    for (let i = 0; i < length; i++) {
      move(children[i], container, parentAnchor);
    }
  }
}
