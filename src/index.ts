import { Observable, BehaviorSubject } from "rxjs";
import * as hx from "@halix/action-sdk";

import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';

/**
* CustomElementContext is an interface defining the properties of the custom element context, which represents
* the state of the application front-end. A CustomElementContext is provided as property bound to Lit elements
* that back custom page elements.
*/
export interface CustomElementContext {
    pageContext: { [key: string]: any };
    pageContext$: Observable<{ [key: string]: any }>;
    groupObject: {
        groupObject: any;
        parent?: any;
        groupChange: BehaviorSubject<number>;
    };
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
    authTokenRetriever: () => Observable<string>;
    pageData: any;
    updateVariable: (variable: string, value: any) => void;
    updatePageData: (pageData: any) => void;
}

/**
* initializeFromCustomElement initializes the SDK from a custom element context. This should be called
* at the beginning of the action handler to set up the SDK with incoming information, including context
* information, input parameters, and authentication information needed to make API requests to the Halix service.
* 
* @param context - The custom element context
*/
export function initializeContext(context: CustomElementContext) {
    
    hx.initialize({
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
            initializeContext(val);
            this.onContextAvailable(val);
            this.requestUpdate('context', oldVal); // optional: notify Lit of change
        }
    }
    
    /**
    * Subclasses can use this hook for any initialization that needs to happen when the context is available.
    * This hook is called once when the context is available upon initialization of the element.
    */
    protected abstract onContextAvailable(context: CustomElementContext): void;
    
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
        // Run serially to preserve order; switch to Promise.all for parallel if you don’t care
        for (const url of urls) {
            // Ignore obvious empties/mistakes
            if (!url || typeof url !== 'string') continue;
            await this.addStylesheet(url);
        }
    }
}