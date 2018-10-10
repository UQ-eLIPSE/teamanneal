<script lang="ts">
import Vue, { VNode, CreateElement } from "vue";

import { Record, RecordElement } from "../../../common/Record";
import { SatisfactionMap, NodeSatisfactionObject } from "../../../common/ConstraintSatisfaction";

import { GroupNode } from "../data/GroupNode";
import { GroupNodeIntermediateStratum } from "../data/GroupNodeIntermediateStratum";
import { GroupNodeLeafStratum } from "../data/GroupNodeLeafStratum";
import { GroupNodeNameMap } from "../data/GroupNodeNameMap";
import { GroupNodeRecordArrayMap } from "../data/GroupNodeRecordArrayMap";
import { ResultsEditor as S } from "../store";

type Props = (
    Props_NodeStratumWithRecordChildren |
    Props_NodeStratumWithStratumChildren
)

interface Props_NodeStratumWithRecordChildren {
    node: GroupNodeLeafStratum,
    depth: number,
    totalNumberOfColumns: number,
    recordLookupMap: Map<RecordElement, Record>,
    nodeNameMap: GroupNodeNameMap | undefined,
    nodeRecordMap: GroupNodeRecordArrayMap | undefined,
    nodeStyles: Map<string | RecordElement, { color?: string, backgroundColor?: string }> | undefined,
    constraintSatisfactionMap: SatisfactionMap | undefined,
    onItemClick: (data: ({ node: GroupNode } | { recordId: RecordElement })[]) => void,
    onToggleNodeVisibility: (node: GroupNode) => void,
    collapsedNodes: { [key: string]: true },
    nodePassingChildrenMapArray: { [nodeId: string]: { constraintId: string, passText: string }[] }

}

interface Props_NodeStratumWithStratumChildren {
    node: GroupNodeIntermediateStratum,
    depth: number,
    totalNumberOfColumns: number,
    recordLookupMap: Map<RecordElement, Record>,
    nodeNameMap: GroupNodeNameMap | undefined,
    nodeRecordMap: GroupNodeRecordArrayMap | undefined,
    nodeStyles: Map<string | RecordElement, { color?: string, backgroundColor?: string }> | undefined,
    constraintSatisfactionMap: SatisfactionMap | undefined,
    onItemClick: (data: ({ node: GroupNode } | { recordId: RecordElement })[]) => void,
    onToggleNodeVisibility: (node: GroupNode) => void,
    collapsedNodes: { [key: string]: true },
    nodePassingChildrenMapArray: { [nodeId: string]: { constraintId: string, passText: string }[] }
}

// Determines how big the cell is and the associated percent
/*interface ConstraintCell {
    constraintPercent: number,
    rowspan: number
}*/

function propsHasRecordChildren(p: Props): p is Props_NodeStratumWithRecordChildren {
    return p.node.type === "leaf-stratum";
}

function getGroupHeadingLabel(p: Props) {
    if (p.nodeNameMap === undefined) {
        return p.node._id;
    }

    const name = p.nodeNameMap[p.node._id];

    if (name === undefined) {
        return p.node._id;
    }

    return name;
}

function getRows(p: Props_NodeStratumWithRecordChildren) {
    const recordMap = p.nodeRecordMap;

    if (recordMap === undefined) {
        throw new Error("Node record array map not defined; cannot fetch record");
    }

    const recordIds = recordMap[p.node._id] || [];

    return recordIds.map(id => ({ id, data: p.recordLookupMap.get(id)! }));
}

function getInnerNodes(p: Props_NodeStratumWithStratumChildren) {
    return p.node.children;
}

function displayToggleVisibilityButtonText(p: Props) {
    return isNodeVisible(p) ? "-" : "+";
}

function isNodeVisible(p: Props) {
    return p.collapsedNodes[p.node._id] === undefined;
}

