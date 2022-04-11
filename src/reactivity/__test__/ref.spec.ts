/*
 * @Author: Zhouqi
 * @Date: 2022-03-23 21:32:46
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-11 17:41:23
 */
import { effect } from "../src/effect";
import { reactive } from "../src/reactive";
import {
  ref,
  shallowRef,
  isRef,
  unRef,
  proxyRefs,
  toRef,
  toRefs,
} from "../src/ref";
describe("ref", () => {
  it("should be reactive", () => {
    const a = ref(1);
    expect(a.value).toBe(1);
    let dummy;
    let calls = 0;
    effect(() => {
      calls++;
      dummy = a.value;
    });
    expect(calls).toBe(1);
    expect(dummy).toBe(1);
    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
    // same value should not trigger
    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
  });

  it("should make nested properties reactive", () => {
    const obj = {
      count: 1,
    };
    const a = ref(obj);
    let dummy;
    let i = 0;
    effect(() => {
      i++;
      dummy = a.value.count;
    });
    expect(dummy).toBe(1);
    // a.value.count = 2;
    a.value = obj;
    expect(dummy).toBe(1);
    expect(i).toBe(1);
    a.value.count = 2;
    expect(obj.count).toBe(2);
  });

  it("test rawValue", () => {
    let i = 0;
    const pObj = reactive({
      num: {},
    });

    const rObj = ref({
      num: {},
    });
    effect(() => {
      i++;
      rObj.value;
    });

    rObj.value = pObj;
    expect(i).toBe(2);
    rObj.value = pObj;
    expect(i).toBe(2);
  });

  it("shallow ref", () => {
    const obj = {
      num: 1,
    };
    let i = 0;
    const ref = shallowRef(obj);
    effect(() => {
      i++;
      ref.value;
    });

    ref.value.num = 2;
    expect(i).toBe(1);
    ref.value = 2;
    expect(i).toBe(2);
  });

  it("proxyRefs", () => {
    const user = {
      age: ref(10),
      name: "xiaohong",
    };
    const proxyUser = proxyRefs(user);
    expect(user.age.value).toBe(10);
    expect(proxyUser.age).toBe(10);
    expect(proxyUser.name).toBe("xiaohong");

    (proxyUser as any).age = 20;
    expect(proxyUser.age).toBe(20);
    expect(user.age.value).toBe(20);

    proxyUser.age = ref(20);
    expect(proxyUser.age).toBe(20);
    expect(user.age.value).toBe(20);
  });

  it("isRef", () => {
    const a = ref(1);
    const user = reactive({
      age: 1,
    });
    expect(isRef(a)).toBe(true);
    expect(isRef(1)).toBe(false);
    expect(isRef(user)).toBe(false);
  });

  it("unRef", () => {
    const a = ref(1);
    expect(unRef(a)).toBe(1);
    expect(unRef(1)).toBe(1);
  });

  it("toRef", () => {
    const obj: any = reactive({
      a: 1,
      b: 2,
    });
    let i = 0;
    const ref = toRef(obj, "a");
    effect(() => {
      i = obj.a;
    });
    expect(i).toBe(1);
    ref.value = 2;
    expect(i).toBe(2);
    obj.a = 3;
    expect(i).toBe(3);
    expect(ref.value).toBe(3);
  });

  it("toRefs", () => {
    const obj: any = reactive({
      a: 1,
      b: 2,
    });
    let i = 0;
    const refs = toRefs(obj);
    effect(() => {
      i = obj.a;
    });
    expect(i).toBe(1);
    refs.a.value = 2;
    expect(i).toBe(2);
    obj.a = 3;
    expect(i).toBe(3);
    expect(refs.a.value).toBe(3);
  });
});
