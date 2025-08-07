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

/**
 * HalixLitElement is a base class for all Halix custom elements. It provides a context property that can be used to access the Halix SDK. 
 * It provides the onContextAvailable hook for subclasses to use when the element receives context from the outer Halix environment.
 */
export abstract class HalixLitElement extends LitElement {
    private _context!: CustomElementContext;
    
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
}