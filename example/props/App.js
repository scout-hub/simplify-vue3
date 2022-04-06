/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-06 22:52:56
 */
import {
    h
} from "../../lib/my-mini-vue.esm.js";

const Child = {
    name: "Child",
    props: {
        msg: {
            type: String,
            default: 'xxx'
        }
    },
    setup() {},
    render() {
        return h('div', null, 123);
    }
}

export default {
    name: "App",
    setup() {
        return {
            msg: 'test123'
        }
    },
    render() {
        return h("div", null, [h(Child, {
            msg: this.msg,
            id: 'div',
            class: 'red',
        })]);
    }
};