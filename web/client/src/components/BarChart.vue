<script>

import { Doughnut } from "vue-chartjs";


export default {

  extends: VueChartJs.Doughnut,
  props: ["options"],
  mixins: [VueChartJs.mixins.reactiveProp],

  mounted() {
    this.renderChart(this.chartData, this.options);
  }
};
</script>

<!-- ####################################################################### -->

<style scoped>
.chart rect {
  fill: steelblue;
}

.chart text {
  fill: white;
  font: 10px sans-serif;
  text-anchor: end;
}
</style>