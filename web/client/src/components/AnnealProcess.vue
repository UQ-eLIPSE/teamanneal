<template>
    <div id="wizard-container">
        <div id="wizard-sidebar">[step-by-step navigatable sidebar]</div>
        <div id="wizard-content">
            <router-view class="wizard-subcomponent" />
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

@Component
export default class AnnealProcess extends Vue {

}
</script>

<!-- ####################################################################### -->

<style scoped>
#wizard-container {
    display: flex;

    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    flex-direction: row;
}

#wizard-sidebar {
    flex-grow: 0;
    flex-shrink: 0;

    width: 20rem;

    color: #fff;
    background: rgb(230, 230, 230);

    box-shadow: inset -1rem 0 1rem rgba(0, 0, 0, 0.1);
}

#wizard-content {
    flex-grow: 1;

    position: relative;

    background: #f2f2f2;
}

.wizard-subcomponent {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    font-weight: 300;
}
</style>
