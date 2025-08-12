# Halix Custom Element SDK

The **Halix Custom Element SDK** (`@halix/customelement-sdk`) provides a development framework for creating custom web elements that integrate seamlessly with the [Halix Platform](https://halix.io). It offers a streamlined API for handling Halix context, initializing the action SDK, and building reactive web components using Lit.

> 📌 **Note:** This SDK is **source-available** and is **licensed for use only within applications running on the Halix platform.**  
> See the [LICENSE](./LICENSE) file for full terms.

---
## 📦 Installation

Install the SDK via npm:

```bash
npm install @halix/customelement-sdk
```

Import the SDK using ECMAScript module syntax:

```js
import { initializeContext, HalixLitElement, CustomElementContext } from '@halix/customelement-sdk';
```

---
## 🚀 Getting Started

Here's a minimal example of a Halix custom element written with Lit:

```js
import { HalixLitElement, CustomElementContext } from '@halix/customelement-sdk';
import { html, css } from 'lit';

export class MyCustomElement extends HalixLitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1rem;
    }
  `;

  protected onContextAvailable(context: CustomElementContext) {
    // This method is called when the context is available
    // You can now access the Halix SDK and user context
    console.log('User:', context.session.user.getFormattedName());
    console.log('Organization:', context.session.organizationProxy);
  }

  render() {
    return html`
      <div>
        <h2>Welcome to Halix</h2>
        <p>This is a custom element running in the Halix platform.</p>
      </div>
    `;
  }
}
```

---
## 📘 Key Concepts

### CustomElementContext

The `CustomElementContext` interface provides access to the Halix platform state:

- **`pageContext`**: Current page context variables and their values
- **`pageContext$`**: Observable stream of page context changes
- **`groupObject`**: Group object information, if one is in scope
  - `groupObject`: The group object itself
  - `parent`: Parent object information, if one is in scope
  - `groupChange`: Observable stream that fires when the group object changes
- **`session`**: User session information including:
  - `user`: Current user details (name, email, etc.)
  - `sandbox`: Current sandbox/solution environment
  - `organizationProxy`: Organization context
  - `userProxy`: User proxy information
- **`serviceAddress`**: Halix service endpoint
- **`authTokenRetriever`**: Function to get authentication tokens

### HalixLitElement

A base class that extends Lit's `LitElement` and provides:

- Automatic SDK initialization when context is available
- Context property with getter/setter
- `onContextAvailable()` hook for subclasses
- Integration with Halix action SDK

---
## 🛠️ Core Functions

| Function | Description |
|----------|-------------|
| `initializeContext(context)` | Initializes the Halix action SDK with custom element context |
| `HalixLitElement` | Base class for custom elements with context integration |

---
## 🏗️ Architecture

### Context Flow

1. **Element Creation**: Custom element is instantiated in the Halix platform
2. **Context Binding**: Platform binds `CustomElementContext` to the element
3. **SDK Initialization**: `initializeContext()` sets up the action SDK
4. **Hook Execution**: `onContextAvailable()` is called for custom logic
5. **Reactive Updates**: Element re-renders when context changes

### Integration Points

- **Lit Framework**: Built on top of Lit for reactive web components
- **Halix Action SDK**: Automatically initialized and available
- **RxJS**: Observable patterns for reactive data streams
- **TypeScript**: Full type safety and IntelliSense support

---
## 📋 Usage Patterns

### Basic Custom Element

```js
import { HalixLitElement, CustomElementContext } from '@halix/customelement-sdk';
import { html } from 'lit';

export class SimpleElement extends HalixLitElement {
  protected onContextAvailable(context: CustomElementContext) {
    // Access user information
    const userName = context.session.user.getFormattedName();
    const orgName = context.session.organizationProxy?.name;
    
    // Initialize any custom logic
    this.loadData();
  }

  async loadData() {
    // Use the initialized Halix SDK
    const data = await hx.getObject('myType', 'someKey');
    // Update component state
  }

  render() {
    return html`<div>Hello from Halix!</div>`;
  }
}
```

### Reactive Context Updates

```js
export class ReactiveElement extends HalixLitElement {
  protected onContextAvailable(context: CustomElementContext) {
    // Subscribe to page context changes
    context.pageContext$.subscribe(pageContext => {
      // Handle page context updates
      this.requestUpdate();
    });
  }
}
```

---
## 🔐 License

**Halix SDK License v1.0**

This SDK is licensed for **use only within applications running on the Halix platform**, in accordance with Halix SDK guidelines.

- **You may not** use this SDK outside the Halix platform.
- Full license text is available in the [LICENSE](./LICENSE) file.

For commercial licensing outside this scope, contact [hello@halix.io](mailto:hello@halix.io).

---
## 🧰 Contributing

This repository is source-available but not open source. Contributions are currently limited to internal Halix developers and partners. Please open an issue to discuss improvements or bug reports.

---
## 🧭 About Halix

Halix is a low-code platform designed to empower developers and business users to build powerful applications quickly. Learn more at [halix.io](https://halix.io).
