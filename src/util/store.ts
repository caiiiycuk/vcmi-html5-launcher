import { configureStore, createSlice } from "@reduxjs/toolkit";
import { resetModule } from "./module";
import { getFilesDB } from "./db";

const params = new URLSearchParams(location.search);
const demo = params.get("demo") === "1";
const storedClient = params.get("client") ?? localStorage.getItem("vcmi.client");

export const unprefixedDataUrlPrefix = "1.5.7-wasm";
export const unprefixedDataUrl = "https://caiiiycuk.github.io/vcmi-wasm/vcmi/vcmi.data.js";
export const unprefixedLocalizedDataUrl = {
    "en": "https://caiiiycuk.github.io/vcmi-wasm/vcmi/en.data.js",
    "ru": "https://caiiiycuk.github.io/vcmi-wasm/vcmi/ru.data.js",
};

export const clients: {
    version: string,
    wasmUrl: string,
    dataUrl: string,
    localizedDataUrl?: {
        en: string,
        ru: string,
    },
    mods?: string,
    noData?: boolean,
}[] = [
    {
        version: "1.6.5-wasm-2",
        wasmUrl: "https://caiiiycuk.github.io/vcmi-wasm/vcmi/vcmiclient.1.6.5-0.js",
        dataUrl: "https://caiiiycuk.github.io/vcmi-wasm/vcmi/vcmi.data.1.6.5.js",
        mods: "https://caiiiycuk.github.io/vcmi-wasm/vcmi/vcmi.mods.data.1.6.3.js",
        localizedDataUrl: unprefixedLocalizedDataUrl,
    },
    {
        version: "1.6.7-wasm-0-experimental",
        wasmUrl: "https://br.cdn.dos.zone/vcmi/vcmiclient-1.6.7-0.__",
        dataUrl: "https://br.cdn.dos.zone/vcmi/vcmi.data.1.6.7.__",
        mods: "https://caiiiycuk.github.io/vcmi-wasm/vcmi/vcmi.mods.data.1.6.3.js",
        localizedDataUrl: unprefixedLocalizedDataUrl,
    },
    {
        version: "1.6.4-wasm-0",
        wasmUrl: "https://caiiiycuk.github.io/vcmi-wasm/vcmi/vcmiclient.1.6.4-0.js",
        dataUrl: "https://caiiiycuk.github.io/vcmi-wasm/vcmi/vcmi.data.1.6.4.js",
        mods: "https://caiiiycuk.github.io/vcmi-wasm/vcmi/vcmi.mods.data.1.6.3.js",
        localizedDataUrl: unprefixedLocalizedDataUrl,
    },
    {
        version: "1.6.3-wasm-4",
        wasmUrl: "https://caiiiycuk.github.io/vcmi-wasm/vcmi/vcmiclient.1.6.3-0.js",
        dataUrl: "https://caiiiycuk.github.io/vcmi-wasm/vcmi/vcmi.data.1.6.3.js",
        mods: "https://caiiiycuk.github.io/vcmi-wasm/vcmi/vcmi.mods.data.1.6.3.js",
        localizedDataUrl: unprefixedLocalizedDataUrl,
    },
    {
        version: "1.5.7-wasm-10",
        wasmUrl: "https://caiiiycuk.github.io/vcmi-wasm/vcmi/vcmiclient.js",
        dataUrl: unprefixedDataUrl,
        localizedDataUrl: unprefixedLocalizedDataUrl,
    },
];

(() => {
    if (demo) {
        clients.push({
            version: "DEMO",
            wasmUrl: "https://br.cdn.dos.zone/vcmi/vcmiclient.demo-1.__",
            dataUrl: getInitLang() === "ru" ?
                "https://br.cdn.dos.zone/vcmi/vcmi.demo-ru-1.data.__" :
                "https://br.cdn.dos.zone/vcmi/vcmi.demo-en-1.data.__",
            noData: true,
        });
    }

    if (location.hostname === "localhost") {
        clients.push({
            version: "bundled (dev)",
            wasmUrl: "vcmi/vcmiclient.js",
            dataUrl: "vcmi/vcmi.data.js",
            mods: "https://caiiiycuk.github.io/vcmi-wasm/vcmi/vcmi.mods.data.1.6.3.js",
            localizedDataUrl: unprefixedLocalizedDataUrl,
        });
    }
})();

