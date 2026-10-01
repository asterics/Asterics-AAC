import {GridData} from '../../model/GridData';
import {GridImage} from '../../model/GridImage';
import {i18nService} from '../i18nService';
import {imageUtil} from '../../util/imageUtil';
import {GridElement} from '../../model/GridElement';
import {util} from '../../util/util';
import {dataService} from '../data/dataService.js';
import {MetaData} from '../../model/MetaData.js';
import {arasaacService} from '../pictograms/arasaacService.js';
import $ from "../../externals/jquery.js";
import {constants} from "../../util/constants.js";
import {TextConfig} from "../../model/TextConfig.js";
import {gridUtil} from '../../util/gridUtil';
import {fontUtil} from '../../util/fontUtil';
import {PdfArea} from "./PdfArea";

let pdfService = {};

const DEBUG_MARK_AREAS = false;
const DOC_WIDTH = 297;
const DOC_HEIGHT = 210;
const DEFAULT_FONT_PATH = "./app/fonts/ttf/Arimo-Regular.ttf"

let pdfOptions = {
    docPadding: 5,
    footerHeight: 8,
    elementPadding: 1
};
let jsPdfModule = null;
let doc = null;
let convertMode = null;
let homeGridId = null;
let metadata = null;

/**
 * Converts given grids to pdf and downloads the pdf file
 *
 * @param gridsData array of GridData to convert to pdf
 * @param options (optional) object containing options
 * @param options.showLinks if true, links on elements are created which are referring to another grid/page
 * @param options.backgroundColor object with r/g/b properties defining a background color for grid elements. Default: white.
 * @param options.includeGlobalGrid if true, the global grid is included to each grid
 * @param options.progressFn a function that is called in order to report progress of the task.
 *                           Parameters passed: <percentage:Number, text:String, abortFn:Function>.
 *                           "abortFn" can be called in order to abort the task.
 * @return {Promise<void>}
 */
pdfService.gridsToPdf = async function (gridsData, options) {
    jsPdfModule = jsPdfModule || (await import(/* webpackChunkName: "jspdf" */ 'jspdf'));
    options = options || {};
    let metadata = await dataService.getMetadata();
    let defaultGlobalGrid = null;
    if (options.includeGlobalGrid) {
        defaultGlobalGrid = await dataService.getGlobalGrid();
    }
    options.idPageMap = {};
    options.idParentsMap = {};
    gridsData = gridsData.filter(grid => !!grid);
    gridsData.forEach((grid, index) => {
        options.idPageMap[grid.id] = index + 1;
    });

    for (let grid of gridsData) {
        options.idParentsMap[grid.id] = options.idParentsMap[grid.id] || [];
        for (let element of grid.gridElements) {
            element = new GridElement(element);
            let nav = gridUtil.getNavigateGridId(element, homeGridId);
            if (nav) {
                options.idParentsMap[nav] = options.idParentsMap[nav] || [];
                options.idParentsMap[nav].push(options.idPageMap[grid.id]);
            }
        }
    }
    doc = new jsPdfModule.jsPDF({
        orientation: 'landscape',
        compress: true
    });

    options.pages = gridsData.length;
    for (let i = 0; i < gridsData.length && !options.abort; i++) {
        if (options.progressFn) {
            options.progressFn(
                Math.round((100 * i) / gridsData.length),
                i18nService.t('creatingPageXOfY', i + 1, gridsData.length),
                () => {
                    options.abort = true;
                }
            );
        }
        let globalGrid = defaultGlobalGrid;
        if (options.includeGlobalGrid && gridsData[i].showGlobalGrid && gridsData[i].globalGridId) {
            globalGrid = await dataService.getGrid(gridsData[i].globalGridId, false);
        }
        globalGrid = gridsData[i].showGlobalGrid !== false ? globalGrid : null;
        options.page = i + 1;
        await addGridToPdf(doc, gridsData[i], options, metadata, globalGrid);
        if (i < gridsData.length - 1) {
            doc.addPage();
        }
    }
    if (!options.abort) {
        if (options.progressFn) {
            options.progressFn(100);
        }
        //window.open(doc.output('bloburl'))
        doc.save('grid-export.pdf');
    }
};

