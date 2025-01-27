import { configureStore, createSlice } from "@reduxjs/toolkit";
import { resetModule } from "./module";
import { getFilesDB } from "./db";

const params = new URLSearchParams(location.search);

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
    localizedDataUrl: {
        en: string,
        ru: string,
    },
    mods?: string,
}[] = [
    {
        version: "1.6.3-wasm-2",
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
    if (location.hostname === "localhost" || params.get("token") === "BlackKnight") {
        clients.push({
            version: "bundled (dev)",
            wasmUrl: "vcmi/vcmiclient.js",
            dataUrl: "https://caiiiycuk.github.io/vcmi-wasm/vcmi/vcmi.data.1.6.3.js",
            mods: "vcmi/vcmi.mods.data.js",
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


export const resolutions = [
    [0, 0], [800, 600], [1024, 768], [1280, 720], [1280, 1024], [1440, 900],
];
const maxSize = 1440;
const minSize = 600;

const initialUiState: {
    lang: "ru" | "en",
    step: "MODULE_SELECT" | "DATA_SELECT" | "LOADING_DATA" | "READY_TO_RUN" | "STARTED" | "ABOUT",
    config: string,
    client: string,
    vcmiGameFilesReady: boolean,
} = {
    lang: (params.get("lang") ?? localStorage.getItem("vcmi.lang") ??
        navigator.language).startsWith("ru") ? "ru" : "en",
    step: "MODULE_SELECT",
    config: localStorage.getItem("vcmi.config") ?? defaultConfig(),
    client: localStorage.getItem("vcmi.client") ?? clients[0].version,
    vcmiGameFilesReady: false,
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
    const [widht, height] = getScreenResolution();
    return `{
    "general" : {
        "language" : "${navigator.language.startsWith("ru") ? "russian" : "english"}",
        "autosaveCountLimit" : 1
    },
    "video" : {
        "resolution" : {
            "width" : ${widht},
            "height" : ${height},
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

export function getScreenResolution() {
    const dpi = Math.max(1, Math.min(devicePixelRatio, 2));
    let width = Math.round(innerWidth * dpi);
    let height = Math.round(innerHeight * dpi);
    if (width > maxSize) {
        height = Math.round(height * maxSize / width);
        width = maxSize;
    }
    if (height > maxSize) {
        width = Math.round(width * maxSize / height);
        height = maxSize;
    }
    if (width < minSize) {
        height = Math.round(height * minSize / width);
        width = minSize;
    }
    if (height < minSize) {
        width = Math.round(width * height / minSize);
        height = minSize;
    }

    // if (width <= resolutions[1][0] || height <= resolutions[1][1]) {
    //     width = resolutions[1][0];
    //     height = resolutions[1][1];
    // }

    return [width, height];
}

export function getClient(version: string) {
    return clients.find((client) => client.version === version) ?? clients[0];
}
