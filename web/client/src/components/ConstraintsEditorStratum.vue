<template>
    <div>
        <div class="stratum-each-heading">
            Each
            <span class="stratum-label">{{ stratum.label }}</span>
        </div>
        <br>
        <div v-if="!isPartition"
             class="stratum-constraints">
            <div>
                <div class="no-constraints-msg"
                     v-if="stratumConstraints.length === 0">
                    <i>Configure constraints for {{ stratum.label }}s by clicking on the Add button below.</i>
                </div>
                <ul>
                    <li class="constraint"
                        v-for="constraint in stratumConstraints"
                        :key="constraint._id">
                        <ConstraintsEditorConstraintItem :stratum="stratum"
                                                         :constraint="constraint"></ConstraintsEditorConstraintItem>
                    </li>
                    <li>
                        <button class="button add-constraint"
                                @click="addNewConstraint">
                            <span>Add {{ stratum.label }} constraint</span>
                        </button>
                    </li>
                </ul>
            </div>
        </div>
        <div v-else
             class="stratum-constraints">
            <div>
                <i>Constraints are not applicable to partitions.</i>
            </div>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

import ConstraintsEditorConstraintItem from "./ConstraintsEditorConstraintItem.vue";
import * as Stratum from "../data/Stratum";
import * as Constraint from "../data/Constraint";
import * as SourceFile from "../data/SourceFile";

@Component({
    components: {
        ConstraintsEditorConstraintItem,
    },
})
export default class ConstraintsEditorStratum extends Vue {
    // Props
    @Prop stratum: Stratum.Stratum = p({ type: Object, required: true, }) as any;
    @Prop stratumConstraints: ReadonlyArray<Constraint.Constraint> = p({ type: Array, required: true, }) as any;
    @Prop isPartition: boolean = p({ type: Boolean, required: false, default: false, }) as any;

    get fileInStore() {
        const file: Partial<SourceFile.SourceFile> = this.$store.state.sourceFile;
        return file;
    }

    get columnInfo() {
        return this.fileInStore.columnInfo;
    }

    get strata() {
        return this.$store.state.constraintsConfig.strata as ReadonlyArray<Stratum.Stratum>;
    }

    get stratumIndex() {
        const id = this.stratum._id;
        return this.strata.findIndex(s => s._id === id);
    }

    addNewConstraint() {
        const columnInfo = this.columnInfo!;

        // Pick random column and random default value
        const defaultColumn = (Math.random() * columnInfo.length) >>> 0;
        const defaultColumnInfo = columnInfo[defaultColumn];

        const valueSetArray = Array.from(defaultColumnInfo.valueSet as Set<string | number>);
        const defaultFilterValue = valueSetArray[(Math.random() * valueSetArray.length) >>> 0];

        // TODO: Generate random constraint?
        const constraint: Constraint.Constraint = {
            _id: performance.now(),
            strata: this.stratumIndex,
            weight: 50,
            type: "count",
            filter: {
                column: defaultColumn,
                function: "eq",
                values: [
                    defaultFilterValue,
                ]
            },
            condition: {
                function: "eq",
                value: 1
            },
            applicability: []
        }

        this.$store.commit("insertConstraintsConfigConstraint", constraint);
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
.stratum-each-heading {
    display: inline-block;

    font-size: 1.5em;
    color: #fff;

    background: #608;

    border-radius: 0.3em;
    padding-left: 0.7em;
}

.stratum-label {
    display: inline-block;
    background: #49075E;
    padding: 0.3em 0.7em;
    border-radius: 0.3em;

    color: #fff;
}

.stratum-constraints {
    display: flex;
    flex-direction: row;

    justify-content: flex-start;
    align-items: flex-start;

    margin-left: 1.5rem;
}

.stratum-constraints>div {
    flex-grow: 1;
    /*flex-shrink: 0;*/
    margin: 1rem;
}

.stratum-constraints ul {
    margin: 0 -1rem;
    padding: 0;
    list-style: none;
}

.stratum-constraints li+li {
    margin-top: 1rem;
}

.stratum-constraints .constraint {
    padding-left: 0.8rem;
    font-size: 1.4em;

    z-index: 1;

    background: rgba(0, 0, 0, 0.05);
    background-clip: content-box;
}

.stratum-constraints .constraint::before {
    content: "";
    position: absolute;
    display: inline-block;

    width: 1rem;
    height: 1rem;

    border-radius: 50%;
    background: #49075E;

    margin-top: 0.5em;
    margin-left: -1.7rem;
}

button.add-constraint {
    display: inline-flex;

    width: 2.5rem;
    height: 2.5rem;

    border-radius: 50%;

    justify-content: center;
    align-items: center;

    position: relative;
    left: -1.6rem;
}

button.add-constraint>span {
    display: none;

    min-width: 10em;

    position: absolute;
    left: 3.7em;
    color: #777;

    text-align: left;
}

button.add-constraint::before {
    display: block;
    content: "+";

    line-height: 0;

    font-size: 3em;
    font-weight: 100;

    margin-top: -0.05em;
}

button.add-constraint:hover>span,
button.add-constraint:focus>span,
button.add-constraint:active>span {
    display: block;
}

.no-constraints-msg {
    margin-bottom: 1rem;
}
</style>
