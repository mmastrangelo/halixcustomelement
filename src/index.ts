import { Observable } from "rxjs";

import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';

// Minimal interface - only requires the initialize method that the superclass actually uses
export interface ActionSdkType {
    initialize: (config: any) => void;
    // Everything else is typed as any for maximum flexibility and maintainability
    [key: string]: any;
}

/**
 * ComponentContainer represents a component within the navigation structure.
 */
export interface ComponentContainer {
    id: string;
    name: string;
    containers?: ComponentContainer[];
    componentType: string;
    componentConfig?: any;
    parent?: ComponentContainer;

    /**
     * Returns the fully qualified ID of this component - which is the ID of this component preceded by the IDs of
     * all its ancestors, dot delimited (i.e., root.child.grandchild).
     */
    getFullyQualifiedId(): string;
}

/**
 * DataElement represents a metadata definition for a business entity or data structure within the Halix platform.
 * It defines the schema and configuration for data that can be stored, queried, and manipulated.
 * 
 * @example
 * ```typescript
 * const customerElement: DataElement = {
 *   id: "customer",
 *   name: "Customer",
 *   shortName: "Cust",
 *   description: "Customer master data",
 *   labelAttributeIDs: ["firstName", "lastName"],
 *   dataAttributes: [...]
 * };
 * ```
 */
export interface DataElement {
    id: string;
    name: string;
    shortName?: string;
    description: string;
    labelAttributeIDs: string[];
    dataAttributes: DataAttribute[];
    organizationProxy?: boolean;
    userProxy?: boolean;
}

/**
 * DataAttribute represents a single field or property within a DataElement.
 * It defines the type, constraints, and behavior of a specific piece of data.
 * 
 * @example
 * ```typescript
 * const emailAttribute: DataAttribute = {
 *   id: "email",
 *   name: "Email Address",
 *   attributeType: "primitive",
 *   dataType: "string",
 *   length: 255,
 *   required: true
 * };
 * ```
 */
export interface DataAttribute {
    id: string;
    name: string;
    shortName?: string;
    attributeType: string;
    dataType: string;
    formatType?: string;
    length: number;
    rows?: number;
    height?: number;
    decimals?: number;
    codeSetKey?: string;
    dataAttributes?: Array<DataAttribute>;
    required?: boolean;
    default?: string;
    relatedElementId?: string;
    builtInCodes?: AttributeCode[];
    sequenceNumber?: number;
}

/**
 * AttributeCode represents a single valid code option for a coded DataAttribute.
 * Coded attributes restrict values to a predefined set of options, similar to an enum.
 * 
 * @example
 * ```typescript
 * const statusCode: AttributeCode = {
 *   sequence: 1,
 *   code: "ACTIVE",
 *   description: "Active Customer",
 *   value: "A"
 * };
 * ```
 */
export interface AttributeCode {
    sequence?: number;
    code: string;
    description?: string;
    value?: any;
}
/**
 * MetadataLookup provides methods for retrieving metadata definitions at runtime.
 * This interface is available through the CustomElementContext and allows custom elements
 * to dynamically query the metadata configuration of data elements and their attributes.
 * 
 * @example
 * ```typescript
 * // In a custom element
 * const customerElement = this.context.metadataLookup.lookupDataElement("customer");
 * const emailAttr = this.context.metadataLookup.lookupDataAttribute("customer", "email");
 * const statusCodes = this.context.metadataLookup.lookupCodesForAttribute("customer", "status");
 * ```
 */
export interface MetadataLookup {
    /**
     * Retrieves the complete DataElement definition for a given element ID.
     * @param dataElementId - The unique identifier of the data element to look up
     * @returns The DataElement definition
     */
    lookupDataElement(dataElementId: string): DataElement;
    
    /**
     * Retrieves a specific DataAttribute definition from a DataElement.
     * @param dataElementId - The unique identifier of the parent data element
     * @param attributeId - The unique identifier of the attribute within the element
     * @returns The DataAttribute definition
     */
    lookupDataAttribute(dataElementId: string, attributeId: string): DataAttribute;
    