function hasARASAACImages(gridData) {
    return gridData.gridElements.reduce(
        (total, element) =>
            total || (element.image && element.image.searchProviderName === arasaacService.SEARCH_PROVIDER_NAME),
        false
    );
}

function addFooter({doc, area, gridData, options}) {
    let fontSizePt = (pdfOptions.footerHeight * 0.4) / 0.352778;
    doc.setTextColor(0);
    doc.setFontSize(fontSizePt);
    let textL = i18nService.t('printedByAstericsGrid');
    let textL2 = i18nService.t('copyrightARASAACPDF');
    let textC = i18nService.getTranslation(gridData.label);
    let firstParentPage = options.idParentsMap[gridData.id][0];
    let yBaseFooter = area.y + area.height;
    let hasARASAAC = hasARASAACImages(gridData);
    let yLine1 = hasARASAAC ? yBaseFooter - pdfOptions.footerHeight : yBaseFooter;
    if (options.showLinks && firstParentPage) {
        let prefix = JSON.stringify(options.idParentsMap[gridData.id].slice(0, 5));
        textC = prefix + ' => ' + textC;
        let textWidth = doc.getTextWidth(textC);
        doc.link(
            DOC_WIDTH / 2 - textWidth / 2,
            yLine1 - pdfOptions.footerHeight * 0.4,
            textWidth,
            pdfOptions.footerHeight * 0.4,
            {pageNumber: firstParentPage}
        );
    }
    let currentPage = options.idPageMap[gridData.id] || 1;
    let totalPages = Object.keys(options.idPageMap).length || 1;
    let textR = currentPage + ' / ' + totalPages;
    doc.text(textL, pdfOptions.docPadding + pdfOptions.elementPadding, yLine1, {
        baseline: 'bottom',
        align: 'left'
    });
    if (hasARASAAC) {
        doc.text(textL2, pdfOptions.docPadding + pdfOptions.elementPadding, yBaseFooter, {
            baseline: 'bottom',
            align: 'left'
        });
    }
    doc.text(textC, DOC_WIDTH / 2, yLine1, {
        baseline: 'bottom',
        align: 'center'
    });
    doc.text(textR, DOC_WIDTH - pdfOptions.docPadding - pdfOptions.elementPadding, yLine1, {
        baseline: 'bottom',
        align: 'right'
    });
}

function addRegister({doc, area, options}) {
    let maxRegisters = 30;
    let stepSize = 1;
    let registerCount = options.pages;
    if (options.pages > maxRegisters) {
        stepSize = Math.ceil(options.pages / maxRegisters);
        registerCount = Math.ceil(options.pages / stepSize);
    }
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(0);
    doc.roundedRect(area.x, area.y, area.width, area.height, 0, 0);
    doc.setFontSize(13);
    let registerElementWidth = area.width / registerCount;
    for (let i = 0; i < registerCount; i++) {
        doc.roundedRect(
            i * registerElementWidth,
            DOC_HEIGHT - area.height,
            registerElementWidth,
            area.height,
            0,
            0
        );
        let maxPage = i * stepSize + 1;
        if (maxPage <= options.page) {
            doc.text(
                maxPage + '',
                i * registerElementWidth + registerElementWidth / 2,
                area.y + area.height / 2,
                {
                    baseline: 'middle',
                    align: 'center'
                }
            );
        }
    }
}

