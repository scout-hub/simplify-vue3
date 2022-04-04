/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-03-29 09:12:21
 */
import {
    h
} from "../../lib/my-mini-vue.esm.js";

const Child = {
    name: "Child",
    setup(props) {
        props.count = 2;
    },
    render() {
        return h('div', null, this.count);
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
        return h("div", {
            id: 'div',
            class: 'red',
            onClick: [() => {
                console.log(1);
            }, () => {
                console.log(3)
            }],
            onmousedown: () => {
                console.log(2);
            }
        }, [h('div', null, this.msg), h(Child, {
            count: 1
        })]);
    }
};