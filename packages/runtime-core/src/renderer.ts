/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:59:49
 * @LastEditors: Zhouqi
 * @LastEditTime: 2023-04-19 22:20:35
 */
import { createComponentInstance, setupComponent } from "./component";
import {
  Fragment,
  isSameVNodeType,
  Text,
  Comment,
  normalizeVNode,
} from "./vnode";
import { createAppApi } from "./apiCreateApp";
import { ReactiveEffect } from "@simplify-vue/reactivity";
import {
  EMPTY_ARR,
  EMPTY_OBJ,
  invokeArrayFns,
  PatchFlags,
  ShapeFlags,
} from "@simplify-vue/shared";
import {
  renderComponentRoot,
  shouldUpdateComponent,
} from "./componentRenderUtils";
import { flushPostFlushCbs, invalidateJob, queueJob, queuePostFlushCb } from "./scheduler";
import { updateProps } from "./componentProps";
import { updateSlots } from "./componentSlots";
import { isKeepAlive } from "./component/KeepAlive";
import { invokeDirectiveHook } from "./directives";

export const queuePostRenderEffect = queuePostFlushCb;

/**
 * @author: Zhouqi
 * @description: 自定义渲染器
 * @param options 传入的平台渲染方法集合
 */
export function createRenderer(options) {
  return baseCreateRenderer(options);
}

/**
 * @author: Zhouqi
 * @description: 创建基础渲染器函数
 * @param options 传入的平台渲染方法集合
 */
function baseCreateRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
    setText: hostSetText,
    createText: hostCreateText,
    createComment: hostCreateComment,
    nextSibling: hostNextSibling,
    parentNode: hostParentNode,
  } = options;

  /**
   * @author: Zhouqi
   * @description: 更新函数
   * @param n1 老的虚拟节点
   * @param n2 新的虚拟节点
   * @param container 容器
   * @param anchor 锚点元素
   * @param parentComponent 父组件实例
   * @param optimized 是否优化
   */
  const patch = (n1, n2, container, anchor = null, parentComponent, optimized = !!n2.dynamicChildren) => {
    if (n1 === n2) return;

    // 1. 更新的时候可能vnode对应的key是一样的，但是type不一样，这种情况也是需要删除旧的节点
    // 2. 更新组件的时候
    // #fix example slots demo
    if (n1 && !isSameVNodeType(n1, n2)) {
      // 更新锚点元素，因为旧的节点被删除，新的需要创建，创建的位置应该是当前被删除节点的下一个节点之前
      // 因此需要找到当前节点的下一个节点作为锚点节点
      anchor = getNextHostNode(n1);
      unmount(n1, parentComponent);
      n1 = null;
    }

    const { shapeFlag, type } = n2;

    switch (type) {
      // 特殊虚拟节点类型处理
      case Fragment:
        // 处理type为Fragment的节点（插槽）
        processFragment(n1, n2, container, anchor, parentComponent, optimized);
        break;
      case Comment:
        // 处理注释节点
        processCommentNode(n1, n2, container, anchor);
        break;
      case Text:
        // 处理文本节点
        processText(n1, n2, container, anchor);
        break;
      default:
        // if is element
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor, parentComponent, optimized);
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          // 有状态、函数式组件
          processComponent(n1, n2, container, anchor, parentComponent);
        } else if (shapeFlag & ShapeFlags.TELEPORT) {
          type.process(n1, n2, container, anchor, parentComponent, internals);
        }
    }
  };

  /**
   * @author: Zhouqi
   * @description: 处理注释节点
   * @param n1 老的虚拟节点
   * @param n2 新的虚拟节点
   * @param container 容器
   * @param anchor 锚点元素
   */
  const processCommentNode = (n1, n2, container, anchor) => {
    if (n1 === null) {
      const el = (n2.el = hostCreateComment(n2.children));
      hostInsert(el, container, anchor);
    } else {
      // 不支持动态更新注释节点
      n2.el = n1.el;
    }
  };

  /**
   * @author: Zhouqi
   * @description: 处理Fragment节点
   * @param n1 老的虚拟节点
   * @param n2 新的虚拟节点
   * @param container 容器
   * @param anchor 锚点元素
   * @param parentComponent 父组件实例
   * @param optimized 是否优化
   */
  const processFragment = (n1, n2, container, anchor, parentComponent, optimized) => {
    let { patchFlag, dynamicChildren } = n2;

    // #fix: example slots demo when update slot, the new node insertion exception
    // 由于插槽节点在渲染的时候不会创建根标签包裹去插槽节点，导致在更新的时候可能无法正确找到锚点元素
    // 这时候需要我们手动去创建一个空的文本节点去包裹所有的插槽节点。
    const fragmentStartAnchor = (n2.el = n1
      ? n1.el
      : hostCreateComment("fragment start"));
    const fragmentEndAnchor = (n2.anchor = n1
      ? n1.anchor
      : hostCreateComment("fragment end"));
    if (n1 === null) {
      // #fix: example slots demo when update slot, the new node insertion exception
      hostInsert(fragmentStartAnchor, container, anchor);
      hostInsert(fragmentEndAnchor, container, anchor);
      const { children } = n2;
      mountChildren(children, container, fragmentEndAnchor, parentComponent, optimized);
    } else {
      if (
        patchFlag > 0 &&
        patchFlag & PatchFlags.STABLE_FRAGMENT &&
        dynamicChildren
      ) {
        // 稳定的fragment（template root，template v-for）只需要更新patchBlockChildren，不用patchChildren
        patchBlockChildren(
          n1.dynamicChildren,
          dynamicChildren,
          container,
          parentComponent
        );
      } else {
        // 全量更新节点，比如v-for 产生的不稳定的Fragment
        patchChildren(n1, n2, container, fragmentEndAnchor, parentComponent, optimized);
      }
    }
  };

  /**
   * @author: Zhouqi
   * @description: 处理节点为Text类型的虚拟节点
   * @param  n1 老的虚拟节点
   * @param  n2 新的虚拟节点
   * @param  container 容器
   * @param  anchor 锚点元素
   */
  const processText = (n1, n2, container, anchor) => {
    if (n1 === null) {
      // 老的虚拟节点不存，则表示创建节点
      const { children } = n2;
      const el = (n2.el = hostCreateText(children));
      hostInsert(el, container, anchor);
    } else {
      // 更新文本节点
      const el = (n2.el = n1.el);
      if (n1.children !== n2.children) {
        hostSetText(el, n2.children);
      }
    }
  };

  /**
   * @author: Zhouqi
   * @description: 处理组件
   * @param n1 旧的虚拟节点
   * @param n2 新的虚拟节点
   * @param container 容器
   * @param anchor 锚点元素
   * @param  parentComponent 父组件实例
   */
  const processComponent = (n1, n2, container, anchor, parentComponent) => {
    // n1为null表示初始化组件
    if (n1 == null) {
      // 如果组件是keep-alive缓存过的组件，则不需要重新挂载，只需要从隐藏容器中取出缓存过的DOM即可
      if (n2.shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
        parentComponent.ctx.activate(n2, container, anchor);
      } else {
        mountComponent(n2, container, anchor, parentComponent);
      }
    } else {
      // 更新组件
      updateComponent(n1, n2);
    }
  };

  /**
   * @author: Zhouqi
   * @description: 更新组件
   * @param  n1 老的虚拟节点
   * @return  n2 新的虚拟节点
   */
  const updateComponent = (n1, n2) => {
    const instance = (n2.component = n1.component);
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2;
      // 在同一个任务队列中可能存在多个重复更新同一个子组件的任务，为了防止重复更新同一个子组件，这里需要删除后续相同任务。
      // 详见example中的keep-alive示例
      invalidateJob(instance.update);
      instance.update();
    } else {
      n2.el = n1.el;
      instance.vnode = n2;
    }
  };

  /**
   * @author: Zhouqi
   * @description: 创建元素
   * @param  initialVNode 初始虚拟节点
   * @param  container 容器
   * @param  anchor 锚点元素
   * @param  parentComponent 父组件实例
   */
  const mountComponent = (initialVNode, container, anchor, parentComponent) => {
    // 获取组件实例
    const instance = (initialVNode.component = createComponentInstance(
      initialVNode,
      parentComponent
    ));

    // keepalive组件需要为其上下文对象中添加渲染器，渲染器提供一些DOM操作
    if (isKeepAlive(initialVNode)) {
      (instance.ctx as any).renderer = internals;
    }

    // 初始化组件
    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container, anchor);
  };

  /**
   * @author: Zhouqi
   * @description: 执行渲染和更新
   * @param  instance 组件实例
   * @param  initialVNode 初始虚拟节点
   * @param  container 容器
   * @param  anchor 锚点元素
   */
  const setupRenderEffect = (instance, initialVNode, container, anchor) => {
    const componentUpdateFn = () => {
      // 通过isMounted判断组件是否创建过，如果没创建过则表示初始化渲染，否则为更新
      if (!instance.isMounted) {
        const { bm, m } = instance;
        // beforeMount hook
        if (bm) {
          invokeArrayFns(bm);
        }
        const subTree: Record<string, any> = (instance.subTree =
          renderComponentRoot(instance));
        patch(null, subTree, container, anchor, instance);

        // 到这一步说明元素都已经渲染完成了，也就能够获取到根节点，这里的subTree就是根组件
        initialVNode.el = subTree.el;

        // mount hook
        if (m) {
          // invokeArrayFns(m);
          // 加入到pendingPostFlush队列，保证在组件mounted完成后触发
          queuePostRenderEffect(m);
        }

        // 表示组件Dom已经创建完成
        instance.isMounted = true;
      } else {
        // console.log("组件更新了", instance);
        let { next, vnode, bu, u } = instance;
        if (next) {
          // 更新组件的渲染数据
          next.el = vnode.el;
          updateComponentPreRender(instance, next);
        }
        if (bu) {
          invokeArrayFns(bu);
        }
        // 更新
        const nextTree = renderComponentRoot(instance);
        const prevTree = instance.subTree;
        instance.subTree = nextTree;
        patch(prevTree, nextTree, container, anchor, instance);
        // updated hook
        if (u) {
          // invokeArrayFns(u);
          // 保证组件更新完成后触发updated hook
          queuePostRenderEffect(u);
        }
      }
    };
    const effect = new ReactiveEffect(componentUpdateFn, () => {
      // 自定义调度器，当多个同步任务触发更新时，将任务放入微任务队列中，避免多次更新
      queueJob(instance.update);
    });
    const update = (instance.update = effect.run.bind(effect));
    // 收集依赖，在依赖的响应式数据变化后可以执行更新
    update();
  };

  /**
   * @author: Zhouqi
   * @description: 更新组件上面预渲染的数据
   * @param instance 组件实例
   * @param nextVnode 新的虚拟节点
   */
  const updateComponentPreRender = (instance, nextVnode) => {
    nextVnode.component = instance;
    const prevProps = instance.vnode.props;
    instance.vnode = nextVnode;
    instance.next = null;
    // 更新props
    updateProps(instance, nextVnode.props, prevProps);
    // 更新slots
    updateSlots(instance, nextVnode.children);
  };

  /**
   * @author: Zhouqi
   * @description: 处理普通元素
   * @param n1 老的虚拟节点
   * @param n2 新的虚拟节点
   * @param container 父容器
   * @param anchor 锚点元素
   * @param parentComponent 父组件实例
   * @param optimized 是否优化
   */
  const processElement = (n1, n2, container, anchor, parentComponent, optimized) => {
    // 旧的虚拟节点不存在，说明是初始化渲染
    if (n1 === null) {
      mountElement(n2, container, anchor, parentComponent, optimized);
    } else {
      // 更新
      patchElement(n1, n2, parentComponent, optimized);
    }
  };

  /**
   * @author: Zhouqi
   * @description: 更新元素
   * @param n1 旧的虚拟节点
   * @param n2 新的虚拟节点
   * @param parentComponent 父组件实例
   */
  const patchElement = (n1, n2, parentComponent, optimized) => {
    // 新的虚拟节点上没有el，需要继承老的虚拟节点上的el
    const el = (n2.el = n1.el);
    const { dynamicChildren, patchFlag, dirs } = n2;

    if (dirs) {
      // 触发指令钩子函数beforeUpdate
      invokeDirectiveHook(n2, n1, "beforeUpdate");
    }

    // 只diff动态节点，跳过静态节点的diff
    // TODO 先改成 dynamicChildren.length 以保证不影响之前的demo
    if (dynamicChildren && dynamicChildren.length) {
      patchBlockChildren(
        n1.dynamicChildren,
        dynamicChildren,
        el,
        parentComponent
      );
    } else if (!optimized) {
      // 全量diff
      patchChildren(n1, n2, el, null, parentComponent, false);
    }

    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;

    // 标记了对应的动态属性则只更新动态属性，否则全量更新
    if (patchFlag > 0) {
      // class是动态的，需要更新
      if (patchFlag & PatchFlags.CLASS) {
        if (oldProps.class !== newProps.class) {
          hostPatchProp(el, "class", null, newProps.class);
        }
      }

      // 有其他动态属性，需要更新
      if (patchFlag & PatchFlags.PROPS) {
        const dynamicProps = n2.dynamicProps;
        const dynamicPropsLength = dynamicProps.length;
        for (let i = 0; i < dynamicPropsLength; i++) {
          const key = dynamicProps[i];
          const prev = oldProps[key];
          const next = newProps[key];
          if (next !== prev) {
            hostPatchProp(el, key, prev, next);
          }
        }
      }

      // 动态唯一子文本节点更新
      if (patchFlag & PatchFlags.TEXT) {
        if (n1.children !== n2.children) {
          hostSetElementText(el, n2.children as string)
        }
      }
    } else {
      /**
       * props更新的三种情况
       * 1、旧的和新都存在key且新旧值存在但是不一样 —————— 更新属性值
       * 2、新的key上的值不存在 ———— 删除属性
       * 3、旧的key在新的上面不存在 ———— 删除属性
       */
      patchProps(el, n2, oldProps, newProps);
    }

    if (dirs) {
      // 触发指令钩子函数updated
      invokeDirectiveHook(n2, n1, "updated");
    }
  };

  const patchBlockChildren = (
    oldChildren,
    newChildren,
    fallbackContainer,
    parentComponent
  ) => {
    for (let i = 0; i < newChildren.length; i++) {
      const newVNode = newChildren[i];
      const oldVNode = oldChildren[i];
      const container =
        // 节点是一个Fragment片段，如果要进行节点的移动/挂载，需要找到这个节点的父节点去处理，否则会报错
        oldVNode.el && oldVNode.type === Fragment
          ? hostParentNode(oldVNode.el)
          : fallbackContainer;
      patch(oldVNode, newVNode, container, null, parentComponent, true);
    }
  };

  /**
   * @author: Zhouqi
   * @description: 更新孩子节点
   * @param n1 旧的虚拟节点
   * @param n2 新的虚拟节点
   * @param container 容器
   * @param anchor 锚点元素
   * @param parentComponent 父组件实例
   * @param optimized 是否优化
   */
  const patchChildren = (n1, n2, container, anchor, parentComponent, optimized = false) => {
    const c1 = n1.children;
    const c2 = n2.children;
    const prevShapeFlag = n1 ? n1.shapeFlag : 0;
    const { shapeFlag, patchFlag } = n2;

    // fast path
    if (patchFlag > 0) {
      // 处理children节点有key属性的情况（部分有，部分没有也算）
      // 处理children节点没有key属性的情况（先针对v-for没有绑定key的情况）
      if (patchFlag & PatchFlags.KEYED_FRAGMENT) {
        patchKeyedChildren(c1, c2, container, anchor, parentComponent, optimized);
        return;
      } else if (patchFlag & PatchFlags.UNKEYED_FRAGMENT) {
        // unkeyed
        patchUnkeyedChildren(c1, c2, container, anchor, parentComponent, optimized);
        return;
      }
    }

    // 更新的几种情况
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 1. 新的虚拟节点的子节点是一个文本节点，旧的虚拟节点的子节点是一个数组，则删除旧的节点元素，然后创建新的文本节点
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1, parentComponent);
      }
      // 2. 旧的虚拟节点也是一个文本节点，但是文本内容不同，此时只需要更新文本内容
      if (c1 !== c2) {
        hostSetElementText(container, c2);
      }
    } else {
      // 走进这里说明新的孩子节点不存在或者是数组类型
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 3. 新旧孩子节点都是数组的情况下需要进行 dom diff，这种情况也是最复杂的
          patchKeyedChildren(c1, c2, container, anchor, parentComponent, optimized);
        } else {
          // 4. 新的节点不存在，则删除旧的子节点
          unmountChildren(c1, parentComponent);
        }
      } else {
        // 旧的孩子节点为文本节点。这种情况不管怎样，旧的文本节点都必须清空
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          // 5. 旧的是一个文本节点，新的子节点不存在，将文本清空
          hostSetElementText(container, "");
        }
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 6. 旧的是文本节点，新的是数组节点，则清空文本并创建新的子节点
          mountChildren(c2, container, anchor, parentComponent, optimized);
        }
      }
    }
  };

  /**
   * @author: Zhouqi
   * @description: 更新没有绑定过key属性的动态节点
   * @param c1 旧的子节点
   * @param c2 新的子节点
   * @param parentAnchor 锚点元素
   * @param container 容器
   * @param parentComponent 父组件实例
   * @param optimized 是否优化
   */
  const patchUnkeyedChildren = (c1, c2, container, anchor, parentComponent, optimized) => {
    // TODO optimized优化，对原节点进行克隆，以避免重新normalizeVNode带来的消耗
    const oldLen = c1.length;
    const newLen = c2.length;
    const minLen = Math.min(oldLen, newLen);
    for (let i = 0; i < minLen; i++) {
      const newChild = normalizeVNode(c2[i]);
      patch(c1[i], newChild, container, null, parentComponent, optimized);
    }
    // 说明有新增的节点，需要新增
    if (oldLen < newLen) {
      mountChildren(c2, container, anchor, parentComponent, optimized, minLen);
    } else {
      // 说明有要删除的节点
      unmountChildren(c1, parentComponent, minLen);
    }
  };

  /**
   * @author: Zhouqi
   * @description: 快速diff算法
   * @param c1 旧的子节点
   * @param c2 新的子节点
   * @param parentAnchor 锚点元素
   * @param container 容器
   * @param parentComponent 父组件实例
   * @param optimized 是否优化
   */
  const patchKeyedChildren = (
    c1,
    c2,
    container,
    parentAnchor,
    parentComponent,
    optimized
  ) => {
    // 快速diff算法的几种情况
    /**
     * 1. 相同前置节点
     * (a b) c
     * (a b) d e
     */
    const l2 = c2.length;
    let i = 0;
    let oldEnd = c1.length - 1;
    let newEnd = l2 - 1;
    while (i <= oldEnd && i <= newEnd) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentAnchor, parentComponent, optimized);
      } else {
        break;
      }
      i++;
    }
    /**
     * 3. 相同后置节点
     * a (b c)
     * d e (b c)
     */
    while (i <= newEnd && i <= oldEnd) {
      const n1 = c1[oldEnd];
      const n2 = c2[newEnd];
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentAnchor, parentComponent, optimized);
      } else {
        break;
      }
      oldEnd--;
      newEnd--;
    }

    // 判断有新增节点的两个依据
    // 1、i > oldEnd：这个条件成立说明旧的子节点已经全部遍历完毕
    // 2、i <= newEnd：这个条件成立说明新的子节点还有没有遍历的，这些节点就是新增的节点
    if (i > oldEnd && i <= newEnd) {
      /**
       * 取出i到newEnd之间的元素，这些元素为需要新增的元素
       * 接下去就需要找到这些元素添加的位置，即找到一个锚点元素提供节点操作的帮助
       * 1. (a b) (e) ====> (a b) c (e) ：c是需要新增的节点，c要插入到e节点的前面，所以e是锚点元素，e节点的索引为 newEnd+1
       * 2. (a b) ====> (a b) c ：c是需要新增的节点，c排在新的子节点数组中的最后一位，所以只需要添加到尾部即可，判断条件是newEnd+1 >= c2.length
       */
      // 锚点索引
      const anchorIndex = newEnd + 1;
      // 锚点元素
      const anchor = anchorIndex < l2 ? c2[anchorIndex].el : parentAnchor;
      while (i <= newEnd) {
        patch(null, c2[i], container, anchor, parentComponent, optimized);
        i++;
      }
    }
    // 判断需要删除节点的两个依据
    // 1、i > newEnd：这个条件成立说明新的子节点已经全部遍历完毕
    // 2、i <= oldEnd：这个条件成立说明旧的子节点还有没有遍历的，这些节点就是需要删除的节点
    else if (i > newEnd && i <= oldEnd) {
      /**
       * 取出i到oldEnd之间的元素，这些元素为需要删除的元素
       * (a) b c (d) ====> (a) (d) ：b、c是需要删除的节点
       */
      while (i <= oldEnd) {
        unmount(c1[i], parentAnchor);
        i++;
      }
    }
    // 上面都是理想情况下的处理
    // 当排除相容前置和后置节点后，中间部分的情况比较复杂时需要额外的处理
    else {
      /**
       * (a) b c d f (e) =====> (a) c d b g (e)  比如这种情况，头尾只有一个元素相同，中间有相同节点但位置不一样，并且有需要删除的节点也有需要新增的节点
       * 无论情况有多复杂，最终需要知道两个点
       * 1、找到需要移动的节点以及如何移动
       * 2、找到需要被添加或者删除的节点
       */

      // 1. 构建一个新的数组 newIndexToOldIndexMap，这个数组初始化长度为新的子节点数组中未遍历到的节点数量，初始值为-1。
      // 这个数组的作用是存储新数组节点中未遍历到的节点在老数组节点中对应的索引位置，以便计算出它的最长递增子序列来帮助dom操作
      // 新子节点数组中未遍历到的节点数量为 遍历到尾部索引的newEnd 减去 遍历到头部的索引 i 之后 加1，即length = newEnd - i + 1

      // 需要更新的节点数量
      const toBePatched = newEnd - i + 1;
      const newIndexToOldIndexMap = new Array(toBePatched).fill(-1);

      // 2. 构建一个索引表，构建新数组节点中对应key的索引位置，用以辅助填充 newIndexToOldIndexMap 数组
      const newStart = i;
      const oldStart = i;
      const keyToNewIndexMap = new Map();
      for (let i = newStart; i <= newEnd; i++) {
        keyToNewIndexMap.set(c2[i].key, i);
      }

      // 3. 填充newIndexToOldIndexMap，并找到需要移动和删除的节点
      // 元素是否需要移动的判断：
      // 当前遍历到的旧的子节点在新子节点数组中的索引位置是否大于已经遍历过的索引位置最大的节点（是否是递增关系），如果呈递增关系，则不需要移动，反之需要移动节点
      // 例如： 1 2 4 3 ====> 1 3 2 4
      // 1、首先初始化最大索引值pos=0，第一次遍历旧子节点数组，找到2这个节点在新子节点数组中的索引位置为2，2 > 0（递增），所以2不用移动，pos=2
      // 2、第二次遍历旧子节点数组，找到4这个节点在新子节点数组中的索引位置为3，3 > 2（递增），所以4不用移动，pos=3
      // 3、第三次遍历旧子节点数组，找到3这个节点在新子节点数组中的索引位置为1，1 < 3（递减），所以3需要移动，pos不变

      // 判断DOM是否需要移动
      let moved = false;
      // 存储旧子节点在新子节点数组中的最大索引值
      let maxNewIndexSoFar = 0;
      // 记录已经更新过的子节点
      let patched = 0;

      for (let i = oldStart; i <= oldEnd; i++) {
        const oldVnode = c1[i];
        // 当已经更新过的子节点数量大于需要遍历的新子节点数组时，表示旧节点数量大于新节点数量，需要删除

        if (patched >= toBePatched) {
          unmount(oldVnode, parentComponent);
          continue;
        }
        let keyIndex;
        // key === undefined || null
        if (oldVnode.key != null) {
          /**
           * 注意：
           * 这里其实只是去查找了对应key相同的节点，但是新旧节点的type可能是不一样的，因此还是需要经历删除再创建的过程，并不是直接更新节点
           * 这一步删除再创建是在patch里面进行的（源码）
           */
          keyIndex = keyToNewIndexMap.get(oldVnode.key);
          // 为什么不在这里处理？
          // if (c2[keyIndex].type !== oldVnode.type) {
          //   keyIndex = undefined;
          //   console.log(keyIndex);
          // }
        } else {
          // 如果用户没有传入key，则需要再加一层循环去寻找节点（传入key的重要性，避免O(n²)的时间复杂度）
          for (let j = newStart; j <= newEnd; j++) {
            if (isSameVNodeType(oldVnode, c2[j])) {
              keyIndex = j;
              break;
            }
          }
        }
        if (keyIndex !== undefined) {
          newIndexToOldIndexMap[keyIndex - newStart] = i;
          if (keyIndex >= maxNewIndexSoFar) {
            // 递增关系，不需要移动，重新赋值maxNewIndexSoFar
            maxNewIndexSoFar = keyIndex;
          } else {
            // 表示DOM需要移动
            moved = true;
          }
          // 找到了节点，更新
          patch(
            oldVnode,
            c2[keyIndex],
            container,
            parentAnchor,
            parentComponent,
            optimized
          );
          // 递增，表示新子节点数组中又更新了一个节点
          patched++;
        } else {
          // 没找到节点，删除
          unmount(oldVnode, parentComponent);
        }
      }

      // 需要进行DOM移动和DOM创建的情况
      // 计算最长递增子序列，得到的结果是最长递增子序列的索引信息
      // 1 (2 3 4 6) 5 ====> 1 (3 4 2 7) 5 索引数组为 [2,3,1,-1]  最长递增子序列为 [2, 3] 子序列索引为 [0, 1]
      // 意思是新子节点数组中下标为0和1的节点不需要移动，其它的可能要移动，因为索引数组和新子节点数组（去除前后置节点）位置是一一对应的
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : EMPTY_ARR;
      // 创建两个变量用来遍历increasingNewIndexSequence和新子节点数组（去除前后置节点）
      let seq = increasingNewIndexSequence.length - 1;
      const j = toBePatched - 1;
      // 这里进行倒序处理，保证后面的节点先被处理。因为这里可能存在节点的移动，移动的时候需要找到锚点节点
      // 也就是当前节点的下一个节点，因此我们要确保锚点节点一定是稳定的，不会变动，所以这里从后往前进行
      // 节点遍历处理
      for (let i = j; i >= 0; i--) {
        // 1. 找到需要新增的节点
        const pos = i + newStart;
        const newVnode = c2[pos];
        // 2. 找到锚点节点的索引
        const anchor = pos + 1 < l2 ? c2[pos + 1].el : parentAnchor;
        // 3. 挂载
        if (newIndexToOldIndexMap[i] === -1) {
          // 索引为-1说明没有在老的里面找到对应的节点，说明是新节点，需要挂载
          patch(null, newVnode, container, anchor, parentComponent, optimized);
        } else if (moved) {
          // 需要移动的情况：
          // 1、没有最长递增子序列元素可以遍历了（j<0）
          // 2、最长递增子序列对应的元素索引和当前遍历到的元素的索引不一样（i !== increasingNewIndexSequence[seq]）
          if (j < 0 || i !== increasingNewIndexSequence[seq]) {
            // 需要移动节点
            move(newVnode, container, anchor);
          } else {
            // 找到了对应不需要移动的节点，只需要更新seq
            seq--;
          }
        }
      }
    }
  };

  /**
   * @author: Zhouqi
   * @description: 移动节点
   * @param vnode 需要移动的vnode
   * @param container 容器
   * @param anchor 锚点节点
   */
  const move = (vnode, container, anchor) => {
    const { type } = vnode;
    // TODO Fragment类型的移动
    if (type === Fragment) {
      //
      return;
    }
    hostInsert(vnode.el, container, anchor);
  };

  /**
   * @author: Zhouqi
   * @description: 删除数组类型的子节点
   * @param children 孩子节点vnode
   * @param parentComponent 父组件实例
   * @param start children子节点起始遍历的位置
   */
  const unmountChildren = (children, parentComponent, start = 0) => {
    const childrenLength = children.length;
    for (let i = start; i < childrenLength; i++) {
      unmount(children[i], parentComponent);
    }
  };

  /**
   * @author: Zhouqi
   * @description: 更新props属性
   * @param el 容器
   * @param vnode 新的虚拟节点
   * @param oldProps 旧的props
   * @param newProps 新的props
   */
  const patchProps = (el, vnode, oldProps, newProps) => {
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
   * @author: Zhouqi
   * @description: 生成普通元素
   * @param  vnode 虚拟dom
   * @param  container 父容器
   * @param  anchor 锚点元素
   * @param  parentComponent 父组件实例
   */
  const mountElement = (vnode, container, anchor, parentComponent, optimized) => {
    const { type, props, children, shapeFlag, transition, dirs } = vnode;
    const el = (vnode.el = hostCreateElement(type));
    // 处理children
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 孩子是一个字符串表示文本类型
      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 处理数组类型的孩子节点
      // #fix bug example defineAsyncComponent 新建子节点的时候不需要锚点元素
      // mountChildren(children, el, anchor, parentComponent);
      mountChildren(children, el, null, parentComponent, optimized);
    }

    // 指令
    if (dirs) {
      invokeDirectiveHook(vnode, null, "created");
    }

    if (props) {
      // 处理props
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }

    // 动画
    if (transition) {
      transition.beforeEnter(el);
    }

    // 指令
    if (dirs) {
      // 触发指令钩子函数beforeMount
      invokeDirectiveHook(vnode, null, "beforeMount");
    }
    hostInsert(el, container, anchor);

    // 指令
    if (dirs) {
      invokeDirectiveHook(vnode, null, "mounted");
    }

    if (transition) {
      queuePostRenderEffect(() => {
        transition.enter(el);
      });
    }
  };

  /**
   * @author: Zhouqi
   * @description: 递归处理子节点
   * @param children 子节点
   * @param container 父容器
   * @param anchor 锚点元素
   * @param parentComponent 父组件实例
   * @param start children子节点起始遍历的位置
   * @param optimized 是否优化
   */
  const mountChildren = (
    children,
    container,
    anchor,
    parentComponent,
    optimized,
    start = 0
  ) => {
    for (let i = start; i < children.length; i++) {
      patch(null, children[i], container, anchor, parentComponent, optimized);
    }
  };

  /**
   * @author: Zhouqi
   * @description: 渲染函数
   * @param vnode 虚拟节点
   * @param container 容器
   */
  const render = (vnode, container) => {
    // 新的虚拟节点为null，说明是卸载操作
    if (vnode === null && container._vnode) {
      unmount(container._vnode, null);
    } else {
      patch(container._vnode || null, vnode, container, null, null);
    }
    // 执行lifecycle hook
    flushPostFlushCbs();
    // 缓存当前vnode，下一次更新的时候，该值就是旧的vnode
    container._vnode = vnode;
  };

  /**
   * @author: Zhouqi
   * @description: 组件卸载
   * @param vnode 老的虚拟节点
   * @param parentComponent 父组件实例
   */
  const unmount = (vnode, parentComponent) => {
    const { shapeFlag, component, children } = vnode;

    // 如果是需要缓存的组件，需要调用deactivate放入隐藏容器中缓存
    if (shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
      parentComponent.ctx.deactivate(vnode);
      return;
    }
    if (shapeFlag & ShapeFlags.COMPONENT) {
      // 销毁组件
      unmountComponent(component);
    } else {
      if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 销毁子节点
        unmountChildren(children, parentComponent);
      }
      // 销毁元素
      remove(vnode);
    }
  };

  /**
   * @author: Zhouqi
   * @description: 删除元素节点
   * @param vnode 虚拟节点
   */
  const remove = (vnode) => {
    const { el, transition } = vnode;
    if (transition) {
      const { leave } = transition;
      leave(el, hostRemove);
    } else {
      hostRemove(el);
    }
  };

  /**
   * @author: Zhouqi
   * @description: 卸载组件
   * @param instance 组件实例
   */
  const unmountComponent = (instance) => {
    const { um, bum, subTree } = instance;

    // beforeUnmount hook
    if (bum) {
      invokeArrayFns(bum);
    }

    // 递归卸载子节点
    unmount(subTree, instance);

    // unmounted hook
    if (um) {
      queuePostRenderEffect(um);
    }
  };

  /**
   * @author: Zhouqi
   * @description: 找到当前真实节点的下一个节点
   * @param vnode 虚拟节点
   * @return 当前真实节点的下一个节点
   */
  const getNextHostNode = (vnode) => {
    return hostNextSibling(vnode.anchor || vnode.el);
  };

  const internals = {
    p: patch,
    um: unmount,
    m: move,
    o: options,
    mc: mountChildren,
    pc: patchChildren,
  };

  return {
    render,
    createApp: createAppApi(render),
  };
}

