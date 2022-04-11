/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 14:52:24
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-11 13:40:06
 */
import { computed } from "../src/computed";
import { effect } from "../src/effect";
import { reactive } from "../src/reactive";

describe("computed", () => {
  it("happy path", () => {
    const value: any = reactive({
      foo: 1,
    });

    const getter = computed(() => {
      return value.foo;
    });

    value.foo = 2;
    expect(getter.value).toBe(2);
  });

  it("should compute lazily", () => {
    const value: any = reactive({
      foo: 1,
    });
    const getter = jest.fn(() => {
      return value.foo;
    });
    const cValue = computed(getter);

    // lazy
    expect(getter).not.toHaveBeenCalled();

    expect(cValue.value).toBe(1);
    expect(getter).toHaveBeenCalledTimes(1);

    // should not compute again
    cValue.value;
    expect(getter).toHaveBeenCalledTimes(1);

    // should not compute until needed
    value.foo = 2;
    expect(getter).toHaveBeenCalledTimes(1);

    // now it should compute
    expect(cValue.value).toBe(2);
    expect(getter).toHaveBeenCalledTimes(2);

    // should not compute again
    cValue.value;
    expect(getter).toHaveBeenCalledTimes(2);
  });

  it("计算属性中的嵌套effect", () => {
    const value: any = reactive({
      foo: 1,
    });
    let i = 0;

    const getter = computed(() => {
      return value.foo;
    });

    effect(() => {
      i++;
      getter.value;
    });

    value.foo = 2;
    expect(i).toBe(2);
  });
});
