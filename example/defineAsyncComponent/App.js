/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-14 22:41:39
 */
import {
    h,
    defineAsyncComponent
} from "../../lib/simplify-vue.esm.js";

const Child = defineAsyncComponent({
    loader: () => import('./Child.js')
})

export default {
    name: "App",
    setup() {

    },
    render() {
        return h("div", null, [h(Child)]);
    }
};