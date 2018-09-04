<template>
    <div class="limit-satisfaction-charts">
        <!-- <BarChart :chart-data="chartDataActual" :options="options"></BarChart> -->
        <!-- <BarChart :chart-data="chartDataExpected" :options="options"></BarChart> -->
        <!-- <BarChart :chart-data="expectedChartDatasetPie" :height="200" :options="generateOptions('Expected Distribution', true)"></BarChart> -->
        <BarChart :chart-data="chartData" :height="200" :options="generateOptions('Distribution of records with ' + this.constraintFilterText + ' among '+ this.stratumLabel + 's', true)"></BarChart>

    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";
import BarChart from "./BarChart.vue";
// const colors = ["red", "green", "blue", "orange", "purple"];
@Component({
  components: {
    BarChart
  }
})
export default class LimitSatisfactionBarChart extends Vue {
  @Prop data = p<any>({ required: true, default: () => {} });
  @Prop constraintFilterText = p({ type: String, required: false, default: "" });
  @Prop stratumLabel = p({ type: String, required: false, default: () => "" });

  get actualDistribution() {
    return Object.keys(this.data.distributionMap.actual).map(k => [this.data.distributionMap.actual[k], k]);
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
      //   labels: ["Actual vs Expected"],
      //   datasets: this.actualDataSet,
      options: this.generateOptions("Chart", true),
      datasets: [
        {
          backgroundColor: ["#50B432", "#ED561B", "#DDDF00", "#24CBE5", "#64E572", "#FF9655", "#FFF263", "#6AF9C4"],
          hoverBackgroundColor: ["#50B432", "#ED561B", "#DDDF00", "#24CBE5", "#64E572", "#FF9655", "#FFF263", "#6AF9C4"],
          hoverBorderColor: "#111111",
          data: this.actualDistribution.map(d => d[0])
        }
        // {
        //   label: this.yLabel + " (Expected)",
        //   backgroundColor: ["#50B432", "#ED561B", "#DDDF00", "#24CBE5", "#64E572", "#FF9655", "#FFF263", "#6AF9C4"],
        //   hoverBackgroundColor: ["#50B432", "#ED561B", "#DDDF00", "#24CBE5", "#64E572", "#FF9655", "#FFF263", "#6AF9C4"],
        //   hoverBorderColor: '#111111',
        //   data: this.expectedDistribution.map(d => d[0])
        // }
      ]
    };
  }

  buildPieChartData(distribution: any) {
    return {
      labels: distribution.map((d: any) => this.stratumLabel + "s with " + d[1] + " " + this.data.constraint.filter.column.label),
      datasets: [
        {
          label: distribution.map((d: any) => d[0] + this.stratumLabel + "s"),
          fill: true,
          data: distribution.map((d: any) => d[0]),
          backgroundColor: ["#50B432", "#ED561B", "#DDDF00", "#24CBE5", "#64E572", "#FF9655", "#FFF263", "#6AF9C4"],
          hoverBorderColor: "#000000"
        }
      ]
    };
  }
  get expectedChartDatasetPie() {
    return this.buildPieChartData(this.expectedDistribution);
  }

  get actualChartDatasetPie() {
    return this.buildPieChartData(this.actualDistribution);
  }

  get combinedChartDatasetPie() {
    return [this.expectedChartDatasetPie, this.actualChartDatasetPie];
  }

  generateOptions(title: string, legend: boolean) {
    const stratumLabel = this.stratumLabel;
    const constraintFilterText = this.constraintFilterText;
    return {
      title: {
        display: true,
        text: title
      },
      responsive: false,
      maintainAspectRatio: true,
      legend: { display: legend },
      tooltips: {
        callbacks: {
          label: function(tooltipItem: any, data: any) {
            const indice = tooltipItem.index;
            return data.datasets[0].data[indice] + ' ' + stratumLabel + 's have ' + data.labels[indice] + ' record(s) with ' + constraintFilterText;
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