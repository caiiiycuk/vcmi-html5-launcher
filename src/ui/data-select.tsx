import { useDispatch, useSelector } from "react-redux";
import { State, uiSlice } from "../util/store";
import { useT } from "../i18n";
import { useEffect, useState } from "preact/hooks";
import { getDataDB } from "../util/db";
import { VCMI_DATA, VCMI_MODULE } from "../util/module";

export function DataSelect() {
    const t = useT();
    const dispatch = useDispatch();
    const dataUrl = useSelector((state: State) => state.ui.homm3DataUrl);
    const [dataType, setDataType] = useState<"file" | "url" | "db">("url");
    const [hoMM3InDB, setHoMM3InDB] = useState<boolean>(false);
    const [dbReady, setDBReady] = useState<boolean>(false);
    const [zipUrl, setZipUrl] = useState<boolean>(false);

    useEffect(() => {
        const onend = () => {
            setDBReady(true);
            let hoMM3InDB = true;
            for (const next of Object.keys(VCMI_DATA)) {
                if (VCMI_DATA[next] === null) {
                    hoMM3InDB = false;
                    break;
                }
            }

            if (hoMM3InDB) {
                setHoMM3InDB(hoMM3InDB);
                setDataType("db");
            }
        };

        (async () => {
            try {
                const db = await getDataDB();
                await db.forEach((key, value) => {
                    if (VCMI_DATA[key] !== undefined) {
                        VCMI_DATA[key] = value;
                    }
                });
            } catch (e) {
                console.error(e);
            } finally {
                onend();
            }
        })().catch((e) => {
            console.error(e);
            onend();
        });
    }, []);

    return <div class="flex flex-col">
        <article class="pt-0" role="tabpanel">
            <h3 class="my-4">{t("legal")}</h3>
            <p>
                {t("legal_text")}
            </p>
            <p class="mt-2">
                [1] — <a href="https://github.com/vcmi/"
                    target="_blank">VCMI</a> ;
                [2] — <a href="https://www.gog.com/en/game/heroes_of_might_and_magic_3_complete_edition"
                    target="_blank">HoMM3</a>
            </p>
            <div class="field-row mt-4">
                <input checked type="checkbox" disabled id="confirm_legal_copy" />
                <label class="font-bold" for="confirm_legal_copy">
                    {t("confirm_legal_copy")}
                </label>
            </div>
        </article>
        {zipUrl && <fieldset>
            <legend>{t("instructions")}</legend>
            <div>
                {t("i1_download_zip")}
            </div>
            <div class="ml-4 my-3">
                <a class="text-lg underline cursor-pointer" href={dataUrl} target="_blank"
                    rel="noopener noreferrer">{t("i1_download_button")}</a>
            </div>
            <div class="my-3 font-bold">
                {t("i2_extract_zip_to_folder")}
            </div>
            <div class="my-3">
                {t("i3_select_folder")}
            </div>
            <div class="field-row">
                <input class="ml-4" id="data-file" type="file" name="data-file"
                    {... { webkitdirectory: true, directory: true }}
                    onChange={(e) => {
                        if (e.currentTarget.files !== null) {
                            setDataType("file");
                            VCMI_MODULE.homm3Files = e.currentTarget.files;
                        }
                    }} />
            </div>
        </fieldset>}
        {!zipUrl && <fieldset>
            <legend>{t("data_source")}</legend>
            <div class="field-row">
                <input disabled={!dbReady} checked={dataType === "file"}
                    onChange={() => setDataType("file")}
                    id="data-directory" type="radio" name="data-source" />
                <label for="data-directory">{t("data_directory")}</label>
            </div>
            <div class="field-row">
                <input class="ml-4" id="data-file" type="file" name="data-file"
                    {... { webkitdirectory: true, directory: true }}
                    onChange={(e) => {
                        if (e.currentTarget.files !== null) {
                            setDataType("file");
                            VCMI_MODULE.homm3Files = e.currentTarget.files;
                        }
                    }} />
            </div>
            <div class="field-row">
                <input disabled={!dbReady || dataUrl.length === 0} checked={dataType === "url"}
                    onChange={() => setDataType("url")}
                    id="data-url" type="radio" name="data-source" />
                <label for="data-url">URL</label>
            </div>
            <div class="field-row">
                <input class="ml-4 w-full" id="data-url" type="text"
                    onChange={(e) => {
                        setDataType("url");
                        dispatch(uiSlice.actions.setDataUrl(e.currentTarget.value ?? ""));
                    }}
                    value={dataUrl}
                    placeholder={t("enter_url")}
                />
            </div>
            <div class="field-row">
                <input disabled={!hoMM3InDB} checked={dataType === "db"} onChange={() => setDataType("db")}
                    id="data-db" type="radio" name="data-source" />
                <label for="data-db">{t("data_db")}</label>
            </div>
        </fieldset>}
        {dbReady &&
            <div class="flex flex-row gap-1">
                <button class="min-w-4" onClick={() => window.open("https://t.me/dzhomm3", "_blank")}>
                    <p class="tg-link size-5 p-0 m-0"></p>
                </button>
                <button class="min-w-4" onClick={() => dispatch(uiSlice.actions.step("ABOUT"))}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                        stroke-width="1.5" stroke="currentColor" class="size-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025
                            3.071-1.025 4.242 0 1.172 1.025 1.172 2.687
                            0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45
                            1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                    </svg>
                </button>
                <div class="flex-grow"></div>
                <button class="self-end"
                    onClick={() => {
                        if (dataType !== "db") {
                            for (const next of Object.keys(VCMI_DATA)) {
                                VCMI_DATA[next] = null;
                            }
                        }
                        if (dataType !== "file") {
                            delete VCMI_MODULE.homm3Files;
                        }
                        if (dataType === "url" && dataUrl.toLowerCase().endsWith(".zip")) {
                            setZipUrl(true);
                        } else {
                            dispatch(uiSlice.actions.step("LOADING_DATA"));
                        }
                    }}
                    disabled={dataUrl.length === 0 && dataType === "url"}
                >
                    {t("next")}
                </button>
            </div>}
        {!dbReady &&
            <p class="self-end font-bold my-1 text-gray-400">{t("loading_db")}</p>}
    </div>;
}
