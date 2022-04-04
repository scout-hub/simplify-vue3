/*
 * @Author: Zhouqi
 * @Date: 2022-03-20 20:26:23
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-03-26 21:47:41
 */
import { reactive } from "../src/reactive";
import { effect, stop } from "../src/effect";

describe("effect", () => {
  it("happy path", () => {
    const user = reactive({
      age: 10,
    });
    let nextAge;
    effect(() => {
      nextAge = user.age + 1;
    });
    expect(nextAge).toBe(11);
    user.age++;
    expect(nextAge).toBe(12);
  });

  it("runner", () => {
    let foo = 10;
    const runner = effect(() => {
      foo++;
      return "foo";
    });
    expect(foo).toBe(11);
    const r = runner();
    expect(foo).toBe(12);
    expect(r).toBe("foo");
  });

  it("scheduler", () => {
    let dummy;
    let run: any;
    const scheduler = jest.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      { scheduler }
    );
    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);
    // should be called on first trigger
    obj.foo++;
    expect(scheduler).toHaveBeenCalledTimes(1);
    // // should not run yet
    expect(dummy).toBe(1);
    // // manually run
    run();
    // // should have run
    expect(dummy).toBe(2);
  });

  it("stop", () => {
    let dummy;
    const obj = reactive({ prop: 1 });
    const runner = effect(() => {
      dummy = obj.prop;
    });
    obj.prop = 2;
    expect(dummy).toBe(2);
    stop(runner);
    // obj.prop = 3;
    // 是否跟shouldTrack有关?
    obj.prop++;
    expect(dummy).toBe(2);

    // stopped effect should still be manually callable
    runner();
    expect(dummy).toBe(3);
  });

  it("events: onStop", () => {
    const onStop = jest.fn();
    const runner = effect(() => {}, {
      onStop,
    });

    stop(runner);
    expect(onStop).toHaveBeenCalled();
  });

  it("cleanup", () => {
    const user = reactive({
      age: 10,
      ok: true,
    });
    let i = 0;
    let effectFn = () => {
      i++;
      user.name = user.ok ? user.age : "123";
    };
    effect(effectFn);
    // ok为false时，无论age怎么变，都不应该触发副作用函数，因为此时name一直为123
    user.ok = false;
    user.age = 2;

    expect(i).toBe(2);
  });

  it("obj++", () => {
    const user = reactive({
      num: 0,
    });

    effect(() => {
      // 无限递归循环
      // user.num ++ ====> user.num = user.num + 1;
      user.num++;
    });

    user.num = 3;

    expect(user.num).toBe(4);
  });

  it("嵌套effect", () => {
    const user = reactive({
      num: 0,
      num1: 1,
    });

    let i = 0;
    effect(() => {
      effect(() => {
        i = user.num1;
      });
      i = user.num;
    });

    user.num = 2;

    expect(i).toBe(2);
  });

  it("lazy effect", () => {
    const user = reactive({
      num: 0,
    });

    const runner = effect(
      () => {
        user.num++;
      },
      {
        lazy: true,
      }
    );
    expect(user.num).toBe(0);
    runner();
    expect(user.num).toBe(1);
    user.num = 2;
    expect(user.num).toBe(3);
  });
});
