import { render } from "preact";
import "xp.css";
import "./index.css";


import { Provider, useDispatch, useSelector } from "react-redux";
import { State, store, uiSlice, VCMI_MODULE } from "./util/store";
import { Loader } from "./ui/resource-loader";
import { VCMIWindow } from "./ui/vcmi-window";
import { useT } from "./i18n";
import { DataSelect } from "./ui/data-select";

function Page() {
    const state = useSelector((state: State) => state.ui.step);
    const dataUrl = useSelector((state: State) => state.ui.dataUrl);
    const wasmUrl = useSelector((state: State) => state.ui.wasmUrl);

    const dispatch = useDispatch();
    switch (state) {
        case "DATA_SELECT": {
            return <DataSelect />;
        };
        case "LOADING_DATA": {
            return <Loader url={dataUrl} resourceType="datafile" />;
        };
        case "LOADING_WASM":
            return <Loader url={wasmUrl} resourceType="wasm" />;
        case "READY_TO_RUN":
            return <div>
                <button class="btn btn-xl" onClick={() => {
                    dispatch(uiSlice.actions.step("STARTED"));
                }}>Press to run</button>
            </div>;
        case "STARTED": {
            return <VCMIWindow />;
        }
    }

    return null;
}

function App() {
    const t = useT();
    return <div class="flex flex-col w-full h-full items-center justify-center">
        <div class="window w-96 min-h-96">
            <div class="title-bar">
                <div class="title-bar-text">{t("title")}</div>
                <div class="title-bar-controls">
                    <button aria-label="Minimize"></button>
                    <button aria-label="Maximize"></button>
                    <button aria-label="Close"></button>
                </div>
            </div>
            <div class="window-body">
                <Page />
            </div>
        </div>
    </div>;
}

(function () {
    render(
        <Provider store={store}>
            {<App /> as any}
        </Provider>,
        document.getElementById("app")!,
    );
})();
