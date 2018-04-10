<script lang="ts">
import Vue, { VNode, CreateElement } from "vue";

import * as AnnealNode from "../../../common/AnnealNode";
import { Record, RecordElement } from "../../../common/Record";

import { NodeNameMapNameGenerated } from "../data/ResultTree";

type Props = (
    Props_NodeStratumWithRecordChildren |
    Props_NodeStratumWithStratumChildren
)

interface HiddenNodes {
    Records: HiddenNodesWithRecordChildren,
    Strata: HiddenNodesWithStratumChildren
}

interface HiddenNodesWithRecordChildren {
    [key: string]: RecordElement[]
}

interface HiddenNodesWithStratumChildren {
    [key: string]: AnnealNode.NodeStratumWithStratumChildren
}

interface Props_NodeStratumWithRecordChildren {
    node: AnnealNode.NodeStratumWithRecordChildren,
    depth: number,
    totalNumberOfColumns: number,
    recordLookupMap: Map<RecordElement, Record>,
    nodeNameMap: NodeNameMapNameGenerated | undefined,
    nodeStyles: Map<AnnealNode.Node | RecordElement, { color?: string, backgroundColor?: string }> | undefined,
    constraintSatisfactionMap: { [nodeId: string]: number | undefined } | undefined,
    onItemClick: (data: ({ node: AnnealNode.Node } | { recordId: RecordElement })[]) => void,
    onToggleItemVisibility: (node: AnnealNode.Node) => void,
    hiddenStrata: HiddenNodes;
}

interface Props_NodeStratumWithStratumChildren {
    node: AnnealNode.NodeStratumWithStratumChildren,
    depth: number,
    totalNumberOfColumns: number,
    recordLookupMap: Map<RecordElement, Record>,
    nodeNameMap: NodeNameMapNameGenerated | undefined,
    nodeStyles: Map<AnnealNode.Node | RecordElement, { color?: string, backgroundColor?: string }> | undefined,
    constraintSatisfactionMap: { [nodeId: string]: number | undefined } | undefined,
    onItemClick: (data: ({ node: AnnealNode.Node } | { recordId: RecordElement })[]) => void,
    onToggleItemVisibility: (node: AnnealNode.Node) => void,
    hiddenStrata: HiddenNodes;
}

function propsHasRecordChildren(p: Props): p is Props_NodeStratumWithRecordChildren {
    return p.node.type === "stratum-records";
}

function getGroupHeadingLabel(p: Props) {
    if (p.nodeNameMap === undefined) {
        return p.node._id;
    }

    const name = p.nodeNameMap.get(p.node);

    if (name === undefined) {
        return p.node._id;
    }

    return `${name.stratumLabel} ${name.nodeGeneratedName}`;
}

function getRows(p: Props_NodeStratumWithRecordChildren) {
    return p.node.recordIds.filter((recordId) => p.hiddenStrata.Records[recordId + ''] === undefined).map(id => ({ id, data: p.recordLookupMap.get(id)! }));
}

function getInnerNodes(p: Props_NodeStratumWithStratumChildren) {
    return p.node.children.filter((child) => p.hiddenStrata.Records[child._id] === undefined);
}

function displayToggleVisibilityButtonText(p: Props) {
    if (p.node.type === "stratum-records") {
        const visible = p.node.recordIds.every((recordId) => p.hiddenStrata.Records[recordId + ''] === undefined);
        return visible ? "-" : "+";
    }

    if (p.node.type === "stratum-stratum") {
        const visible = p.node.children.every((child) => p.hiddenStrata.Strata[child._id] === undefined);
        return visible ? "-" : "+";
    }

    return ".";
}

/** Creates the heading elements for stratum nodes */
function createGroupHeading(createElement: CreateElement, onItemClick: (data: ({ node: AnnealNode.Node } | { recordId: RecordElement })[]) => void, onHideChildNodes: any, p: Props) {
    const leadingPadCells = p.depth;
    const totalNumberOfColumns = p.totalNumberOfColumns;
    const heading = getGroupHeadingLabel(p);

    const constraintSatisfaction = overallConstraintSatisfaction(p);

    const headingContentElementArray = [
        createElement("div", { class: "label" }, heading),
    ];

    if (constraintSatisfaction !== undefined) {
        headingContentElementArray.push(
            createElement("div", { class: "overall-constraint-satisfaction" }, [
                `${(constraintSatisfaction * 100) >>> 0}%`,
                createElement("meter",
                    {
                        attrs: {
                            value: constraintSatisfaction,
                            min: 0,
                            max: 1,
                            low: 0.5,
                        },
                    }
                )
            ])
        );
    }

    // Get style information from node style map
    const style = p.nodeStyles && p.nodeStyles.get(p.node);

    return createElement("tr", [
        createElement("td",
            {
                class: "tree-indicator",
                attrs: { colspan: leadingPadCells }
            },
            [
                createElement("button", {

                    on: {
                        click: () => {
                            onHideChildNodes(p.node);
                        }
                    }
                }, displayToggleVisibilityButtonText(p))
            ]),
        createElement("td",
            {
                class: "group-heading",
                attrs: { colspan: totalNumberOfColumns - leadingPadCells },
                on: {
                    // When stratum heading clicked emit just blank array as the
                    // actual stratum information is contained by the component 
                    // `render()` function and not here
                    click: () => onItemClick([]),
                },
                style,
            },
            [
                createElement("div", { class: "heading-content" }, headingContentElementArray)
            ]
        ),
    ]);
}

