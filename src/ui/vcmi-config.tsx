import { useDispatch, useSelector } from "react-redux";
import { defaultConfig, getScreenResolution, resolutions, State, uiSlice } from "../util/store";
import { useT } from "../i18n";
import { useEffect, useState } from "preact/hooks";
import { getFilesDB } from "../util/db";
import { BlobReader, BlobWriter, Uint8ArrayReader, Uint8ArrayWriter, ZipReader, ZipWriter } from "@zip.js/zip.js";

const widhtRegex = new RegExp("\"width\"\\s*:\\s*(\\d+)");
const heightRegex = new RegExp("\"height\"\\s*:\\s*(\\d+)");

export function VCMIConfig() {
    const dispatch = useDispatch();
    const t = useT();
    const config = useSelector((state: State) => state.ui.config);
    const [index, setIndex] = useState<number>(0);
    const [downloadLink, setDownloadLink] = useState<string | null>(null);
    const [dlcLoading, setDlcLoading] = useState<boolean>(false);
    const [dlcError, setDlcError] = useState<string | null>(null);
    const [dlcFile, setDlcFile] = useState<string>("");

    function resetConfig() {
        setIndex(0);
        dispatch(uiSlice.actions.setConfig(defaultConfig()));

        getFilesDB()
            .then((db) => {
                // db.clear().catch(() => {});
                return db.put("/home/web_user/.config/vcmi/settings.json", new Uint8Array(0));
            })
            .catch(console.error);
    }

    useEffect(() => {
        const [w, h] = parseResolution(config);
        if (w && h) {
            const index = resolutions.findIndex((r) => r[0] === w && r[1] === h);
            if (index !== -1) {
                setIndex(index);
                return;
            }
        } else {
            resetConfig();
        }
    }, []);

    useEffect(() => {
        if (index === 0) {
            const root = document.getElementById("app");
            const observer = new ResizeObserver(() => {
                dispatch(uiSlice.actions.setConfig(updateConfigResolution(config, 0)));
            });
            observer.observe(root!);
            return () => {
                observer.unobserve(root!);
            };
        }
    }, [index]);

    return <div class="flex flex-col gap-2">
        <div class="field-row-stacked">
            <label for="resolution">{t("resolution")}</label>
            <select id="resolution" onChange={(e) => {
                const index = Number.parseInt(e.currentTarget.value);
                if (index >= 0 && index < resolutions.length) {
                    setIndex(index);
                    dispatch(uiSlice.actions.setConfig(updateConfigResolution(config, index)));
                }
            }}>
                {resolutions.map(([w, h], i) => {
                    const [screenWidth, screenHeight] = getScreenResolution();
                    const text = i === 0 ? t("fit_screen") + " — " + screenWidth + "x" + screenHeight :
                        w + "x" + h;
                    return <option value={i} selected={index === i} >{text}</option>;
                })}
            </select>
        </div>

        <div class="flex flex-row justify-between gap-4">
            <button onClick={resetConfig}>{t("reset")}</button>
            {downloadLink !== null &&
                <a href={downloadLink} target="_blank">{t("archive_link")}</a>
            }
            {downloadLink === null && <button onClick={async () => {
                const writer = new ZipWriter(new BlobWriter("application/zip"), { bufferedWrite: true, level: 0 });
                const db = await getFilesDB();
                await db.forEach((key, value) => {
                    if (value.length > 0) {
                        writer.add(key, new Uint8ArrayReader(value));
                    }
                });
                if (downloadLink !== null) {
                    URL.revokeObjectURL(downloadLink);
                }
                setDownloadLink(URL.createObjectURL(await writer.close()));
            }}>{t("download_saves")}</button>
            }
            <button class={dlcLoading ? "opacity-50 pointer-events-none" : ""} onClick={() => {
                if (!dlcLoading) {
                    document.getElementById("upload-file")?.click();
                }
            }}>{t("upload_dlc")}</button>
            <input type="file" id="upload-file" class="hidden" onChange={async (e) => {
                const files = e.currentTarget.files;
                if (files !== null && files.length > 0) {
                    try {
                        setDlcError(null);
                        setDlcLoading(true);
                        setDlcFile(files[0].name);
                        const reader = new ZipReader(new BlobReader(files[0]));
                        const db = await getFilesDB();
                        for await (const next of reader.getEntriesGenerator()) {
                            if (!next.directory && next.getData && !next.filename.startsWith("__MACOSX")) {
                                setDlcFile(next.filename);
                                const data = await next.getData(new Uint8ArrayWriter());
                                await db.put(next.filename[0] === "/" ?
                                    next.filename : "/" + next.filename, data);
                            }
                        }
                    } catch (e: any) {
                        setDlcError(e.message ?? "unknown error");
                    } finally {
                        setDlcLoading(false);
                    }
                }
            }}></input>
        </div>

        {dlcLoading && <div>
            <div>{t("loading")}: {dlcFile}</div>
        </div>}

        {dlcError && <div class="text-red-500 font-bold">
            {t("error")}: {dlcError}
        </div>}

        <div class="field-row-stacked w-full">
            <label for="config-text">{t("config")}</label>
            <textarea id="config-text" rows={8} value={config}
                onChange={(e) => dispatch(uiSlice.actions.setConfig(e.currentTarget.value))}></textarea>
        </div>

        {!dlcLoading &&
            <div class="flex flex-row justify-end">
                <button onClick={() => {
                    dispatch(uiSlice.actions.step("STARTED"));
                }}>{t("start_the_game")}</button>
            </div>}
    </div>;
}


function updateConfigResolution(config: string, index: number) {
    const [screenWidth, screenHeight] = getScreenResolution();
    const [w, h] = index === 0 ? [screenWidth, screenHeight] : resolutions[index];
    return config
        .replace(widhtRegex, "\"width\": " + w)
        .replace(heightRegex, "\"height\": " + h);
}

export function parseResolution(config: string) {
    const wMatch = config.match(widhtRegex);
    const hMatch = config.match(heightRegex);

    if (wMatch && hMatch) {
        return [Number.parseInt(wMatch[1]), Number.parseInt(hMatch[1])];
    }

    return [null, null];
}
