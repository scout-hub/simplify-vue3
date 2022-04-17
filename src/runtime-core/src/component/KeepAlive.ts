/*
 * @Author: Zhouqi
 * @Date: 2022-04-16 17:21:02
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-16 22:31:34
 */
import { isArray, isString } from "../../..//shared/src";
import { ShapeFlags } from "../../../shared/src/shapeFlags";
import { onMounted, onUpdated } from "../apiLifecycle";
import { getCurrentInstance } from "../component";

// 判断是否是KeepAlive组件
export const isKeepAlive = (vnode): boolean => vnode.type.__isKeepAlive;

export const KeepAlive = {
  name: "KeepAlive",
  __isKeepAlive: true,

  props: {
    include: [String, RegExp, Array],
    exclude: [String, RegExp, Array],
    max: [String, Number],
  },

  setup(props, { slots }) {
    // 获取KeepAlive组件实例
    const instance: any = getCurrentInstance();

    // 获取上下文对象ctx
    const sharedContext = instance.ctx;

    // 当前渲染的组件vnode
    let current: any = null;

    // 从渲染器中获取DOM操作
    const {
      renderer: {
        p: patch,
        m: move,
        um: _unmount,
        o: { createElement },
      },
    } = sharedContext;

    // 隐藏容器
    const storageContainer = createElement("div");

    // 缓存组件（渲染时）的vnode的容器
    // 键是vnode的type或者用户绑定的key
    // 值是vnode
    const cache = new Map();
    // 管理缓存组件的key
    const keys = new Set();

    // 在上下文对象中绑定activate方法，在patch的时候调用进行DOM搬运
    sharedContext.activate = (vnode, container, anchor) => {
      const instance = vnode.component!;
      // 从隐藏容器走移走缓存的DOM，插入到页面中
      move(vnode, container, anchor);
      // 可能props更新了，这里需要patch一下
      patch(instance.vnode, vnode, container, anchor, instance);
    };

    // 在上下文对象中绑定deactivate方法，在unmount的时候调用进行DOM搬运
    sharedContext.deactivate = (vnode) => {
      // 获取unmount阶段vnode的组件实例，将对应的DOM移入到storageContainer中隐藏。
      move(vnode, storageContainer, null);
    };

    // 缓存组件卸载操作
    function unmount(vnode) {
      // 需要重置vnode类型以便在后面unmount的时候可以正常卸载
      resetShapeFlag(vnode);
      _unmount(vnode, instance);
    }

    // 超出缓存最大数量，根据lru规则淘汰最近最少访问的组件
    function pruneCacheEntry(key) {
      // 获取最近最少访问的组件
      const cached = cache.get(key);
      if (!current || cached.type !== current.type) {
        // 如果当前组件vnode不存在或者需要淘汰的组件不是当前组件，则直接卸载需要淘汰的组件
        unmount(cached);
      } else if (current) {
        // 重置当前组件的vnode的类型，因为可能当前组件就是将要被淘汰的组件，比如max是1的情况下，这个时候不能
        // 立即删除，所以需要重置它的类型以便在后面unmount的时候可以正常卸载
        resetShapeFlag(current);
      }

      // 删除对应缓存的vnode和key
      cache.delete(key);
      keys.delete(key);
    }

    // 组件vnode缓存时的key，由于缓存的时候需要缓存渲染器渲染时的vnode（keep-alive组件渲染后的subTree）
    // 因此不能直接缓存slots获取到的vnode，这里通过定义一个pendingCacheKey来记录当前组件的key，并和渲染时
    // 组件的vnode关联起来。
    let pendingCacheKey = null;
    const cacheSubTree = () => {
      if (pendingCacheKey != null) {
        // 缓存组件的vnode
        cache.set(pendingCacheKey, instance.subTree);
      }
    };

    onMounted(cacheSubTree);
    onUpdated(cacheSubTree);

    // TODO onBeforeUnmount 清空并卸载缓存的所有组件

    return () => {
      pendingCacheKey = null;

      // 没有要渲染的插槽组件则直接返回
      if (!slots.default) {
        return null;
      }

      // 获取默认插槽数据
      const children = slots.default();
      // 要渲染的组件vnode
      const vnode = children[0];

      if (children.length > 1) {
        console.warn("KeepAlive组件内部只允许有一个子组件");
        current = null;
        return children;
      } else if (!(vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT)) {
        current = null;
        // 如果vnode不是一个有状态组件的话，则直接返回vnode
        return vnode;
      }

      const { include, exclude, max } = props;

      // 获取组件配置
      const comp = vnode.type;
      const vnodeKey = vnode.key;

      const name = vnode.type.name;

      // 如果要缓存的组件不在用户定义之内，则不缓存，直接返回vnode
      if (
        (include && (!name || !matches(include, name))) ||
        (exclude && name && matches(exclude, name))
      ) {
        current = vnode;
        return vnode;
      }

      // 获取key
      const key = vnodeKey == null ? comp : vnodeKey;
      // 拿到缓存的vnode
      const cacheVnode = cache.get(key);

      if (cacheVnode) {
        // 如果存在缓存的组件，则取出缓存的组件，将el和组件实例赋值到当前组件的vnode上
        vnode.el = cacheVnode.el;
        vnode.component = cacheVnode.component;

        // 更新组件标志，防止重新mount一次组件
        vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE;

        // 更新最新访问的组件
        keys.delete(key);
        keys.add(key);
      } else {
        pendingCacheKey = key;
        // 没有缓存过当前组件，则加入到缓存中，这里不缓存vnode
        keys.add(key);
        // 如果超出缓存的最大数量，需要移除最近最少访问的组件缓存
        if (max && keys.size > parseInt(max)) {
          // 通过迭代器的next方法获取第一个key，这个key就是最近最少访问的组件key
          const key = keys.values().next().value;
          pruneCacheEntry(key);
        }
      }
      // 标记组件的是一个需要被keep-alive的，避免直接unmount的时候被卸载
      vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;

      current = vnode;
      return vnode;
    };
  },
};

/**
 * @author: Zhouqi
 * @description: 重置vnode的类型
 * @param  vnode 组件的虚拟节点
 */
function resetShapeFlag(vnode) {
  let shapeFlag = vnode.shapeFlag;
  if (shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
    shapeFlag -= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;
  }
  if (shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
    shapeFlag -= ShapeFlags.COMPONENT_KEPT_ALIVE;
  }
  vnode.shapeFlag = shapeFlag;
}

/**
 * @author: Zhouqi
 * @description: 组件名是否匹配
 * include="['a', 'b']"
 * include="/a|b/"
 * include="a,b"
 * @param pattern 匹配表达式
 * @param name 组件名
 * @return 是否匹配
 */
function matches(pattern: any, name: string): boolean {
  // 三种类型：正则、数组、字符串逗号拼接
  if (isArray(pattern)) {
    // 数组
    return pattern.some((p) => matches(p, name));
  } else if (isString(pattern)) {
    // 字符串
    return pattern.split(",").includes(name);
  } else if (pattern.test) {
    // 正则
    return pattern.test(name);
  }
  return false;
}
