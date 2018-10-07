<!--

*******************************************************************
* THIS CHART FEATURE MAY BE USEFUL IN THE FUTURE
* NOT BEING USED FOR NOW
*******************************************************************

-->

<template>
    <div class="limit-satisfaction-charts">
        <Chart :chart-data="chartData" :height="200" :options="generatedOptions"></Chart>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";
import Chart from "./Chart.vue";

@Component({
  components: {
    Chart
  }
})
export default class LimitSatisfactionChart extends Vue {
  @Prop data = p<any>({ required: true, default: () => {} });
  @Prop constraintFilterText = p({ type: String, required: false, default: "" });
  @Prop stratumLabel = p({ type: String, required: false, default: () => "" });

  get actualDistribution() {
    return Object.keys(this.data.distributionMap.actual).map(k => [this.data.distributionMap.actual[k], k]);
  }

  get generatedOptions() {
    const chartDescription = 'Distribution of records with ' + this.constraintFilterText + ' (among '+ this.stratumLabel + 's)';
    const chartTitle = 'Actual v/s Expected distribution';
    return this.generateOptions([chartDescription, chartTitle], true);
  }

  get expectedDistribution() {
    return Object.keys(this.data.distributionMap.expected).map(k => [this.data.distributionMap.expected[k], k]);
  }

  calculateColor(expectedDistributionExists?: boolean, percentDifference?: number) {
    if (percentDifference === undefined) return "rgba(1, 0, 0, 0.1)";

    if (expectedDistributionExists !== undefined && expectedDistributionExists === false) {
      return "rgba(248, 121, 121, 0.3)";
    }

    return `hsla(${(100 - percentDifference) * 1.2}, 100%, 40%, 0.8)`;
  }

  get distributionDeltaColorsArray() {
    return this.actualDistribution.map(d => {
      if (this.data.distributionMap.expected[d[1]] !== undefined) {
        const percentDifference = Math.abs(this.data.distributionMap.expected[d[1]] - d[0]) / this.data.distributionMap.expected[d[1]] * 100;
        return this.calculateColor(true, percentDifference);
      } else {
        return this.calculateColor(false);
      }
    });
  }

  get chartData() {
    return {
      labels: this.actualDistribution.map(d => d[1]),
      datasets: [
        {
          label: "Actual",
          backgroundColor: ["#50B432", "#ED561B", "#DDDF00", "#24CBE5", "#64E572", "#FF9655", "#FFF263", "#6AF9C4"],
          hoverBackgroundColor: ["#50B432", "#ED561B", "#DDDF00", "#24CBE5", "#64E572", "#FF9655", "#FFF263", "#6AF9C4"],
          hoverBorderColor: "#111111",
          data: this.actualDistribution.map(d => d[0])
        },
        {
          label: "Expected",
          backgroundColor: ["#50B432", "#ED561B", "#DDDF00", "#24CBE5", "#64E572", "#FF9655", "#FFF263", "#6AF9C4"],
          hoverBackgroundColor: ["#50B432", "#ED561B", "#DDDF00", "#24CBE5", "#64E572", "#FF9655", "#FFF263", "#6AF9C4"],
          hoverBorderColor: '#111111',
          data: this.expectedDistribution.map(d => d[0])
        }
      ]
    };
  }

  generateTooltipCallbackConfiguration(stratumLabel: string, constraintFilterText: string, datasetLabel: string) {
    return function(tooltipItem: any, data: any) {
            const indice = tooltipItem.index;
            return datasetLabel + ':' + data.datasets[0].data[indice] + ' ' + stratumLabel + 's have ' + data.labels[indice] + ' record(s) with ' + constraintFilterText;
    }
  }

  generateOptions(title: string[], legendEnabled: boolean) {
    const stratumLabel = this.stratumLabel;
    const constraintFilterText = this.constraintFilterText;
    return {
      title: {
        display: true,
        text: title
      },
      responsive: false,
      maintainAspectRatio: true,
      legend: { 
        display: legendEnabled,

      },
      tooltips: {
        callbacks: {
          label: function(tooltipItem: any, data: any) {
            const actualExpectedString = data.datasets[tooltipItem.datasetIndex].label;
            const indice = tooltipItem.index;
            return actualExpectedString + ":" + data.datasets[0].data[indice] + ' ' + stratumLabel + 's have ' + data.labels[indice] + ' record(s) with ' + constraintFilterText;
          }
        }
      }
    };
  }
}
</script>

<!-- ####################################################################### -->

<style scoped>
.limit-satisfaction-charts {
  display: flex;
  flex-flow: row;
  flex-wrap: wrap;
}
</style>