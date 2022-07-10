/*
 * @Author: Zhouqi
 * @Date: 2022-03-20 20:52:58
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-07-10 22:08:27
 */
import { extend, isArray, isMap } from "@simplify-vue/shared";
import {
  createDep,
  Dep,
  finalizeDepMarkers,
  initDepMarkers,
  newTracked,
  wasTracked,
} from "./dep";
import { TriggerOpTypes } from "./operations";

interface RectiveEffectOptions {
  onStop?: Function;
  scheduler?: Function;
  lazy?: boolean;
}

interface ReactiveEffectRunner {
  _effect: ReactiveEffect;
}

// 最大深度
const maxMarkerBits = 30;

export const ITERATE_KEY = Symbol("iterate");
export const MAP_KEY_ITERATE_KEY = Symbol("Map key iterate");

export class ReactiveEffect {
  deps: Dep[] = [];
  onStop?: Function;
  private active = true;

  constructor(public effectFn, public scheduler?) {}

  run() {
    try {
      activeEffect = this;
      activeEffectStack.push(this);
      /**
     * 下面是3.2之前的做法，3.2之后有所改动，不是全部清除，而是根据bit位和effect深度比较
     * 
     * cleanupEffect的作用是清除当前ReactiveEffect所关联的deps，即响应式对象key对应的Set依赖集合
     * effectFn = () => {
        // user.ok为false时，user.name始终应该是123，即使user.age发生改变也不应该触发副作用函数执行
        user.name = user.ok ? user.age : "123";
       };
       当user.ok变成false时会触发副作用函数，此时会清空ok、age上面的依赖，并且重新收集ok的依赖，
       由于三元表达式的结果，age不会收集依赖，因此即使修改user.age也不再会触发副作用函数执行。
     */
      /**
       * 比如第一层的effect，effectTrackDepth就是1，trackOpBit就是10；
       * 嵌套的第二层effect，effectTrackDepth就是2，trackOpBit就是100；
       * 嵌套的第三层effect，effectTrackDepth就是3，trackOpBit就是1000；
       */
      trackOpBit = 1 << ++effectTrackDepth;
      // 还没有超过最大层级限定，更新deps最新收集的标记
      if (effectTrackDepth <= maxMarkerBits) {
        initDepMarkers(this);
      } else {
        // 超过最大深度，清空所有依赖
        cleanupEffect(this);
      }
      const result = this.effectFn();
      activeEffectStack.pop();
      activeEffect = activeEffectStack[activeEffectStack.length - 1];
      // activeEffect = undefined
      return result;
    } finally {
      // 重置dep标记位并处理过期依赖
      if (effectTrackDepth <= maxMarkerBits) {
        finalizeDepMarkers(this);
      }
    }
  }

  stop() {
    // active用于防止重复调用stop
    if (this.active) {
      // 移除依赖
      cleanupEffect(this);
      this.onStop && this.onStop();
      this.active = false;
    }
  }
}

// 找到所有依赖这个 effect 的响应式对象，从这些响应式对象里面把 effect 给删除掉
function cleanupEffect(effect: ReactiveEffect) {
  const { deps } = effect;
  for (let i = 0; i < deps.length; i++) {
    const dep = deps[i];
    dep.delete(effect);
  }
  deps.length = 0;
}

let activeEffect: ReactiveEffect | undefined;
/**
 * 收集当前正在使用的ReactiveEffect，在嵌套effect的情况下，每一个effect执行
 * 时内部的ReactiveEffect是不同的。建立activeEffectStack是为了能够在对应的
 * effect函数执行时收集到正确的activeEffect。
 *
 * effect(() => {
 *     effect(() => {
 *       执行逻辑
 *     });
 *     执行逻辑
 *   });
 *
 * 执行过程：
 * 外层effect执行 ---> activeEffect=当前effect内部创建的ReactiveEffect
 * 并且被收集到activeEffectStack中 ---> 内部effect执行 ---> activeEffect=当前effect
 * 内部创建的ReactiveEffect并且被收集到activeEffectStack中 ---> 内部effect执行完成，
 * activeEffectStack弹出栈顶的ReactiveEffect，此时栈顶的ReactiveEffect对应外层effect，
 * 取出后赋值给当前的activeEffect
 */
const activeEffectStack: Array<any> = [];

let shouldTrack = true;

// 能否能进行依赖收集
export function canTrack(): boolean {
  return !!(shouldTrack && activeEffect);
}

// 暂停依赖追踪
export function pauseTracking() {
  shouldTrack = false;
}

// 恢复依赖追踪
export function resetTracking() {
  shouldTrack = true;
}

/**
 * options:{
 *    scheduler: 用户自定义的调度器函数
 *    onStop: 清除响应式时触发回调函数;
 *    lazy: 是否懒执行，即第一次不执行fn
 * }
 */
export function effect(effectFn: Function, options: RectiveEffectOptions = {}) {
  const _effect = new ReactiveEffect(effectFn, options.scheduler);
  options && extend(_effect, options);
  // 如果不是懒执行，则执行一次副作用函数
  if (!options.lazy) _effect.run();
  const runner: any = _effect.run.bind(_effect);
  runner._effect = _effect;
  return runner;
}

