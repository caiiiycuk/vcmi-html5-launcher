import { getFilesDB } from "./db";

export const VCMI_DATA: { [file: string]: Uint8Array | null } = {
    "H3ab_ahd.snd": null,
    "H3ab_bmp.lod": null,
    "H3ab_spr.lod": null,
    "H3bitmap.lod": null,
    "H3sprite.lod": null,
    "Heroes3.snd": null,
};

export const VCMI_MODULE: {
    homm3Files?: FileList,
    canvas?: HTMLCanvasElement,
    FS?: {
        createPath: (parent: string, dir: string) => void,
        createDataFile: (dir: string, _: null, contents: Uint8Array,
            canRead: boolean, canWrite: boolean, canOwn: boolean) => void,
        readFile: (path: string) => Uint8Array,
    },
    run?: () => void,
    callMain?: () => void,
    instantiateWasm?: any,
    getPreloadedPackage?: (name: string, size: number) => ArrayBufferLike,
    HEAPU8?: Uint8Array,
    _free?: (ptr: number) => void,
    UTF8ToString?: (stringPtr: number) => string;
    fsRead: (path: string) => Uint8Array,
    fsWrite: (path: string, contents: Uint8Array) => void,
    fsUpdate: (filePtr: number, bufferPtr: number, length: number) => void;
    getVCMIVersion: () => string,
    gameStarted?: () => void;
    websocket?: { url: string };
    _getVCMIVersion?: () => number,
} = resetModule();

export function resetModule() {
    const module: typeof VCMI_MODULE = {
        fsRead: (path) => {
            return module.FS!.readFile(path);
        },
        fsWrite: (file, contents) => {
            let parent = "/";
            const parts = file.split("/");
            for (let i = 0; i < parts.length - 1; ++i) {
                if (parts[i].length > 0) {
                    VCMI_MODULE.FS!.createPath(parent, parts[i]);
                    if (parent.length > 1) {
                        parent += "/";
                    }
                    parent += parts[i];
                }
            }
            VCMI_MODULE.FS!.createDataFile(file, null, contents, true, true, true);
        },
        fsUpdate: async (filePtr, bufferPtr, length) => {
            const file = module.UTF8ToString!(filePtr);
            if (length <= 0) {
                console.warn("Trying to save empty file", file);
                return;
            }
            const db = await getFilesDB();
            db.put(file, module.HEAPU8!.slice(bufferPtr, bufferPtr + length)).catch(console.error);
            module._free!(bufferPtr);
        },
        getVCMIVersion() {
            return module.UTF8ToString!(module._getVCMIVersion!());
        },
    };
    module.websocket = {
        url: "wss://",
    };
    // for debug
    (window as any).VCMI_MODULE = module;
    return module;
}
