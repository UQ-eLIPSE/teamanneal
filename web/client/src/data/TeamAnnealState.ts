import * as SourceFile from "./SourceFile";
import * as ConstraintsConfig from "./ConstraintsConfig";

export interface TeamAnnealState {
    routerFullPath: string,
    
    sourceFile: Partial<SourceFile.SourceFile>,
    constraintsConfig: Partial<ConstraintsConfig.ConstraintsConfig>,
}
