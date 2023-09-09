'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

require('dotenv').config();

var fs = require('fs');
var path = require('path');
var notionapiAgent = require('notionapi-agent');
const { Client } = require('@notionhq/client');
var taskManager = require('@dnpr/task-manager');
var fsutil = require('@dnpr/fsutil');
var crypto = require('crypto');
var logger = require('@dnpr/logger');
var nastUtilFromNotionapi = require('nast-util-from-notionapi');
var nastUtilToReact = require('nast-util-to-react');
var ejs = require('ejs');
require('squirrelly');
var visit = require('unist-util-visit');
var child_process = require('child_process');
const React = require('react');
const { useContext, useEffect, useState } = React;
//let redis = require('../../../web/redis-client');
const ReactDOMServer = require ('react-dom/server');
//const MyContext = require('../../../web/context');
const cloudinary = require('cloudinary').v2;
const request = require('request');
const probe = require("probe-image-size");
const { PDFDocument, rgb } = require('pdf-lib');
const { htmlToImage } = require('html-to-image');
const puppeteer = require('puppeteer');
const axios = require('axios'); 
const fetch = require('node-fetch');


//const { pageIdToPublish } = require('../../server'); 

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var crypto__default = /*#__PURE__*/_interopDefaultLegacy(crypto);
var visit__default = /*#__PURE__*/_interopDefaultLegacy(visit);

/**
 * Wrapper of console.log().
 */
const Logger = logger.Logger;
const log = new Logger('noteablog-app', {
    logLevel: typeof process.env.DEBUG !== 'undefined' ? 'debug' : 'info',
    useColor: typeof process.env.NO_COLOR !== 'undefined' ? false : true,
});
/**
 * Failsafe JSON.parse() wrapper.
 * @param str - Payload to parse.
 * @returns Parsed object when success, undefined when fail.
 */
function parseJSON(str) {
    try {
        return JSON.parse(str);
    }
    catch (error) {
        return void 0;
    }
}
/** Get the path of output dir and ensure it is available. */
function outDir(workDir) {
    const outDir = path__default['default'].join(workDir, 'public');
    if (!fs__default['default'].existsSync(outDir)) {
        fs__default['default'].mkdirSync(outDir, { recursive: true });
    }
    return outDir;
}

function objAccess(objLike) {
    return function (key) {
        /** Call with no parameter to signal the end of the access chain. */
        if (typeof key === 'undefined') {
            return objLike;
        }
        /**
         * Try to access the array if it is truthy.
         * Otherwise, just pass the falsy value.
         */
        if (objLike) {
            return objAccess(objLike[key]);
        }
        else {
            return objAccess(objLike);
        }
    };
}

class Cache {
    constructor(cacheDir) {
        this.cacheDir = cacheDir;
        if (!fs__default['default'].existsSync(cacheDir)) {
            fs__default['default'].mkdirSync(cacheDir, { recursive: true });
        }
    }
    get(namespace, id) {
        const fPath = this.fPath(namespace, id);
        /** Read file. */
        if (!fs__default['default'].existsSync(fPath)) {
            log.debug(`Failed to get cache "${id}" of namespace "${namespace}".`);
            return undefined;
        }
        const data = fs__default['default'].readFileSync(fPath, { encoding: 'utf-8' });
        /** Parse file. */
        try {
            const obj = JSON.parse(data);
            return obj;
        }
        catch (error) {
            log.debug(`Cache object "${id}" of namespace "${namespace}" is corrupted.`);
            log.debug(error);
            return undefined;
        }
    }
    set(namespace, id, obj) {
        const fPath = this.fPath(namespace, id);
        fs__default['default'].writeFileSync(fPath, JSON.stringify(obj, getCircularReplacer()));
    }
    shouldUpdate(namespace, id, lastModifiedTime) {
        const fPath = this.fPath(namespace, id);
        if (fs__default['default'].existsSync(fPath)) {
            const lastModifiedTimeOfCache = fs__default['default'].statSync(fPath).mtimeMs;
            return lastModifiedTime > lastModifiedTimeOfCache;
        }
        else {
            return true;
        }
    }
    fPath(namespace, id) {
        return path__default['default'].join(this.cacheDir, this._hash(namespace + id));
    }
    _hash(payload) {
        return crypto__default['default'].createHash('sha256').update(payload).digest('hex');
    }
}
/**
 * Filter circular object for JSON.stringify()
 * @function getCircularReplacer
 * @returns {object} Filtered object.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cyclic_object_value
 */
function getCircularReplacer() {
    const seen = new WeakSet();
    return (_key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                return;
            }
            seen.add(value);
        }
        return value;
    };
}

class Config {
    constructor(configPath) {
        this.configPath = configPath;
        try {
            this.configObj = JSON.parse(fs__default['default'].readFileSync(configPath, { encoding: 'utf-8' }));
        }
        catch (error) {
            log.error(`Failed to load config from "${configPath}".`);
            throw error;
        }
    }
    get(key) {
        return this.configObj[key];
    }
    set(key, data) {
        this.configObj[key] = data;
    }
    /** Sync changes to file. */
    sync() {
        return fs.promises.writeFile(this.configPath, JSON.stringify(this.configObj));
    }
}

const dashIDLen = '0eeee000-cccc-bbbb-aaaa-123450000000'.length;
const noDashIDLen = '0eeee000ccccbbbbaaaa123450000000'.length;
function getPageIDFromPageURL(str) {
    let splitArr = str.split('/');
    splitArr = (splitArr.pop() || '').split('-');
    const pageID = splitArr.pop();
    if (pageID && pageID.length === noDashIDLen) {
        return toDashID(pageID);
    }
    else {
        throw new Error(`Cannot get pageID from ${str}`);
    }
}
function getPageIDFromCollectionPageURL(str) {
    let splitArr = str.split('/');
    splitArr = (splitArr.pop() || '').split('-');
    splitArr = (splitArr.pop() || '').split('?');
    const pageID = splitArr[0];
    if (pageID && pageID.length === noDashIDLen) {
        return toDashID(pageID);
    }
    else {
        throw new Error(`Cannot get pageID from ${str}`);
    }
}
function toDashID(str) {
    if (isValidDashID(str)) {
        return str;
    }
    const s = str.replace(/-/g, '');
    if (s.length !== noDashIDLen) {
        return str;
    }
    const res = str.substring(0, 8) +
        '-' +
        str.substring(8, 12) +
        '-' +
        str.substring(12, 16) +
        '-' +
        str.substring(16, 20) +
        '-' +
        str.substring(20);
    return res;
}
function isValidDashID(str) {
    if (str.length !== dashIDLen) {
        return false;
    }
    if (str.indexOf('-') === -1) {
        return false;
    }
    return true;
}

