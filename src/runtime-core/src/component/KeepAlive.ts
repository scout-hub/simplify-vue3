/*
 * @Author: Zhouqi
 * @Date: 2022-04-16 17:21:02
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-16 21:14:40
 */
import { ShapeFlags } from "../../../shared/src/shapeFlags";
import { onMounted, onUpdated } from "../apiLifecycle";
import { getCurrentInstance } from "../component";

// 判断是否是KeepAlive组件
export const isKeepAlive = (vnode): boolean => vnode.type.__isKeepAlive;

export const KeepAlive = {
  name: "KeepAlive",
  __isKeepAlive: true,
  setup(props, { slots }) {
    // 获取KeepAlive组件实例
    const instance: any = getCurrentInstance();

    // 获取上下文对象ctx
    const sharedContext = instance.ctx;

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
      // 从隐藏容器走移走缓存的DOM，插入到页面中
      move(vnode, container, anchor);
    };

    // 在上下文对象中绑定deactivate方法，在unmount的时候调用进行DOM搬运
    sharedContext.deactivate = (vnode) => {
      // 获取unmount阶段vnode的组件实例，将对应的DOM移入到storageContainer中隐藏。
      move(vnode, storageContainer, null);
      console.log(storageContainer);
    };

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
      } else if (!(vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT)) {
        // 如果vnode不是一个有状态组件的话，则直接返回vnode
        return vnode;
      }

      // 获取组件配置
      const comp = vnode.type;
      const vnodeKey = vnode.key;
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
      }
      // 标记组件的是一个需要被keep-alive的，避免直接unmount的时候被卸载
      vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;
      return vnode;
    };
  },
};
