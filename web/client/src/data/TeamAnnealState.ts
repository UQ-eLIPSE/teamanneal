import * as SourceFile from "./SourceFile";
import * as ConstraintsConfig from "./ConstraintsConfig";

export interface TeamAnnealState {
    sourceFile: Partial<SourceFile.SourceFile>,
    constraintsConfig: Partial<ConstraintsConfig.ConstraintsConfig>,
}
