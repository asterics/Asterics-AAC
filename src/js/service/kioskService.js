import { localStorageService } from './data/localStorageService';
import { util } from '../util/util';

let _beforeUnloadHandler = null;
let _wakeLock = null;
let _popStateHandler = null;
let _prevOverscrollBehavior = '';
let _prevTouchCallout = '';

let kioskService = {};

kioskService.lockApp = async function (options = {}) {
    localStorageService.save('AG_APP_LOCKED', 'true');
    // 1. Android Native Kiosk / Lock Task (fijar pantalla nativo en Android)
    if (window.AndroidNative && window.AndroidNative.setAppLocked) {
        try {
            window.AndroidNative.setAppLocked(true);
        } catch (e) {}
    }

    // 2. Pantalla completa del sistema (solo si se solicita explícitamente en options)
    if (options.fullscreen && !util.isFullscreen()) {
        try {
            let p = util.openFullscreen();
            if (p && p.catch) p.catch(() => {});
        } catch (e) {}
    }

    // 3. Prevenir gestos de deslizamiento hacia atrás/adelante en iOS y Android
    _prevOverscrollBehavior = document.documentElement.style.overscrollBehavior || '';
    document.documentElement.style.overscrollBehavior = 'none';
    document.body.style.overscrollBehavior = 'none';

    _prevTouchCallout = document.documentElement.style.webkitTouchCallout || '';
    document.documentElement.style.webkitTouchCallout = 'none';
    document.body.style.webkitTouchCallout = 'none';

    // 4. Trampa de historial para evitar salir con gestos de borde o botón atrás
    if (!_popStateHandler) {
        history.pushState({ appLocked: true }, '');
        _popStateHandler = function (e) {
            history.pushState({ appLocked: true }, '');
        };
        window.addEventListener('popstate', _popStateHandler);
    }

    // 5. Prevenir cierre o recarga accidental de pestaña o ventana
    if (!_beforeUnloadHandler) {
        _beforeUnloadHandler = function (e) {
            e.preventDefault();
            e.returnValue = '';
            return '';
        };
        window.addEventListener('beforeunload', _beforeUnloadHandler);
    }

    // 6. Bloquear teclas del sistema en navegadores Chromium (Escape, F11, etc.)
    if (navigator.keyboard && navigator.keyboard.lock) {
        try {
            await navigator.keyboard.lock(['Escape', 'F11', 'Tab', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight']);
        } catch (e) {}
    }

    // 7. Evitar suspensión de pantalla mediante Wake Lock API
    if ('wakeLock' in navigator && !_wakeLock) {
        try {
            _wakeLock = await navigator.wakeLock.request('screen');
        } catch (e) {}
    }
};

kioskService.unlockApp = function () {
    localStorageService.save('AG_APP_LOCKED', 'false');
    // 1. Android Native Unlock (desfijar pantalla)
    if (window.AndroidNative && window.AndroidNative.setAppLocked) {
        try {
            window.AndroidNative.setAppLocked(false);
        } catch (e) {}
    }

    // 2. Restaurar comportamiento de gestos y overscroll
    document.documentElement.style.overscrollBehavior = _prevOverscrollBehavior;
    document.body.style.overscrollBehavior = _prevOverscrollBehavior;
    document.documentElement.style.webkitTouchCallout = _prevTouchCallout;
    document.body.style.webkitTouchCallout = _prevTouchCallout;

    // 3. Quitar trampa de navegación
    if (_popStateHandler) {
        window.removeEventListener('popstate', _popStateHandler);
        _popStateHandler = null;
    }

    // 4. Quitar trampa de beforeunload
    if (_beforeUnloadHandler) {
        window.removeEventListener('beforeunload', _beforeUnloadHandler);
        _beforeUnloadHandler = null;
    }

    // 5. Desbloquear teclado
    if (navigator.keyboard && navigator.keyboard.unlock) {
        try {
            navigator.keyboard.unlock();
        } catch (e) {}
    }

    // 6. Liberar Wake Lock
    if (_wakeLock) {
        try {
            _wakeLock.release();
        } catch (e) {}
        _wakeLock = null;
    }
};

export { kioskService };
