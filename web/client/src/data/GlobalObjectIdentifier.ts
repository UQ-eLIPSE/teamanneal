import * as UUID from "../util/UUID";

export namespace GlobalObjectIdentifier {
    const idMap: WeakMap<Object, string> = new WeakMap();

    export function GetId(value: Object) {
        let id = idMap.get(value);

        if (id === undefined) {
            id = UUID.generate();
            idMap.set(value, id);
        }

        return id;
    }
}