/**
 * @author: Zhouqi
 * @description: 最长递增子序列
 * @return 最长递增序列的递增索引
 */
const getSequence = (arr: number[]): number[] => {
  // 用于回溯的数组，记录的是比当前数小的前一个数的下标
  let temp = Array(arr.length);
  // 初始结果默认第一个为0，记录的是arr中数据对应的下标
  let result = [0];
  for (let i = 0; i < arr.length; i++) {
    const num = arr[i];
    if (num > 0) {
      let j = result[result.length - 1];
      // 如果当前遍历到的数字比结果中最后一个值对应的数字还要大，则直接将下标添加到result末尾
      if (num > arr[j]) {
        // j就是比当前这个数小的前一个数的索引，记录它（为了最后修正下标）
        temp[i] = j;
        // 这里记录的是索引
        result.push(i);
        continue;
      }
      // 用二分法查找比当前这个数要大的第一个数的位置并替换它
      let left = 0;
      let right = result.length - 1;
      while (left < right) {
        const mid = (left + right) >> 1;
        if (arr[result[mid]] < num) {
          left = mid + 1;
        } else {
          right = mid;
        }
      }
      // 最终left === right
      // 判断找到的数是不是比当前这个数大
      if (arr[result[left]] > num) {
        if (left > 0) {
          // left - 1就是比当前这个数小的前一个数的索引，记录它
          temp[i] = result[left - 1];
        }
        result[left] = i;
      }
    }
  }
  // 回溯，修正下标
  let resultLen = result.length;
  let k = result[resultLen - 1];
  while (resultLen-- > 0) {
    result[resultLen] = k;
    k = temp[k];
  }
  return result;
};
