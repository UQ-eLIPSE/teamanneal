<script lang="ts">
import Vue, { VNode, CreateElement } from "vue";

import * as AnnealNode from "../../../common/AnnealNode";

type Props = (
    Props_NodeStratumWithRecordChildren |
    Props_NodeStratumWithStratumChildren
)

interface Props_NodeStratumWithRecordChildren {
    node: AnnealNode.NodeStratumWithRecordChildren,
    depth: number,
    totalNumberOfColumns: number,
    recordLookupMap: Map<string | number | null, ReadonlyArray<number | string | null>>,
}

interface Props_NodeStratumWithStratumChildren {
    node: AnnealNode.NodeStratumWithStratumChildren,
    depth: number,
    totalNumberOfColumns: number,
    recordLookupMap: Map<string | number | null, ReadonlyArray<number | string | null>>,
}

function getLabel(p: Props) {
    return `AnnealNode.NodeStratum[${p.node._id}]`;
}

function nodeHasRecordChildren(p: Props): p is Props_NodeStratumWithRecordChildren {
    return p.node.type === "stratum-records";
}

function getRows(p: Props_NodeStratumWithRecordChildren) {
    return p.node.recordIds.map(id => ({ id, data: p.recordLookupMap.get(id)! }));
}

function getInnerNodes(p: Props_NodeStratumWithStratumChildren) {
    return p.node.children;
}

function createRecordContentRow(createElement: CreateElement, cells: ReadonlyArray<number | string | null>, leadingPadCells: number) {
    return createElement("tr", { class: "record-content" }, [
        ...Array.from({ length: leadingPadCells }, () => createElement("td", { class: "blank" })),
        ...cells.map((cellValue) => {
            return createElement("td", { class: getCellClasses(cellValue) }, getCellDisplayedValue(cellValue));
        }),
    ]);
}

function getCellClasses(cellValue: number | string | null) {
    return {
        "nan": Number.isNaN(cellValue as any),
        "null": cellValue === null,
    };
}

function getCellDisplayedValue(cellValue: number | string | null) {
    if (cellValue === null) {
        return undefined;
    }

    return "" + cellValue;
}

export default Vue.component<Props>("SpreadsheetTreeView2AnnealNodeStratum", {
    functional: true,

    props: {
        node: { required: true, },
        depth: { type: Number, required: true, },
        totalNumberOfColumns: { type: Number, required: true, },
        recordLookupMap: { required: true, },
    },

    render: function(h, ctx) {
        const p = ctx.props;

        // We're constructing the component manually due to restrictions on how
        // we can create multi-root-node components with Vue and templates in
        // vue-loader.
        // 
        // See https://github.com/vuejs/vue-loader/issues/1168

        const elements: VNode[] = [
            h("tr", [
                h("td", { class: "tree-indicator", attrs: { colspan: p.depth } }, "-"),
                h("td", { class: "group-heading", attrs: { colspan: p.totalNumberOfColumns - p.depth } }, getLabel(p)),
            ]),
        ];

        if (nodeHasRecordChildren(p)) {
            // Render records here
            elements.push(...getRows(p).map(row => createRecordContentRow(h, row.data, p.depth)));
        } else {
            // Render further strata
            elements.push(...getInnerNodes(p).map(child =>
                // Recurse down using this same component
                h("SpreadsheetTreeView2AnnealNodeStratum", {
                    props: {
                        node: child,
                        depth: p.depth + 1,
                        totalNumberOfColumns: p.totalNumberOfColumns,
                        recordLookupMap: p.recordLookupMap,
                    }
                })
            ));
        }

        // NOTE: We're overriding the type annotation as functional components
        // allow VNode[], however Vue's type definition does not permit this at
        // the moment, so we pretend that this is just a single VNode.
        return elements as any as VNode;
    }
});
</script>

<!-- ####################################################################### -->

<style scoped>
.group-heading {
    border: 1px solid #ddd;
    text-align: inherit;

    background: #738;
    color: #fff;
    font-weight: 400;
    padding: 0.1em 0.5em;
}

.tree-indicator {
    border: 0;
    padding: 0;

    width: 2em;
    min-width: 2em;
    max-width: 2em;

    text-align: right;
}


.record-content td {
    border: 1px solid #ddd;
    text-align: inherit;

    padding: 0.5em;

    white-space: nowrap;
}

.record-content td.blank {
    border: 0;
    padding: 0;

    width: 2em;
    min-width: 2em;
    max-width: 2em;
}

.nan {
    background: #fee;
    color: #f00;
}

.nan::before {
    content: "Not a number";
    font-style: italic;
    font-size: 0.7em;
}

.null {
    background: #eef;
    color: #00f;
}

.null::before {
    content: "No value";
    font-style: italic;
    font-size: 0.7em;
}
</style>
