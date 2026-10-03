import { convertServiceLocal } from '../service/data/convertServiceLocal.js';

class SettingsApp {
    /**
     * @param settings.modelVersion
     * @param settings.appLang
     * @param settings.unlockPasscode
     * @param settings.syncNavigation
     * @param settings.externalSpeechServiceUrl
     */
    constructor(settings) {
        settings = settings || {};
        this.modelVersion = settings.modelVersion;
        this.appLang = settings.appLang || "";
        this.unlockPasscode = settings.unlockPasscode;
        this.syncNavigation = settings.syncNavigation;
        this.externalSpeechServiceUrl = settings.externalSpeechServiceUrl;
        this.kioskModeOnStartup = settings.kioskModeOnStartup || false;
        this.fullscreenOnStartup = settings.fullscreenOnStartup || false;
        this.lockOnStartup = settings.lockOnStartup || false;

        convertServiceLocal.updateDataModel(this);
    }
}

export { SettingsApp };