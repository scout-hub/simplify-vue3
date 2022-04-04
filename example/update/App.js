/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-03 21:38:43
 */
import {
    h,
    ref
} from "../../lib/my-mini-vue.esm.js";


export default {
    name: "App",
    setup() {
        const count = ref(1);

        const change = () => {
            count.value++;
        };

        return {
            count,
            change
        };
    },
    render() {
        return h("button", {
            onClick: this.change,
        }, this.count);
    }
};