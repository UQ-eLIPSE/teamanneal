import * as ToServerAnnealRequest from "../../../common/ToServerAnnealRequest";
import * as HTTPResponseCode from "../core/HTTPResponseCode";
import * as Logger from "../core/Logger";
import * as Util from "../core/Util";

import * as express from "express";

// Middleware
import * as SourceDataCheckValidity from "../middleware/SourceDataCheckValidity";
import * as ConstraintCheckValidity from "../middleware/ConstraintCheckValidity";

// Data manipulation and structures
import * as SourceData from "../data/SourceData";
import * as AnnealNode from "../data/AnnealNode";
import * as GroupDistribution from "../data/GroupDistribution";
import * as ColumnInfo from "../data/ColumnInfo";

const globalLogger = Logger.getGlobal();
const log = Logger.log(globalLogger);

// Signature of exported function must not be altered for all routers
module.exports = () => {
    const router = express.Router();

    router.route("/")
        .post(
        // Validation middleware
        // TODO: More input validation
        SourceDataCheckValidity.generate(req => req.body.sourceData),
        ConstraintCheckValidity.generate(req => req.body.constraints),

        // Run anneal
        anneal
        );

    return router;
};

const anneal: express.RequestHandler =
    (req, res, _next) => {
        const data: ToServerAnnealRequest.Root = req.body;

        // Convert sourceData description to that which uses partitioned record
        // arrays, if records are not already partitioned
        const sourceData = SourceData.convertToPartitionedRecordArrayDesc(data.sourceData)
        const partitions = sourceData.records;

        // An array of all records in the data set
        const allRecords = Util.concatArrays(partitions);



        /// =========================
        /// Gather column information
        /// =========================

        const columnInfos = sourceData.columns.map((column, i) => {
            return ColumnInfo.initFromColumnIndex(allRecords, i, column);
        });



        /// =====================
        /// Parallelisable anneal
        /// =====================

        // Operate per partition (isolated data sets - can be parallelised)
        const output = partitions.map((partition, i) => {
            log("info")(`Annealing partition ${i + 1}`);

            /// ================================
            /// Structuring the data into a tree
            /// ================================

            // Convert all records into AnnealNodes
            // Records are leaves for our AnnealNode tree
            const leaves = partition.map(AnnealNode.init);

            // Shuffle all leaves now
            // This only needs to be done once - there is no advantage in
            // shuffling nodes higher up in the tree
            let nodes = Util.shuffleArray(leaves);

            // Go over each stratum
            const strata = data.strata;

            // Hold references to each node created per stratum
            const strataNodes: ReadonlyArray<AnnealNode.AnnealNode>[] = [];

            strata.forEach((stratum) => {
                // Calculate number of groups to form
                const numberOfGroups = GroupDistribution.calculateNumberOfGroups(nodes.length, stratum.size.min, stratum.size.ideal, stratum.size.max, false);

                // Splice into groups
                const groups = GroupDistribution.sliceIntoGroups(numberOfGroups, nodes);

                // Create new nodes for this stratum from new groups above
                const thisStratumNodes = groups.map(AnnealNode.createNodeFromChildrenArray);

                // Build up arrays of AnnealNode that are represented at each
                // stratum
                strataNodes.push(thisStratumNodes);

                // Build up AnnealNode tree by updating `nodes` to refer to the
                // array of nodes from this stratum; this is reused on next loop
                nodes = thisStratumNodes;
            });

            // Create root node
            const rootNode = AnnealNode.createNodeFromChildrenArray(nodes);



            /// =================
            /// Calculating costs
            /// =================

            // TODO:
            // * Separate out constraints per stratum
            //
            // --- FIRST ROUND COST CALC ---
            //
            // * For each stratum (bottom up),
            //      * For each node of that stratum,
            //          * This node's cost = sum of all costs of immediate
            //            children
            //          * Find all **leaves** that are connected to that node
            //          * Calculate costs per constraint for that node
            //          * Add cost to node's existing cost
            //          * Update node cost via. CostCache
            //
            // * Calculate total cost = sum of costs of root node's immediate
            //                          children
            //
            // --- FURTHER ROUND COST CALC (after swap, move, etc.) ---
            //
            // (At this point the cost caches would be invalidated for affected
            // nodes only)
            // (Maybe we could keep track of which nodes had costs invalidated
            // to make the below loop shorter?)
            // 
            // * For each stratum (bottom up)
            //      * For each node with **invalidated** cost cache,
            //          * This node's cost = sum of all costs of immediate
            //            children
            //          * Find all **leaves** that are connected to that node
            //          * Calculate costs per constraint for that node
            //          * Add cost to node's existing cost
            //          * Update node cost via. CostCache
            //
            // * Calculate total cost = sum of costs of root node's immediate
            //                          children

            return true;
        });

        return res
            .status(HTTPResponseCode.SUCCESS.OK)
            .json({
                output,
            });
    };
