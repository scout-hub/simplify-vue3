/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-27 22:29:18
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
            <span v-if="show">scout</span>
        </p>
        <div v-if="show">我是v-if</div>
        <div v-else >我是v-else</div>
        <button @click="changeClass">更新</button>
    </div>`,
    name: "App",
    setup() {
        const msg = ref('hello');
        const msg1 = ref('simplify-vue');
        const className = ref('red');
        const visible = ref(false);
        const show = ref(true);

        const changeClass = () => {
            className.value = 'green';
            visible.value = !visible.value;
            show.value = !show.value;
        }

        return {
            show,
            visible,
            msg,
            className,
            msg1,
            changeClass
        }
    }
};