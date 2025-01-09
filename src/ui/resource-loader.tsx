import { useEffect, useState } from "preact/hooks";
import { loadResource } from "../util/resource";
import { dataVersion, State, uiSlice, dataUrl, wasmUrl, localizedDataUrl } from "../util/store";
import { useDispatch, useSelector } from "react-redux";
import { wasmInstantiate } from "../util/wasm";
import { useT } from "../i18n";
import { getDataDB } from "../util/db";
import { normalizeDataFileName, VCMI_DATA, VCMI_MODULE } from "../util/module";

export function Loader(props: {
    resourceType: "datafile" | "wasm",
}) {
    let homm3DataUrl = useSelector((state: State) => state.ui.homm3DataUrl);
    if (homm3DataUrl.length > 0 && homm3DataUrl[homm3DataUrl.length - 1] !== "/") {
        homm3DataUrl += "/";
    }
    const lang = useSelector((state: State) => state.ui.lang);
    const [file, setFile] = useState<string>("");
    const [progress, setProgress] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const dispatch = useDispatch();
    const t = useT();
    useEffect(() => {
        setError(null);
        (async () => {
            if (props.resourceType === "datafile") {
                const db = await getDataDB();

                const loadDataFile = async (dataUrl: string, dataKeyPrefix: string) => {
                    const dataContentsUrl = dataUrl.substring(0, dataUrl.length - 3);
                    const dataKey = dataKeyPrefix + ".data.js";
                    const dataContentsKey = dataKeyPrefix + ".data";
                    let [data, dataContents] = await Promise.all([db.get(dataKey),
                        db.get(dataContentsKey)]);
                    let dataJs: string | null = null;
                    if (data !== null) {
                        dataJs = new TextDecoder().decode(data);
                    }
                    if (dataJs === null || dataContents === null) {
                        dataJs = await loadResource(dataUrl, "text", () => { }) as string;
                        dataContents = new Uint8Array(await loadResource(dataContentsUrl,
                            "arraybuffer", setProgress) as ArrayBuffer);
                        db.put(dataKey, new TextEncoder().encode(dataJs)).catch(console.error);
                        db.put(dataContentsKey, dataContents).catch(console.error);
                    }

                    return [dataJs, dataContents.buffer] as [string, ArrayBuffer];
                };

                // load vcmi data
                {
                    setFile("VCMI/Data");
                    VCMI_MODULE.data = await loadDataFile(dataUrl, dataVersion);
                }

                // load localized data
                {
                    const key = lang === "ru" ? "ru" : "en";
                    setFile("VCMI/" + key + "-Data");
                    VCMI_MODULE.localizedData = await loadDataFile(localizedDataUrl[key], dataVersion + "-" + key);
                }

                VCMI_MODULE.getPreloadedPackage = (name: any, size: any) => {
                    let data;
                    if (name === "vcmi.data") {
                        data = VCMI_MODULE.data![1];
                        delete VCMI_MODULE.data;
                    } else {
                        data = VCMI_MODULE.localizedData![1];
                        delete VCMI_MODULE.localizedData;
                    }
                    return data;
                };

                // load homm3 data
                const homm3Files: FileList | undefined = VCMI_MODULE.homm3Files;
                if (homm3Files) {
                    delete VCMI_MODULE.homm3Files;
                    setFile("Searching in " + homm3Files.length + " files");
                    let processed = 0;
                    for (const next of homm3Files) {
                        const name = normalizeDataFileName(next.name);
                        if (VCMI_DATA[name] === null) {
                            setFile("Uploading " + name);
                            VCMI_DATA[name] = new Uint8Array(await next.arrayBuffer());
                            db.put(name, VCMI_DATA[name]!).catch(console.error);
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
                    let index = 0;
                    for (const next of Object.keys(VCMI_DATA)) {
                        index += 1;
                        setFile("HOMM3/" + next + " (" + index + "/" + Object.keys(VCMI_DATA).length + ")");
                        if (VCMI_DATA[next] === null) {
                            try {
                                VCMI_DATA[next] = new Uint8Array(await loadResource(
                                    homm3DataUrl + "Data/" + next, "arraybuffer", setProgress) as any);
                            } catch (e) {
                                // try also lowercase
                                console.error(e);
                                VCMI_DATA[next] = new Uint8Array(await loadResource(
                                    homm3DataUrl + "Data/" + next.toLowerCase(), "arraybuffer", setProgress) as any);
                            }
                            db.put(next, VCMI_DATA[next]).catch(console.error);
                        }
                    }
                }

                const Module = VCMI_MODULE;
                eval(Module.data![0]);
                eval(Module.localizedData![0]);
                dispatch(uiSlice.actions.step("READY_TO_RUN"));
            } else if (props.resourceType === "wasm") {
                setFile("VCMI/WebAssembly");
                const wasmScript = await loadResource(wasmUrl, "text", setProgress) as string;
                const wasmScriptUrl = URL.createObjectURL(new Blob([wasmScript], { type: "text/javascript" }));
                const script = document.createElement("script");
                script.src = wasmScriptUrl;
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

                    try {
                        /* eslint-disable-next-line new-cap */
                        (window as any).VCMI(Module)
                            .then((_module: typeof VCMI_MODULE) => {
                                dispatch(uiSlice.actions.step("DATA_SELECT"));
                            })
                            .catch((e: any) => {
                                console.error(e);
                                setError(e.message ?? "wasm instantiation error");
                            });
                    } catch (e: any) {
                        console.error(e);
                        setError(e.message ?? "wasm instantiation error");
                    }
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
    }, [homm3DataUrl, props.resourceType, lang]);

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
                {error.indexOf("SharedArrayBuffer") !== -1 &&
                    <p class="text-red-500 font-bold">{t("browser_is_not_supported")}</p>
                }
                <p class="text-red-500 font-bold">{error}</p>
                <p class="text-gray-600">{t("open_browser_logs")}</p>
                {props.resourceType !== "wasm" && <button onClick={() => {
                    dispatch(uiSlice.actions.step("DATA_SELECT"));
                }}>{t("back")}</button>}
            </div>
        }
    </div>;
}
