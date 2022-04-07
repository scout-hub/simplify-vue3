/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-07 11:59:44
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
    setup(props) {
        console.log(props);
    },
    render() {
        return h('div', {
            onClick: () => {
                console.log(this.$attrs);
            }
        }, this.msg);
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
            id: 'div',
            class: ['red', 'green'],
            onClick: [
                () => {
                    console.log(1);
                },
                () => {
                    console.log(2);
                }
            ]
        }), h('div', null, this.msg)]);
    }
};