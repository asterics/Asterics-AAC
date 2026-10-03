<template>
    <div ref="wrapper" class="grid-item-content comic-bubble-wrapper" :style="wrapperStyle">
        <svg class="comic-bubble-svg"
             viewBox="0 0 300 200"
             preserveAspectRatio="none">
            <!-- Sombra sólida 3D tipo cómic -->
            <path v-if="comicShadow && shadowPath" :d="shadowPath" :fill="'#111111'" opacity="0.85" transform="translate(5, 5)"/>

            <!-- Burbujas de pensamiento adicionales si es tipo 'thought' -->
            <g v-if="bubbleType === 'thought' && thoughtBubbles.length">
                <circle v-for="(b, idx) in thoughtBubbles" :key="'tb-' + idx"
                        :cx="b.cx" :cy="b.cy" :r="b.r"
                        :fill="fillColor" :stroke="borderColor" :stroke-width="borderWidth" />
            </g>

            <!-- Cuerpo principal del bocadillo -->
            <path :d="bubblePath"
                  :fill="fillColor"
                  :stroke="borderColor"
                  :stroke-width="borderWidth"
                  :stroke-dasharray="bubbleType === 'whisper' ? '6,4' : 'none'"
                  stroke-linejoin="round"
                  stroke-linecap="round" />
        </svg>

        <!-- Contenedor del texto centrado dentro del relleno del bocadillo (HTML estándar, sin deformación de fuentes) -->
        <div ref="textContainer" class="comic-bubble-text-container" :style="textContainerStyle">
            <div ref="bubbleText" class="comic-bubble-text" :style="textStyle">
                {{ displayContent }}
            </div>
        </div>
    </div>
</template>

<script>
import { i18nService } from '../../../js/service/i18nService';
import { stateService } from '../../../js/service/stateService';
import { constants } from '../../../js/util/constants';
import $ from '../../../js/externals/jquery';

