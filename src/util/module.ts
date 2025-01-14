import { getFilesDB } from "./db";
import { loadResource } from "./resource";

export const DATA_SET: { [variant: string]: string[] } = {
    "complete_edition": [
        "data/h3ab_ahd.snd",
        "data/h3ab_bmp.lod",
        "data/h3ab_spr.lod",
        "data/h3bitmap.lod",
        "data/h3sprite.lod",
        "data/heroes3.snd",
    ],
};

export const VCMI_MODULE: {
    variantZip?: File,
    variantFiles: { [key: string]: Uint8Array },
    canvas?: HTMLCanvasElement,
    FS?: {
        createPath: (parent: string, dir: string) => void,
        createDataFile: (dir: string, _: null, contents: Uint8Array,
            canRead: boolean, canWrite: boolean, canOwn: boolean) => void,
        readFile: (path: string) => Uint8Array,
        unlink: (path: string) => void,
    },
    run?: () => void,
    callMain?: (args?: string[]) => void,
    instantiateWasm?: any,
    getPreloadedPackage?: (name: string, size: number) => ArrayBufferLike,
    HEAPU8?: Uint8Array,
    _free?: (ptr: number) => void,
    UTF8ToString?: (stringPtr: number) => string;
    fsRead: (path: string) => Uint8Array,
    fsWrite: (path: string, contents: Uint8Array) => void,
    fsUpdate: (filePtr: number, bufferPtr: number, length: number) => void;
    loadMusic: (filePtr: number) => void,
    getVCMIVersion: () => string,
    gameStarted?: () => void;
    websocket?: { url: string };
    _getVCMIVersion?: () => number,
    _playMusic?: () => void,
    data?: [string, ArrayBuffer],
    localizedData?: [string, ArrayBuffer],
} = resetModule();

export function resetModule() {
    const loadedMusic: {[file: string]: boolean} = {};
    const module: typeof VCMI_MODULE = {
        variantFiles: {},
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
        loadMusic: async (filePtr) => {
            const file = module.UTF8ToString!(filePtr).substring(1);
            if (loadedMusic[file]) {
                return;
            }
            loadedMusic[file] = true;
            const url = "/vcmi/launcher/vcmi" + file;
            const music = await loadResource(url, "arraybuffer") as ArrayBuffer;
            module.FS!.unlink(file);
            module.fsWrite(file, new Uint8Array(music));
            module._playMusic!();
        },
        getVCMIVersion() {
            if (module._getVCMIVersion) {
                return module.UTF8ToString!(module._getVCMIVersion());
            }

            return "Function _getVCMIVersion not found.";
        },
    };
    module.websocket = {
        url: "wss://",
    };
    // for debug
    (window as any).VCMI_MODULE = module;
    return module;
}

export function isDataSet(keys: string[]) {
    keys = keys.map((key) => key.toLowerCase());
    function haveAll(contents: string[]) {
        for (const key of contents) {
            if (keys.indexOf(key) === -1) {
                return false;
            }
        }
        return true;
    }
    for (const variant of Object.keys(DATA_SET)) {
        if (haveAll(DATA_SET[variant])) {
            return true;
        }
    }
    return false;
}

