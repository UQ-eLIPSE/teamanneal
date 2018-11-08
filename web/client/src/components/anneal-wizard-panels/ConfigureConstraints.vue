<template>
    <div class="wizard-panel">
        <div class="wizard-panel-content">
            <h1>Set constraints</h1>
            <p>
                TeamAnneal forms groups with consideration to constraints you provide. Add as many constraints as you need to describe desired properties for each group.
                <a class="more help-link"
                   :class="{'active': showHelp}"
                   href="#"
                   @click.prevent="toggleHelp">Need help?</a>
            </p>
            <div class="help-box"
                 v-if="showHelp">
                <h2>Significance of constraint order and modal verbs ("should have", etc.)</h2>
                <p>The order of constraints is
                    <b>not significant</b> to the anneal process.</p>
                <p>Instead, modal verbs ("weights") that appear at the start of each constraint are used to determine which is more significant compared to others.</p>
                <p>The relative weights for each are listed below:</p>
                <table class="example-table">
                    <thead>
                        <tr>
                            <th>Modal verb</th>
                            <th>Relative weight</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>may have</td>
                            <td>1</td>
                        </tr>
                        <tr>
                            <td>could have</td>
                            <td>5</td>
                        </tr>
                        <tr>
                            <td>should have</td>
                            <td>25</td>
                        </tr>
                        <tr>
                            <td>must have</td>
                            <td>500</td>
                        </tr>
                    </tbody>
                </table>
                <p>This means that a "must have" constraint is considered with 500 times greater importance than a "may have" constraint.</p>

                <h2>Constraint applicability to groups only of a certain size</h2>
                <p>In general, constraints will apply to all groups being formed. This is indicated in each constraint by "when
                    <i>group</i> has
                    <u>any number of people</u>".</p>
                <p>If you wish to only have TeamAnneal consider the constraint for groups of a certain size, you can edit the applicability condition to only apply, for example, "when
                    <i>group</i> has
                    <u>3 people</u>".</p>
                <p>Please note that the number applies to the number of people that sit under the group - if the group contains subgroups, the value applies to the total number of people in all subgroups, and not the number of subgroups.</p>
                <h2>Example</h2>
                <p>An example would be the following constraint <i><u>should have an</u> <u>even distribution of</u> people with <u>GPA</u> <u>greater than 3</u> when Team has <u>any number of</u> people</i></p>
                <p>In this example, the cost is <u>should have</u> with a value of 25, Team Anneal will attempt to split the teams in an <u>even distribution</u> of people with a filter value of
                <u>GPA</u> and a filter function of <u>greater than 3</u> with <u>any number of</u> as the size applicability.</p>
            </div>
            <div v-if="!hasConstraints"
                 class="error-msg">
                <h3>No constraints defined</h3>
                <p>You need to add at least one constraint. Please correct this before continuing.</p>
            </div>
            <div v-if="!areAllConstraintsValid"
                 class="error-msg">
                <h3>Some constraints are invalid</h3>
                <p>You have constraints which are not validly configured. These are highlighted below. Please correct this before continuing.</p>
            </div>
            <p>
                <ConstraintsEditor></ConstraintsEditor>
            </p>
        </div>
        <div class="wizard-panel-bottom-buttons">
            <button class="button"
                    @click="emitWizardNavNext"
                    :disabled="isWizardNavNextDisabled">Continue</button>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Component, Mixin } from "av-ts";

import * as AnnealProcessWizardEntries from "../../data/AnnealProcessWizardEntries";
import { AnnealCreator as S } from "../../store";

import { AnnealProcessWizardPanel } from "../AnnealProcessWizardPanel";

import ConstraintsEditor from "../ConstraintsEditor.vue";

@Component({
    components: {
        ConstraintsEditor,
    },
})
export default class ConfigureConstraints extends Mixin(AnnealProcessWizardPanel) {
    // Required by AnnealProcessWizardPanel
    // Defines the wizard step
    readonly thisWizardStep = AnnealProcessWizardEntries.configureConstraints;

    get hasConstraints() {
        return S.get(S.getter.HAS_CONSTRAINTS);
    }

    get areAllConstraintsValid() {
        return S.get(S.getter.ARE_ALL_CONSTRAINTS_VALID);
    }
}
</script>

<!-- ####################################################################### -->

<style scoped src="../../static/anneal-process-wizard-panel.css"></style>

<style scoped>
.example-table {
    border-collapse: collapse;
}

.example-table th,
.example-table td {
    border: 1px solid #aaa;
    padding: 0.1em 0.3em;
}

.error-msg {
    font-size: 0.9em;
    background: darkorange;
    padding: 1px 1em;
}
</style>