/** Creates elements for records */
// TODO: Fix `any` type for style
function createRecordContentRow(createElement: CreateElement, onItemClick: (data: ({ node: AnnealNode.Node } | { recordId: RecordElement })[]) => void, recordId: RecordElement, cells: Record, p: Props_NodeStratumWithRecordChildren) {
    // Get style information from node style map
    const style = p.nodeStyles && p.nodeStyles.get(recordId);

    return createElement("tr",
        {
            class: "record-content",
            on: {
                // When record clicked, emit record info up
                click: () => onItemClick([{ recordId, }]),
            },
        },
        [
            createElement("td", { class: "leading-pad-cell", attrs: { colspan: p.depth } }),
            ...cells.map((cellValue) => {
                return createElement("td",
                    {
                        class: getCellClasses(cellValue),
                        style,
                    },
                    getCellDisplayedValue(cellValue)
                );
            }),
        ]
    );
}

/** Returns the classes to apply to cells of a given value */
function getCellClasses(cellValue: number | string | null) {
    return {
        "nan": Number.isNaN(cellValue as any),
        "null": cellValue === null,
    };
}

/** Returns the string to display for cells of a given value */
function getCellDisplayedValue(cellValue: number | string | null) {
    if (cellValue === null) {
        return undefined;
    }

    return "" + cellValue;
}

function overallConstraintSatisfaction(p: Props) {
    // No map to use
    if (p.constraintSatisfactionMap === undefined) {
        return undefined;
    }

    return p.constraintSatisfactionMap[p.node._id];
}

export default Vue.component<Props>("SpreadsheetTreeView2AnnealNodeStratum", {
    functional: true,

    props: {
        node: { required: true, },
        depth: { type: Number, required: true, },
        totalNumberOfColumns: { type: Number, required: true, },
        recordLookupMap: { required: true, },
        nodeNameMap: { required: false, },
        nodeStyles: { required: false },
        constraintSatisfactionMap: { required: false, },
        onToggleItemVisibility: { required: true },
        onItemClick: { required: true, },
        hiddenStrata: { required: true }
    },

    render: function(h, ctx) {
        const p = ctx.props;
        // This appends information about the current stratum node to the item
        // click chain
        const __onItemClick = (data: ({ node: AnnealNode.Node } | { recordId: RecordElement })[]) => {
            p.onItemClick([{ node: p.node }, ...data]);
        }

        const __onHideChildNodes = p.onToggleItemVisibility;

        // We're constructing the component manually due to restrictions on how
        // we can create multi-root-node components with Vue and templates in
        // vue-loader.
        // 
        // See https://github.com/vuejs/vue-loader/issues/1168

        // Do not render if parent `node` is hidden
        if (p.hiddenStrata.Strata[p.node._id] === undefined) {
            const elements: VNode[] = [
                createGroupHeading(h, __onItemClick, __onHideChildNodes, p),
            ];

            if (propsHasRecordChildren(p)) {
                // Render records here
                elements.push(...getRows(p).map(row => createRecordContentRow(h, __onItemClick, row.id, row.data, p)));
            } else {
                // Render further strata
                elements.push(...getInnerNodes(p).map((child) =>
                    // Recurse down using this same component
                    h("SpreadsheetTreeView2AnnealNodeStratum", {
                        props: {
                            node: child,
                            depth: p.depth + 1,
                            totalNumberOfColumns: p.totalNumberOfColumns,
                            recordLookupMap: p.recordLookupMap,
                            nodeNameMap: p.nodeNameMap,
                            nodeStyles: p.nodeStyles,
                            constraintSatisfactionMap: p.constraintSatisfactionMap,
                            onItemClick: __onItemClick,
                            onToggleItemVisibility: p.onToggleItemVisibility,
                            hiddenStrata: p.hiddenStrata
                        }
                    })
                ));
            }
            // NOTE: We're overriding the type annotation as functional components
            // allow VNode[], however Vue's type definition does not permit this at
            // the moment, so we pretend that this is just a single VNode.
            return elements as any as VNode;
        }

        return [] as any as VNode;

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

    width: 1em;
    min-width: 1em;
    max-width: 1em;

    text-align: right;
}


.record-content td {
    border: 1px solid #ddd;
    text-align: inherit;

    padding: 0.5em;

    white-space: nowrap;
}

.record-content .leading-pad-cell {
    border: 0;
    padding: 0;
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

.heading-content {
    display: flex;
    flex-direction: row;
}

.heading-content .label {
    flex-grow: 1;
    flex-shrink: 1;
}

.heading-content .overall-constraint-satisfaction {
    flex-grow: 0;
    flex-shrink: 0;

    font-size: 0.8em;
    align-self: center;
}

.heading-content .overall-constraint-satisfaction meter {
    margin-left: 0.7ch;
}
</style>
