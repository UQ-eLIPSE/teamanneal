import * as AnnealNode from "../../../common/AnnealNode";
import * as Constraint from "../../../common/Constraint";
import * as RecordData from "../../../common/RecordData";
import * as Stratum from "../../../common/Stratum";

import * as ToServerAnnealRequest from "../../../common/ToServerAnnealRequest";

interface InternalAnnealMeta {
    redisResponseId: string,
}

interface InternalAnnealNodeMeta {
    annealNode: {
        id: string,
        index: number,
    }
}

export interface AnnealRequestMessageData {
    _meta: InternalAnnealMeta,

    annealRequest: ToServerAnnealRequest.Root,
}

export interface AnnealJobData {
    _meta: InternalAnnealMeta & InternalAnnealNodeMeta,

    recordData: RecordData.Desc,
    annealNode: AnnealNode.NodeRoot,
    strata: ReadonlyArray<Stratum.Desc>,
    constraints: ReadonlyArray<Constraint.Desc>,
}

export interface AnnealResultMessageData {
    _meta: InternalAnnealMeta & InternalAnnealNodeMeta,

    result?: AnnealNode.NodeRoot,
    error?: string,
}

export interface AnnealResponseMessageData {
    _meta: InternalAnnealMeta,

    results?: AnnealResultMessageData[],
    error?: string,
}
