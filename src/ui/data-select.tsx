import { useDispatch, useSelector } from "react-redux";
import { State, uiSlice } from "../util/store";
import { useT } from "../i18n";
import { useState } from "preact/hooks";

export function DataSelect() {
    const t = useT();
    const dispatch = useDispatch();
    const dataUrl = useSelector((state: State) => state.ui.dataUrl);
    const [dataType, setDataType] = useState<"file" | "url" | "db">("url");

    return <div class="flex flex-col">
        <article class="pt-0" role="tabpanel">
            <h3 class="my-4">{t("legal")}</h3>
            <p>
                {t("legal_text")}
            </p>
            <p class="mt-2">
                [1] — <a href="https://github.com/vcmi/" target="_blank">VCMI</a> ;
                [2] — <a href="https://www.gog.com/en/game/heroes_of_might_and_magic_3_complete_edition" target="_blank">HoMM3</a>
            </p>
            <div class="field-row mt-4">
                <input checked type="checkbox" disabled id="confirm_legal_copy" />
                <label class="font-bold" for="confirm_legal_copy">
                    {t("confirm_legal_copy")}
                </label>
            </div>
        </article>
        <fieldset>
            <legend>{t("data_source")}</legend>
            <div class="field-row">
                <input checked={dataType === "file"} onSelect={() => setDataType("file")}
                    id="data-directory" type="radio" name="data-source" />
                <label for="data-directory">{t("data_directory")}</label>
            </div>
            <div class="field-row">
                <input class="ml-4" id="data-file" type="file" name="data-file" webkitdirectory />
            </div>
            <div class="field-row">
                <input checked={dataType === "url"}
                    onSelect={() => setDataType("url")}
                    id="data-url" type="radio" name="data-source" />
                <label for="data-url">URL</label>
            </div>
            <div class="field-row">
                <input class="ml-4 w-full" id="data-url" type="text"
                    onChange={(e) => {
                        setDataType("url");
                        dispatch(uiSlice.actions.setDataUrl(e.currentTarget.value ?? ""));
                    }}
                    value={dataUrl} />
            </div>
            <div class="field-row">
                <input checked={dataType === "db"} onSelect={() => setDataType("db")}
                    id="data-db" type="radio" name="data-source" />
                <label for="data-db">{t("data_db")}</label>
            </div>
        </fieldset>
        <button class="self-end"
            onClick={() => {
                dispatch(uiSlice.actions.step("LOADING_DATA"));
            }}
        >
            {t("next")}
        </button>
    </div>;

    return <div>
        <button class="btn btn-xl" >Press to start</button>
    </div>

}