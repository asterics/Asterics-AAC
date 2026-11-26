import { convertServiceLocal } from '../service/data/convertServiceLocal.js';

class SettingsApp {
    /**
     * @param settings.modelVersion
     * @param settings.appLang
     * @param settings.unlockPasscode
     * @param settings.syncNavigation
     * @param settings.externalSpeechServiceUrl
     * @param settings.showSearchLocked if true, the floating search button is shown in locked mode (default: true)
     */
    constructor(settings) {
        settings = settings || {};
        this.modelVersion = settings.modelVersion;
        this.appLang = settings.appLang || "";
        this.unlockPasscode = settings.unlockPasscode;
        this.syncNavigation = settings.syncNavigation;
        this.externalSpeechServiceUrl = settings.externalSpeechServiceUrl;
        this.showSearchLocked = settings.showSearchLocked !== undefined ? settings.showSearchLocked : true;

        convertServiceLocal.updateDataModel(this);
    }
}

export { SettingsApp };