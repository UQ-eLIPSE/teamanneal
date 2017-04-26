import * as ToServerAnnealRequest from "../../../common/ToServerAnnealRequest";
import * as HTTPResponseCode from "../core/HTTPResponseCode";
import * as Logger from "../core/Logger";

import * as express from "express";
import * as Data_SourceData from "../data/SourceData";
import * as Data_Constraint from "../data/Constraint";

import * as Util from "../anneal/Util";
import * as Anneal from "../anneal/Anneal";
import * as Partition from "../anneal/Partition";
import * as StringMap from "../anneal/StringMap";
import * as Constraint from "../anneal/Constraint";
import * as ColumnDesc from "../anneal/ColumnDesc";
import * as ColumnInfo from "../anneal/ColumnInfo";
import * as CostFunction from "../anneal/CostFunction";

const globalLogger = Logger.getGlobal();
const log = Logger.log(globalLogger);

// Signature of exported function must not be altered for all routers
module.exports = () => {
    const router = express.Router();

    router.route("/")
        .post(PostDataAnnealHandler);

    return router;
};

const PostDataAnnealHandler: express.RequestHandler =
    (req, res, _next) => {
        /** Returns HTTP400 response (Bad request) with specified message */
        const res400 = (message: string | undefined) =>
            res.status(HTTPResponseCode.CLIENT_ERROR.BAD_REQUEST)
                .json({
                    message,
                });


        const data: ToServerAnnealRequest.Root = req.body;

        // Check `sourceData`
        const sourceDataValid = Data_SourceData.checkValidity(data.sourceData);

        if (!sourceDataValid.value) {
            return res400(sourceDataValid.message);
        }

        // Check `constraints`
        for (let i = 0; i < data.constraints.length; ++i) {
            const constraint = data.constraints[i];

            const constraintValid = Data_Constraint.checkValidity(constraint);

            if (!constraintValid.value) {
                return res400(`Constraint at index ${i}: ${constraintValid.message}`);
            }
        }

        // TODO: More input validation




        // Anneal
        // TODO: This is somewhat hacked together from old client-side code
        //       and other things to get a prototype up.
        //       Seriously needs work before it gets any further!
        //
        // NOTE: Old client-side code being used - only one strata/level support
        // NOTE: No applicabilityConditions/"of-size" support
        // NOTE: Only single search value support



        // Prepare
        // Convert source data to one with partitioned records
        const newSourceData = Data_SourceData.convertToPartitionedRecordArrayDesc(data.sourceData);

        /** Array<0 = number, 1 = string> */
        const columnTypes = newSourceData.columns.map(c => c.type);

        // NOTE: One strata support only
        const strata = data.strata[0];
        const minSize = strata.size.min;
        const idealSize = strata.size.ideal;
        const maxSize = strata.size.max;

        // String map
        const stringMap = StringMap.init();
        const addToStringMap = StringMap.add(stringMap);
        const fetchFromStringMap = StringMap.get(stringMap);

        // Partitions
        const partitions: Partition.Partition[] = newSourceData.records.map(
            (recordSet) => {
                const numberOfGroups = Partition.calculateNumberOfGroups(recordSet.length)(minSize)(idealSize)(maxSize)(false);
                const newPartition: Partition.Partition = Util.initArrayFunc(_ => [])(numberOfGroups);

                recordSet.forEach(
                    (record, i) => {
                        // Translate records to just numbers (strings become pointers)
                        const translatedRecord = record.map(
                            (recordElement, i) => {
                                const type = columnTypes[i];

                                // Number
                                if (type === 0) {
                                    return recordElement as number;
                                }

                                // String
                                if (type === 1) {
                                    return addToStringMap(recordElement as string);
                                }

                                throw new Error(`Type not given for ${i}th column`);
                            }
                        );

                        // Push new record into new partition in round-robin fashion
                        newPartition[i % numberOfGroups].push(translatedRecord);
                    }
                );

                return newPartition;
            }
        );

        // Column info
        const columnInfo: ColumnInfo.ColumnInfo = newSourceData.columns.map(
            (column, i) => {
                const labelPointer = addToStringMap(column.label);
                const type = column.type;

                const columnDesc: ColumnDesc.ColumnDesc = ColumnDesc.init();

                // Set name
                ColumnDesc.setName(columnDesc)(labelPointer);

                // Set type, range, string distinct
                switch (type) {
                    case 0: {   // number 
                        ColumnDesc.setTypeNumeric(columnDesc);

                        // Set range
                        let columnMin = Infinity;
                        let columnMax = -Infinity;

                        partitions.forEach(
                            (partition) => partition.forEach(
                                (recordSet) => recordSet.forEach(
                                    (record) => {
                                        const value = record[i];
                                        if (value < columnMin) {
                                            columnMin = value;
                                        }

                                        if (value > columnMax) {
                                            columnMax = value;
                                        }
                                    }
                                )
                            )
                        );

                        ColumnDesc.setRangeMin(columnDesc)(columnMin);
                        ColumnDesc.setRangeMax(columnDesc)(columnMax);

                        break;
                    }
                    case 1: {   // string
                        ColumnDesc.setTypeString(columnDesc);

                        // Set distinct
                        let distinctPointerSet = new Set<number>();

                        partitions.forEach(
                            (partition) => partition.forEach(
                                (recordSet) => recordSet.forEach(
                                    (record) => {
                                        const value = record[i];
                                        distinctPointerSet.add(value);
                                    }
                                )
                            )
                        );

                        ColumnDesc.setStringDistinct(columnDesc)(distinctPointerSet.size);

                        break;
                    }
                    default: {
                        throw new Error(`Unrecognised column type ${type}`);
                    }
                }

                return columnDesc;
            }
        );

        // Constraints
        const constraints = data.constraints.map(
            (constraint) => {
                const c = Constraint.init();    // Constraint object to return
                const setWeight = Constraint.setWeight(c);  //

                // Set strata (aka. level)
                Constraint.setLevel(c)(constraint.strata);

                // Set weight
                // NOTE: The set value relies on the structure of
                //       Constraint.Weight enum
                const weight = constraint.weight;
                if (weight >= 1000) {
                    setWeight(0);
                } else if (weight >= 50) {
                    setWeight(1);
                } else if (weight >= 10) {
                    setWeight(2);
                } else if (weight >= 2) {
                    setWeight(3);
                } else {
                    throw new Error(`Can't accept weight: ${weight}`);
                }

                // Set column index
                Constraint.setColumnIndex(c)(constraint.filter.column);

                // Set operator (similar to what we now have as condition function)
                // NOTE: The set value relies on the structure of
                //       Constraint.Operator
                const conditionFunction = constraint.condition.function;
                const setOperator = Constraint.setOperator(c);
                switch (conditionFunction) {
                    case "eq": { setOperator(0); break; }
                    case "neq": { setOperator(1); break; }
                    case "gt":
                    case "gte": { setOperator(2); break; }
                    case "lt":
                    case "lte": { setOperator(3); break; }

                    case "high": { setOperator(4); break; }
                    case "low": { setOperator(5); break; }

                    case "similar": { setOperator(6); break; }
                    case "different": { setOperator(7); break; }
                    default: { throw new Error(`Can't accept condition function ${conditionFunction}`); }
                }

                // TODO:
                // Set of size

                if (constraint.type === "countable" || constraint.type === "limit") {
                    // Set field operator
                    // NOTE: The set value relies on the structure of
                    //       Constraint.CountableFieldOperator
                    const filterFunction = constraint.filter.function;
                    const setFieldOperator = Constraint.setFieldOperator(c);
                    switch (filterFunction) {
                        case "eq": { setFieldOperator(0); break; }
                        case "neq": { setFieldOperator(1); break; }
                        case "lte": { setFieldOperator(2); break; }
                        case "lt": { setFieldOperator(3); break; }
                        case "gte": { setFieldOperator(4); break; }
                        case "gt": { setFieldOperator(5); break; }
                        default: { throw new Error(`Can't accept filter function ${filterFunction}`); }
                    }

                    // Set field value (now known as filter search values)
                    const filterValue = constraint.filter.searchValues[0];
                    Constraint.setFieldValue(c)(
                        typeof filterValue === "string" ?
                            addToStringMap(filterValue) :
                            filterValue
                    );

                    if (constraint.type === "countable") {
                        // Set count (now known as condition value)
                        Constraint.setCount(c)(constraint.condition.value);
                    }
                }

                return c;
            }
        );


        const anneal =
            (columnInfo: ColumnInfo.ColumnInfo) =>
                (constraints: Constraint.Constraint[]) =>
                    (partitions: Partition.Partition[]) => {
                        // Run
                        return new Promise<Anneal.AnnealIterationResult[]>((resolve, _reject) => {
                            const results: Anneal.AnnealIterationResult[] = [];

                            // Execute over partitions
                            let job: number = 0;
                            const totalJobs = partitions.length;

                            const appliedRecordSetCostFunctions = CostFunction.generateAppliedRecordSetCostFunctions(columnInfo!)(constraints);

                            for (let partition of partitions) {
                                log("info")(`Annealing ${++job}/${totalJobs}`);

                                const result = Anneal.run(appliedRecordSetCostFunctions)(partition);

                                results.push(result);
                            }

                            resolve(results);
                        });
                    };



        // Map over each partition
        return (async () => {
            const results = await anneal(columnInfo)(constraints)(partitions);

            // Remap strings back in
            const groups = results.map(
                (result) => Anneal.getPartition(result).map(
                    (group) => group.map(
                        (record) => record.map(
                            (recordElement, i) => {
                                const type = columnTypes[i];

                                // Number
                                if (type === 0) {
                                    return recordElement;
                                }

                                // String
                                if (type === 1) {
                                    return fetchFromStringMap(recordElement);
                                }

                                throw new Error(`Type not given for ${i}th column`);
                            }
                        )
                    )
                )
            )

            return res
                .status(HTTPResponseCode.SUCCESS.OK)
                .json({
                    groups,
                });
        })();
    };
