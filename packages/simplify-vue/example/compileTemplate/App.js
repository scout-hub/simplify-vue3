/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-25 09:56:11
 */
import {
    ref
} from "../../dist/simplify-vue.esm.js";
export default {
    template: `
    <div :class="className" id="div">
        {{ msg }}
        <h1 class="h1">
        {{ msg1 }}
        </h1>
        <p v-show="visible">
            hi，
            <span>scout</span>
        </p>
        <button @click="changeClass">更新</button>
    </div>`,
    name: "App",
    setup() {
        const msg = ref('hello');
        const msg1 = ref('simplify-vue');
        const className = ref('red');
        const visible = ref(false);

        const changeClass = () => {
            className.value = 'green';
            visible.value = !visible.value;
        }

        return {
            visible,
            msg,
            className,
            msg1,
            changeClass
        }
    }
};