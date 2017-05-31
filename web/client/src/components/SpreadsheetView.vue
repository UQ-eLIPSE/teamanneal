<template>
    <div id="spreadsheet">
        <table>
            <tr v-for="(row, i) in rows" :class="{ 'header': i === 0, }">
                <td v-for="cell in row">{{ cell }}</td>
            </tr>
        </table>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Lifecycle, Prop, p } from "av-ts";

@Component
export default class SpreadsheetView extends Vue {
    // Props
    @Prop rows: ReadonlyArray<string | number> = p(Array) as any;
    @Prop stickyHeader = p(Boolean);


    stickyHeader_lastUpdate: number = 0;

    get headerRow() {
        // Returns the first <tr> it encounters, which is the header row
        return this.$el.querySelector("tr");
    }

    @Lifecycle mounted() {
        if (this.stickyHeader) {
            // Enable sticky header on scroll
            this.$el.addEventListener("scroll", () => {
                Vue.nextTick(() => requestAnimationFrame((time: number) => {
                    // If already processed in same frame, don't do again
                    if (this.stickyHeader_lastUpdate === time) { return; }

                    // Translate Y to move header down to compensate for scroll
                    const offset = this.$el.scrollTop;
                    this.headerRow!.style.transform = `translateY(${offset}px)`;

                    // Unmark flag
                    this.stickyHeader_lastUpdate = time;
                }));
            });
        }
    }
}   
</script>

<!-- ####################################################################### -->

<style scoped>
#spreadsheet {
    font-family: monospace;
    white-space: pre;

    overflow: scroll;
}

table {
    border-collapse: collapse;
}

td,
th {
    border: 1px solid #ddd;
    padding: 0.2em;
}

td.num {
    text-align: right;
    color: blue;
}

td.highlight,
th.highlight {
    background: rgba(73, 7, 94, 0.3);
}

.header {
    background: green;
    color: #fff;
}
</style>
