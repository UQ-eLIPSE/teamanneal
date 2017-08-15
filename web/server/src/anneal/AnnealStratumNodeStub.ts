export class AnnealStratumNodeStub {
    private readonly id: string;
    private readonly children: AnnealStratumNodeStub[] | undefined;
    private size: number | undefined;

    constructor(id: string, children?: AnnealStratumNodeStub[]) {
        this.id = id;
        this.children = children;
        this.size = undefined;
    }

    public getId() {
        return this.id;
    }

    public getChildren() {
        return this.children;
    }

    public getSize() {
        return this.size;
    }

    public setSize(size: number) {
        // Can only set size once
        if (this.size !== undefined) {
            return this.size;
        }

        return this.size = size;
    }
}