function addLink({element, idPageMap, elemArea}) {
    if (idPageMap[gridUtil.getNavigateGridId(element, homeGridId)]) {
        let targetPage = idPageMap[gridUtil.getNavigateGridId(element, homeGridId)];
        let iconWidth = Math.max(elemArea.width / 10, 7);
        let offsetX = elemArea.width - iconWidth - 1;
        doc.setDrawColor(255);
        doc.setFillColor(90, 113, 122);
        let rectX = elemArea.x + offsetX;
        let rectY = elemArea.y + 1;
        if (metadata.textConfig.textPosition === TextConfig.TEXT_POS_ABOVE) {
            rectY = elemArea.y + elemArea.height - iconWidth - 1;
        }
        doc.roundedRect(rectX, rectY, iconWidth, iconWidth, 1, 1, 'FD');
        doc.link(elemArea.x, elemArea.y, elemArea.width, elemArea.height, {pageNumber: targetPage});
        if (targetPage) {
            let fontSizePt = (iconWidth * 0.6) / 0.352778;
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(fontSizePt);
            doc.text(
                targetPage + '',
                rectX + iconWidth / 2,
                rectY + iconWidth / 2,
                {
                    baseline: 'middle',
                    align: 'center',
                    maxWidth: iconWidth
                }
            );
        }
    }
}

async function addGridToPdf(doc, gridData, options, metadata, globalGrid) {
    gridData = new GridData(gridData);
    gridData = gridUtil.mergeGrids(gridData, globalGrid, metadata);
    let registerHeight = options.showRegister && options.pages > 1 ? 10 : 0;
    let footerHeight = hasARASAACImages(gridData) ? 2 * pdfOptions.footerHeight : pdfOptions.footerHeight;
    let gridArea = getArea({
        x: pdfOptions.docPadding,
        y: pdfOptions.docPadding,
        width: DOC_WIDTH - 2 * pdfOptions.docPadding,
        height: (DOC_HEIGHT - 2 * pdfOptions.docPadding - footerHeight - registerHeight)
    });
    let footerArea = getArea({
        x: gridArea.x,
        y: gridArea.y + gridArea.height,
        width: gridArea.width,
        height: footerHeight
    });
    let registerArea = getArea({
        x: 0,
        y: DOC_HEIGHT - registerHeight,
        width: DOC_WIDTH,
        height: registerHeight
    });

    await loadDefaultFont();
    addFooter({doc, area: footerArea, gridData, options});
    if (registerHeight > 0) {
        addRegister({doc, area: registerArea, options})
    }

    await loadGridFont();
    let elementTotalWidth = gridArea.width / gridUtil.getWidthWithBounds(gridData);
    let elementTotalHeight =
        gridArea.height / gridUtil.getHeightWithBounds(gridData);
    markArea(gridArea, "lightgreen");
    for (let element of gridData.gridElements) {
        if (element.hidden) {
            continue;
        }
        let elemArea = getArea({
            x: gridArea.x + elementTotalWidth * element.x + pdfOptions.elementPadding,
            y: gridArea.y + elementTotalHeight * element.y + pdfOptions.elementPadding,
            width: elementTotalWidth * element.width - 2 * pdfOptions.elementPadding,
            height: elementTotalHeight * element.height - 2 * pdfOptions.elementPadding
        });
        markArea(elemArea, "lightblue");

        let bgColor = options.printBackground ? util.getRGB(MetaData.getElementColor(element, metadata)) : [255, 255, 255];
        doc.setDrawColor(0);
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.roundedRect(elemArea.x, elemArea.y, elemArea.width, elemArea.height, 3, 3, 'FD');

        let hasImage = element && element.image && (element.image.data || element.image.url);
        let displayLabel = gridUtil.getDisplayLabel(element);
        let labelArea = getArea();
        let imgArea = getArea();

        let imgMaxHeight = (1 - metadata.textConfig.fontSizePct / 100) * elemArea.height;
        let labelMaxHeight = elemArea.height - imgMaxHeight;
        if (!displayLabel || !hasImage) {
            let contentArea = getArea({
                x: elemArea.x + pdfOptions.elementPadding,
                y: elemArea.y + pdfOptions.elementPadding,
                width: elemArea.width - 2 * pdfOptions.elementPadding,
                height: elemArea.height - 2 * pdfOptions.elementPadding
            });
            if (hasImage) {
                imgArea = contentArea;
            }
            if (displayLabel) {
                labelArea = contentArea;
            }
        } else if (metadata.textConfig.textPosition === TextConfig.TEXT_POS_ABOVE) {
            labelArea = getArea({
                x: elemArea.x + pdfOptions.elementPadding,
                y: elemArea.y + pdfOptions.elementPadding,
                width: elemArea.width - 2 * pdfOptions.elementPadding,
                height: labelMaxHeight - pdfOptions.elementPadding
            });
            imgArea = getArea({
                x: elemArea.x + pdfOptions.elementPadding,
                y: elemArea.y + labelMaxHeight + pdfOptions.elementPadding,
                width: elemArea.width - 2 * pdfOptions.elementPadding,
                height: imgMaxHeight - 2 * pdfOptions.elementPadding
            });
        } else { // TEXT_POS_BELOW
            imgArea = getArea({
                x: elemArea.x + pdfOptions.elementPadding,
                y: elemArea.y + pdfOptions.elementPadding,
                width: elemArea.width - 2 * pdfOptions.elementPadding,
                height: imgMaxHeight - 2 * pdfOptions.elementPadding
            });
            labelArea = getArea({
                x: elemArea.x + pdfOptions.elementPadding,
                y: elemArea.y + imgMaxHeight,
                width: elemArea.width - 2 * pdfOptions.elementPadding,
                height: labelMaxHeight - pdfOptions.elementPadding
            });

        }

        markArea(imgArea, "yellow");
        markArea(labelArea, "orange");
        if (displayLabel) {
            addLabelToPdf({doc, element, area: labelArea, label: displayLabel, bgColor});
        }
        if (hasImage) {
            await addImageToPdf({doc, element, area: imgArea});
        }
        if (options.showLinks) {
            addLink({element, idPageMap: options.idPageMap, elemArea});
        }
    }
}

