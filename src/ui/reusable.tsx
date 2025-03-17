import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { useT } from "../i18n";
import { clients, State, uiSlice } from "../util/store";
import { VCMI_MODULE } from "../util/module";

export function ClientSelect() {
    const t = useT();
    const client = useSelector((state: State) => state.ui.client);
    const dispatch = useDispatch();
    const stateLang = useSelector((state: State) => state.ui.lang);
    const emVersion = VCMI_MODULE.getVCMIVersion();
    const clientDisabled = new URLSearchParams(location.search).get("client") !== null;

    return <fieldset>
        <legend>{t("client")}</legend>
        <div class="field-row-stacked">
            <label for="client">{t("version")}</label>
            <select id="client" disabled={clientDisabled} onChange={(e) => {
                dispatch(uiSlice.actions.setClient(e.currentTarget.value));
            }}>
                {clients.map(({ version }) => {
                    return <option value={version} selected={version === client}>{version}</option>;
                })}
            </select>
            {emVersion && <p class="text-gray-500">({emVersion})</p>}
        </div>
        <div class="field-row-stacked">
            <label for="language">{t("language")}</label>
            <select id="language" onChange={(e) => {
                dispatch(uiSlice.actions.setLang(e.currentTarget.value as "ru" | "en"));
            }}>
                {["ru", "en"].map((lang) => {
                    return <option value={lang} selected={lang === stateLang}>
                        {lang === "ru" ? "Русский" : "English"}
                    </option>;
                })}
            </select>
        </div>
    </fieldset>;
}
