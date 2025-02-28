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
    canvas?: HTMLCanvasElement,
    FS?: {
        createPath: (parent: string, dir: string) => void,
        createDataFile: (dir: string, _: null, contents: Uint8Array,
            canRead: boolean, canWrite: boolean, canOwn: boolean) => void,
        readFile: (path: string) => Uint8Array,
        unlink: (path: string) => void,
    },
    callMain?: (args?: string[]) => void,
    instantiateWasm?: any,
    getPreloadedPackage?: (name: string, size: number) => ArrayBufferLike,
    HEAPU8?: Uint8Array,
    _malloc?: (size: number) => number,
    _free?: (ptr: number) => void,
    UTF8ToString?: (stringPtr: number) => string;
    lengthBytesUTF8?: (str: string) => number;
    stringToUTF8?: (str: string, ptr: number, size: number) => void;
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
    modsData?: [string, ArrayBuffer],
    getWidth?: () => number,
    getHeight?: () => number,
    hsLock?: Promise<void>,
    loadHighscores: (isCampaing: boolean, callback: (json: number) => void) => void,
    mainMenuQuit: () => void,
} = resetModule();

export function resetModule() {
    const loadedMusic: {[file: string]: boolean} = {};
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
        loadMusic: async (filePtr) => {
            const file = module.UTF8ToString!(filePtr).substring(1);
            if (loadedMusic[file]) {
                return;
            }
            loadedMusic[file] = true;
            const url = "https://cdn.dos.zone/custom/vcmi/async" + file;
            const music = await loadResource(url, "arraybuffer") as ArrayBuffer;
            module.FS!.unlink(file);
            module.fsWrite(file, new Uint8Array(music));
            module._playMusic!();
        },
        getVCMIVersion() {
            (window as any).FS = module.FS;
            if (module._getVCMIVersion) {
                return module.UTF8ToString!(module._getVCMIVersion());
            }

            return "Function _getVCMIVersion not found.";
        },
        loadHighscores: (isCampaing, callback) => {
            module.hsLock = (async () => {
                if (module.hsLock) {
                    await module.hsLock;
                }

                const hs = (await (await fetch("https://d5dn8hh4ivlobv6682ep.apigw.yandexcloud.net/vcmi/hs/get?isCampaing=" + 
                    (isCampaing ? "1" : "0") + "&limit=11")).json()).hs ?? [];
                for (const h of hs) {
                    h[isCampaing ? "campaignName" : "scenarioName"] = h["map"];
                    delete h["map"];
                }
                const json = JSON.stringify(hs);
                const len = module.lengthBytesUTF8!(json) + 1;
                const ptr = module._malloc!(len);
                module.stringToUTF8!(json, ptr, len);
                callback(ptr);
                module._free!(ptr);
            })().catch((e) => {
                callback(0);
                console.error("Failed to load highscores", e);
            });
        },
        mainMenuQuit: () => {
            const params = new URLSearchParams(location.search);
            params.delete("demo");
            location.search = params.toString();
        },
    };
    module.websocket = {
        url: "wss://",
    };
    // for debug
    (window as any).VCMI_MODULE = module;
    return module;
}