function addLabelToPdf({doc, element, area, bgColor, label}) {
    let hasImg = element.image && (element.image.data || element.image.url);
    let fontSizeMM = area.height;
    let fontSizePt = (fontSizeMM / 0.352778);
    if (convertMode === TextConfig.CONVERT_MODE_UPPERCASE) {
        label = label.toLocaleUpperCase();
    } else if (convertMode === TextConfig.CONVERT_MODE_LOWERCASE) {
        label = label.toLocaleLowerCase();
    }
    let optimalFontSize = getOptimalFontsize(
        doc,
        label,
        fontSizePt,
        area.width,
        area.height
    );
    let textColor = fontUtil.getHighContrastColorRgb(bgColor);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(optimalFontSize);
    let dim = doc.getTextDimensions(label);
    let lines = Math.ceil(dim.w / area.width);
    let totalTextHeight = dim.h * lines;
    let yStart = area.y + (area.height / 2) - (totalTextHeight / 2);
    doc.text(label, area.x + area.width / 2, yStart, {
        baseline: 'top',
        align: 'center',
        maxWidth: area.width
    });
}

function getOptimalFontsize(doc, text, baseSize, maxWidth, maxHeight) {
    let steps = 10;
    let size = baseSize;
    let stepSize = baseSize / 2;
    doc.setFontSize(size);
    let dim = doc.getTextDimensions(text);
    if (dim.w <= maxWidth) {
        return size;
    }
    for (let i = 0; i < steps; i++) {
        doc.setFontSize(size);
        let dim = doc.getTextDimensions(text);
        if (text.indexOf(' ') !== -1) {
            let possibleLines = Math.floor(maxHeight / dim.h);
            let currentLines = Math.ceil(dim.w / maxWidth);
            if (dim.w / possibleLines > maxWidth * 0.5 || currentLines > possibleLines) {
                size -= stepSize;
            } else {
                size += stepSize;
            }
        } else {
            if (dim.w > maxWidth) {
                size -= stepSize;
            } else {
                size += stepSize;
            }
        }
        stepSize /= 2;
    }
    return Math.floor(Math.min(size, baseSize));
}

