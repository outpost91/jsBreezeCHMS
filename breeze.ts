/**
*   TypeScript wrapper for Breeze ChMS API: http://breezechms.com/docs#extensions_api
*   The Breeze API allows churches to build custom functionality integrated with
*   Breeze.
*   Usage:
*     import * as breeze from './breeze';
*     let breeze_api = breeze.BreezeApi(
*         breeze_url='https://demo.breezechms.com',
*         api_key='5c2d2cbacg3...')
*     let people = breeze_api.get_people();
*     let person;
*     for(person in people) {
*       console.log('%s %s', person['first_name'], person['last_name']);
*     }
*/

import fetch from 'node-fetch'

const ENDPOINTS = {
    /* Breeze API url endpoints
    */ 
    PEOPLE : '/api/people',
    EVENTS : '/api/events',
    PROFILE_FIELDS : '/api/profile',
    CONTRIBUTIONS : '/api/giving',
    FUNDS : '/api/funds',
    PLEDGES : '/api/pledges'
};

class BreezeError extends Error {
    /* Error for BreezeApi.
    */
}

export class BreezeApi {
    /* A wrapper for the Breeze REST API.
    */
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
        if( dry_run === undefined ) {
            this.dry_run = false
        } else {
            this.dry_run = dry_run
        }
        
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
            params?,
            headers?,
            timeout?:number) {
        /* Makes an HTTP request to a given url.
        Args:
          endpoint: URL where the service can be accessed.
          params: Query parameters to append to endpoint url.
          headers: HTTP headers; used for authenication parameters.
          timeout: Timeout in seconds for HTTP request.
        Returns:
          HTTP response
        Throws:
          BreezeError if connection or request fails.
        */

        const url:string = this.breeze_url + endpoint;
        
        console.log('Making async request to %s', url);
            
        if( !this.dry_run ) {
            let time_out:number;

            time_out = timeout || 60
            
            const options = {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Api-Key': this.api_key
              },
              timeout: time_out * 1000,
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
        return !(('error' in response) || ('errorCode' in response));
    }

    get_people(
            limit?:number,
            offset?:number,
            details?:boolean) {
        /* List people from your database.
        Args:
          limit: Number of people to return. If None, will return all people.
          offset: Number of people to skip before beginning to return results.
                  Can be used in conjunction with limit for pagination.
          details: Option to return all information (slower) or just names.
        returns:
          JSON response. For example:
          {
            "id":"157857",
            "first_name":"Thomas",
            "last_name":"Anderson",
            "path":"img\/profiles\/generic\/blue.jpg"
          },
          {
            "id":"157859",
            "first_name":"Kate",
            "last_name":"Austen",
            "path":"img\/profiles\/upload\/2498d7f78s.jpg"
          },
          {
            ...
          }
        */

        const params:string[] = new Array()
        if( limit !== undefined ){
            params.push('limit='.concat(limit.toString()))
        }
        if( offset !== undefined ){
            params.push('offset='.concat(offset.toString()))
        }
        if( details !== undefined ){
            params.push('details=1')
        }

        return this._request(ENDPOINTS.PEOPLE.concat('/?', params.join('&')), 10);
    }

    get_person_details( person_id:string ) {
        /* Retrieve the details for a specific person by their ID.
        Args:
          person_id: Unique id for a person in Breeze database.
        Returns:
          JSON response.
        */
        return this._request(ENDPOINTS.PEOPLE.concat('/', person_id));
    }

    get_profile_fields() {
        /* List profile fields from your database.
        Returns:
          JSON response.
        */
        return this._request(ENDPOINTS.PROFILE_FIELDS);
    }

    get_events(
            start_date?:string,
            end_date?:string ) {
        /* Retrieve all events for a given date range.
        Args:
          start_date: Start date; defaults to first day of the current month.
          end_date: End date; defaults to last day of the current month
        Returns:
          JSON response.
        */
        const params:string[] = new Array()
        if( start_date !== undefined ) {
            params.push('start='.concat(start_date))
        }
        if( end_date !== undefined ) {
            params.push('end='.concat(end_date))
        }

        try {
            return this._request(ENDPOINTS.EVENTS.concat('/?', params.join('&')));
        } catch(e) {
            return this._request(ENDPOINTS.EVENTS);
        }
    }

    event_check_in(
            person_id:string,
            event_instance_id:string) {
        /* Checks in a person into an event.
        Args:
          person_id: id for a person in Breeze database.
          event_instance_id: id for event instance to check into..
        */
        
        const params:string[] = new Array()
        if( person_id !== undefined ) {
            params.push('person_id='.concat(person_id))
        }
        if( event_instance_id !== undefined ) {
            params.push('instance_id='.concat(event_instance_id))
        }
        
        return this._request(ENDPOINTS.EVENTS.concat('/attendance/add?', params.join('&')));       
    }

    event_check_out(
            person_id:string,
            event_instance_id:string) {
        /* Remove the attendance for a person checked into an event.
        Args:
          person_id: Breeze ID for a person in Breeze database.
          event_instance_id: id for event instance to check out (delete).
        Returns:
          True if check-out succeeds; False if check-out fails.
        */

        const params:string[] = new Array()
        if( person_id !== undefined ) {
            params.push('person_id='.concat(person_id))
        }
        if( event_instance_id !== undefined ) {
            params.push('instance_id='.concat(event_instance_id))
        }
        
        return this._request(ENDPOINTS.EVENTS.concat('/attendance/delete?', params.join('&')));
    }

    add_contribution(
            date?:string,
            name?:string,
            person_id?:string,
            uid?:string,
            processor?:string,
            method?:string,
            funds_json?,
            amount?:string,
            group?:string,
            batch_number?:string,
            batch_name?:string) {
        /* Add a contribution to Breeze.
        Args:
          date: Date of transaction in DD-MM-YYYY format (ie. 24-5-2015)
          name: Name of person that made the transaction. Used to help match up
                contribution to correct profile within Breeze.  (ie. John Doe)
          person_id: The Breeze ID of the donor. If unknown, use UID instead of
                     person id  (ie. 1234567)
          uid: The unique id of the person sent from the giving platform. This
               should be used when the Breeze ID is unknown. Within Breeze a user
               will be able to associate this ID with a given Breeze ID.
               (ie. 9876543)
          processor: The name of the processor used to send the payment. Used in
                     conjunction with uid. Not needed if using Breeze ID.
                     (ie. SimpleGive, BluePay, Stripe)
          method: The payment method. (ie. Check, Cash, Credit/Debit Online,
                  Credit/Debit Offline, Donated Goods (FMV), Stocks (FMV),
                  Direct Deposit)
          funds_json: JSON string containing fund names and amounts. This allows
                      splitting fund giving. The ID is optional. If present, it must
                      match an existing fund ID and it will override the fund name.
                      ie. [ {
                              'id':'12345',
                              'name':'General Fund',
                              'amount':'100.00'
                            },
                            {
                              'name':'Missions Fund',
                              'amount':'150.00'
                            }
                          ]
          amount: Total amount given. Must match sum of amount in funds_json.
          group: This will create a new batch and enter all contributions with the
                 same group into the new batch. Previous groups will be remembered
                 and so they should be unique for every new batch. Use this if
                 wanting to import into the next batch number in a series.
          batch_number: The batch number to import contributions into. Use group
                        instead if you want to import into the next batch number.
          batch_name: The name of the batch. Can be used with batch number or group.
        Returns:
          Payment Id.
        Throws:
          BreezeError on failure to add contribution.
        */

        const params:string[] = new Array()
        if( date !== undefined ) {
            params.push('date='.concat('date'))
        }
        if( name !== undefined ) {
            params.push('name='.concat('name'))
        }
        if( person_id !== undefined ) {
            params.push('person_id='.concat('person_id'))
        }
        else if( uid !== undefined ) {            
            params.push('uid='.concat('uid'))
        }
        else {
            throw new BreezeError('Adding a contribution requires a person_id or uid.')
        }
        if( processor !== undefined ) {
            params.push('processor='.concat('processor'))
        }
        if( method !== undefined ) {
            params.push('method='.concat('method'))
        }
        if( funds_json !== undefined ) {
            params.push('funds_json='.concat('funds_json'))
        }
        if( amount !== undefined ) {
            params.push('amount='.concat('amount'))
        }
        if( group !== undefined ) {
            params.push('group='.concat('group'))
        }
        if( batch_number !== undefined ) {
            params.push('batch_number='.concat('batch_number'))
        }
        if( batch_name !== undefined ) {
            params.push('batch_name='.concat('batch_name'))
        }

        return this._request(ENDPOINTS.CONTRIBUTIONS.concat('/add?', params.join('&')))['payment_id'];
    }

    edit_contribution(
            payment_id:string,
            date?:string,
            name?:string,
            person_id?:string,
            uid?:string,
            processor?:string,
            method?:string,
            funds_json?,
            amount?:string,
            group?:string,
            batch_number?:string,
            batch_name?:string) {
        /* Edit an existing contribution.
        Args:
          payment_id: The ID of the payment that should be modified.
          date: Date of transaction in DD-MM-YYYY format (ie. 24-5-2015)
          name: Name of person that made the transaction. Used to help match up
                contribution to correct profile within Breeze.  (ie. John Doe)
          person_id: The Breeze ID of the donor. If unknown, use UID instead of
                     person id  (ie. 1234567)
          uid: The unique id of the person sent from the giving platform. This
               should be used when the Breeze ID is unknown. Within Breeze a user
               will be able to associate this ID with a given Breeze ID.
               (ie. 9876543)
          processor: The name of the processor used to send the payment. Used in
                     conjunction with uid. Not needed if using Breeze ID.
                     (ie. SimpleGive, BluePay, Stripe)
          method: The payment method. (ie. Check, Cash, Credit/Debit Online,
                  Credit/Debit Offline, Donated Goods (FMV), Stocks (FMV),
                  Direct Deposit)
          funds_json: JSON string containing fund names and amounts. This allows
                      splitting fund giving. The ID is optional. If present, it must
                      match an existing fund ID and it will override the fund name.
                      ie. [ {
                              'id':'12345',
                              'name':'General Fund',
                              'amount':'100.00'
                            },
                            {
                              'name':'Missions Fund',
                              'amount':'150.00'
                            }
                          ]
          amount: Total amount given. Must match sum of amount in funds_json.
          group: This will create a new batch and enter all contributions with the
                 same group into the new batch. Previous groups will be remembered
                 and so they should be unique for every new batch. Use this if
                 wanting to import into the next batch number in a series.
          batch_number: The batch number to import contributions into. Use group
                        instead if you want to import into the next batch number.
          batch_name: The name of the batch. Can be used with batch number or group.
        Returns:
          Payment id.
        Throws:
          BreezeError on failure to edit contribution.
        */

        const params:string[] = new Array()
        if( payment_id !== undefined ) {
            params.push('payment_id='.concat(payment_id))
        }
        if( date !== undefined ) {
            params.push('date='.concat(date))
        }
        if( name !== undefined ) {
            params.push('name='.concat(name))
        }
        if( person_id !== undefined ) {
            params.push('person_id='.concat(person_id))
        }
        if( uid !== undefined ) {
            params.push('uid='.concat(uid))
        }
        if( processor !== undefined ) {
            params.push('processor='.concat(processor))
        }
        if( method !== undefined ) {
            params.push('method='.concat(method))
        }
        if( funds_json !== undefined ) {
            params.push('funds_json='.concat(funds_json))
        }
        if( amount !== undefined ) {
            params.push('amount='.concat(amount))
        }
        if( group !== undefined ) {
            params.push('group='.concat(group))
        }
        if( batch_number !== undefined ) {
            params.push('batch_number='.concat(batch_number))
        }
        if( batch_name !== undefined ) {
            params.push('batch_name='.concat(batch_name))
        }
        
        return this._request(ENDPOINTS.CONTRIBUTIONS.concat('/edit?', params.join('&')))['payment_id'];
    }
    
    delete_contribution( payment_id:string ) {
        /* Delete an existing contribution.
        Args:
          payment_id: The ID of the payment that should be deleted.
        Returns:
          Payment id.
        Throws:
          BreezeError on failure to delete contribution.
        */

        const params:string[] = new Array()
        if( payment_id !== undefined ) {
            params.push('payment_id='.concat('payment_id'))
        }
        
        try {
            return this._request(ENDPOINTS.CONTRIBUTIONS.concat('/delete?', params.join('&')))['payment_id'];
        } catch(e) {
            throw new BreezeError('Deleting a contribution requires a payment_id.')
        }
    }

    list_contributions(
            start_date?:string,
            end_date?:string,
            person_id?:string,
            include_family?:boolean,
            amount_min?:string,
            amount_max?:string,
            method_ids?:string[],
            fund_ids?:string[],
            envelope_number?:string,
            batches?:string[],
            forms?:string[]) {
        /* Retrieve a list of contributions.
        Args:
          start_date: Find contributions given on or after a specific date
                      (ie. 2015-1-1); required.
          end_date: Find contributions given on or before a specific date
                    (ie. 2018-1-31); required.
          person_id: ID of person's contributions to fetch. (ie. 9023482)
          include_family: Include family members of person_id (must provide
                          person_id); default: False.
          amount_min: Contribution amounts equal or greater than.
          amount_max: Contribution amounts equal or less than.
          method_ids: List of method IDs.
          fund_ids: List of fund IDs.
          envelope_number: Envelope number.
          batches: List of Batch numbers.
          forms: List of form IDs.
        Returns:
          List of matching contributions.
        Throws:
          BreezeError on malformed request.
        */

        const params:string[] = new Array()
        if( start_date !== undefined ) {
            params.push('start='.concat(start_date))
        }
        if( end_date !== undefined ) {
            params.push('end='.concat(end_date))
        }
        if( person_id !== undefined ) {
            params.push('person_id='.concat(person_id))
        }
        if( include_family !== undefined ) {
            if( !person_id ) {
                throw new BreezeError('include_family requires a person_id.')
            }
            params.push('include_family=1')
        }
        if( amount_min !== undefined ) {
            params.push('amount_min='.concat(amount_min))
        }
        if( amount_max !== undefined ) {
            params.push('amount_max='.concat(amount_max))
        }
        if( method_ids !== undefined ) {
            params.push('method_ids='.concat(method_ids.join('-')))
        }
        if( fund_ids !== undefined ) {
            params.push('fund_ids='.concat(fund_ids.join('-')))
        }
        if( envelope_number !== undefined ) {
            params.push('envelope_number='.concat(envelope_number))
        }
        if( batches !== undefined ) {
            params.push('batches='.concat(batches.join('-')))
        }
        if( forms !== undefined ) {
            params.push('forms='.concat(forms.join("-")))
        }

        try {
            return this._request(ENDPOINTS.CONTRIBUTIONS.concat('/list?', params.join('&')));
        } catch(e) {
            return this._request(ENDPOINTS.CONTRIBUTIONS);
        }
    }

    list_funds( include_totals?:boolean ) {
        /* List all funds.
        Args:
          include_totals: Amount given to the fund should be returned.
        Returns:
          JSON Reponse.
        */

        const params:string[] = new Array()
        if( include_totals !== undefined && include_totals ) {
            params.push('include_totals=1')
        }
        
        try {
            return this._request(ENDPOINTS.FUNDS.concat('/list?', params.join('&')));
        } catch(e) {
            return this._request(ENDPOINTS.FUNDS);
        }
    }
    
    list_campaigns() {
        /* List of campaigns.
        Returns:
          JSON response.
        */
        return this._request(ENDPOINTS.PLEDGES.concat('/list_campaigns'));
    }

    list_pledges( campaign_id:string ) {
        /* List of pledges within a campaign.
        Args:
          campaign_id: ID number of a campaign.
        Returns:
          JSON response.
        */
        const params:string[] = new Array()
        if( campaign_id !== undefined ) {
            params.push('campaign_id='.concat(campaign_id))
        }
        
        try {
            return this._request(ENDPOINTS.PLEDGES.concat('/list_pledges?', params.join('&')));
        } catch(e) {
            throw new BreezeError('Listing pledges within a campaign requires a campaign_id.')
        }        
    }
}
