/*
 * @Author: Zhouqi
 * @Date: 2022-03-20 20:46:00
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-11 22:31:52
 */
import { effect } from "../src/effect";
import { reactive } from "../src/reactive";

describe("reactive", () => {
  it("happy path", () => {
    const org = { foo: 1 };
    const obOrg: any = reactive(org);
    expect(obOrg).not.toBe(org);
    expect(obOrg.foo).toBe(1);
  });

  it("test rawValue", () => {
    let i = 0;
    const pObj: any = reactive({
      num: 1,
    });

    const rObj: any = reactive({ num1: 1 });
    effect(() => {
      i++;
      rObj.num1;
    });

    rObj.num1 = pObj;
    expect(i).toBe(2);
    rObj.num1 = pObj;
    expect(i).toBe(2);
  });

  it("test proxy has ", () => {
    let i = 0;
    const obj: any = reactive({
      num: 1,
    });
    effect(() => {
      i++;
      "num" in obj;
    });
    obj.num++;
    expect(i).toBe(2);
  });

  it("test proxy ownkeys ", () => {
    let i = 0;
    const obj: any = reactive({
      num: 1,
    });
    effect(() => {
      i++;
      for (const key in obj) {
      }
    });

    obj.num1 = 0;

    expect(i).toBe(2);
    obj.num = 2;
    expect(i).toBe(2);
  });

  it("test proxy deleteProperty ", () => {
    let i = 0;
    const obj: any = reactive({
      num: 1,
      num1: 0,
    });
    effect(() => {
      i++;
      for (const key in obj) {
      }
    });

    obj.num1 = 1;
    expect(i).toBe(1);

    delete obj.num;
    expect(i).toBe(2);
  });

  it("test prototype chain", () => {
    const obj = { name: "zs" };
    const obj1 = { name1: "ls" };
    const child: any = reactive(obj);
    const parent = reactive(obj1);
    Object.setPrototypeOf(child, parent);
    let i = 0;
    effect(() => {
      i++;
      //
      child.name1;
    });

    child.name1 = "ww";
    expect(i).toBe(2);
  });

  it("test array index", () => {
    const arr = reactive([1]);
    let i;
    effect(() => {
      i = arr[0];
    });
    arr[0] = 2;
    expect(i).toBe(2);
  });

  it("test array length", () => {
    const arr: any = reactive([1]);
    let i;
    effect(() => {
      i = arr.length;
      if (!arr[0]) {
        i++;
      }
    });
    arr[2] = 2;
    expect(i).toBe(3);
    arr[2] = 23;
    expect(i).toBe(3);
    arr.length = 10;
    expect(i).toBe(10);
    arr.length = 0;
    expect(i).toBe(1);
  });

  it("test array for in", () => {
    const arr: any = reactive([1]);
    let i = 0;
    effect(() => {
      i++;
      for (const key in arr) {
      }
    });

    arr.length = 10;
    expect(i).toBe(2);
    arr[10] = 1;
    expect(i).toBe(3);
    arr[10] = 2;
    expect(i).toBe(3);
  });

  it("test array for of", () => {
    const arr: any = reactive([1]);
    let i = 0;
    effect(() => {
      i++;
      // for (const key of arr) {
      // }
      for (const key of arr.values()) {
      }
    });
    arr.length = 10;
    expect(i).toBe(2);
    arr[10] = 1;
    expect(i).toBe(3);
    arr[10] = 2;
    expect(i).toBe(4);
  });

  it("test array includes", () => {
    const obj = {};
    const arr: any = reactive([obj]);
    expect(arr.includes(arr[0])).toBe(true);
  });

  it("test array includes last/indexOf ", () => {
    const obj = {};
    const arr: any = reactive([obj]);
    expect(arr.includes(obj)).toBe(true);
    expect(arr.indexOf(obj)).toBe(0);
    expect(arr.lastIndexOf(obj)).toBe(0);
  });
});