var NPropertyType;
(function (NPropertyType) {
    NPropertyType["Text"] = "text";
    NPropertyType["Checkbox"] = "checkbox";
    NPropertyType["Select"] = "select";
    NPropertyType["MultiSelect"] = "multi_select";
    NPropertyType["Date"] = "date";
})(NPropertyType || (NPropertyType = {}));
class NProperty {
    constructor(id, rawProperty) {
        this.id = id;
        this.name = rawProperty.name;
        this.type = '';
        this.records = new Map();
    }
}
class NTextProperty extends NProperty {
    constructor(id, rawProperty) {
        super(id, rawProperty);
        this.type = NPropertyType.Text;
    }
}
class NCheckboxProperty extends NProperty {
    constructor(id, rawProperty) {
        super(id, rawProperty);
        this.type = NPropertyType.Checkbox;
    }
}
class NSelectProperty extends NProperty {
    constructor(id, rawProperty) {
        super(id, rawProperty);
        this.type = NPropertyType.Select;
        this.options = rawProperty.options || [];
    }
}
class NMultiSelectProperty extends NProperty {
    constructor(id, rawProperty) {
        super(id, rawProperty);
        this.type = NPropertyType.MultiSelect;
        this.options = rawProperty.options || [];
    }
}
class NDateTimeProperty extends NProperty {
    constructor(id, rawProperty) {
        super(id, rawProperty);
        this.type = NPropertyType.Date;
    }
}
class NRecord {
    constructor(rawPage) {
        this.id = getPageIDFromPageURL(rawPage.uri);
        this.propertyCellMap = new Map();
        this.uri = rawPage.uri;
        this.title = rawPage.title;
        this.icon = rawPage.icon;
        this.cover = rawPage.cover;
        this.coverPosition = rawPage.coverPosition;
        this.fullWidth = rawPage.fullWidth;
        this.createdTime = rawPage.createdTime;
        this.lastEditedTime = rawPage.lastEditedTime;
    }
}
class NCell {
    constructor(property, record) {
        this.property = property;
        this.record = record;
    }
}
class NTextCell extends NCell {
    constructor(property, record, rawValue) {
        super(property, record);
        this.value = rawValue;
    }
}
class NCheckboxCell extends NCell {
    constructor(property, record, rawValue) {
        super(property, record);
        this.value = rawValue ? rawValue[0][0] === 'Yes' : false;
    }
}
class NSelectCell extends NCell {
    constructor(property, record, rawValue) {
        super(property, record);
        const optionNames = rawValue ? rawValue[0][0].split(',') : [];
        this.value = property.options.find(o => o.value === optionNames[0]);
    }
}
class NMultiSelectCell extends NCell {
    constructor(property, record, rawValue) {
        super(property, record);
        const optionNames = rawValue ? rawValue[0][0].split(',') : [];
        this.value = optionNames.reduce((result, optionName) => {
            const option = property.options.find(o => o.value === optionName);
            if (option)
                result.push(option);
            return result;
        }, []);
    }
}
class NDateTimeCell extends NCell {
    constructor(property, record, rawValue) {
        super(property, record);
        /**
         * rawValue
         * [0]: SemanticString
         * [0][1]: FormattingAll[]
         * [0][1][0]: FormattingMentionDate
         * [0][1][0][1]: DateTime
         */
        const node = rawValue && rawValue[0];
        const attrs = node && node[1];
        const formattingDate = attrs && attrs[0];
        const dataTime = formattingDate && formattingDate[1];
        this.value = dataTime;
    }
}
class NTable {
    constructor(rawTable) {
        this.id = getPageIDFromPageURL(rawTable.uri);
        const rawTableColumnProps = rawTable.views[0].format.table_properties;
        /**
         * Using rawTableColumnProps to initialize schema make the order of
         * properties match the order of columns in the UI.
         */
        if (rawTableColumnProps) {
            this.properties = rawTableColumnProps
                /** Filter out properties that do not exist in schema. */
                .filter(tableProperty => rawTable.schema[tableProperty.property])
                .map(tableProperty => {
                const propertyId = tableProperty.property;
                const rawProperty = rawTable.schema[propertyId];
                return createNProperty(propertyId, rawProperty);
            });
        }
        else {
            this.properties = Object.entries(rawTable.schema).map(tuple => {
                const [propertyId, rawProperty] = tuple;
                return createNProperty(propertyId, rawProperty);
            });
        }
        this.records = [];
        React.Children.toArray(rawTable.children.forEach(rawPage => {
            const record = new NRecord(rawPage);
            this.records.push(record);
            this.properties.forEach(property => {
                const rawPropertyValue = (rawPage.properties || {})[property.id];
                const cell = createNCell(property, record, rawPropertyValue);
                property.records.set(record, cell);
                record.propertyCellMap.set(property, cell);
            });
        }));
    }
    /** Print the table structure so you can see what it looks like. */
    peek() {
        let head = '';
        for (let i = 0; i < this.properties.length; i++) {
            head += this.properties[i].constructor.name + ' ';
        }
        //console.log(head);
        console.log(''.padEnd(head.length, '-'));
        for (let i = 0; i < this.records.length; i++) {
            const record = this.records[i];
            let row = '';
            record.propertyCellMap.forEach((cell, property) => {
                row +=
                    cell.constructor.name.padEnd(property.constructor.name.length) + ' ';
            });
            row += '-> ' + record.constructor.name;
            console.log(row);
        }
    }
}
function createNProperty(propertyId, rawProperty) {
    switch (rawProperty.type) {
        case 'checkbox':
            return new NCheckboxProperty(propertyId, rawProperty);
        case 'select':
            return new NSelectProperty(propertyId, rawProperty);
        case 'multi_select':
            return new NMultiSelectProperty(propertyId, rawProperty);
        case 'date':
            return new NDateTimeProperty(propertyId, rawProperty);
        default:
            return new NTextProperty(propertyId, rawProperty);
    }
}
function createNCell(property, record, rawValue) {
    switch (property.type) {
        case NPropertyType.Checkbox:
            return new NCheckboxCell(property, record, rawValue);
        case NPropertyType.Select:
            return new NSelectCell(property, record, rawValue);
        case NPropertyType.MultiSelect:
            return new NMultiSelectCell(property, record, rawValue);
        case NPropertyType.Date:
            return new NDateTimeCell(property, record, rawValue);
        default:
            return new NTextCell(property, record, rawValue);
    }
}

/** Extract interested data for blog generation from a Notion table. */
async function parseTable(collectionPageURL, notionAgent, config) {
    let pageID = getPageIDFromCollectionPageURL(collectionPageURL);
    const pageCollection = (await nastUtilFromNotionapi.getOnePageAsTree(pageID, notionAgent));
    const table = new NTable(pageCollection);
    const propertyAccessMap = new Map();
    table.properties.forEach(property => {
        propertyAccessMap.set(property.name, property);
    });
    /**
     * Check if the Notion table has all required properties.
     *
     * Note: Some information like `title` exists on the page itself, so we
     * don't need to check.
     */
    const requiredPropertyDescriptors = [
        ['tags', NPropertyType.MultiSelect],
        ['publish', NPropertyType.Checkbox],
        ['inMenu', NPropertyType.Checkbox],
        ['inList', NPropertyType.Checkbox],
        ['template', NPropertyType.Select],
        ['url', NPropertyType.Text],
        ['description', NPropertyType.Text],
        ['date', NPropertyType.Date],
    ];
    for (const descriptor of requiredPropertyDescriptors) {
        const property = propertyAccessMap.get(descriptor[0]);
        if (!property) {
            throw new Error(`Required property "${descriptor[0]}" is missing in the Notion table.`);
        }
        else if (property.type !== descriptor[1]) {
            throw new Error(`The type of property "${descriptor[0]}" should be "${descriptor[1]}", but got "${property.type}".`);
        }
    }
    const pages = table.records.map(record => {
        return {
            id: extractIdFromUri(record.uri),
            iconUrl: getIconUrl(record.icon),
            cover: record.cover,
            title: renderNodesToText(record.title),
            tags: record.propertyCellMap.get(propertyAccessMap.get('tags'))?.value || [],
            publish: record.propertyCellMap.get(propertyAccessMap.get('publish'))?.value || false,
            inMenu: record.propertyCellMap.get(propertyAccessMap.get('inMenu'))?.value || false,
            inList: record.propertyCellMap.get(propertyAccessMap.get('inList'))?.value || false,
            template: record.propertyCellMap.get(propertyAccessMap.get('template'))?.value?.value || 'post',
            url: getPageUrl(record.uri, renderNodesToText(record.propertyCellMap.get(propertyAccessMap.get('url'))?.value), renderNodesToText(record.propertyCellMap.get(propertyAccessMap.get('title'))?.value), config),
            description: record.propertyCellMap.get(propertyAccessMap.get('description'))?.value,
            descriptionPlain: renderNodesToText(record.propertyCellMap.get(propertyAccessMap.get('description'))?.value),
            descriptionHTML: renderNodesToHtml(record.propertyCellMap.get(propertyAccessMap.get('description'))?.value),
            date: record.propertyCellMap.get(propertyAccessMap.get('date'))?.value?.start_date,
            dateString: getDateString(record.propertyCellMap.get(propertyAccessMap.get('date'))?.value?.start_date, config),
            createdTime: record.createdTime,
            lastEditedTime: record.lastEditedTime,
        };
    });
const siteContext = {
        iconUrl: getIconUrl(pageCollection.icon),
        cover: pageCollection.cover,
        title: renderNodesToText(pageCollection.name),
        description: pageCollection.description,
        descriptionPlain: renderNodesToText(pageCollection.description),
        descriptionHTML: renderNodesToHtml(pageCollection.description),
        pages: pages.sort(dateDescending),
        tagMap: new Map(),
    };
    /** Create tagMap. */
    siteContext.pages.forEach(page => {
        page.tags.forEach(tag => {
            const pagesForTag = siteContext.tagMap.get(tag.value);
            if (!pagesForTag) {
                siteContext.tagMap.set(tag.value, [page]);
            }
            else {
                pagesForTag.push(page);
            }
        });
    });
    return siteContext;
}
/**
 * Utility functions to get useful values from properties of Nast.Page
 */
