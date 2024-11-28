import { configureStore, createSlice } from "@reduxjs/toolkit";

export const VCMI_DATA: {[file: string]: Uint8Array | null} = {
    "H3ab_ahd.snd": null,
    "H3ab_bmp.lod": null,
    "H3ab_spr.lod": null,
    "H3bitmap.lod": null,
    "H3sprite.lod": null,
    "Heroes3.snd": null,
};

export let VCMI_MODULE: { homm3Files?: FileList } & any = {
};

const initialUiState: {
    lang: "ru" | "en",
    homm3DataUrl: string,
    vcmiDataUrl: string,
    wasmUrl: string,
    step: "DATA_SELECT" | "LOADING_DATA" | "LOADING_WASM" | "READY_TO_RUN" | "STARTED",
    config: string,
} = {
    lang: navigator.language.startsWith("ru") ? "ru" : "en",
    homm3DataUrl: localStorage.getItem("vcmi.dataUrl") ?? "vcmi/",
    vcmiDataUrl: "vcmi/vcmi.data.js",
    wasmUrl: "vcmi/vcmiclient.js",
    step: "DATA_SELECT",
    config: localStorage.getItem("vcmi.config") ??
`{
    "general" : {
        "language" : "${navigator.language.startsWith("ru") ? "russian" : "english"}",
    },
    "video" : {
        "resolution" : {
            "width": ${innerWidth}
            "height": ${innerHeight},
            "scaling": 100,
        }
    }
}`,
};

export const uiSlice = createSlice({
    name: "ui",
    initialState: initialUiState,
    reducers: {
        step: (state, a: { payload: typeof initialUiState.step }) => {
            state.step = a.payload;

            if (state.step === "DATA_SELECT") {
                VCMI_MODULE = {};
            }
        },
        setDataUrl: (state, a: { payload: string }) => {
            state.homm3DataUrl = a.payload;
            localStorage.setItem("vcmi.dataUrl", a.payload);
        },
        setConfig: (state, a: { payload: string }) => {
            state.config = a.payload;
            localStorage.setItem("vcmi.config", a.payload);
        },
    },
});

export const store = configureStore({
    reducer: {
        ui: uiSlice.reducer,
    },
});

export interface State {
    ui: typeof initialUiState,
}

// for debug
(window as any).VCMI_MODULE = VCMI_MODULE;