    /**
     * Retrieves the valid code options for a coded attribute.
     * @param dataElementId - The unique identifier of the parent data element
     * @param attributeId - The unique identifier of the coded attribute
     * @returns Array of code options with sequence, code, and description
     */
    lookupCodesForAttribute(dataElementId: string, attributeId: string): Observable<AttributeCode[]>;
}

/**
* CustomElementContext is an interface defining the properties of the custom element context, which represents
* the state of the application front-end. A CustomElementContext is provided as property bound to Lit elements
* that back custom page elements.
*/
export interface CustomElementContext {
    pageContext: { [key: string]: any };
    pageContext$: Observable<{ [key: string]: any }>;
    groupObject: any;
    session: {
        solution: {
            objKey: string;
            name: string;
            description: string;
            sandboxKeys: string[];
        },
        sandbox: {
            objKey: string;
            id: string;
            solutionKey: string;
            organizationKey: string;
        },
        user: {
            objKey: string;
            username: string;
            firstName: string;
            lastName: string;
            email: string;
            photoKey: string;
            thumbnail: string;
            getFormattedName(): string;
        },
        currentNav: {
            id: string;
            name: string;
            rootContainers?: ComponentContainer[];
            personalContainers?: ComponentContainer[];
            landingContainer?: ComponentContainer;
            homeContainer?: ComponentContainer;
        };
        currentComponent: {
            id: string;
            name: string;
            componentConfig: any;
        }
        organizationKey: string;
        organizationProxyKey: string;
        organizationProxy: any;
        userProxy: any;
        secondaryScopeKey: string;
        secondaryScopeLabel: string;
        isLoggedIn(): boolean;
    };
    serviceAddress: string;
    pageData: any;
    pageData$: Observable<any>;
    updateVariable: (variable: string, value: any) => void;
    updatePageData: (pageData: any) => void;
    navigate: (componentId: string, queryParams?: { [key: string]: string }) => Observable<any>;
    authTokenRetriever: () => Observable<string>;
    metadataLookup: MetadataLookup;

    /**
     * Retrieves the scope keys the current user has access to for a given data element and custom scope ID.
     * The returned keys can be used as the 'parentKey' when accessing list data or performing crud operations.
     * @param dataElementId - The data element of the scope keys to retrieve
     * @param customScopeId - Optional; the customScopeId associated with the scope keys to retrieve    
     * @returns An array of scope keys
     */
    getScopeKeys(dataElementId: string, customScopeId?: string): string[];
}

/**
* initializeFromCustomElement initializes the SDK from a custom element context. This should be called
* at the beginning of the action handler to set up the SDK with incoming information, including context
* information, input parameters, and authentication information needed to make API requests to the Halix service.
*
* @param context - The custom element context
* @param actionSdk - The action SDK instance to initialize
*/
export function initializeContext(context: CustomElementContext, actionSdk: ActionSdkType) {
    actionSdk.initialize({
        body: {
            authTokenRetriever: context.authTokenRetriever,
            sandboxKey: context.session?.sandbox?.objKey,
            serviceAddress: context.serviceAddress,
            actionSubject: context.pageContext,
            userContext: {
                user: context.session?.user,
                userProxy: context.session?.userProxy,
                orgProxy: context.session?.organizationProxy,
                orgProxyKey: context.session?.organizationProxyKey,
                orgKey: context.session?.organizationKey,
                userProxyKey: context.session?.userProxy?.objKey,
            },
            params: {},
        },
    });
}

// CSS Library Loading & Caching
const supportsAdopted = 'adoptedStyleSheets' in Document.prototype && 'replace' in CSSStyleSheet.prototype;
const sheetCache = new Map<string, CSSStyleSheet>();   // for constructable sheets
const cssTextCache = new Map<string, string>();        // for fallback text & quick reuse
const inflight = new Map<string, Promise<string>>();   // share concurrent fetches