async function addImageToPdf({doc, element, area}) {
    let hasImage = element && element.image && (element.image.data || element.image.url);
    if (!hasImage) {
        return Promise.resolve();
    }
    let type = new GridImage(element.image).getImageType();
    let imageData = element.image.data;
    let dim = null;
    if (!imageData) {
        let dataWithDim = await imageUtil.urlToBase64WithDimensions(element.image.url, 500, type);
        imageData = dataWithDim.data;
        dim = dataWithDim.dim;
    }
    if (!imageData) {
        return Promise.resolve();
    }
    if (!dim) {
        dim = await imageUtil.getImageDimensionsFromDataUrl(imageData);
    }
    let elementRatio = area.width / area.height;
    let width = area.width,
        height = area.height;
    let xOffset = 0,
        yOffset = 0;
    if (dim.ratio >= elementRatio) {
        // img has wider ratio than space in element
        if (!isNaN(dim.ratio)) {
            height = width / dim.ratio;
        }
        yOffset = (area.height - height) / 2;
    } else {
        //img has narrower ratio than space in element
        if (!isNaN(dim.ratio)) {
            width = height * dim.ratio;
        }
        xOffset = (area.width - width) / 2;
    }
    let x = area.x + xOffset;
    let y = area.y + yOffset;
    if (type === GridImage.IMAGE_TYPES.PNG) {
        doc.addImage(imageData, 'PNG', x, y, width, height);
    } else if (type === GridImage.IMAGE_TYPES.JPEG) {
        doc.addImage(imageData, 'JPEG', x, y, width, height);
    } else if (type === GridImage.IMAGE_TYPES.SVG) {
        let pixelWidth = width / 0.084666667; //convert width in mm to pixel at 300dpi
        let pngBase64 = await imageUtil.base64SvgToBase64Png(imageData, pixelWidth);
        doc.addImage(pngBase64, type, x, y, width, height);
    }
}

/**
 * load a font from remote and add it to jsPDF doc
 *
 * @param path the path of the font, e.g. '/app/fonts/My-Font.ttf'
 * @param doc the jsPDF doc instance to install the font to
 * @param fontWeight the weight of the loaded font ("bold" or "normal")
 * @return {Promise<void>}
 */
async function loadFont(path, doc, fontWeight) {
    let fontName = path.substring(path.lastIndexOf('/') + 1);

    // 1. Check if the font and weight are already loaded
    const fontList = doc.getFontList();
    if (fontList[fontName] && fontList[fontName].includes(fontWeight)) {
        doc.setFont(fontName, fontWeight);
        return;
    }

    // 2. Fetch only if it hasn't been loaded
    let response = await fetch(path).catch((e) => console.error(e));
    if (!response) {
        return;
    }

    log.info('using font', fontName);
    let contentBuffer = await response.arrayBuffer();
    let contentString = util.arrayBufferToBase64(contentBuffer);

    if (contentString) {
        // 3. Add to VFS only if it's not already there
        if (!doc.existsFileInVFS(fontName)) {
            doc.addFileToVFS(fontName, contentString);
        }
        doc.addFont(fontName, fontName, fontWeight);
        doc.setFont(fontName, fontWeight);
    }
}

async function loadDefaultFont() {
    await loadFont(DEFAULT_FONT_PATH, doc, "normal");
}

async function loadGridFont() {
    let fontFamily = metadata.textConfig.fontFamily || TextConfig.FONT_ARIAL;
    let fontFilename = TextConfig.FONT_TO_BOLD_FILENAME[fontFamily];
    let fontPath = `./app/fonts/ttf/${fontFilename}.ttf`;
    await loadFont(fontPath, doc, "bold");
}

function getArea({ x = 0, y = 0, width = 0, height = 0 } = {}) {
    return new PdfArea({x, y, width, height, doc, jsPdfModule});
}

function markArea(area, color, text) {
    if (DEBUG_MARK_AREAS) {
        area.mark(color, text);
    }
}

async function getMetadataConfig() {
    metadata = await dataService.getMetadata();
    homeGridId = metadata.homeGridId;
    if (metadata.textConfig) {
        convertMode = metadata.textConfig.convertMode;
    }
}

$(document).on(constants.EVENT_USER_CHANGED, getMetadataConfig);
$(document).on(constants.EVENT_METADATA_UPDATED, getMetadataConfig);

export {pdfService};
