/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-02 14:10:03
 */
import {
    h,
    getCurrentInstance
} from "../../lib/my-mini-vue.esm.js";

const Child = {
    name: "Child",
    setup() {
        const instance = getCurrentInstance();
        console.log(instance);
    },
    render() {
        return h('div', null, 1);
    }
}

export default {
    name: "App",
    setup() {
        const instance = getCurrentInstance();
        console.log(instance);
        return {
            msg: 'test123'
        }
    },
    render() {
        return h("div", null, [h(Child)]);
    }
};