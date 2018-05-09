/**
*   TypeScript wrapper for Breeze ChMS API: http://breezechms.com/docs#extensions_api
*   The Breeze API allows churches to build custom functionality integrated with
*   Breeze.
*   Usage:
*     import * as breeze from './breeze-fetch';
*     let breeze_api = breeze.BreezeAsync(
*         breeze_url='https://demo.breezechms.com',
*         api_key='5c2d2cbacg3...')
*     let people = breeze_api.request('/api/people');
*     for( let person in people) {
*       console.log(person['first_name'], person['last_name'])
*     }
*/

import fetch from 'node-fetch'

interface _request_params {
    headers?:{},
    timeout?:number
}

export class BreezeError extends Error {
    /* Error for BreezeApi.
    */
    constructor(message) {
        super(message);
        this.name = "BreezeError";
    }
}

const _request_succeeded = ( response ) => {
    /* Predicate to ensure that the HTTP request succeeded.
    */
    return !((typeof response !== 'boolean' ) && ( ('error' in response) || ('errorCode' in response) ) );
}

const _request = (state) => ({
    request: ( endpoint:string,
               optionalObj?:_request_params ) => {
        /* Makes an async HTTP 'GET' request to a given url.
        Args:
          endpoint: URL where the service can be accessed.
          headers: HTTP headers; used for authenication parameters. NOT IMPLEMENTED YET
          timeout: Timeout in seconds for HTTP request. Default 30 seconds.
        Returns:
          fetch Promise
        Throws:
          BreezeError if connection or request fails.
        */

        const url:string = state.breeze_url + endpoint;
        
        console.log('Making async request to %s', url);
        
        if( !state.dry_run ) {
            const options = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Api-Key': state.api_key
                },
                timeout: ((optionalObj !== undefined && optionalObj.timeout !== undefined) ? optionalObj.timeout : 30) * 1000,
                mode: 'cors'
            };
        
            return fetch(url, options)
                    .then( res => {
                        if( !_request_succeeded(res.json()) ) {
                            return fetch.Promise.reject(new BreezeError(res));
                        }
                        return fetch.Promise.resolve(res);
                    })
                    .catch( error => {
                        return fetch.Promise.reject(new BreezeError(error));
                    });
        }

        return fetch.Promise.resolve({});
    }
})

export const BreezeAsync = (breeze_url:string,
                            api_key:string,
                            dry_run?:boolean) => {
    
    if (!(breeze_url && (breeze_url.search(/^https:\/\//) > -1) &&
            (breeze_url.search(/\.breezechms\.com$/) > -1))) {
        throw new BreezeError('You must provide your breeze_url as subdomain.breezechms.com: '.concat(breeze_url));
    }
    if( !api_key ){
        throw new BreezeError('You must provide an API key.');
    }

    const state = {
        breeze_url,
        api_key,
        dry_run
    }

    return Object.assign(
        {},
        _request(state)
    )
        
}
