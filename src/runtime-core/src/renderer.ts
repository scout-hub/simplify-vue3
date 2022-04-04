/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:59:49
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-04 15:21:48
 */
import { createComponentInstance, setupComponent } from "./component";
import { Fragment, Text } from "./vnode";
import { createAppApi } from "./apiCreateApp";
import { effect } from "../../reactivity/src/index";
import { EMPTY_OBJ, ShapeFlags } from "../../shared/src/index";

/**
 * @description: 自定义渲染器
 * @param options 传入的平台渲染方法集合
 */
export function createRenderer(options) {
  return baseCreateRenderer(options);
}

/**
 * @description: 创建基础渲染器函数
 * @param options 传入的平台渲染方法集合
 */
function baseCreateRenderer(options) {
  /**
   * @description: 渲染函数
   * @param vnode 虚拟节点
   * @param container 容器
   */
  function render(vnode, container) {
    // 新的虚拟节点为null，说明是卸载操作
    if (vnode === null) {
    } else {
      patch(container._vnode || null, vnode, container, null);
    }
    // 缓存当前vnode，下一次更新的时候，该值就是旧的vnode
    container._vnode = vnode;
  }

  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
  } = options;

  /**
   * @description: 更新函数
   * @param n1 老的虚拟节点
   * @param n2 新的虚拟节点
   * @param container 容器
   * @param parentComponent 父组件实例
   */
  const patch = (n1, n2, container, parentComponent = null) => {
    if (n1 === n2) {
      return;
    }
    const { shapeFlag, type } = n2;

    switch (type) {
      // 特殊虚拟节点类型处理
      case Fragment:
        // 处理type为Fragment的节点（插槽）
        processFragment(n1, n2, container, parentComponent);
        break;
      case Text:
        processText(n1, n2, container);
        break;
      default:
        // if is element
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // if is component
          processComponent(n1, n2, container, parentComponent);
        }
    }
  };

  /**
   * @description: 处理Fragment节点
   * @param n1 老的虚拟节点
   * @param n2 新的虚拟节点
   * @param container 容器
   * @param parentComponent 父组件实例
   */
  const processFragment = (n1, n2, container, parentComponent) => {
    // 老的虚拟节点不存，则表示创建节点
    if (n1 === null) {
      const { children } = n2;
      mountChildren(children, container, parentComponent);
    }
  };

  /**
   * @description: 处理节点为Text类型的虚拟节点
   * @param  n1 老的虚拟节点
   * @param  n2 新的虚拟节点
   * @param  container 容器
   */
  const processText = (n1, n2, container) => {
    // 老的虚拟节点不存，则表示创建节点
    if (n1 === null) {
      const { children } = n2;
      const el = (n2.el = document.createTextNode(children));
      container.appendChild(el);
    }
  };

  /**
   * @description: 处理组件
   * @param n1 旧的虚拟节点
   * @param n2 新的虚拟节点
   * @param container 容器
   * @param  parentComponent 父组件实例
   */
  const processComponent = (n1, n2, container, parentComponent) => {
    // n1为null表示初始化组件
    if (n1 === null) {
      mountComponent(n2, container, parentComponent);
    } else {
      // TODO 更新组件
      // updateComponent();
    }
  };

  /**
   * @description: 创建元素
   * @param  initialVNode 初始虚拟节点
   * @param  container 容器
   * @param  parentComponent 父组件实例
   */
  const mountComponent = (initialVNode, container, parentComponent) => {
    // 获取组件实例
    const instance = createComponentInstance(initialVNode, parentComponent);
    // 初始化组件
    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container);
  };

  /**
   * @description: 执行渲染和挂载
   * @param  instance 组件实例
   * @param  initialVNode 初始虚拟节点
   * @param  container 容器
   */
  const setupRenderEffect = (instance, initialVNode, container) => {
    // 收集依赖，在依赖的响应式数据变化后可以执行更新
    effect(() => {
      // 通过isMounted判断组件是否创建过，如果没创建过则表示初始化渲染，否则为更新
      if (!instance.isMounted) {
        const subTree = (instance.subTree = instance.render());
        patch(null, subTree, container, instance);
        // 表示组件Dom已经创建完成
        instance.isMounted = true;
        // 到这一步说明元素都已经渲染完成了，也就能够获取到根节点，这里的subTree就是根组件
        initialVNode.el = subTree.el;
      } else {
        // 更新
        const nextTree = instance.render();
        const prevTree = instance.subTree;
        instance.subTree = nextTree;
        patch(prevTree, nextTree, container, instance);
      }
    });
  };

  /**
   * @description: 处理普通元素
   * @param n1 老的虚拟节点
   * @param n2 新的虚拟节点
   * @param container 父容器
   * @param parentComponent 父组件实例
   */
  const processElement = (n1, n2, container, parentComponent) => {
    // 旧的虚拟节点不存在，说明是初始化渲染
    if (n1 === null) {
      mountElement(n2, container, parentComponent);
    } else {
      // 更新
      patchElement(n1, n2);
    }
  };

  /**
   * @description: 更新元素
   * @param n1 旧的虚拟节点
   * @param n2 新的虚拟节点
   */
  const patchElement = (n1, n2) => {
    console.log({
      n1,
      n2,
    });
    // 新的虚拟节点上没有el，需要继承老的虚拟节点上的el
    const el = (n2.el = n1.el);
    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;
    /**
     * props更新的三种情况
     * 1、旧的和新都存在key且新旧值存在但是不一样 —————— 更新属性值
     * 2、新的key上的值不存在 ———— 删除属性
     * 3、旧的key在新的上面不存在 ———— 删除属性
     */
    patchProps(el, n2, oldProps, newProps);
  };

  /**
   * @description: 更新props属性
   * @param el 容器
   * @param n2 新的虚拟节点
   * @param oldProps 旧的props
   * @param newProps 新的props
   */
  const patchProps = (el, n2, oldProps, newProps) => {
    if (oldProps === newProps) return;

    for (const key in newProps) {
      const nextValue = newProps[key];
      const prevValue = oldProps[key];
      if (nextValue !== prevValue) {
        hostPatchProp(el, key, prevValue, nextValue);
      }
    }
    if (oldProps === EMPTY_OBJ) return;

    for (const key in oldProps) {
      // 旧的key在新的中找不到则表示删除
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  };

  /**
   * @description: 生成普通元素
   * @param  vnode 虚拟dom
   * @param  container 父容器
   * @param  parentComponent 父组件实例
   */
  const mountElement = (vnode, container, parentComponent) => {
    const { type, props, children, shapeFlag } = vnode;
    const el = (vnode.el = hostCreateElement(type));
    // 处理children
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 孩子是一个字符串表示文本类型
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el, parentComponent);
    }

    if (props) {
      // 处理props
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    hostInsert(el, container, null);
  };

  /**
   * @description: 递归处理子节点
   * @param children 子节点
   * @param container 父容器
   * @param parentComponent 父组件实例
   */
  const mountChildren = (children, container, parentComponent) => {
    children.forEach((vnode) => {
      patch(null, vnode, container, parentComponent);
    });
  };

  return {
    createApp: createAppApi(render),
  };
}