/**
 * WeackMap{
 *    target: Map{
 *        key: Set(effectFn)
 *    }
 * }
 * 这里使用WeakMap是因为当target引用对象被销毁时，它所建立的依赖关系其实已经没有存在的必要了
 * 可以被辣鸡回收机制回收
 */
const targetMap = new WeakMap();

// 标记effect的层级
let effectTrackDepth = 0;

// 操作位
export let trackOpBit = 1;

// 依赖收集函数
export function track(target: object, key: unknown) {
  // if (!activeEffect) return;
  if (!canTrack()) return;
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = createDep()));
  }
  trackEffects(dep);
}

// 抽离收集依赖公共逻辑
export function trackEffects(dep: Dep) {
  // 判断依赖是否需要重新被收集
  let shouldTrack = false;
  if (effectTrackDepth <= maxMarkerBits) {
    // 不是最新收集的，
    if (!newTracked(dep)) {
      dep.n |= trackOpBit;
      // 判断是否已经被收集过
      shouldTrack = !wasTracked(dep);
    }
  } else {
    // 全量cleanup模式下的处理
    shouldTrack = !dep.has(activeEffect!);
  }
  if (shouldTrack) {
    dep.add(activeEffect!);
    activeEffect!.deps.push(dep);
  }
}

// 触发依赖函数
export function trigger(
  target: object,
  type: TriggerOpTypes,
  key?: unknown,
  newValue?: unknown
) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  let deps: (Dep | undefined)[] = [];

  if (type === TriggerOpTypes.CLEAR) {
    // 如果是clear操作，触发所有依赖
    deps.push(...depsMap.values());
  } else if (key === "length" && isArray(target)) {
    /**
     * 如果操作了数组的length，比如 arr = [1], arr.length = 0;
     * 此时会删除arr[0]这个元素，需要触发key为0相关的依赖；当时假如
     * arr.length = 1，此时arr[0]依旧存在，不受影响，不需要触发依赖。
     * 因此我们得出一个结论，当修改数组的长度属性时，需要触发原数组中下标大于
     * 新length值的依赖。
     */
    depsMap.forEach((dep, key) => {
      // 不要遗漏了key为length的依赖，因为操作了length
      if (key === "length" || key >= (newValue as number)) {
        deps.push(dep);
      }
    });
  } else {
    // 如果key不是undefined，则获取对应key上的deps依赖集合
    if (key !== void 0) {
      deps.push(depsMap.get(key));
    }

    // 针对不同的type还需要做特殊处理
    switch (type) {
      case TriggerOpTypes.SET:
        // Map的forEach既关心键，也关心值，因此修改的时候也要获取ITERATE_KEY相关的依赖
        if (isMap(target)) {
          deps.push(depsMap.get(ITERATE_KEY));
        }
        break;
      case TriggerOpTypes.ADD:
        if (!isArray(target)) {
          // 对象新增属性操作，影响for in操作，需要获取ITERATE_KEY相关的依赖
          deps.push(depsMap.get(ITERATE_KEY));
          if (isMap(target)) {
            // Map新增属性操作，影响keys操作，需要获取MAP_KEY_ITERATE_KEY相关的依赖
            deps.push(depsMap.get(MAP_KEY_ITERATE_KEY));
          }
        } else {
          // 数组新增元素操作，会影响length属性，需要获取length相关的依赖
          deps.push(depsMap.get("length"));
        }
        break;
      case TriggerOpTypes.DELETE:
        // 删除属性操作，影响for in 操作，需要获取ITERATE_KEY相关的依赖
        deps.push(depsMap.get(ITERATE_KEY));
        if (isMap(target)) {
          // Map删除属性操作，影响keys操作，需要获取MAP_KEY_ITERATE_KEY相关的依赖
          deps.push(depsMap.get(MAP_KEY_ITERATE_KEY));
        }
        break;
      default:
        break;
    }
  }

  // 构建一个新的effect集合，防止无限循环，比如：删除effect的同时又添加effect
  const effects: ReactiveEffect[] = [];

  for (const dep of deps) {
    if (dep) {
      effects.push(...dep);
    }
  }
  triggerEffects(effects);
}

// 抽离公共的触发依赖逻辑
export function triggerEffects(deps: (Dep | ReactiveEffect)[]) {
  // dep不是数组的话转化成数组，比如ref触发依赖传入的是一个set集合
  const depsToRun = isArray(deps) ? deps : [...deps];
  depsToRun.forEach((dep: any) => {
    /**
       * 这里的dep !== activeEffect是为了防止obj++这种形成：收集--》更新--》收集的循环现象
       * effect(() => {
        // user.num ++ ====> user.num = user.num + 1;
        user.num++;
       });
       */
    if (dep !== activeEffect) {
      const scheduler = dep.scheduler;
      // 触发依赖的时候，如果存在用户自定义调度器，则执行调度器函数，否则执行依赖函数
      scheduler ? scheduler(dep.effectFn) : dep.run();
    }
  });
}

// 停止副作用函数执行
export function stop(runner: ReactiveEffectRunner) {
  runner._effect.stop();
}