function renderNodesToText(styledStringArr) {
    if (styledStringArr)
        return styledStringArr.map(str => str[0]).join('');
    else
        return '';
}
function renderNodesToHtml(styledStringArr) {
    if (styledStringArr)
        return nastUtilToReact.renderToHTML(styledStringArr);
    else
        return '';
}
/**
 * Get formatted string from a date-typed property
 * @param {string | undefined} dateRaw
 * @param {Config} config
 * @returns {string | undefined} WWW, MMM DD, YYY
 */
function getDateString(dateRaw, config) {
    if (dateRaw) {
        const options = {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        };
        const locales = config.get('locales') || 'en-US';
        const dateString = new Date(dateRaw).toLocaleDateString(locales, options);
        return dateString;
    }
    else
        return undefined;
}
/**
 * TODO: Use encodeURLComponent to completely eliminate XSS.
 *
 * Determine the string that will be used as the filename of the generated
 * HTML and as the URL to link in other pages.
 *
 * First, `/` and `\` are removed since they can't exist in file path.
 * Second, if the escaped url is a empty string or user doesn't specify an
 * url, generate a slug from the title (if `autoSlug` is `true` in `Config`)
 * and use it along with page id as the filename,
 * otherwise just use the page id as is.
 * @param {string} pageUri
 * @param {string} customSlug
 * @param {string} title
 * @param {Config} config
 * @returns {string}
 */
function getPageUrl(pageUri, customSlug, title, config) {
    let url = getSafeUrl(customSlug);
    if (url.length === 0) {
        if (config.get('autoSlug')) {
            const partialId = extractIdFromUri(pageUri).slice(0, 6);
            url = `${getSlugFromTitle(title)}-${partialId}`;
        }
        else {
            url = `${extractIdFromUri(pageUri)}`;
        }
    }
    return `${url}.html`;
}
/**
 * Returns a formatted slug from a title by stripping non-alphanumeric chars, and
 * replacing spaces with dashes.
 * @param {string} title
 * @returns {string}
 */
function getSlugFromTitle(title) {
    return title
        .replaceAll(/[\s\\/]/g, '-')
        .replaceAll(/[^\w-]/g, '')
        .toLowerCase();
}
/**
 * Remove "/" and "\" since they can't be in filename
 * @param {string} url
 * @returns {string}
 */
function getSafeUrl(url) {
    return url.replace(/\/|\\/g, '');
}
/**
 * @param icon May be an URL, an emoji character, or undefined.
 */
function getIconUrl(icon) {
    if (!icon)
        return undefined;
    if (/^http/.test(icon)) {
        return icon;
    }
    else {
        return `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text text-anchor=%22middle%22 dominant-baseline=%22middle%22 x=%2250%22 y=%2255%22 font-size=%2280%22>${icon}</text></svg>`;
    }
}
function extractIdFromUri(uri) {
    return (uri.split('/').pop() || '').split('?')[0];
}
/** A comparator to sort `PageMetadata` by date descending. */
function dateDescending(later, former) {
    const laterTimestamp = later.date ? new Date(later.date).getTime() : 0;
    const formerTimestamp = former.date ? new Date(former.date).getTime() : 0;
    if (laterTimestamp > formerTimestamp)
        return -1;
    else if (laterTimestamp < formerTimestamp)
        return 1;
    else
        return 0;
}

class TemplateProvider {
    constructor(templateDir) {
        this.templateDir = templateDir;
        this.templateMap = {};
    }
    /**
     * Get template as a string by its name.
     *
     * The name of a template is its filename without extension.
     */
    get(templateName) {
        log.debug(`Get template "${templateName}"`);
        const template = this.templateMap[templateName];
        const templatePath = this._templatePath(templateName);
        if (template) {
            return { content: template, filePath: templatePath };
        }
        else {
            return { content: this._load(templateName), filePath: templatePath };
        }
    }
    /**
     * Load a template as a string into cache and return it.
     *
     * If failed to load, return an error string.
     */
    _load(templateName) {
        log.debug(`Load template "${templateName}"`);
        const templatePath = this._templatePath(templateName);
        try {
            this.templateMap[templateName] = fs__default['default'].readFileSync(templatePath, {
                encoding: 'utf-8',
            });
            return this.templateMap[templateName];
        }
        catch (err) {
            log.warn(err);
            if (templateName.length)
                return `Cannot find "${templateName}.html" \
in "${this.templateDir}".`;
            else
                return 'The template name has zero length, \
please check the "template" field in your Notion table.';
        }
    }
    /**
     * Get the path of a template file.
     */
    _templatePath(templateName) {
        return path__default['default'].join(this.templateDir, `${templateName}.html`);
    }
}

class EJSStrategy {
    constructor(templateDir) {
        this.templateProvider = new TemplateProvider(templateDir);
    }
    render(templateName, data) {
        const template = this.templateProvider.get(templateName);
        return ejs.render(template.content, data, {
            filename: template.filePath,
        });
    }
}
class Renderer {
    constructor(strategy) {
        this.strategy = strategy;
    }
    render(templateName, data) {
        return this.strategy.render(templateName, data);
    }
}

function renderIndex(task) {
    const siteMeta = task.data.siteContext;
    const { renderer } = task.tools;
    const config = task.config;
    const outDir = config.outDir;
    const indexPath = path__default['default'].join(outDir, 'index.html');
    //log.info('Render home page');
    const html = renderer.render('index', { siteMeta });
    fs__default['default'].writeFileSync(indexPath, html, { encoding: 'utf-8' });
    siteMeta.tagMap.forEach((pageMetas, tagVal) => {
        //log.info(`Render tag "${tagVal}"`);
        const html = renderer.render('tag', {
            siteMeta,
            tagName: tagVal,
            pages: pageMetas,
        });
        fs__default['default'].writeFileSync(`${config.tagDir}/${tagVal}.html`, html, {
            encoding: 'utf-8',
        });
    });
}