async function fetchCss(url: string): Promise<string> {
    // de-dupe concurrent fetches of same URL
    if (inflight.has(url)) {
        return inflight.get(url)!;
    }

    const p = (async () => {
        if (cssTextCache.has(url)) {
            return cssTextCache.get(url)!;
        }
        const res = await fetch(url, { credentials: 'omit', mode: 'cors' });
        if (!res.ok) {
            throw new Error(`Failed to load CSS ${url}: ${res.status} ${res.statusText}`);
        }
        const text = await res.text();
        cssTextCache.set(url, text);
        return text;
    })();

    inflight.set(url, p);
    try {
        return await p;
    } finally {
        inflight.delete(url);
    }
}

/**
* HalixLitElement is a base class for all Halix custom elements. It provides a context property that can be used to access the Halix SDK.
* It provides the onContextAvailable hook for subclasses to use when the element receives context from the outer Halix environment.
*/
export abstract class HalixLitElement extends LitElement {
    // Action SDK instance injected by subclasses - allows version independence
    protected hx!: ActionSdkType;

    private _context!: CustomElementContext;

    // Tracks which external URLs this instance has already adopted/injected
    private _appliedCssUrls = new Set<string>();

    // @ts-ignore
    @property({ type: Object })
    get context(): CustomElementContext {
        return this._context;
    }

    set context(val: CustomElementContext) {
        const oldVal = this._context;
        this._context = val;

        if (val?.session?.organizationProxyKey) {
            // Subclasses must now call initializeContext with their own SDK instance
            // This will be handled by subclasses in their onContextAvailable override
            this.onContextAvailable(val);
            this.requestUpdate('context', oldVal); // optional: notify Lit of change
        }   
    }

    /**
    * Subclasses can use this hook for any initialization that needs to happen when the context is available.
    * This hook is called once when the context is available upon initialization of the element.
    * Subclasses should call initializeContext(context, theirSdkInstance) in this method.
    */
    protected abstract onContextAvailable(context: CustomElementContext): void;

    /**
    * Initialize the Halix context and action SDK with a specific SDK instance.
    * Subclasses must call this in their onContextAvailable implementation.
    */
    protected initializeContext(context: CustomElementContext, actionSdk: ActionSdkType) {
        this.hx = actionSdk;
        initializeContext(context, actionSdk);
    }

    protected onDestroy(): void {
        // Clean up any resources here
    }

    protected async addStylesheet(url: string): Promise<void> {
        if (this._appliedCssUrls.has(url)) return; // no-ops on repeat
        this._appliedCssUrls.add(url);

        try {
            const cssText = await fetchCss(url);

            if (supportsAdopted) {
                // share sheet across all instances for perf/memory
                let sheet = sheetCache.get(url);
                if (!sheet) {
                    sheet = new CSSStyleSheet();
                    await sheet.replace(cssText);
                    sheetCache.set(url, sheet);
                }
                // append without clobbering existing styles
                const root = this.renderRoot as ShadowRoot & { adoptedStyleSheets: CSSStyleSheet[] };
                root.adoptedStyleSheets = [
                    ...root.adoptedStyleSheets,
                    sheet
                ];
            } else {
                // Fallback: inject <style> into this shadow root
                const style = document.createElement('style');
                // Nonce handling for CSP compliance. Not yet implemented.
                // const nonce = getCspNonce();
                // if (nonce) style.setAttribute('nonce', nonce);
                style.textContent = cssText;
                this.renderRoot.appendChild(style);
            }
        } catch (err) {
            console.error(`[HalixLitElement] Failed to add stylesheet ${url}:`, err);
            throw err;
        }
    }

    protected async addStylesheets(urls: string[]): Promise<void> {
        // Run serially to preserve order; switch to Promise.all for parallel if you don't care
        for (const url of urls) {
            // Ignore obvious empties/mistakes
            if (!url || typeof url !== 'string') continue;
            await this.addStylesheet(url);
        }
    }
}
