import { configureStore, createSlice } from "@reduxjs/toolkit";
import { resetModule } from "./module";
import { getFilesDB } from "./db";

export const dataVersion = "1.5.7-wasm";
export const dataUrl = "https://caiiiycuk.github.io/vcmi-wasm/vcmi/vcmi.data.js";
export const localizedDataUrl = {
    "en": "https://caiiiycuk.github.io/vcmi-wasm/vcmi/en.data.js",
    "ru": "https://caiiiycuk.github.io/vcmi-wasm/vcmi/ru.data.js",
};

export const clients = [
    {
        version: "1.5.7-wasm-6",
        wasmUrl: "https://caiiiycuk.github.io/vcmi-wasm/vcmi/vcmiclient.js",
    },
    {
        version: "bundled (dev)",
        wasmUrl: "vcmi/vcmiclient.js",
    },
];

export const archiveOrgLinks = {
    "en": {
        "complete": "https://archive.org/download/data_20241222/Data.zip",
    },
    "ru": {
        "complete": "https://archive.org/download/homm3ruslang/Data.zip",
    },
};

const maxSize = 1440;
const minSize = 600;
const params = new URLSearchParams(location.search);

const initialUiState: {
    lang: "ru" | "en",
    step: "MODULE_SELECT" | "DATA_SELECT" | "LOADING_DATA" | "READY_TO_RUN" | "STARTED" | "ABOUT",
    config: string,
    client: string,
} = {
    lang: (localStorage.getItem("vcmi.lang") ?? navigator.language).startsWith("ru") ? "ru" : "en",
    step: "MODULE_SELECT",
    config: localStorage.getItem("vcmi.config") ?? defaultConfig(),
    client: localStorage.getItem("vcmi.client") ?? "1.5.7-wasm-6",
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

    return [width, height];
}

export function getClient(version: string) {
    return clients.find((client) => client.version === version) ?? clients[0];
}
