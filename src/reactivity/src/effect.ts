/*
 * @Author: Zhouqi
 * @Date: 2022-03-20 20:52:58
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-10 21:50:43
 */
import { extend } from "../../shared/src/index";
import { Dep } from "./dep";

interface RectiveEffectOptions {
  onStop?: Function;
  scheduler?: Function;
  lazy?: boolean;
}

interface ReactiveEffectRunner {
  _effect: ReactiveEffect;
}

export class ReactiveEffect {
  deps: Dep[] = [];
  onStop?: Function;
  private active = true;

  constructor(public effectFn, public scheduler?) {}

  run() {
    activeEffect = this;
    activeEffectStack.push(this);
    /**
     * cleanup的作用是清除当前ReactiveEffect所关联的deps，即响应式对象key对应的Set依赖集合
     * effectFn = () => {
        // user.ok为false时，user.name始终应该是123，即使user.age发生改变也不应该触发副作用函数执行
        user.name = user.ok ? user.age : "123";
       };
       当user.ok变成false时会触发副作用函数，此时会清空ok、age上面的依赖，并且重新收集ok的依赖，
       由于三元表达式的结果，age不会收集依赖，因此即使修改user.age也不再会触发副作用函数执行。
     */
    cleanup(this);
    const result = this.effectFn();
    activeEffectStack.pop();
    activeEffect = activeEffectStack[activeEffectStack.length - 1];
    // activeEffect = undefined
    return result;
  }

  stop() {
    // active用于防止重复调用stop
    if (this.active) {
      // 移除依赖
      cleanup(this);
      this.onStop && this.onStop();
      this.active = false;
    }
  }
}

// 找到所有依赖这个 effect 的响应式对象，从这些响应式对象里面把 effect 给删除掉
function cleanup(effect: ReactiveEffect) {
  effect.deps.forEach((deps) => {
    deps.delete(effect);
  });
  effect.deps.length = 0;
}

let activeEffect: ReactiveEffect | undefined;
let shouldTrack = true;
/**
 * 收集当前正在使用的ReactiveEffect，在嵌套effect的情况下，每一个effect执行
 * 时内部的ReactiveEffect是不同的。建立activeEffectStack是为了能够在对应的
 * effect函数执行时收集到正确的activeEffect。
 * 
 * effect(() => {
      effect(() => {
        执行逻辑
      });
      执行逻辑
    });
 * 
 * 执行过程：
 * 外层effect执行 ---> activeEffect=当前effect内部创建的ReactiveEffect
 * 并且被收集到activeEffectStack中 ---> 内部effect执行 ---> activeEffect=当前effect
 * 内部创建的ReactiveEffect并且被收集到activeEffectStack中 ---> 内部effect执行完成，
 * activeEffectStack弹出栈顶的ReactiveEffect，此时栈顶的ReactiveEffect对应外层effect，
 * 取出后赋值给当前的activeEffect
 */
const activeEffectStack: Array<any> = [];
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

// 依赖收集函数
export function track(target: object, key: string) {
  // if (!activeEffect) return;
  if (!canTrack()) return;
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let deps = depsMap.get(key);
  if (!deps) {
    deps = new Set();
    depsMap.set(key, deps);
  }
  trackEffects(deps);
}

// 抽离收集依赖公共逻辑
export function trackEffects(deps: Dep) {
  deps.add(activeEffect!);
  activeEffect!.deps.push(deps);
}

// 触发依赖函数
export function trigger(target: object, key: string) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  const deps = depsMap.get(key);
  if (!deps) return;
  triggerEffects(deps);
}

// 抽离公共的触发依赖逻辑
export function triggerEffects(deps: Dep) {
  /**
   * 构建一个新的set，避免在另一个set的forEach中形成set.delete(1)，set.add(1)死循环现象
   */
  const depsToRun = new Set();
  deps.forEach((dep) => {
    /**
       * 这里的dep !== activeEffect是为了防止obj++这种形成：收集--》更新--》收集的循环现象
       * effect(() => {
        // user.num ++ ====> user.num = user.num + 1;
        user.num++;
       });
       */
    dep !== activeEffect && depsToRun.add(dep);
  });
  depsToRun.forEach((dep: any) => {
    const scheduler = dep.scheduler;
    // 触发依赖的时候，如果存在用户自定义调度器，则执行调度器函数，否则执行依赖函数
    scheduler ? scheduler(dep.effectFn) : dep.run();
  });
}

// 停止副作用函数执行
export function stop(runner: ReactiveEffectRunner) {
  runner._effect.stop();
}

// 能否能进行依赖收集
export function canTrack(): boolean {
  return !!(shouldTrack && activeEffect);
}
