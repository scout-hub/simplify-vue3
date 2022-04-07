/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:16:02
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-03 16:33:50
 */
import App from "./App.js";
import {
    createRenderer
} from "../../lib/simplify-vue.esm.js";

const {
    createApp
} = createRenderer({
    createElement(type) {
        console.log('执行了自定义渲染器的createElement函数');
        return document.createElement('div');
    },
    patchProp() {
        console.log('执行了自定义渲染器的patchProp函数');
        return;
    },
    insert(el, parent) {
        console.log('执行了自定义渲染器的insert函数');
        parent.appendChild(el);
    }
});

createApp(App).mount(document.querySelector('#app'));