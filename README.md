# tsBreezeCHMS
Typescript interface to the BreezeChMS REST API 

Based on https://github.com/alexortizrosado/pyBreezeChMS

## Installation

Before using tsBreezeChMS, you'll need to install the [node-fetch](https://www.npmjs.com/package/node-fetch) library:

    npm install node-fetch

## Getting Started

```typescript
import * as breeze from './breeze';

const breeze_api = new breeze.BreezeApi(
    breeze_url='https://your_subdomain.breezechms.com',
    api_key='YourApiKey')
```

To get a JSON of all people:

```python

people = breeze_api.get_people()
```
