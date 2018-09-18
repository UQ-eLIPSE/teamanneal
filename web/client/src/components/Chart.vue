<!--

*******************************************************************
* THIS CHART FEATURE MAY BE USEFUL IN THE FUTURE
* NOT BEING USED FOR NOW
*******************************************************************

-->

<script>

import { Doughnut, mixins } from "vue-chartjs";

export default {

  extends: Doughnut,
  props: ["options"],
  mixins: [mixins.reactiveProp],

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