export const VCMI_GAME_FILES: {
    [key: string]: {
        name: string,
        contents: Uint8Array | null,
    }
} = {
    "h3ab_ahd.snd": {
        name: "Data/H3ab_ahd.snd",
        contents: null,
    },
    "h3ab_spr.lod": {
        name: "Data/H3ab_spr.lod",
        contents: null,
    },
    "heroes3.snd": {
        name: "Data/Heroes3.snd",
        contents: null,
    },
    "h3ab_bmp.lod": {
        name: "Data/H3ab_bmp.lod",
        contents: null,
    },
    "h3bitmap.lod": {
        name: "Data/H3bitmap.lod",
        contents: null,
    },
    "h3sprite.lod": {
        name: "Data/H3sprite.lod",
        contents: null,
    },
};


const initialUiState: {
    lang: "ru" | "en",
    step: "MODULE_SELECT" | "DATA_SELECT" | "LOADING_DATA" | "READY_TO_RUN" | "STARTED" | "ABOUT",
    config: string,
    client: string,
    vcmiGameFilesReady: boolean,
    resolutionIndex: number,
} = {
    lang: (params.get("lang") ?? localStorage.getItem("vcmi.lang") ??
        navigator.language).startsWith("ru") ? "ru" : "en",
    step: "MODULE_SELECT",
    config: localStorage.getItem("vcmi.config") ?? defaultConfig(),
    client: demo ? "DEMO" :
        (storedClient === "DEMO" ? clients[0].version : storedClient) ?? clients[0].version,
    vcmiGameFilesReady: false,
    resolutionIndex: Number.parseInt(localStorage.getItem("vcmi.resolutionIndex") ?? "0") ?? 0,
};

export const uiSlice = createSlice({
    name: "ui",
    initialState: initialUiState,
    reducers: {
        step: (state, a: { payload: typeof initialUiState.step }) => {
            state.step = a.payload;

            if (state.step === "DATA_SELECT") {
                resetModule();
            }
        },
        setConfig: (state, a: { payload: string }) => {
            state.config = a.payload;
            localStorage.setItem("vcmi.config", a.payload);
        },
        setResolutionIndex: (state, a: { payload: number }) => {
            state.resolutionIndex = a.payload;
            localStorage.setItem("vcmi.resolutionIndex", a.payload.toString());
        },
        setClient: (state, a: { payload: string }) => {
            state.client = a.payload;
            localStorage.setItem("vcmi.client", a.payload);
            location.reload();
        },
        setLang: (state, a: { payload: "ru" | "en" }) => {
            state.lang = a.payload;
            localStorage.setItem("vcmi.lang", a.payload);
        },
        checkVcmiGameFilesReady: (state) => {
            state.vcmiGameFilesReady = Object.keys(VCMI_GAME_FILES).filter((key) => {
                return VCMI_GAME_FILES[key].contents === null;
            }).length === 0;
        },
    },
});

export const store = (() => {
    const store = configureStore({
        reducer: {
            ui: uiSlice.reducer,
        },
    });

    (async () => {
        const db = await getFilesDB();
        const config = await db.get("/home/web_user/.config/vcmi/settings.json");
        if (config && config.length > 0) {
            store.dispatch(uiSlice.actions.setConfig(new TextDecoder().decode(config)));
        }
    })().catch(console.error);

    return store;
})();

export interface State {
    ui: typeof initialUiState,
}

export function defaultConfig() {
    return `{
    "general" : {
        "language" : "${navigator.language.startsWith("ru") ? "russian" : "english"}",
        "autosaveCountLimit" : 1
    },
    "video" : {
        "resolution" : {
            "scaling" : 100
        }
    },
    "server" : {
        "remoteHostname" : "netherlands.dos.zone"
    },
    "lobby" :  {
        "hostname" : "netherlands.dos.zone"
    }
}`;
}

export function getClient(version: string) {
    return clients.find((client) => client.version === version) ?? clients[0];
}

export function getInitLang() {
    return (params.get("lang") ?? localStorage.getItem("vcmi.lang") ??
        navigator.language).startsWith("ru") ? "ru" : "en";
}
