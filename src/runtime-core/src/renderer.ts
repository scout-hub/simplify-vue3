/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:59:49
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-06 17:15:58
 */
import { createComponentInstance, setupComponent } from "./component";
import { Fragment, isSameVNodeType, Text } from "./vnode";
import { createAppApi } from "./apiCreateApp";
import { ReactiveEffect } from "../../reactivity/src/index";
import { EMPTY_OBJ, invokeArrayFns, ShapeFlags } from "../../shared/src/index";
import { shouldUpdateComponent } from "./componentRenderUtils";
import { flushPostFlushCbs, queueJob, queuePostFlushCb } from "./scheduler";

export const queuePostRenderEffect = queuePostFlushCb;

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
  const render = (vnode, container) => {
    // 新的虚拟节点为null，说明是卸载操作
    if (vnode === null) {
    } else {
      patch(container._vnode || null, vnode, container, null, null);
    }
    // 执行lifecycle hook
    flushPostFlushCbs();
    // 缓存当前vnode，下一次更新的时候，该值就是旧的vnode
    container._vnode = vnode;
  };

  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options;

  /**
   * @description: 更新函数
   * @param n1 老的虚拟节点
   * @param n2 新的虚拟节点
   * @param container 容器
   * @param anchor 锚点元素
   * @param parentComponent 父组件实例
   */
  const patch = (n1, n2, container, anchor, parentComponent) => {
    if (n1 === n2) {
      return;
    }
    const { shapeFlag, type } = n2;

    switch (type) {
      // 特殊虚拟节点类型处理
      case Fragment:
        // 处理type为Fragment的节点（插槽）
        processFragment(n1, n2, container, anchor, parentComponent);
        break;
      case Text:
        processText(n1, n2, container, anchor);
        break;
      default:
        // if is element
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor, parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // if is component
          processComponent(n1, n2, container, anchor, parentComponent);
        }
    }
  };

  /**
   * @description: 处理Fragment节点
   * @param n1 老的虚拟节点
   * @param n2 新的虚拟节点
   * @param container 容器
   * @param anchor 锚点元素
   * @param parentComponent 父组件实例
   */
  const processFragment = (n1, n2, container, anchor, parentComponent) => {
    // 老的虚拟节点不存，则表示创建节点
    if (n1 === null) {
      const { children } = n2;
      mountChildren(children, container, anchor, parentComponent);
    }
  };

  /**
   * @description: 处理节点为Text类型的虚拟节点
   * @param  n1 老的虚拟节点
   * @param  n2 新的虚拟节点
   * @param  container 容器
   * @param  anchor 锚点元素
   */
  const processText = (n1, n2, container, anchor) => {
    // 老的虚拟节点不存，则表示创建节点
    if (n1 === null) {
      const { children } = n2;
      const el = (n2.el = document.createTextNode(children));
      hostInsert(el, container, anchor);
    }
  };

  /**
   * @description: 处理组件
   * @param n1 旧的虚拟节点
   * @param n2 新的虚拟节点
   * @param container 容器
   * @param anchor 锚点元素
   * @param  parentComponent 父组件实例
   */
  const processComponent = (n1, n2, container, anchor, parentComponent) => {
    // n1为null表示初始化组件
    if (n1 === null) {
      mountComponent(n2, container, anchor, parentComponent);
    } else {
      // TODO 更新组件
      updateComponent(n1, n2);
    }
  };

  /**
   * @description: 更新组件
   * @param  n1 老的虚拟节点
   * @return  n2 新的虚拟节点
   */
  const updateComponent = (n1, n2) => {
    const instance = (n2.component = n1.component);
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2;
      instance.update();
    } else {
      n2.el = n1.el;
      instance.vnode = n2;
    }
  };

  /**
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
    // 初始化组件
    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container, anchor);
  };

  /**
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
        const subTree = (instance.subTree = instance.render());
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
        console.log("组件更新了", instance);
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
        const nextTree = instance.render();
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
   * @description: 更新组件上面预渲染的数据
   * @param instance 组件实例
   * @param nextVnode 新的虚拟节点
   */
  const updateComponentPreRender = (instance, nextVnode) => {
    nextVnode.component = instance;
    instance.vnode = nextVnode;
    instance.next = null;
    // updateProps
    instance.props = nextVnode.props;
  };

  /**
   * @description: 处理普通元素
   * @param n1 老的虚拟节点
   * @param n2 新的虚拟节点
   * @param container 父容器
   * @param anchor 锚点元素
   * @param parentComponent 父组件实例
   */
  const processElement = (n1, n2, container, anchor, parentComponent) => {
    // 旧的虚拟节点不存在，说明是初始化渲染
    if (n1 === null) {
      mountElement(n2, container, anchor, parentComponent);
    } else {
      // 更新
      patchElement(n1, n2, parentComponent);
    }
  };

  /**
   * @description: 更新元素
   * @param n1 旧的虚拟节点
   * @param n2 新的虚拟节点
   * @param parentComponent 父组件实例
   */
  const patchElement = (n1, n2, parentComponent) => {
    // 新的虚拟节点上没有el，需要继承老的虚拟节点上的el
    const el = (n2.el = n1.el);

    patchChildren(n1, n2, el, null, parentComponent);

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
   * @description: 更新孩子节点
   * @param n1 旧的虚拟节点
   * @param n2 新的虚拟节点
   * @param container 容器
   * @param anchor 锚点元素
   * @param parentComponent 父组件实例
   */
  const patchChildren = (n1, n2, container, anchor, parentComponent) => {
    const c1 = n1.children;
    const c2 = n2.children;
    const prevShapeFlag = n1 ? n1.shapeFlag : 0;
    const { shapeFlag } = n2;
    // 更新的几种情况
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 1. 新的虚拟节点的子节点是一个文本节点，旧的虚拟节点的子节点是一个数组，则删除旧的节点元素，然后创建新的文本节点
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1);
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
          patchKeyedChildren(c1, c2, container, anchor, parentComponent);
        } else {
          // 4. 新的节点不存在，则删除旧的子节点
          unmountChildren(c1);
        }
      } else {
        // 旧的孩子节点为文本节点。这种情况不管怎样，旧的文本节点都必须清空
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          // 5. 旧的是一个文本节点，新的子节点不存在，将文本清空
          hostSetElementText(container, "");
        }
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 6. 旧的是文本节点，新的是数组节点，则清空文本并创建新的子节点
          mountChildren(c2, container, anchor, parentComponent);
        }
      }
    }
  };

  /**
   * @description: 快速diff算法
   * @param c1 旧的子节点
   * @param c2 新的子节点
   * @param parentAnchor 锚点元素
   * @param container 容器
   * @param parentComponent 父组件实例
   */
  const patchKeyedChildren = (
    c1,
    c2,
    container,
    parentAnchor,
    parentComponent
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
        patch(n1, n2, container, parentAnchor, parentComponent);
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
        patch(n1, n2, container, parentAnchor, parentComponent);
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
        patch(null, c2[i], container, anchor, parentComponent);
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
        hostRemove(c1[i].el);
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

      // 2. 构建一个索引表，存储新数组节点中对应节点在旧数组节点中的位置，用以帮助填充 newIndexToOldIndexMap 数组
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
          hostRemove(oldVnode.el);
          continue;
        }
        let keyIndex;
        // key === undefined || null
        if (oldVnode.key != null) {
          keyIndex = keyToNewIndexMap.get(oldVnode.key);
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
            parentComponent
          );
          // 递增，表示新子节点数组中又更新了一个节点
          patched++;
        } else {
          // 没找到节点，删除
          hostRemove(oldVnode.el);
        }
      }

      // 需要进行DOM移动
      if (moved) {
        // 计算最长递增子序列，得到的结果是最长递增子序列的索引信息
        // 1 (2 3 4 6) 5 ====> 1 (3 4 2 7) 5 索引数组为 [2,3,1,-1]  最长递增子序列为 [2, 3] 子序列索引为 [0, 1]
        // 意思是新子节点数组中下标为0和1的节点不需要移动，其它的可能要移动，因为索引数组和新子节点数组（去除前后置节点）位置是一一对应的
        const increasingNewIndexSequence = getSequence(newIndexToOldIndexMap);
        console.log(increasingNewIndexSequence);
        // 创建两个变量用来遍历increasingNewIndexSequence和新子节点数组（去除前后置节点）
        let seq = increasingNewIndexSequence.length - 1;
        const j = toBePatched - 1;
        for (let i = j; i >= 0; i--) {
          // 1. 找到需要新增的节点
          const pos = i + newStart;
          const newVnode = c2[pos];
          // 2. 找到锚点节点的索引
          const anchor = pos + 1 < l2 ? c2[pos + 1].el : parentAnchor;
          // 3. 挂载
          if (newIndexToOldIndexMap[i] === -1) {
            // 说明是新节点，需要挂载
            patch(null, newVnode, container, anchor, parentComponent);
          } else if (
            newIndexToOldIndexMap[i] !== increasingNewIndexSequence[seq]
          ) {
            // 需要移动节点
            hostInsert(newVnode.el, container, anchor);
          } else {
            // 找到了对应不需要移动的节点，只需要更新seq
            seq--;
          }
        }
      }
    }
  };

  /**
   * @description: 删除数组类型的子节点
   * @param children 孩子节点vnode
   */
  const unmountChildren = (children) => {
    const childrenLength = children.length;
    for (let i = 0; i < childrenLength; i++) {
      hostRemove(children[i].el);
    }
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
   * @param  anchor 锚点元素
   * @param  parentComponent 父组件实例
   */
  const mountElement = (vnode, container, anchor, parentComponent) => {
    const { type, props, children, shapeFlag } = vnode;
    const el = (vnode.el = hostCreateElement(type));
    // 处理children
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 孩子是一个字符串表示文本类型
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el, anchor, parentComponent);
    }

    if (props) {
      // 处理props
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    hostInsert(el, container, anchor);
  };

  /**
   * @description: 递归处理子节点
   * @param children 子节点
   * @param container 父容器
   * @param anchor 锚点元素
   * @param parentComponent 父组件实例
   */
  const mountChildren = (children, container, anchor, parentComponent) => {
    children.forEach((vnode) => {
      patch(null, vnode, container, anchor, parentComponent);
    });
  };

  return {
    createApp: createAppApi(render),
  };
}

/**
 * @description: 最长递增子序列（vue3中的源码）
 * @param 需要计算的数组
 * @return 最长递增序列的递增索引
 */
function getSequence(arr: number[]): number[] {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}
