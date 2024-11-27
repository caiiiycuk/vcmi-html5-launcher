import { configureStore, createSlice } from "@reduxjs/toolkit";

export let VCMI_MODULE: any = {};

const initialUiState: {
    lang: "ru" | "en",
    dataUrl: string,
    wasmUrl: string,
    step: "DATA_SELECT" | "LOADING_DATA" | "LOADING_WASM" | "READY_TO_RUN" | "STARTED",
} = {
    lang: navigator.language.startsWith("ru") ? "ru" : "en",
    dataUrl: "vcmi/vcmi.data.js",
    wasmUrl: "vcmi/vcmiclient.js",
    step: "DATA_SELECT",
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
            state.dataUrl = a.payload;
        },
    }
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