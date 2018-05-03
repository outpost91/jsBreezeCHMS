/**
*   TypeScript wrapper for Breeze ChMS API: http://breezechms.com/docs#extensions_api
*   The Breeze API allows churches to build custom functionality integrated with
*   Breeze.
*   Usage:
*     import * as breeze from './breeze-fetch';
*     let breeze_api = breeze.BreezeAsync(
*         breeze_url='https://demo.breezechms.com',
*         api_key='5c2d2cbacg3...')
*     let people = breeze_api._request('/api/people');
*     let person;
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

export class BreezeAsync {
    name:string = this.constructor.name;
    
    breeze_url:string;
    api_key:string;
    dry_run:boolean;

    constructor( 
            breeze_url:string,
            api_key:string,
            dry_run?:boolean ) {
        /* Instantiates the BreezeApi with your Breeze account information.
        Args:
          breeze_url: Fully qualified domain for your organizations Breeze service.
          api_key: Unique Breeze API key. For instructions on finding your
                   organizations API key, see:
                   http://breezechms.com/docs#extensions_api
          dry_run: Enable no-op mode, which disables requests from being made. When
                   combined with debug, this allows debugging requests without
                   affecting data in your Breeze account.
        */

        this.breeze_url = breeze_url
        this.api_key = api_key
        this.dry_run = dry_run || false
        
        if (!(this.breeze_url && (this.breeze_url.search(/^https:\/\//) > -1) &&
                (this.breeze_url.search(/\.breezechms\.com$/) > -1))) {
            throw new BreezeError('You must provide your breeze_url as subdomain.breezechms.com: '.concat(this.breeze_url));
        }

        if( !this.api_key ){
            throw new BreezeError('You must provide an API key.');
        }
    }

    _request( 
            endpoint:string,
            optionalObj?:_request_params) {
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

        const url:string = this.breeze_url + endpoint;
        
        console.log('Making async request to %s', url);
        
        if( !this.dry_run ) {
            const options = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Api-Key': this.api_key
                },
                timeout: ((optionalObj !== undefined && optionalObj.timeout !== undefined) ? optionalObj.timeout : 30) * 1000,
                mode: 'cors'
            };
        
            return fetch(url, options)
                    .then( res => res.json() )
                    .then( data => {
                        if( !this._request_succeeded(data) ) {
                            return fetch.Promise.reject(new BreezeError(data));
                        }
                        return fetch.Promise.resolve(data);
                    })
                    .catch( error => {
                        return fetch.Promise.reject(new BreezeError(error));
                    });
        }

        return fetch.Promise.resolve({});
    }

    _request_succeeded( response ) {
        /* Predicate to ensure that the HTTP request succeeded.
        */
        return !((typeof response !== 'boolean' ) && ( ('error' in response) || ('errorCode' in response) ) );
    }
    
}