function createLinkTransformer(siteContext) {
    /** Get no dash page id. */
    function getPageIdFromUri(uri) {
        return uri.split('/').pop();
    }
    /** Replace internal links for a node. */
    return function (node, _index, parent) {
        /** Skip root. */
        if (!parent)
            return;
        /** Link to page. */
        if (node.type === 'page') {
            const pageId = getPageIdFromUri(node.uri);
            if (!pageId)
                return;
            const page = siteContext.pages.find(page => page.id === pageId);
            if (!page)
                return;
            log.debug(`Replace link: ${node.uri} -> ${page.url}`);
            node.uri = page.url;
            return;
        }
        /** Inline mention or link. */
        /** `node` may be any block with text, specifying text block here is
            to eliminate type errors.  */
        const richTextStrs = node.title || [];
        for (let i = 0; i < richTextStrs.length; i++) {
            const richTextStr = richTextStrs[i];
            /** Inline mention page. */
            if ('‣' === richTextStr[0] && 'p' === objAccess(richTextStr)(1)(0)(0)()) {
                const pageInline = objAccess(richTextStr)(1)(0)(1)();
                if (!pageInline)
                    continue;
                const pageId = getPageIdFromUri(pageInline.uri);
                if (!pageId)
                    continue;
                const page = siteContext.pages.find(page => page.id === pageId);
                if (page) {
                    log.debug(`Replace link: ${pageInline.uri} -> ${page.url}`);
                    pageInline.uri = page.url;
                }
                else {
                    const newLink = `https://www.notion.so/${pageId}`;
                    pageInline.uri = newLink;
                    log.debug(`Replace link: ${pageInline.uri} -> ${newLink}`);
                }
                continue;
            }
            if (Array.isArray(richTextStr[1]))
                richTextStr[1].forEach(mark => {
                    if ('a' === mark[0]) {
                        /** Inline link to page or block. */
                        /**
                         * Link to a page:
                         * '/65166b7333374374b13b040ca1599593'
                         *
                         * Link to a block in a page:
                         * '/ec83369b2a9c438093478ddbd8da72e6#aa3f7c1be80d485499910685dee87ba9'
                         *
                         * Link to a page in a collection view, the page is opened in
                         * preview mode (not supported):
                         * '/595365eeed0845fb9f4d641b7b845726?v=a1cb648704784afea1d5cdfb8ac2e9f0&p=65166b7333374374b13b040ca1599593'
                         */
                        const toPath = mark[1];
                        if (!toPath)
                            return;
                        /** Ignore non-notion-internal links. */
                        if (!toPath.startsWith('/'))
                            return;
                        /** Ignore unsupported links. */
                        if (toPath.includes('?')) {
                            const newPath = `https://www.notion.so${toPath}`;
                            log.debug(`Replace link: ${toPath} -> ${newPath}`);
                            mark[1] = newPath;
                            return;
                        }
                        const ids = toPath.replace(/\//g, '').split('#');
                        if (ids.length > 0) {
                            const targetPage = ids[0];
                            const targetBlock = ids[1];
                            const pageInfo = siteContext.pages.find(page => page.id === targetPage);
                            if (pageInfo) {
                                /** The page is in the table. */
                                const newLink = `${pageInfo.url}${targetBlock ? '#https://www.notion.so/' + targetBlock : ''}`;
                                mark[1] = newLink;
                            }
                            else {
                                /** The page is not in the table. */
                                const newLink = `https://www.notion.so${toPath}`;
                                mark[1] = newLink;
                            }
                            log.debug(`Replace link: ${toPath} -> ${mark[1]}`);
                            return;
                        }
                    }
                });
        }
        return;
    };
}
/**
 * Render a post.
 * @param task
 */
let returnValue;
let returnValuePost;
async function renderPost(task) {
    const { doFetchPage, pageMetadata, siteContext, pageIdToPublish } = task.data;
    const { cache, notionAgent, renderer } = task.tools;

    const config = task.config;
    //const pageID = toDashID(pageMetadata.id);
    const pageID = toDashID(pageIdToPublish);
    //const pageID = 'af591314fddf446d99fa48748824e11c';
    //log.info(">>>>>>>>>>>>>>>>>>>>>>> pageIdToPublish",pageID);
    let tree;
    /** Fetch page. */
    if (doFetchPage) {
        //log.info(`Fetch data of page "${pageID}"`);
        tree = await nastUtilFromNotionapi.getOnePageAsTree(pageID, notionAgent);
        /** Use internal links for pages in the table. */
        visit__default['default'](tree, createLinkTransformer(siteContext));
        cache.set('notion', pageID, tree);
        //log.info(`Cache of "${pageID}" is saved`);
    }
    else {
        //log.info(`Read cache of page "${pageID}"`);
        const cachedTree = cache.get('notion', pageID);
        if (cachedTree != null)
            tree = cachedTree;
        else
            throw new Error(`Cache of page "${pageID}" is corrupted, run "noteablog-app generate --fresh <path_to_starter>" to fix`);
    }
    
    /** Render with template. */
    if (pageMetadata.publish) {
        //log.info(`Render published page "${pageID}"`);
        const outDir = config.outDir;
        const outPath = path__default['default'].join(outDir, pageMetadata.url);
        const contentHTML = nastUtilToReact.renderToHTML(tree);
        //console.log("tree ",tree);
        //console.log("pagesUpdated ",pagesUpdated);
        //console.log("siteContext.pages ",siteContext.pages);
        const pageHTML = renderer.render(pageMetadata.template, {
            siteMeta: siteContext,
            post: {
                ...pageMetadata,
                contentHTML,
            },
        });
        returnValuePost = pageHTML;
        //console.log("pageHTML in renderPost ",pageHTML);

        //await fs.promises.writeFile(outPath, pageHTML, { encoding: 'utf-8' });
        //return 0;
    }
    //else {
        //log.info(`Skip rendering of unpublished page "${pageID}"`);
    //    return 1;
    //}
    //log.info(pageHTML);
    //console.log("returnValue ",returnValue);

    return returnValuePost;
}
//log.info("outPageIdToPublishString ",config.outPageIdToPublishString);
/** Generate a Notablog static site. */
let html;
async function generate(workDir, pageIdToPublish, opts = {}) {

    const { concurrency, verbose, ignoreCache } = opts;
    //const notionAgent = notionapiAgent.createAgent({ debug: verbose, token: 'v02%3Auser_token_or_cookies%3AZwQSLj3zP6UG9SShH7mjqS6OhxNUK8Z2bgboaaXhUxnn8xhYrrq_H1juG_hvvgGtNAw9_tYGIju95zzJsrnNeEq2ERvEZOjyC4eiatLSmpCbjuXIrjBTD9ha-pQWLCL3EbIK' });
    //const notionAgent = notionapiAgent.createAgent({ debug: verbose, token: 'v02%3Auser_token_or_cookies%3AGXYK1MbgiAkyh6B8BaFtoySOWF_RD3NzlmrNqx_eV2-fZLrmRsuGLRAR1tKkHpyGlbPLhEB4Xu5IuGQZI0-dR7fHNJW9mqD7JVCcBLO-yAppY0ie_1SLtQZXGDGZU22SZeMv' });    const cache = new Cache(path__default['default'].join(workDir, 'cache'));
    const notionAgent = notionapiAgent.createAgent({ debug: verbose, token: process.env.NOTION_API_KEY });    const cache = new Cache(path__default['default'].join(workDir, 'cache'));
    const config = new Config(path__default['default'].join(workDir, 'config.json'));
    /** Init dir paths. */
    const theme = config.get('theme');
    const themeDir = path__default['default'].join(workDir, `themes/${theme}`);
    if (!fs__default['default'].existsSync(themeDir)) {
        throw new Error(`Cannot find theme "${theme}" in themes/`);
    }
    const outDir = path__default['default'].join(workDir, 'public');
    if (!fs__default['default'].existsSync(outDir)) {
        fs__default['default'].mkdirSync(outDir, { recursive: true });
    }
    const tagDir = path__default['default'].join(workDir, 'public/tag');
    if (!fs__default['default'].existsSync(tagDir)) {
        fs__default['default'].mkdirSync(tagDir, { recursive: true });
    }
    const dirs = {
        workDir,
        themeDir,
        outDir,
        tagDir,
    };
    /** Create TemplateProvider instance. */
    const templateDir = path__default['default'].join(themeDir, 'layouts');
    if (!fs__default['default'].existsSync(templateDir)) {
        throw new Error(`Cannot find layouts/ in theme "${theme}"`);
    }
    const themeManifestPath = path__default['default'].join(themeDir, 'manifest.json');
    const themeManifest = parseJSON(fs__default['default'].readFileSync(themeManifestPath, { encoding: 'utf-8' }));
    if (!themeManifest)
        throw new Error(`The theme is not supported by Notablog  v0.6.0 or above.`);
    // const templateEngine = themeManifest.templateEngine
    const renderStrategy = new EJSStrategy(templateDir);
    const renderer = new Renderer(renderStrategy);
    /** Copy theme assets. */
    //log.info('Copy theme assets');
    const assetDir = path__default['default'].join(themeDir, 'assets');
    fsutil.copyDirSync(assetDir, outDir);
    /** Fetch site metadata. */
    //log.info('Fetch site metadata');
    const siteContext = await parseTable(config.get('url'), notionAgent, config);
    /** Render home page and tags */
    //log.info('Render home page and tags');
    renderIndex({
       data: {
           siteContext: siteContext,
       },
       tools: {
           renderer,
           notionAgent,
           cache,
       },
       config: {
           ...dirs,
       },
    });
    /** Render pages. */
    //log.info('Fetch and render pages');
    const { pagesUpdated, pagesNotUpdated } = siteContext.pages.reduce((data, page) => {
        const cliArgs = process.argv;
        const cliPageID = (cliArgs[4]);
        if (page.id === pageIdToPublish){
            //log.info("TRUE");
            if (ignoreCache ||
                cache.shouldUpdate('notion', toDashID(page.id), page.lastEditedTime)) {
                data.pagesUpdated.push(page);
            }
            else {
                data.pagesNotUpdated.push(page);
            }
        }
        return data;
    }, {
        pagesUpdated: [],
        pagesNotUpdated: [],
    });
    const pageTotalCount = siteContext.pages.length;
    const pageUpdatedCount = pagesUpdated.length;
    const pagePublishedCount = siteContext.pages.filter(page => page.publish).length;
    //log.info("pageID ",(siteContext.pages.filter(page => page.publish)));
    //log.info("pageID ",(siteContext.pages.filter(page => page.id === "af591314fddf446d99fa48748824e11c")));
    //log.info(`${pageUpdatedCount} of ${pageTotalCount} posts have been updated`);
    //log.info(`${pagePublishedCount} of ${pageTotalCount} posts are published`);
    const tm2 = new taskManager.TaskManager2({ concurrency });
    const tasks = [];
    pagesUpdated.forEach(pageMetadata => {
        tasks.push(tm2.queue(renderPost, [
            {
                data: {
                    siteContext,
                    pageMetadata,
                    doFetchPage: true,
                    pageIdToPublish,
                },
                tools: {
                    renderer,
                    notionAgent,
                    cache,
                },
                config: {
                    ...dirs,
                },
            },
        ]));
    });
    pagesNotUpdated.forEach(pageMetadata => {
        tasks.push(tm2.queue(renderPost, [
            {
                data: {
                    siteContext,
                    pageMetadata,
                    doFetchPage: false,
                    pageIdToPublish,
                },
                tools: {
                    renderer,
                    notionAgent,
                    cache,
                },
                config: {
                    ...dirs,
                },
            },
        ]));
    });
    await Promise.all(tasks);

    //const regex = /((https%)[-a-zA-Z0-9:@;?&=\/%\+\.\*!'\(\),\$_\{\}\^~\[\]`#|]+.png)/g;
    //const regex = /((https%)[-a-zA-Z0-9:@;?&=\/%\+\.\*!'\(\),\$_\{\}\^~\[\]`#|]+)/g;
    //const regex = /(?!.*id=)([a-z0-9/-]){36}/g; //isolate pageID from html string
    //const regexHtmlUrl = /((\w+:\/\/)[-a-zA-Z0-9:@;?&=\/%\+\.\*!'\(\),\$_\{\}\^~\[\]`#|]+.png)/g;
    //const regexPageID = /([0-9A-Za-z]{8}-[0-9A-Za-z]{4}-[0-9A-Za-z]{4}-[0-9A-Za-z]{4}-[0-9A-Za-z]{12})/g;
    //const regexBlockID = /\b(?!apple)\b(?!=)([a-z0-9/-]){36}/g;
    //const regexBlockID = /[0-9A-Za-z]{8}-[0-9A-Za-z]{4}-4[0-9A-Za-z]{3}-[89ABab][0-9A-Za-z]{3}-[0-9A-Za-z]{12}$/g;
    //const regexHtmlHref = /((\w+:\/\/)[-a-zA-Z0-9:@;?&=\/%\+\.\*!'\(\),\$_\{\}\^~\[\]`#|]+(id=+[-a-zA-Z0-9:@;?&=\/%\+\.\*!'\(\),\$_\{\}\^~\[\]`#|]+))/g;
    
    let matchRegexBlockID;
    let matchregexHtmlHref;
    let matchRegexPageID;
    let matchRegexHtmlUrl;
    let matchregexDragonman;
    let blockId;
    let block;
    let imageIdFull;
    let pageId;
    //const regexHtmlUrl = /((\w+:\/\/)[-a-zA-Z0-9:@;?&=\/%\+\.\*!'\(\),\$_\{\}\^~\[\]`#|]+.png)/g;
    const regexHtmlUrl = /((\w+:\/\/)[-a-zA-Z0-9:@;?&=\/%\+\.\*!'\(\),\$_\{\}\^~\[\]`#|]+(.png)|((\w+:\/\/)[-a-zA-Z0-9:@;?&=\/%\+\.\*!'\(\),\$_\{\}\^~\[\]`#|]+(.gif)))/g;
    const regexPageID = /([0-9A-Za-z]{8}-[0-9A-Za-z]{4}-[0-9A-Za-z]{4}-[0-9A-Za-z]{4}-[0-9A-Za-z]{12})/g;
    const regexBlockID = /[0-9A-Za-z]{8}-[0-9A-Za-z]{4}-[0-9A-Za-z]{4}-[0-9A-Za-z]{4}-[0-9A-Za-z]{12}$/g;
    const regexHtmlHref = /((\w+:\/\/)[-a-zA-Z0-9:@;?&=\/%\+\.\*!'\(\),\$_\{\}\^~\[\]`#|]+(id=+[-a-zA-Z0-9:@;?&=\/%\+\.\*!'\(\),\$_\{\}\^~\[\]`#|]+))/g;
    const regexDragonman = /(<div>Powered by*)([-a-zA-Z0-9:@;?&=\/%\+\.\*!'\(\),\$_\{\}\^~\[\]`#|\s<">]*)(dragonman225)([-a-zA-Z0-9:@;?&=\/%\+\.\*!'\(\),\$_\{\}\^~\[\]`#|\s<">]*)(<\/div>)/g;
    
    const notion = new Client({auth: process.env.NOTION_SECRET});

    //console.log("returnValuePost",returnValuePost);
    async function processHtml() {

        function isValidUUID(uuid) {
            const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
            return uuidPattern.test(uuid);
        }

        try {
            let newHtml = returnValuePost;

                matchregexDragonman = returnValuePost.match(regexDragonman);
                //console.log("newHtml",newHtml);

            while ((matchregexHtmlHref = regexHtmlHref.exec(returnValuePost)) !== null) {

                //console.log("returnValuePost",returnValuePost);

                matchRegexBlockID = matchregexHtmlHref[0].match(regexBlockID);
                matchRegexPageID = matchregexHtmlHref[0].match(regexPageID);
                matchRegexHtmlUrl = matchregexHtmlHref[0].match(regexHtmlUrl);
                const decodeModule = await import('decode-uri-component');
                const imageHref = decodeModule.default(matchregexHtmlHref[0]);
                const imageUID = matchRegexBlockID;

                if (!isValidUUID(imageUID)) {
                    // Handle the case where imageUID is not a valid UUID
                    console.error(`Invalid imageUID: ${imageUID}`);
                    continue; // Skip this iteration and proceed to the next one
                }

                blockId = imageUID;

                block = await notion.blocks.retrieve({
                    block_id: blockId
                });

                imageIdFull = block.image.file.url;

                const cloudinaryURL = await uploadImage(imageIdFull,matchRegexPageID[0]);
                //console.log("matchRegexHtmlUrl[0]",matchRegexHtmlUrl[0]);

                newHtml = newHtml.replace(matchRegexHtmlUrl[0],cloudinaryURL);
                newHtml = newHtml.replace(matchregexDragonman,'');
            }

            //console.log("new html ----------------------------- ", newHtml);
            return newHtml;

        } catch (err) {
            console.error("Outer error:", err);
            // Handle the outer error here
        }
    }

    async function uploadImage(imageIdFull, pageId) {
        try {
            cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY, 
                api_secret: process.env.CLOUDINARY_API_SECRET,
                upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET
            });

            const response = await cloudinary.uploader.upload(imageIdFull, { folder: `test/${pageId}` });
            //console.log("response >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ", response);

            return response.url;

        } catch (err) {
            console.error("Error during image upload:", err);
            // Handle the error appropriately, you might choose to return the original imageIdFull
            return imageIdFull;
        }
    }

    //console.log(html);
    const html = await processHtml();

    //async function generatePDF() {
    //   const browser = await puppeteer.launch();
    //   const page = await browser.newPage();
    
    //   // You can generate PDF from a URL
    //   // await page.goto('https://example.com');
    
    //   await page.setContent(html);
    
    //   await page.pdf({ path: 'document.pdf', format: 'A4' });
    
    //   await browser.close();
    // }
    
    // generatePDF();
     

    return html;

}

const pageIdToPublishLOCAL = "3a21b11b18614008ac987f39c6d5682c";
async function fetchDatabaseItemMetaData(pageIdToPublish) {
    let customAttributes = {};
    let customAttributesArray = [];
    let customAttributesJSON = {};
    let subSectionValue;
    const workDir = require('../../server.js')
    //console.log("workDir imported",workDir);
    const html = await generate(workDir, pageIdToPublish);
    //console.log('html:', html);
    let sectionData = {}; 
    let sectionName;

    try {

        const sections = {};
        const notionDatabaseId = process.env.NOTION_DATABASE_ID;
        const notionPageApiUrl = `https://api.notion.com/v1/pages/${pageIdToPublish}`;
        const notionDatabaseApiUrl = `https://api.notion.com/v1/databases/${notionDatabaseId}/query`;


        // Query page
        const pageQueryOptions = {
            method: 'GET',
            headers: {
              accept: 'application/json',
              'Notion-Version': '2022-06-28',
              'content-type': 'application/json',
              Authorization: `Bearer ${process.env.NOTION_API_AXIOS_TOKEN}`,
            },
        };

        const pageQueryResponse = await fetch(notionPageApiUrl, pageQueryOptions);
        const pageQueryData = await pageQueryResponse.json();
        //console.log("pageQueryData ", pageQueryData);
        
        const publishValue = pageQueryData.properties.publish?.checkbox; // Adjust the property name as needed
        if (publishValue === false) {
            console.log('Skipping page because publish is false');
            return; // Skip processing if publish is false
        }

        const sectionMap = new Map();
        let nameValue;
        let sectionValue;
        let idValue;
        const subSectionsBySection = {};
        const jsonResult = {};
        
        //console.log("page ", page);
        let sectionsAndSubSections = {};

        nameValue = pageQueryData.properties.nameFormula.formula.string;
        idValue = pageQueryData.id;
        sectionValue = pageQueryData.properties.section?.select?.name;
        const subSectionValue = pageQueryData.properties['sub-section']?.select?.name; // Use optional chaining to handle undefined values

        const nameNoSpaces = nameValue.replace(/\s+/g, '_').toLowerCase();
        const nameNoSpecialCharacters = nameNoSpaces.replace(/[^\w\s]/g, '');

        customAttributes.name = nameValue;
        customAttributes.slug = nameNoSpecialCharacters;
        customAttributes.itemuid = idValue;
        customAttributes.sectionname = sectionValue;
        customAttributes.subsectionnameprime = subSectionValue;
        customAttributes.htmlbodycode = html;
        
        console.log("")
        console.log("--------------------------------------------------------")
        console.log('   Publish is set to true in Notion for "', nameValue,'", posting to Site.');
        console.log("--------------------------------------------------------")

        // Query database
        const databaseQueryOptions = {
            method: 'POST',
            headers: {
            accept: 'application/json',
            'Notion-Version': '2022-06-28',
            'content-type': 'application/json',
            Authorization: `Bearer ${process.env.NOTION_API_AXIOS_TOKEN}`,
            },
            body: JSON.stringify({page_size: 100}),
        };

        const databaseQueryResponse = await fetch(notionDatabaseApiUrl, databaseQueryOptions)
        if (!databaseQueryResponse.ok) {
            console.error('Error querying the collection:', databaseQueryResponse.statusText);
            return;
        }
        //console.log("databaseQueryResponse ",databaseQueryResponse);

        const databaseQueryData = await databaseQueryResponse.json();
        //console.log("databaseQueryData ",databaseQueryData);

        if (!databaseQueryData || !Array.isArray(databaseQueryData.results)) {
            console.error('Database data is missing or incomplete.');
            return;
        }

        for (const key in databaseQueryData) {
            if (databaseQueryData.hasOwnProperty(key)) {
            const value = databaseQueryData[key];
            //console.log(`${key}: ${value}`);
            }
        }
    
        const filteredPublishItems = databaseQueryData.results.filter((item) => {
            const publishValue = item.properties.publish?.checkbox;
            return publishValue !== false;
        });

        for (const item of filteredPublishItems) {
            const sectionValue = item.properties.section?.select?.name;
            const subSectionValue = item.properties['sub-section']?.select?.name;

            if (sectionValue) {
                // Initialize an array for the current section if it doesn't exist
                if (!sectionsAndSubSections[sectionValue]) {
                    sectionsAndSubSections[sectionValue] = new Set(); // Use a Set to store unique sub-section values
                }

                // Add the sub-section to the current section's Set if it's not "None"
                if (subSectionValue && subSectionValue !== 'None') {
                    sectionsAndSubSections[sectionValue].add(subSectionValue);
                }
            }
        }

        for (const sectionKey in sectionsAndSubSections) {
            if (sectionsAndSubSections.hasOwnProperty(sectionKey)) {
                const subsections = sectionsAndSubSections[sectionKey];

                // Process the subsections for each section
                subsections.forEach((subSection) => {
                    // Perform actions with sectionKey (section name) and subSection (sub-section name)
                    // This is where you can add the data to your array or perform other actions
                    //console.log('Section:', sectionKey);
                    //console.log('Sub-Section:', subSection);

                    // Example: Add the data to your array
                    customAttributesArray.push({
                        sectionName: sectionKey,
                        subSectionName: subSection,
                    });
                });
            }
        }

        //console.log("sectionData",sectionData);
        
        
        //console.log("nameValue", nameValue);
        //console.log("sectionsAndSubSections",sectionsAndSubSections);
        //console.log("customAttributes",customAttributes);
        customAttributesJSON = JSON.stringify(customAttributes);

        // Assuming you have an array of items named 'filteredPublishItems'
        // Object to store sections and their sub-sections
        //const sectionName = articlesParseData.sectionname;
        //const subSectionValue = articlesParseData.subsectionnameprime;
        //console.log("filteredPublishItems",filteredPublishItems);

        for (const item of filteredPublishItems) {
            //console.log("item.properties.section",item.properties.section);

            // Access the properties of each item
            sectionName = item.properties.section?.select?.name;
            const subSectionValue = item.properties['sub-section']?.select?.name;

            // Initialize the section if it doesn't exist in the object
            if (!sectionData[sectionName]) {
                sectionData[sectionName] = {
                    sectionName: sectionName,
                    subsections: new Set(), // Initialize a Set to store unique sub-sections
                };
            }

            // Add the sub-section to the corresponding section
            sectionData[sectionName].subsections.add(subSectionValue);
        }
        
        // Convert Sets to arrays for each section
        for (const sectionName in sectionData) {
            sectionData[sectionName].subsections = [...sectionData[sectionName].subsections];
        }
        //console.log(sectionData);
        //console.log("customAttributesJSON",customAttributesJSON);

        }catch (error) {
        console.error('Error:', error);
    }

    return { customAttributesJSON, sectionData };

}


async function webflowCollection(pageIdToPublish) {
    //const customAttributesJSON = await fetchDatabaseItemMetaData(pageIdToPublish);
    const { customAttributesJSON, sectionData } = await fetchDatabaseItemMetaData(pageIdToPublish);
    let articlesParseData = JSON.parse(customAttributesJSON);
    let articleCollectionItemId;

    // take subsection item's ID with name that matches section item name into the REF field
    // for each sub in section, take subsectionprime and put it into subsectionitem${1}+ attr
    try {
        //articlesParseData = JSON.parse(customAttributesJSON); // Parse JSON
        //console.log(parsedData);

        const API_KEY = process.env.WEBFLOW_API;
        const ARTICLES_COLLECTION_ID = process.env.ARTICLES_COLLECTION_ID
        const SECTIONS_COLLECTION_ID = process.env.SECTIONS_COLLECTION_ID
        const SUBSECTIONS_COLLECTION_ID = process.env.SUBSECTIONS_COLLECTION_ID
        const API_ENDPOINT_ARTICLES = `https://api.webflow.com/beta/collections/${ARTICLES_COLLECTION_ID}/items`;
        const API_ENDPOINT_SECTIONS = `https://api.webflow.com/beta/collections/${SECTIONS_COLLECTION_ID}/items`;
        const API_ENDPOINT_SUBSECTIONS = `https://api.webflow.com/beta/collections/${SUBSECTIONS_COLLECTION_ID}/items`;

        // Define options for the fetch request to query the collection
        const articlesQueryOptions = {
            method: 'GET',
            headers: {
            accept: 'application/json',
            authorization: `Bearer ${API_KEY}`,
            },
        };


        /////////////////////////// CREATE/UPDATE NOTION ARTICLE IN WEBFLOW ///////////////////////////
        ////////////////////////////////////////////////////////////////////////////////////////////////
        
        // Make the API request to query the collection
        const articlesQueryResponse = await fetch(API_ENDPOINT_ARTICLES, articlesQueryOptions)
        //console.log("articlesQueryResponse",articlesQueryResponse);

        let articlesCollectionData = await articlesQueryResponse.json();
        //console.log('API Response - Entire Database:', articlesCollectionData);

        let foundItemItemuid;
        let itemSectionNameToFind;
        let itemNameToFind;
        let itemIdToFind;

        // Check if 'items' property exists in the API response
        if (articlesCollectionData.hasOwnProperty('items') && Array.isArray(articlesCollectionData.items)) {
            itemIdToFind = articlesParseData["itemuid"];
            itemNameToFind = articlesParseData["name"];
            itemSectionNameToFind = articlesParseData["sectionname"];

            console.log('   itemIdToFind:', itemIdToFind);
            console.log("--------------------------------------------------------")

            console.log('   itemSectionNameToFind:', itemSectionNameToFind);
            console.log("--------------------------------------------------------")

            
            for (const item of articlesCollectionData.items) {

                console.log("   itemuid",item.fieldData.itemuid);
                console.log("--------------------------------------------------------")
                //console.log('itemIdToFind:', itemIdToFind);
                console.log('   item.fieldData.name:', item.fieldData.name);
                console.log("--------------------------------------------------------")

                console.log('   itemNameToFind:', itemNameToFind);
                console.log("--------------------------------------------------------")

                if (item.fieldData.name === itemNameToFind) {
                    articleCollectionItemId = item.id;

                    console.log('   articleCollectionItemId:', articleCollectionItemId);
                    console.log("--------------------------------------------------------")

                    //console.log('Found item with name', itemNameToFind, 'and id', item.id);
                    // You can use item.id or perform any other action with the found item here
                    break; // If you only want to find the first matching item and exit the loop
                }

                if (item.fieldData.itemuid === itemIdToFind) {

                    foundItemItemuid = item.fieldData.name;
                    // You found the item's item_id, you can proceed with update or use itemId as needed
                    console.log('   Found matching article:',itemNameToFind,'');
                    console.log("--------------------------------------------------------")
                    break; // Exit the loop since you found the item
                
                }else if (item.fieldData.itemuid != itemIdToFind) {

                    console.log('   Notion article "',itemNameToFind,'" has not been created in CMS. Creating it now.');
                    console.log("--------------------------------------------------------")
                    break; // Exit the loop since you didn't find the item
                }
            }
        } else {
            // Handle the case where the 'items' property is missing or not an array
            console.error('Requested Notion article ID not found in Database');
        }
        //console.log('itemuid:', itemuid);

        //console.log("attributeData",attributeData);
        const ARTICLES_DATA_CREATE = {
            isArchived: false,
            isDraft: false,
            fieldData: {
                name: articlesParseData["name"],
                slug: articlesParseData["slug"],
                itemuid: articlesParseData["itemuid"],
                sectionname: articlesParseData["sectionname"],
                subsectionnameprime: articlesParseData["subsectionnameprime"],
                htmlbodycode: articlesParseData["htmlbodycode"],
            }
        };
        const ARTICLES_DATA_UPDATE = {
            isArchived: false,
            isDraft: false,
            fieldData: {
                name: articlesParseData["name"],
                //slug: articlesParseData["slug"],
                itemuid: articlesParseData["itemuid"],
                sectionname: articlesParseData["sectionname"],
                subsectionnameprime: articlesParseData["subsectionnameprime"],
                htmlbodycode: articlesParseData["htmlbodycode"],
            }
        };

        const FINAL_DATA = foundItemItemuid ? ARTICLES_DATA_UPDATE : ARTICLES_DATA_CREATE;
        
        // for (const key in articlesParseData) {
        //     if (key.startsWith('subsectionitem')) {
        //         FINAL_DATA.fieldData[key] = articlesParseData[key];
        //     }
        // }
        const finalOptions = {
            method: foundItemItemuid ? 'PATCH' : 'POST', // Use PATCH for update and POST for create
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
              authorization: `Bearer ${API_KEY}`,
            },
            body: JSON.stringify(FINAL_DATA),
        };
    
        // Define the final API endpoint based on whether the item exists
        const articlesFinalAPIEndpoint = foundItemItemuid
        ? `${API_ENDPOINT_ARTICLES}/${itemCollectionId}` // If the item exists, use the item_id for update
        : API_ENDPOINT_ARTICLES; // If the item doesn't exist, create a new one

        //console.log("articlesFinalAPIEndpoint", articlesFinalAPIEndpoint);
        //console.log("finalOptions", finalOptions);
        // Make the API request
        let finalQueryResponseJson;
        try {
            const finalQueryResponse = await fetch(articlesFinalAPIEndpoint, finalOptions);
            finalQueryResponseJson = await finalQueryResponse.json();

            if (finalOptions.method === 'POST') {
                // If the HTTP method was POST, it means a new item was created
                //console.log('New item created:', finalQueryResponseJson.substring(0, 500) + '...');
                console.log('   New item created:', itemNameToFind);
                console.log("--------------------------------------------------------")

            } else if (finalOptions.method === 'PATCH') {
                // If the HTTP method was PUT, it means an existing item was updated
                //console.log('Item updated:', finalQueryResponseJson.substring(0, 500) + '...');
                console.log('   Item updated:', itemNameToFind);
                console.log("--------------------------------------------------------")

            }

            if (!finalQueryResponse.ok) {
                throw new Error(`HTTP error! Status: ${finalQueryResponse.status}`);
            }
            else if(finalQueryResponse.ok) {
                console.log(`   Article API Response Status: ${finalQueryResponse.status}`);
                console.log("--------------------------------------------------------")
            }
        

        } catch (error) {

            console.error('Error:', error);

        }

        //itemCollectionId = finalQueryResponseJson.id
        //console.log("itemCollectionId",itemCollectionId);



////////////// UPDATE SUBSECTIONS IN SUBSECTION COLLECION IN WEBFLOW ///////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////

        //query subsection cms
        //match item name to section name
        //for each subsection in sectionArray, update subsectionitem${!} values if match
        let subsectionCollectionItemID;
        // Define options for the fetch request to query the collection
        const subsectionsQueryOptions = {
            method: 'GET',
            headers: {
            accept: 'application/json',
            authorization: `Bearer ${API_KEY}`,
            },
        };
        const subsectionsQueryResponse = await fetch(API_ENDPOINT_SUBSECTIONS, subsectionsQueryOptions)
       
        let subsectionsCollectionData;
        let itemFieldDataName;
        let SUBSECTION_UPDATE_DATA = {};
        let subsectionsFromSectionDataArray;
        let subsectionCollectionItemId;

        try {
            if (!subsectionsQueryResponse.ok) {
                throw new Error(`Error fetching subsections data: ${subsectionsQueryResponse.statusText}`);
            }
        
            subsectionsCollectionData = await subsectionsQueryResponse.json();
            // Ensure subsectionsCollectionData is an object with an 'items' property

            for(const sectionX in sectionData){
                
                if (sectionData.hasOwnProperty(sectionX)) {

                    subsectionsFromSectionDataArray = getSubsectionsBySectionName(sectionData, sectionX);

                    //let collectionItemName = item.fieldData.name;
                    for (const item of subsectionsCollectionData.items) {
                        if(item.fieldData.name === sectionX && sectionX === itemSectionNameToFind){
                            itemFieldDataName = item.fieldData.name;
                            subsectionCollectionItemId = item.id;

                            console.log("   itemSectionNameToFind", itemSectionNameToFind);
                            console.log("   sectionX", sectionX);
                            console.log("   itemFieldDataName", itemFieldDataName);
                            console.log("   subsectionCollectionItemId", subsectionCollectionItemId);
                            console.log("--------------------------------------------------------")

                        }
                    }
                    
                    //console.log("sectionX", sectionX);                    
                    if(itemFieldDataName === sectionX){
                        
                        SUBSECTION_UPDATE_DATA = {
                            isArchived: false,
                            isDraft: false,
                            fieldData: {
                                name: sectionX,
                            }

                        };
                        //console.log("itemSectionName", itemName);
                        //console.log("sectionX", sectionX);
                        //console.log("subsectionsFromSectionDataArray", subsectionsFromSectionDataArray);
                        //console.log("subsectionsFromSectionDataArray", subsectionsFromSectionDataArray);
                        for (let i = 1; i <= 6; i++){
                            const subsectionKey = `subsectionitem${i}`;
                            SUBSECTION_UPDATE_DATA.fieldData[subsectionKey] = 'None';
                        }

                        const subsectionsFromSectionDataArray = sectionData[sectionX].subsections;
                        // Update the item's subsection properties
                        for (let i = 1; i <= subsectionsFromSectionDataArray.length; i++) {
                            const subsectionName = subsectionsFromSectionDataArray[i - 1];
                            const subsectionKey = `subsectionitem${i}`;
                            
                            SUBSECTION_UPDATE_DATA.fieldData[subsectionKey] = subsectionName;

                        }

                        //console.log('After updating:');
                        //console.log(SUBSECTION_UPDATE_DATA);
                    }
                }
            }

            //console.log("SUBSECTION_UPDATE_DATA",SUBSECTION_UPDATE_DATA);

            const updateSubsectionCollectionOptions = {
                method: 'PATCH',
                headers: {
                    accept: 'application/json',
                    'content-type': 'application/json',
                    authorization: `Bearer ${API_KEY}`,
                },
                body: JSON.stringify(SUBSECTION_UPDATE_DATA),
            };
        
            // Define the final API endpoint based on whether the item exists
            const API_ENDPOINT_SUBSECTION_UPDATE = `${API_ENDPOINT_SUBSECTIONS}/${subsectionCollectionItemId}`;
    
            // Make the API request
            let subsectionsUpdateResponseJson;
            try {

                //console.log("updateSubsectionCollectionOptions",updateSubsectionCollectionOptions);

                const subsectionsUpdateResponse = await fetch(API_ENDPOINT_SUBSECTION_UPDATE, updateSubsectionCollectionOptions);
                subsectionsUpdateResponseJson = await subsectionsUpdateResponse.json();

                if (!subsectionsUpdateResponse.ok) {
                    throw new Error(`HTTP error! Status: ${subsectionsUpdateResponse.status}`);
                }
                else if(subsectionsUpdateResponse.ok) {
                    
                    console.log(`   Section "${itemSectionNameToFind}" with ID of ${subsectionCollectionItemId}`)
                    console.log("--------------------------------------------------------")

                    console.log(`   Subsection API Response Status: ${subsectionsUpdateResponse.status}`);
                    console.log("--------------------------------------------------------")

                    //console.log("subsectionsUpdateResponseJson",subsectionsUpdateResponseJson);
                }
                            
            } catch (error) {
                console.error('Error:', error);
            }


        } catch (error) {
            console.error('Error fetching/parsing subsections data:', error);
            // Handle the error as needed.
        }

        function getSubsectionsBySectionName(sectionData, targetSectionName) {
            if (sectionData.hasOwnProperty(targetSectionName)) {
                const section = sectionData[targetSectionName];
                if (section.subsections && section.subsections.length > 0) {
                    return section.subsections;
                } else {
                    return "No subsections found for the section.";
                }
            } else {
                return "Section not found in sectionData.";
            }
        }
        //const subsections = getSubsectionsBySectionName(sectionData, XsectionName)


    } catch (error) {
        console.error('Error:', error);
    }
}
//webflowCollection(pageIdToPublishLOCAL);

  

function open(bin, index) {
    const p = child_process.spawn(bin, [index], { detached: true, stdio: 'ignore' });
    p.unref();
}



/**
 * Preview the generate blog.
 */
function preview(workDir) {
    const c = new Config(path__default['default'].join(workDir, 'config.json'));
    if (c.get('previewBrowser')) {
        open(c.get('previewBrowser'), path__default['default'].join(outDir(workDir), 'index.html'));
    }
    else {
        throw new Error('"previewBrowser" property is not set in your Notablog config file.');
    }
}

//const testHtml = generate('../notablog-starter/', 'af591314fddf446d99fa48748824e11c');
//console.log(testHtml); // Check if the 'testHtml' contains the expected content


module.exports = {
    generate,
    preview,
    webflowCollection,
}