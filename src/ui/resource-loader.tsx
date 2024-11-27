import { useEffect, useState } from "preact/hooks";
import { loadResource } from "../util/resource";
import { State, uiSlice, VCMI_DATA, VCMI_MODULE } from "../util/store";
import { useDispatch, useSelector } from "react-redux";
import { wasmInstantiate } from "../util/wasm";
import { useT } from "../i18n";
import { getDB } from "../util/db";

export function Loader(props: {
    resourceType: "datafile" | "wasm",
}) {
    const dataUrl = useSelector((state: State) => state.ui.vcmiDataUrl);
    const homm3DataUrl = useSelector((state: State) => state.ui.homm3DataUrl);
    const wasmUrl = useSelector((state: State) => state.ui.wasmUrl);
    const [file, setFile] = useState<string>("");
    const [progress, setProgress] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const dispatch = useDispatch();
    const t = useT();
    useEffect(() => {
        setError(null);
        (async () => {
            if (props.resourceType === "datafile") {
                // load vcmi data
                setFile("VCMI/Data");
                const jsPromise = loadResource(dataUrl, "text", () => { });
                const dataPromise = loadResource(dataUrl.substring(0, dataUrl.length - 3), "arraybuffer", setProgress);
                const [js, data] = await Promise.all([jsPromise, dataPromise]);

                const Module = VCMI_MODULE;
                Module.getPreloadedPackage = (name: any, size: any) => data;
                eval(js as string);

                // load homm3 data
                const db = await getDB();
                const homm3Files: FileList | undefined = VCMI_MODULE.homm3Files;
                if (homm3Files) {
                    delete VCMI_MODULE.homm3Files;
                    setFile("Searching in " + homm3Files.length + " files");
                    let processed = 0;
                    for (const next of homm3Files) {
                        if (VCMI_DATA[next.name] === null) {
                            setFile("Uploading " + next.name);
                            VCMI_DATA[next.name] = new Uint8Array(await next.arrayBuffer());
                            db.put(next.name, VCMI_DATA[next.name]!).catch(console.error);
                        }
                        processed++;
                        setProgress(Math.round(processed / homm3Files.length));
                    }
                    setFile("Validating...");
                    setProgress(100);
                    for (const next of Object.keys(VCMI_DATA)) {
                        if (VCMI_DATA[next] === null) {
                            throw new Error("File " + next + " not found in uploads!");
                        }
                    }
                } else {
                    for (const next of Object.keys(VCMI_DATA)) {
                        if (VCMI_DATA[next] === null) {
                            setFile("HOMM3/" + next);
                            VCMI_DATA[next] = new Uint8Array(await loadResource(
                                homm3DataUrl + "/Data/" + next, "arraybuffer", setProgress) as any);
                            db.put(next, VCMI_DATA[next]).catch(console.error);
                        }
                    }
                }

                dispatch(uiSlice.actions.step("LOADING_WASM"));
            } else if (props.resourceType === "wasm") {
                setFile("VCMI/WebAssembly");
                const script = document.createElement("script");
                script.src = wasmUrl;
                script.onload = () => {
                    const Module = VCMI_MODULE;

                    Module.instantiateWasm = async (
                        info: Record<string, Record<string, WebAssembly.ImportValue>>,
                        receiveInstance: (i: WebAssembly.Instance, m: WebAssembly.Module) => Promise<any>,
                    ) => {
                        const wasm: Response = await loadResource(wasmUrl.substring(0, wasmUrl.length - 3) + ".wasm",
                            "response", setProgress) as Response;
                        const instance = await wasmInstantiate(wasm, info);
                        return receiveInstance(instance.instance, instance.wasmModule);
                    };

                    /* eslint-disable-next-line new-cap */
                    (window as any).VCMI(Module)
                        .then(() => {
                            dispatch(uiSlice.actions.step("READY_TO_RUN"));
                        })
                        .catch((e: any) => {
                            console.error(e);
                            setError(e.message ?? "wasm instantiation error");
                        });
                };
                script.onerror = (e) => {
                    console.error(e);
                    setError(e + "");
                };
                document.head.appendChild(script);
            }
        })().catch((e) => {
            setError(e.message ?? "unknown error");
            console.error(e);
        });
    }, [dataUrl, wasmUrl, homm3DataUrl, props.resourceType]);

    return <div class="flex flex-col">
        <article class="pt-0" role="tabpanel">
            <h4 class="my-4">{t("loading_data_title")}</h4>
            <div class="flex flex-row">
                <progress class="w-full mr-2" max="100" value={progress}></progress>
                <span>{progress}%</span>
            </div>
            <p class="text-gray-600">{file}</p>
        </article>
        {error &&
            <div class="mx-2 font-mono">
                <p class="my-0 text-xl">{t("error")}</p >
                <p class="text-red-500 font-bold">{error}</p>
                <p class="text-gray-600">{t("open_browser_logs")}</p>
                <button onClick={() => {
                    dispatch(uiSlice.actions.step("DATA_SELECT"));
                }}>{t("back")}</button>
            </div>
        }
    </div>;
}