/** Gets the count of children */
function getNumberOfDescendants(rootNode: GroupNodeIntermediateStratum | GroupNodeLeafStratum, p: Props) {
    let output = 0;

    if (p.collapsedNodes[rootNode._id] === undefined) {
        if (rootNode.type == "intermediate-stratum") {
            for (let i = 0; i < rootNode.children.length; i++) {
                const child = rootNode.children[i];
                if (child.type == "leaf-stratum" && (p.collapsedNodes[child._id] === undefined)) {
                    output = output + getNumberOfDescendants(child, p);
                }

                // Even if the child is invisible, still add to the count
                output = output + 1;
            }
        } else {
            // We are probably a leaf at this point
            if (p.nodeRecordMap && p.nodeRecordMap[rootNode._id]) {
                return p.nodeRecordMap[rootNode._id].length;
            } else {
                return 0;
            }
        }

        return output;
    } else {
        // It's invisible
        return 0;
    }
}


function orderConstraints(nodeSatisfactionObject: NodeSatisfactionObject): string[] {
    const constraints = S.state.constraintConfig.constraints;
    const orderedConstraints: string[] = [];

    // Push to array in the order of result editor's constraint array
    constraints.forEach((constraint) => {
        Object.keys(nodeSatisfactionObject).forEach((constraintId) => {
            if (constraint._id === constraintId) {
                orderedConstraints.push(constraint._id);
            }
        });
    });

    return orderedConstraints;
}

function passClasses(x: { constraintId: string, passText: string }) {
    const classes: string[] = [];
    if (!x || !x.passText) return classes;

    const parts = x.passText.split('/');
    const passing = parseInt(parts[0]);
    const total = parseInt(parts[1]);
    if (passing === 0) {
        // All failed, red
        classes.push("pass-fail")
    } else if (passing === total) {
        // All passed, green
        classes.push("pass-success");
    } else {
        // Passing not equal to total, yellow
        classes.push("pass-avg");
    }

    return classes;
}

/** Creates the heading elements for stratum nodes */
function createGroupHeading(createElement: CreateElement, onItemClick: (data: ({ node: GroupNode } | { recordId: RecordElement })[]) => void, p: Props) {
    const leadingPadCells = p.depth;
    const totalNumberOfColumns = p.totalNumberOfColumns;
    const heading = getGroupHeadingLabel(p);


    const headingContentElementArray = [
        createElement("div", { class: "label", attrs: { id: p.node._id } }, heading),
    ];

    // Get the rowspan associated with the cell, remember to include self
    const rowspan = getNumberOfDescendants(p.node, p) + 1;

    // Iterate through satisfactions
    let satisfaction: NodeSatisfactionObject = {};
    let orderedConstraintsArray: string[] = [];

    if (p.constraintSatisfactionMap && p.constraintSatisfactionMap[p.node._id]) {
        satisfaction = p.constraintSatisfactionMap[p.node._id];

        // Get constraints in the correct order since Object.keys() doesn't guarantee order
        orderedConstraintsArray = orderConstraints(satisfaction);
    }



    // Get style information from node style map
    const style = p.nodeStyles && p.nodeStyles.get(p.node._id);

    return createElement("tr", [
        createElement("td",
            {
                class: "tree-indicator",
                attrs: { colspan: leadingPadCells }
            },
            [
                createElement("button", {
                    class: "toggle-visibility-button",
                    on: {
                        click: () => {
                            // Call `onToggleNodeVisibility` (a function which was passed down as prop to toggle node visibility) with the current `node` as an argument.
                            p.onToggleNodeVisibility(p.node);
                        }
                    }
                }, displayToggleVisibilityButtonText(p))
            ]
        ),
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
        orderedConstraintsArray.map((element) => {
            return createElement("td", {
                class: "strata-satisfaction " + (satisfaction[element]! === 1 ? "sat-success" : "sat-fail"),
                attrs: {
                    rowspan: rowspan
                }
                // This should just return an empty/irrelvant element
            }, satisfaction[element]! === 1 ? "P" : "F");
        }),
        // Append the number of nodes which pass for per constraint
        (p.nodePassingChildrenMapArray[p.node._id] || []).map(x => {
            return createElement("td", {
                class: ["strata-satisfaction", ...passClasses(x)]
            }, x.passText)
        })
    ]);
}

