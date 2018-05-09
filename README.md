# tsBreezeCHMS
Typescript interface to the BreezeChMS REST API 

Based on https://github.com/alexortizrosado/pyBreezeChMS

## Installation

Before using tsBreezeChMS, you'll need to install the [node-fetch](https://www.npmjs.com/package/node-fetch) library:

    npm install node-fetch
    
If you want to create a different factory function other than the one provided you just need to make sure that the returned object contains the property `request: ()`. Inside the `request` function is where the call to the BreezeCHMS API would occur.

## Getting Started

```typescript
import * as breeze from './breeze';
import * as breeze_fetch from './breeze-fetch';

const breeze_api = new breeze.BreezeApi(beeze_fetch.BreezeAsync(
    breeze_url='https://your_subdomain.breezechms.com',
    api_key='YourApiKey'))
```

To get a JSON of all people:

```python

people = breeze_api.get_people()
```
