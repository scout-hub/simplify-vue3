/*
 * @Author: Zhouqi
 * @Date: 2022-03-20 20:46:00
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-11 11:25:05
 */
import { readonly, isReactive, isReadonly, isProxy } from "../src/reactive";

describe("readonly", () => {
  it("readonly", () => {
    const org = { foo: 1, bar: { baz: 2 } };
    const obOrg: any = readonly(org);
    expect(obOrg).not.toBe(org);
    expect(obOrg.foo).toBe(1);
  });

  it("warn set", () => {
    console.warn = jest.fn();
    const user: any = readonly({ name: 2 });
    user.name = 3;
    expect(console.warn).toHaveBeenCalled();
  });

  it("should make nested values readonly", () => {
    const original = { foo: 1, bar: { baz: 2 } };
    const wrapped: any = readonly(original);
    expect(wrapped).not.toBe(original);
    expect(isProxy(wrapped)).toBe(true);
    expect(isReactive(wrapped)).toBe(false);
    expect(isReadonly(wrapped)).toBe(true);
    expect(isReactive(original)).toBe(false);
    expect(isReadonly(original)).toBe(false);
    expect(isReactive(wrapped.bar)).toBe(false);
    expect(isReadonly(wrapped.bar)).toBe(true);
    expect(isReactive(original.bar)).toBe(false);
    expect(isReadonly(original.bar)).toBe(false);
    // get
    expect(wrapped.foo).toBe(1);
  });
});
