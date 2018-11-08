<template>
    <div class="displayFilterBody">
        <!-- Spinner from http://tobiasahlin.com/spinkit/ modified for TA styling -->
        <div v-if="pLoading" class="sk-fading-circle">
            <div class="sk-circle1 sk-circle"></div>
            <div class="sk-circle2 sk-circle"></div>
            <div class="sk-circle3 sk-circle"></div>
            <div class="sk-circle4 sk-circle"></div>
            <div class="sk-circle5 sk-circle"></div>
            <div class="sk-circle6 sk-circle"></div>
            <div class="sk-circle7 sk-circle"></div>
            <div class="sk-circle8 sk-circle"></div>
            <div class="sk-circle9 sk-circle"></div>
            <div class="sk-circle10 sk-circle"></div>
            <div class="sk-circle11 sk-circle"></div>
            <div class="sk-circle12 sk-circle"></div>
        </div>        
        <span class="display-text">Display </span>
        <select :disabled="pLoading" v-model="selectedDepth">
            <option v-for="(s, i) in strataLevels" :key="i" :value="i">{{s}}</option>
        </select>
    </div>
</template>
<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Lifecycle, Watch } from "av-ts";
import { ResultsEditor as S } from "../store";
import { GroupNodeRoot } from "../data/GroupNodeRoot";
import { GroupNodeIntermediateStratum } from "../data/GroupNodeIntermediateStratum";
import { GroupNodeLeafStratum } from "../data/GroupNodeLeafStratum";

@Component
export default class SpreadsheetDisplayFilter extends Vue {
    /** Caches nodes for given depths */
    cachedDepthToNodeArrayMap:  { [depth: number]: string[] } = {};
    pLoading: boolean = false;

    get memberLevel() {
        return this.leafStratum.label + ' ' + 'members';
    }

    get leafStratum() {
        return S.state.strataConfig.strata[S.state.strataConfig.strata.length - 1];
    }
    get selectedDepth() {
        return S.state.requestDepth;
    }

    set selectedDepth(value: number) {
        S.dispatch(S.action.SET_DISPLAY_DEPTH, value);
    }

    @Watch('selectedDepth')
    depthHandler(_old: any, _new: any) {
        this.triggerChange();
    }

    // Gets the levels that users can choose to display
    get strataLevels() {
        const levels: string[] = [];
        const strata = S.state.strataConfig.strata;

        // Get the partition if applicable
        if (S.get(S.getter.IS_DATA_PARTITIONED)) {
            levels.push(S.state.recordData.partitionColumn!.label);
        }

        for(let i = 0; i < strata.length; i++) {
            levels.push(strata[i].label);
        }

        // Final push would be the default/lower case of members
        levels.push(this.memberLevel);

        return levels;
    }

    get nodeRoots() {
        return S.state.groupNode.structure.roots;
    }

    get collapsedNodes() {
        return S.state.collapsedNodes;
    }

    // If targetdepth <= depth, add it to the list
    recursePathDepth(incomingNode: GroupNodeRoot | GroupNodeIntermediateStratum | GroupNodeLeafStratum, targetDepth: number, depth: number, output: string[]) {

        if ((incomingNode.type === "root") || (incomingNode.type === "intermediate-stratum")) {
            for(let i = 0 ; i < incomingNode.children.length; i++) {
                this.recursePathDepth(incomingNode.children[i], targetDepth, depth + 1, output);
            }
        }

        // Push and grab the children too
        if(S.get(S.getter.IS_DATA_PARTITIONED)) {
            if (targetDepth <= depth) {
                output.push(incomingNode._id);
            }
        } else {
            // Issue is we need to check if we have an actual root or not in terms of pushing
            if (targetDepth < depth) {
                output.push(incomingNode._id);
            }
        }


        return output;
    }
    
    async collapseOnDepth(value: number) {
        // Traverse through the path and delete all the nodes necessary

        if (this.cachedDepthToNodeArrayMap[value] === undefined) {
            let output: string[] = [];
            const TOP_LEVEL = 0;

            for (let i = 0; i < this.nodeRoots.length; i++) {
                let tempOutput = this.recursePathDepth(this.nodeRoots[i], value, TOP_LEVEL, []);
                output = output.concat(tempOutput);
            }
            this.cachedDepthToNodeArrayMap[value] = output;
        }

        await S.dispatch(S.action.COLLAPSE_NODES, this.cachedDepthToNodeArrayMap[value]);
        
        // Hide the spinner
        this.pLoading = false;

        // Inform parent that loading has finished
        this.$emit("loadFinished");
    }
    
    triggerChange() {
        // Inform parent that loading has started
        this.$emit("loadInProgress");

        // Display the spinner
        this.pLoading = true;

        // Not the greatest implementation...
        // The issue with using the watch is that the animation is never actually rendered due to the states
        // being checked after each function call not during the function call (fair enough)
        // Doing on change and @Watch leads to a race condition as well so this is the best
        // I can do for now

        // 0ms forces the event to be queued up eventually...
        window.setTimeout(() => this.collapseOnDepth(this.selectedDepth), 0);
    }

    
    @Lifecycle created() {
        // Setting the initial depth as one level "above" member
        const initialDepth = this.strataLevels.findIndex((level) => level === this.memberLevel) - 1;

        this.selectedDepth = initialDepth;

        // Manually trigger change in depth according to the initial depth
        this.triggerChange();
    }


}
</script>