/** Creates elements for records */
// TODO: Fix `any` type for style
function createRecordContentRow(createElement: CreateElement, onItemClick: (data: ({ node: GroupNode } | { recordId: RecordElement })[]) => void, recordId: RecordElement, cells: Record, p: Props_NodeStratumWithRecordChildren) {
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

export default Vue.component<Props>("SpreadsheetTreeView2AnnealNodeStratum", {
    functional: true,

    props: {
        node: { required: true, },
        depth: { type: Number, required: true, },
        totalNumberOfColumns: { type: Number, required: true, },
        recordLookupMap: { required: true, },
        nodeNameMap: { required: false, },
        nodeRecordMap: { required: false, },
        nodeStyles: { required: false },
        constraintSatisfactionMap: { required: false, },
        onToggleNodeVisibility: { required: true },
        onItemClick: { required: true, },
        collapsedNodes: { required: true },
        nodePassingChildrenMapArray: { required: false, default: () => Object.create(Object.prototype) }

    },

    render: function(h, ctx) {
        const p = ctx.props;
        // This appends information about the current stratum node to the item
        // click chain
        const __onItemClick = (data: ({ node: GroupNode } | { recordId: RecordElement })[]) => {
            p.onItemClick([{ node: p.node }, ...data]);
        }
        // We're constructing the component manually due to restrictions on how
        // we can create multi-root-node components with Vue and templates in
        // vue-loader.
        // 
        // See https://github.com/vuejs/vue-loader/issues/1168

        // Do not render if parent `node` is hidden
        const elements: VNode[] = [
            createGroupHeading(h, __onItemClick, p),
        ];

        // If the node is hidden, we let the heading be rendered;
        // don't render anything else, including children
        if (isNodeVisible(p)) {
            // If `node` is not hidden, display children
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
                            nodeRecordMap: p.nodeRecordMap,
                            nodeStyles: p.nodeStyles,
                            constraintSatisfactionMap: p.constraintSatisfactionMap,
                            onItemClick: __onItemClick,
                            onToggleNodeVisibility: p.onToggleNodeVisibility,
                            collapsedNodes: p.collapsedNodes
                        }
                    })
                ));
            }
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

.toggle-visibility-button {
    border: 0.1em solid rgba(100, 80, 80, 0.5);
    color: #3c3c3c;
    background: rgba(119, 129, 139, 0.25);
    cursor: pointer;
    border-radius: 0.1rem;
    width: 1rem;
    height: 1rem;
    padding: 0;
    text-align: center;
    font-size: 0.7em;
}

.toggle-visibility-button:hover,
.toggle-visibility-button:active,
.toggle-visibility-button:focus {
    background: rgba(119, 129, 139, 0.1);
}

.strata-satisfaction {
    border: 1px solid transparent;
    opacity: 0.7;
    z-index: 8;
    text-align: center;
    padding: 0.5rem;
}

.sat-success {
    color: #155724;
    background-color: rgb(198, 239, 206);
    border-color: #c3e6cb;
}

.sat-fail {
    color: rgb(156, 0, 6);
    background-color: rgb(255, 199, 206);
    border-color: #f5c6cb;
}

.strata-satisfaction:hover,
.strata-satisfaction:focus,
.strata-satisfaction:active {
    opacity: 1;
}

.group-heading:hover~.strata-satisfaction {
    opacity: 1;
}

.record-content:hover {
    background: #fafafa;
}

.pass-success {
    color: white;
    background-color: green;
    border-color: #c3e6cb;
}

.pass-fail {
    background-color: rgb(156, 0, 6);
    color: rgb(255, 199, 206);
    border-color: #f5c6cb;
}

.pass-avg {
    background-color: #d39e00;
    color: white;
    border-color: #c69500;
}
</style>
