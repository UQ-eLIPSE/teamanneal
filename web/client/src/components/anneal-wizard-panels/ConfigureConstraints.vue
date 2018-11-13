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
                <span>
                    <i>
                        <u>Weight table</u>
                    </i>
                </span>
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


                <h2>Example Constraints</h2>


                <!-- Constraint examples -->

                <!-- Example 1 -->
                <h3>Example 1</h3>
                <p>
                    <i>
                        <u>should have</u>
                        <u>an even distribution of</u> people with
                        <u>Discipline equal to</u>
                        <u>Electrical Engineering</u> when Team has
                        <u>any number of</u> people</i>
                </p>
                <table class="example-table">
                    <thead>
                        <tr>
                            <th>Weight (Priorities)</th>
                            <th>Condition</th>
                            <th>Characteristic</th>
                            <th>Application</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>should have</td>
                            <td>an even distribution of</td>
                            <td>Discipline equal to Electrical Engineering </td>
                            <td>Team has any number of people</td>
                        </tr>
                    </tbody>
                </table>
                <p>The weight in this context is
                    <i>should have</i> which means Team Anneal will put a significant amount of weight for the condition to be correct (see
                    <i>Weight Table</i> for relative weights). The condition + characteristic, i.e.
                    <i>an even distribution of people with Discipline equal to Electrical Engineering</i> means that Team Anneal will attempt to form groups such that it spreads out people with a certain characteristic (discipline equal to Electrical Engineering) uniformly across all groups. This constraint will be applied to all teams (and not just teams of a certain size) since
                    <i>any number of people</i> has been selected as the applicability</p>
                <p>The output would be a collection of teams such that students with the electrical engineering discipline will be evenly spread across all teams.</p>
                <!-- Example 2 -->
                <h3>Example 2</h3>
                <p>
                    <i>
                        <u>should have</u>
                        <u>at least 1</u> person with
                        <u>GPA</u>
                        <u>greater than 5</u> when Team has
                        <u>3</u> people</i>
                </p>
                <table class="example-table">
                    <thead>
                        <tr>
                            <th>Weight (Priorities)</th>
                            <th>Condition</th>
                            <th>Characteristic</th>
                            <th>Application</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>should have</td>
                            <td>at least 1 person</td>
                            <td>GPA greater than 5</td>
                            <td>Team has 3 people</td>
                        </tr>
                    </tbody>
                </table>
                <p>The weight in this context is
                    <i>should have</i> which means Team Anneal will put a significant amount of weight for the condition to be correct (see
                    <i>Weight Table</i> for relative weights). The condition is
                    <i>at least 1</i> which means that Team Anneal will attempt to form teams with at least 1 person having a particular characteristic (<i>GPA greater than 5</i>). Only teams comprising of 3 people will be affected by this constraint, since the applicability has been set to
                    <i>when Team has 3 people</i>
                </p>
                <p>The output would be that teams of 3 should have at least one person with a GPA above 5 assuming there are enough people that fulfil this criteria.
                </p>                
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