<!-- ####################################################################### -->

<style scoped>
.displayFilterBody {
    display: flex;
    padding: 0.5rem;
    align-items: center;
    background: rgb(240, 240, 240);
    
}

.displayFilterBody > * {
    margin-left: 0.25rem;
    font-size: 1.25rem;
    padding: 0.25rem;
}

.display-text {
    font-size: 1.5rem;
}

.sk-fading-circle {
  width: 40px;
  height: 40px;
  position: relative;
}

.sk-fading-circle .sk-circle {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
}

.sk-fading-circle .sk-circle:before {
  content: '';
  display: block;
  margin: 0 auto;
  width: 15%;
  height: 15%;
  background-color: #333;
  border-radius: 100%;
  -webkit-animation: sk-circleFadeDelay 1.2s infinite ease-in-out both;
          animation: sk-circleFadeDelay 1.2s infinite ease-in-out both;
}
.sk-fading-circle .sk-circle2 {
  -webkit-transform: rotate(30deg);
      -ms-transform: rotate(30deg);
          transform: rotate(30deg);
}
.sk-fading-circle .sk-circle3 {
  -webkit-transform: rotate(60deg);
      -ms-transform: rotate(60deg);
          transform: rotate(60deg);
}
.sk-fading-circle .sk-circle4 {
  -webkit-transform: rotate(90deg);
      -ms-transform: rotate(90deg);
          transform: rotate(90deg);
}
.sk-fading-circle .sk-circle5 {
  -webkit-transform: rotate(120deg);
      -ms-transform: rotate(120deg);
          transform: rotate(120deg);
}
.sk-fading-circle .sk-circle6 {
  -webkit-transform: rotate(150deg);
      -ms-transform: rotate(150deg);
          transform: rotate(150deg);
}
.sk-fading-circle .sk-circle7 {
  -webkit-transform: rotate(180deg);
      -ms-transform: rotate(180deg);
          transform: rotate(180deg);
}
.sk-fading-circle .sk-circle8 {
  -webkit-transform: rotate(210deg);
      -ms-transform: rotate(210deg);
          transform: rotate(210deg);
}
.sk-fading-circle .sk-circle9 {
  -webkit-transform: rotate(240deg);
      -ms-transform: rotate(240deg);
          transform: rotate(240deg);
}
.sk-fading-circle .sk-circle10 {
  -webkit-transform: rotate(270deg);
      -ms-transform: rotate(270deg);
          transform: rotate(270deg);
}
.sk-fading-circle .sk-circle11 {
  -webkit-transform: rotate(300deg);
      -ms-transform: rotate(300deg);
          transform: rotate(300deg); 
}
.sk-fading-circle .sk-circle12 {
  -webkit-transform: rotate(330deg);
      -ms-transform: rotate(330deg);
          transform: rotate(330deg); 
}
.sk-fading-circle .sk-circle2:before {
  -webkit-animation-delay: -1.1s;
          animation-delay: -1.1s; 
}
.sk-fading-circle .sk-circle3:before {
  -webkit-animation-delay: -1s;
          animation-delay: -1s; 
}
.sk-fading-circle .sk-circle4:before {
  -webkit-animation-delay: -0.9s;
          animation-delay: -0.9s; 
}
.sk-fading-circle .sk-circle5:before {
  -webkit-animation-delay: -0.8s;
          animation-delay: -0.8s; 
}
.sk-fading-circle .sk-circle6:before {
  -webkit-animation-delay: -0.7s;
          animation-delay: -0.7s; 
}
.sk-fading-circle .sk-circle7:before {
  -webkit-animation-delay: -0.6s;
          animation-delay: -0.6s; 
}
.sk-fading-circle .sk-circle8:before {
  -webkit-animation-delay: -0.5s;
          animation-delay: -0.5s; 
}
.sk-fading-circle .sk-circle9:before {
  -webkit-animation-delay: -0.4s;
          animation-delay: -0.4s;
}
.sk-fading-circle .sk-circle10:before {
  -webkit-animation-delay: -0.3s;
          animation-delay: -0.3s;
}
.sk-fading-circle .sk-circle11:before {
  -webkit-animation-delay: -0.2s;
          animation-delay: -0.2s;
}
.sk-fading-circle .sk-circle12:before {
  -webkit-animation-delay: -0.1s;
          animation-delay: -0.1s;
}

@-webkit-keyframes sk-circleFadeDelay {
  0%, 39%, 100% { opacity: 0; }
  40% { opacity: 1; }
}

@keyframes sk-circleFadeDelay {
  0%, 39%, 100% { opacity: 0; }
  40% { opacity: 1; } 
}

</style>
