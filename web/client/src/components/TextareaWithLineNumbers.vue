<template>
    <div class="textarea-with-line-numbers">
        <textarea ref="lineNumberTextArea"
                  class="line-numbers-text-area"
                  v-model="lineNumberTextareaText"
                  :cols="lineNumberCols"
                  disabled></textarea>
        <textarea ref="inputTextArea"
                  class="input-text-area"
                  v-model="inputText"
                  @scroll="syncLineNumbers"
                  :rows="rows"
                  :cols="cols"></textarea>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

@Component({
    model: {
        event: "change",
        prop: "text",
    },
})
export default class TextareaWithLineNumbers extends Vue {
    /** Input text */
    @Prop text = p({ type: String, required: false, default: "", });

    /** Number of rows to assign to the input <textarea /> */
    @Prop rows = p({ type: Number, required: false, default: 10, });

    /** Number of cols to assign to the input <textarea /> */
    @Prop cols = p({ type: Number, required: false, default: 30, });

    get inputText() {
        return this.text;
    }

    set inputText(value: string) {
        // Sync line numbers being shown on the DOM everytime the value changes
        this.syncLineNumbers();

        // Emit the value change event
        this.$emit("change", value);
    }

    /** Returns the number of lines in the input text */
    get numberOfLines() {
        return this.inputText.split("\n").length;
    }

    /**
     * A bunch of newlines to be used with the line number textarea to guarantee
     * that the element is always scrollable parallel to the input textarea
     */
    get lineNumberTextareaBottomPaddingString() {
        return Array.from({ length: this.rows }, () => "").join("\n");
    }

    /** Returns line numbers as a new-line delimited string */
    get lineNumberTextareaText() {
        return Array
            .from({ length: this.numberOfLines }, (_, i) => i + 1).join("\n") +
            // We add the bottom padding rows to keep the line number textarea
            // scrollable
            this.lineNumberTextareaBottomPaddingString;
    }

    /** Number of cols to assign to the line number internal <textarea /> */
    get lineNumberCols() {
        // Minimum cols = 2, and changes with the number of lines entered
        return Math.max(2, ("" + this.numberOfLines).length);
    }

    /**
     * Synchronises scrolling between line numbers and custom counter list text
     * area
     */
    syncLineNumbers() {
        const source = this.$refs['inputTextArea'] as HTMLTextAreaElement;
        const lineNumberTextArea = this.$refs['lineNumberTextArea'] as HTMLTextAreaElement;
        lineNumberTextArea.scrollTop = source.scrollTop;
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
.textarea-with-line-numbers {
    display: inline-flex;
}

textarea {
    border: 0;
    padding: 0.4em 0.2em;
    border-bottom: 0.5px solid rgba(1, 0, 0, 0.1);
    font-family: inherit;
    font-size: inherit;
}

.line-numbers-text-area {
    background: rgba(73, 7, 94, 0.04);
    color: #49075e;
    text-align: right;
    overflow: hidden;
    resize: none;
    cursor: default;
    border-right: 0.2em solid #aaa;
}

.input-text-area {
    resize: none;
    white-space: pre;
    overflow: auto;
    outline: none;
}

.input-text-area:active,
.input-text-area:focus {
    outline: 0.2em solid rgba(73, 7, 94, 0.2);
}
</style>