export default {
    name: 'GridElementComicBubble',
    props: ['gridElement', 'element', 'metadata', 'containerSize', 'editable', 'watchForChanges'],
    data() {
        return {
            autoFontSizePx: null,
            resizeObserver: null,
            externalSetLabel: ''
        };
    },
    computed: {
        targetElement() {
            return this.gridElement || this.element || {};
        },
        bubbleProps() {
            let el = this.targetElement;
            return (el && el.additionalProps && el.additionalProps.comicBubble) || {};
        },
        bubbleType() {
            return this.bubbleProps.bubbleType || 'speech';
        },
        tailPosition() {
            return this.bubbleProps.tailPosition || 'bottom-left';
        },
        fontFamily() {
            return this.bubbleProps.fontFamily || '"Comic Neue", "Comic Sans MS", "Chalkboard SE", "Comic Relief", cursive, sans-serif';
        },
        fontSizePct() {
            let el = this.targetElement;
            if (el && el.fontSizePct != null && el.fontSizePct > 0) {
                return el.fontSizePct;
            }
            if (this.bubbleProps && this.bubbleProps.fontSizePct != null && this.bubbleProps.fontSizePct > 0) {
                return this.bubbleProps.fontSizePct;
            }
            return 100;
        },
        fontColor() {
            let el = this.targetElement;
            return (el && el.fontColor) || (this.bubbleProps && this.bubbleProps.fontColor) || '#111111';
        },
        fontWeight() {
            return this.bubbleProps.fontWeight || 'bold';
        },
        fontStyle() {
            return this.bubbleProps.fontStyle || 'normal';
        },
        textAlign() {
            return this.bubbleProps.textAlign || 'center';
        },
        borderColor() {
            return this.bubbleProps.borderColor || '#111111';
        },
        borderWidth() {
            let w = this.bubbleProps.borderWidth;
            return w != null ? w : 3;
        },
        fillColor() {
            return this.bubbleProps.fillColor || '#ffffff';
        },
        cellBgColor() {
            let el = this.targetElement;
            return (el && el.backgroundColor) || (this.bubbleProps && this.bubbleProps.cellBgColor) || 'transparent';
        },
        comicShadow() {
            return this.bubbleProps.comicShadow !== false;
        },
        displayContent() {
            let el = this.targetElement;
            if (!el) return '';
            let dynamicText = (this.externalSetLabel + '') || (el.id ? stateService.getDisplayText(el.id) : '');
            if (dynamicText && typeof dynamicText === 'string' && dynamicText.trim()) {
                return dynamicText;
            }
            let label = el.label;
            if (typeof label === 'string' && label.trim()) {
                return label;
            }
            if (label && typeof label === 'object') {
                let text = i18nService.getTranslation(label);
                if (text && typeof text === 'string' && text.trim()) {
                    return text;
                }
                let curLang = i18nService.getContentLang();
                if (label[curLang] && typeof label[curLang] === 'string' && label[curLang].trim()) {
                    return label[curLang];
                }
                let appLang = i18nService.getAppLang();
                if (label[appLang] && typeof label[appLang] === 'string' && label[appLang].trim()) {
                    return label[appLang];
                }
                for (let key in label) {
                    if (label[key] && typeof label[key] === 'string' && label[key].trim()) {
                        return label[key];
                    }
                }
            }
            return (this.bubbleProps && this.bubbleProps.text) || '';
        },
        wrapperStyle() {
            return {
                backgroundColor: this.cellBgColor,
                width: '100%',
                height: '100%',
                flex: '1 1 auto',
                position: 'relative',
                display: 'block',
                overflow: 'hidden',
                borderRadius: '8px',
                boxSizing: 'border-box'
            };
        },
        textPercentages() {
            if (this.bubbleType === 'box') {
                return { top: 6.0, left: 6.0, width: 88.0, height: 86.0 };
            }

            if (this.bubbleType === 'shout') {
                return { top: 15.0, left: 15.0, width: 70.0, height: 70.0 };
            }

            if (this.bubbleType === 'thought') {
                if (this.tailPosition === 'top-left' || this.tailPosition === 'top-right') {
                    return { top: 34.0, left: 10.0, width: 80.0, height: 56.0 };
                } else if (this.tailPosition === 'left') {
                    return { top: 8.0, left: 16.0, width: 74.0, height: 76.0 };
                } else if (this.tailPosition === 'right') {
                    return { top: 8.0, left: 10.0, width: 74.0, height: 76.0 };
                } else if (this.tailPosition === 'none') {
                    return { top: 8.0, left: 10.0, width: 80.0, height: 76.0 };
                }
                // default thought tail is bottom
                return { top: 6.0, left: 10.0, width: 80.0, height: 56.0 };
            }

            // speech / whisper
            if (this.tailPosition === 'bottom-left' || this.tailPosition === 'bottom-center' || this.tailPosition === 'bottom-right') {
                // Main bubble body is y: [14, 155] (7% to 77.5%), center is placed in upper cavity at ~34%
                return { top: 4.0, left: 6.0, width: 88.0, height: 60.0 };
            } else if (this.tailPosition === 'top-left' || this.tailPosition === 'top-right') {
                // Main bubble body is y: [45, 186] (22.5% to 93.0%), center is placed in lower cavity at ~66%
                return { top: 36.0, left: 6.0, width: 88.0, height: 60.0 };
            } else if (this.tailPosition === 'left') {
                return { top: 6.0, left: 18.0, width: 76.0, height: 86.0 };
            } else if (this.tailPosition === 'right') {
                return { top: 6.0, left: 6.0, width: 76.0, height: 86.0 };
            } else {
                return { top: 6.0, left: 6.0, width: 88.0, height: 86.0 };
            }
        },
        textContainerStyle() {
            let dim = this.textPercentages;
            return {
                position: 'absolute',
                top: dim.top + '%',
                left: dim.left + '%',
                width: dim.width + '%',
                height: dim.height + '%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                pointerEvents: 'none',
                zIndex: 2,
                overflow: 'hidden',
                boxSizing: 'border-box',
                padding: '2px 6px'
            };
        },
        textStyle() {
            let fontSizeStr = this.autoFontSizePx
                ? `${this.autoFontSizePx}px`
                : `clamp(0.6rem, ${(1.2 * (this.fontSizePct / 100)).toFixed(2)}rem, 2.5rem)`;

            return {
                fontFamily: this.fontFamily,
                fontSize: fontSizeStr,
                color: this.fontColor,
                fontWeight: this.fontWeight,
                fontStyle: this.fontStyle,
                lineHeight: 1.15,
                textAlign: this.textAlign || 'center',
                width: '100%',
                maxHeight: '100%',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                hyphens: 'auto',
                whiteSpace: 'pre-line',
                display: 'block',
                margin: '0',
                padding: '0'
            };
        },
        thoughtBubbles() {
            if (this.bubbleType !== 'thought' || this.tailPosition === 'none') return [];
            switch (this.tailPosition) {
                case 'bottom-left':
                    return [{ cx: 50, cy: 172, r: 8 }, { cx: 35, cy: 188, r: 5 }];
                case 'bottom-center':
                    return [{ cx: 145, cy: 172, r: 8 }, { cx: 140, cy: 188, r: 5 }];
                case 'bottom-right':
                    return [{ cx: 250, cy: 172, r: 8 }, { cx: 265, cy: 188, r: 5 }];
                case 'top-left':
                    return [{ cx: 50, cy: 28, r: 8 }, { cx: 35, cy: 12, r: 5 }];
                case 'top-right':
                    return [{ cx: 250, cy: 28, r: 8 }, { cx: 265, cy: 12, r: 5 }];
                case 'left':
                    return [{ cx: 28, cy: 100, r: 8 }, { cx: 12, cy: 110, r: 5 }];
                case 'right':
                    return [{ cx: 272, cy: 100, r: 8 }, { cx: 288, cy: 110, r: 5 }];
                default:
                    return [];
            }
        },
        bubblePath() {
            const w = 300;
            const h = 200;

            if (this.bubbleType === 'box') {
                return `M 15 15 H 285 V 185 H 15 Z`;
            }

            if (this.bubbleType === 'shout') {
                // Polígono en estrella estilo explosión / estallido cómic
                return `M 25,95 L 8,60 L 50,55 L 40,15 L 85,32 L 115,8 L 145,30 L 185,10 L 205,35 L 255,20 L 250,58 L 292,65 L 268,100 L 292,135 L 250,142 L 255,180 L 205,165 L 185,190 L 145,170 L 115,192 L 85,168 L 40,185 L 50,145 L 8,140 Z`;
            }

            if (this.bubbleType === 'thought') {
                // Nube de pensamiento
                return `M 65 30 
                        C 50 15, 20 25, 25 55 
                        C 5 65, 5 105, 25 120 
                        C 10 140, 35 170, 65 160 
                        C 85 175, 125 175, 145 160 
                        C 165 175, 215 175, 235 160 
                        C 265 170, 290 140, 275 120 
                        C 295 105, 295 65, 275 55 
                        C 280 25, 250 15, 235 30 
                        C 215 15, 165 15, 145 30 
                        C 125 15, 85 15, 65 30 Z`;
            }

            // Diálogo estándar (Speech) o Susurro (Whisper)
            let rx = 24;
            let ry = 24;
            let top = 14;
            let left = 14;
            let right = 286;
            let bottom = 155;

            if (this.tailPosition === 'none') {
                bottom = 186;
                return `M ${left + rx} ${top}
                        H ${right - rx} A ${rx} ${ry} 0 0 1 ${right} ${top + ry}
                        V ${bottom - ry} A ${rx} ${ry} 0 0 1 ${right - rx} ${bottom}
                        H ${left + rx} A ${rx} ${ry} 0 0 1 ${left} ${bottom - ry}
                        V ${top + ry} A ${rx} ${ry} 0 0 1 ${left + rx} ${top} Z`;
            }

            if (this.tailPosition === 'bottom-left') {
                return `M ${left + rx} ${top}
                        H ${right - rx} A ${rx} ${ry} 0 0 1 ${right} ${top + ry}
                        V ${bottom - ry} A ${rx} ${ry} 0 0 1 ${right - rx} ${bottom}
                        H 95
                        L 45 192
                        L 65 ${bottom}
                        H ${left + rx} A ${rx} ${ry} 0 0 1 ${left} ${bottom - ry}
                        V ${top + ry} A ${rx} ${ry} 0 0 1 ${left + rx} ${top} Z`;
            }

            if (this.tailPosition === 'bottom-center') {
                return `M ${left + rx} ${top}
                        H ${right - rx} A ${rx} ${ry} 0 0 1 ${right} ${top + ry}
                        V ${bottom - ry} A ${rx} ${ry} 0 0 1 ${right - rx} ${bottom}
                        H 175
                        L 150 192
                        L 125 ${bottom}
                        H ${left + rx} A ${rx} ${ry} 0 0 1 ${left} ${bottom - ry}
                        V ${top + ry} A ${rx} ${ry} 0 0 1 ${left + rx} ${top} Z`;
            }

            if (this.tailPosition === 'bottom-right') {
                return `M ${left + rx} ${top}
                        H ${right - rx} A ${rx} ${ry} 0 0 1 ${right} ${top + ry}
                        V ${bottom - ry} A ${rx} ${ry} 0 0 1 ${right - rx} ${bottom}
                        H 235
                        L 255 192
                        L 205 ${bottom}
                        H ${left + rx} A ${rx} ${ry} 0 0 1 ${left} ${bottom - ry}
                        V ${top + ry} A ${rx} ${ry} 0 0 1 ${left + rx} ${top} Z`;
            }

            if (this.tailPosition === 'top-left') {
                top = 45;
                bottom = 186;
                return `M 65 ${top}
                        L 45 8
                        L 95 ${top}
                        H ${right - rx} A ${rx} ${ry} 0 0 1 ${right} ${top + ry}
                        V ${bottom - ry} A ${rx} ${ry} 0 0 1 ${right - rx} ${bottom}
                        H ${left + rx} A ${rx} ${ry} 0 0 1 ${left} ${bottom - ry}
                        V ${top + ry} A ${rx} ${ry} 0 0 1 ${left + rx} ${top} Z`;
            }

            if (this.tailPosition === 'top-right') {
                top = 45;
                bottom = 186;
                return `M 205 ${top}
                        L 255 8
                        L 235 ${top}
                        H ${right - rx} A ${rx} ${ry} 0 0 1 ${right} ${top + ry}
                        V ${bottom - ry} A ${rx} ${ry} 0 0 1 ${right - rx} ${bottom}
                        H ${left + rx} A ${rx} ${ry} 0 0 1 ${left} ${bottom - ry}
                        V ${top + ry} A ${rx} ${ry} 0 0 1 ${left + rx} ${top} Z`;
            }

            if (this.tailPosition === 'left') {
                left = 40;
                bottom = 186;
                return `M ${left + rx} ${top}
                        H ${right - rx} A ${rx} ${ry} 0 0 1 ${right} ${top + ry}
                        V ${bottom - ry} A ${rx} ${ry} 0 0 1 ${right - rx} ${bottom}
                        H ${left + rx} A ${rx} ${ry} 0 0 1 ${left} ${bottom - ry}
                        V 125
                        L 10 100
                        L ${left} 75
                        V ${top + ry} A ${rx} ${ry} 0 0 1 ${left + rx} ${top} Z`;
            }

            if (this.tailPosition === 'right') {
                right = 260;
                bottom = 186;
                return `M ${left + rx} ${top}
                        H ${right - rx} A ${rx} ${ry} 0 0 1 ${right} ${top + ry}
                        V 75
                        L 290 100
                        L ${right} 125
                        V ${bottom - ry} A ${rx} ${ry} 0 0 1 ${right - rx} ${bottom}
                        H ${left + rx} A ${rx} ${ry} 0 0 1 ${left} ${bottom - ry}
                        V ${top + ry} A ${rx} ${ry} 0 0 1 ${left + rx} ${top} Z`;
            }

            return `M 15 15 H 285 V 185 H 15 Z`;
        },
        shadowPath() {
            return this.bubblePath;
        }
    },
    watch: {
        displayContent() {
            this.calcFontSize();
        },
        containerSize: {
            deep: true,
            handler() {
                this.calcFontSize();
            }
        },
        fontSizePct() {
            this.calcFontSize();
        },
        fontFamily() {
            this.calcFontSize();
        },
        fontWeight() {
            this.calcFontSize();
        },
        fontStyle() {
            this.calcFontSize();
        },
        bubbleType() {
            this.calcFontSize();
        },
        tailPosition() {
            this.calcFontSize();
        }
    },
    methods: {
        calcFontSize() {
            this.$nextTick(() => {
                let text = (this.displayContent || '').trim();
                if (!text) {
                    if (this.autoFontSizePx !== null) {
                        this.autoFontSizePx = null;
                    }
                    return;
                }

                let container = this.$refs.textContainer;
                let wrapper = this.$refs.wrapper;

                let dim = this.textPercentages;
                let widthFactor = dim.width / 100;
                let heightFactor = dim.height / 100;

                let width = 0;
                let height = 0;

                if (container && container.clientWidth > 0 && container.clientHeight > 0) {
                    width = container.clientWidth;
                    height = container.clientHeight;
                } else if (wrapper && wrapper.clientWidth > 0 && wrapper.clientHeight > 0) {
                    width = wrapper.clientWidth * widthFactor;
                    height = wrapper.clientHeight * heightFactor;
                } else if (this.containerSize && this.containerSize.width > 0 && this.containerSize.height > 0) {
                    width = this.containerSize.width * widthFactor;
                    height = this.containerSize.height * heightFactor;
                }

                if (width <= 10 || height <= 10) {
                    return;
                }

                let availWidth = Math.max(10, width - 6);
                let availHeight = Math.max(10, height - 4);

                let cleanFont = (this.fontFamily || 'sans-serif')
                    .replace(/["']/g, '')
                    .split(',')[0]
                    .trim() || 'sans-serif';

                let canvas = document.createElement('canvas');
                let ctx = canvas.getContext('2d');

                let minSize = 8;
                let maxSize = Math.max(minSize, Math.min(Math.floor(availHeight * 0.92), Math.floor(availWidth * 0.92), 120));

                let low = minSize;
                let high = maxSize;
                let bestFitting = minSize;

                while (low <= high) {
                    let mid = Math.floor((low + high) / 2);
                    ctx.font = `${this.fontStyle || 'normal'} ${this.fontWeight || 'bold'} ${mid}px ${cleanFont}, sans-serif`;

                    let rawLines = text.split(/\r?\n/);
                    let totalLines = 0;

                    for (let rLine of rawLines) {
                        let words = rLine.split(/\s+/).filter(Boolean);
                        if (words.length === 0) {
                            totalLines++;
                            continue;
                        }

                        let curLine = '';
                        for (let w of words) {
                            let testLine = curLine ? (curLine + ' ' + w) : w;
                            let testWidth = ctx.measureText(testLine).width;
                            if (testWidth <= availWidth) {
                                curLine = testLine;
                            } else {
                                if (curLine) {
                                    totalLines++;
                                    curLine = '';
                                }
                                let wordWidth = ctx.measureText(w).width;
                                if (wordWidth > availWidth) {
                                    let subWord = '';
                                    for (let ch of w) {
                                        let testSub = subWord + ch;
                                        if (ctx.measureText(testSub).width <= availWidth) {
                                            subWord = testSub;
                                        } else {
                                            totalLines++;
                                            subWord = ch;
                                        }
                                    }
                                    curLine = subWord;
                                } else {
                                    curLine = w;
                                }
                            }
                        }
                        if (curLine) {
                            totalLines++;
                        }
                    }

                    let lineHeight = mid * 1.15;
                    let totalHeight = totalLines * lineHeight;

                    if (totalHeight <= availHeight) {
                        bestFitting = mid;
                        low = mid + 1;
                    } else {
                        high = mid - 1;
                    }
                }

                let userScale = (this.fontSizePct || 100) / 100;
                let calculatedPx = Math.max(8, Math.round(bestFitting * userScale));

                if (this.autoFontSizePx !== calculatedPx) {
                    this.autoFontSizePx = calculatedPx;
                }

                this.$nextTick(() => {
                    let bText = this.$refs.bubbleText;
                    let tCont = this.$refs.textContainer;
                    if (bText && tCont && tCont.clientHeight > 0 && tCont.clientWidth > 0) {
                        let currentPx = this.autoFontSizePx || calculatedPx;
                        while (currentPx > 8 && (bText.scrollHeight > tCont.clientHeight || bText.scrollWidth > tCont.clientWidth)) {
                            currentPx -= 1;
                            bText.style.fontSize = currentPx + 'px';
                        }
                        if (this.autoFontSizePx !== currentPx) {
                            this.autoFontSizePx = currentPx;
                        }
                    }
                });
            });
        },
        externalUpdateFn(event, id, text) {
            let el = this.targetElement;
            if (el && id === el.id) {
                this.externalSetLabel = text;
                this.calcFontSize();
            }
        }
    },
    mounted() {
        this.calcFontSize();
        let el = this.targetElement;
        if (el && el.id) {
            $(document).on(`${constants.EVENT_ELEM_TEXT_CHANGED}.${el.id}`, this.externalUpdateFn);
        }
        if (window.ResizeObserver && this.$refs.wrapper) {
            this.resizeObserver = new ResizeObserver(() => {
                this.calcFontSize();
            });
            this.resizeObserver.observe(this.$refs.wrapper);
        }
        if (this.editable || this.watchForChanges) {
            this.$watch('gridElement', () => {
                this.calcFontSize();
            }, { deep: true });
            this.$watch('element', () => {
                this.calcFontSize();
            }, { deep: true });
        }
    },
    beforeDestroy() {
        let el = this.targetElement;
        if (el && el.id) {
            $(document).off(`${constants.EVENT_ELEM_TEXT_CHANGED}.${el.id}`);
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
    }
};
</script>

<style scoped>
.comic-bubble-wrapper {
    box-sizing: border-box;
}

.comic-bubble-svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
}

.comic-bubble-text {
    user-select: none;
    -webkit-user-select: none;
    text-shadow: 0px 0px 1px rgba(255, 255, 255, 0.4);
}
</style>
