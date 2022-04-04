/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-03 17:08:09
 */
import {
    h
} from "../../lib/my-mini-vue.esm.js";

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
            // class: 'red',
            // class: ['red green'],
            // class: {
            //     red: false, green: true
            // },
            class: ['yellow', {
                red: false,
                green: true
            }],
        }, 123);
    }
};