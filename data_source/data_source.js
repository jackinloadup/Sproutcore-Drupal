Drupal.DataSource = SC.DataSource.extend({

  areEntitiesLoaded: NO,
  /**
   * Fetch a number of records.
   */
  fetch: function(store, query) {
    var recordType = query.recordType;
    if (query === SC.Query.local(LemonadeStand.User)) {
      SC.Request.getUrl(Drupal._urlFor(recordType))
        .set('isJSON', YES)
        .notify(this, this._didFetchAllUsers, { query: query, store: store })
        .send();
    }

    return YES;
  },
  
  _didFetchAllUsers: function(response, params) {
    var store = params.store;
    var query = params.query; 
    var recordType = query.get('recordType');

    if (SC.$ok(response)) {
      
      var records = response.get('body');
      
      records = this.getFieldsFromResults('user', 'user', records, store, LemonadeStand.User);
      
      store.loadRecords(LemonadeStand.User, records);
          
      // notify store that we handled the fetch
      store.dataSourceDidFetchQuery(query);

    // handle error case
    } else store.dataSourceDidErrorQuery(query, response);
  },
  
  /**
   * Retrieve just one record
   */
  retrieveRecord: function(store, storeKey, id) {
    // map storeKey back to record type
    var recordType = SC.Store.recordTypeFor(storeKey);
    // we can handle it, get the URL.
    SC.Request.getUrl(Drupal._urlFor('user',store.idFor(storeKey)))
      .set('isJSON', YES)
      .notify(this, this._didRetrieveRecord, {
        store: store,
        storeKey: storeKey
      })
      .send();

    return YES;
  },
  
  _didRetrieveRecord: function(response, params) {
    var store = params.store,
        storeKey = params.storeKey;

    // normal: load into store...response == dataHash
    if (SC.$ok(response)) {
      store.dataSourceDidComplete(storeKey, response.get('body'));

      // error: indicate as such...response == error
    } else store.dataSourceDidError(storeKey, response.get('body'));
  },

  updateRecord: function(store, storeKey) {
    if (SC.kindOf(store.recordTypeFor(storeKey), LemonadeStand.Users)) {
      url = LemonadeStand._ls_url + "/user/%@.json";
      SC.Request.putUrl(url.fmt(store.idFor(storeKey))).header({
                  'Accept': 'application/json'
              }).json()
        .notify(this, this.didUpdateTask, store, storeKey)
        .send(store.readDataHash(storeKey));
      return YES;
      
    } else return NO ;
  },
  didUpdateTask: function(response, store, storeKey) {
    if (SC.ok(response)) {
      var data = response.get('body');
      if (data) data = data.content; // if hash is returned; use it.
      store.dataSourceDidComplete(storeKey, data) ;
        
    } else store.dataSourceDidError(storeKey); 
  },

  setupEntities: function() {
     if(this.get('areEntitiesLoaded') === YES) return YES;
  },

  getFieldsFromResults: function(entity_type, bundle_name, records, store, model) {

    var fields = Drupal.entityController.fieldInfoInstances('user','user');
    var fields_info = Drupal.entityController.fieldInfoInstances(entity_type, bundle_name);
    var entity_info = Drupal.entityController.entityGetInfo(entity_type);

    primary_key = entity_info['entity keys']['id'];

    record_fields = [];

    // loop through records and move field data into correct models
    jQuery.each(records, function(id) {

      // get the entity id ex: uid
      entity_id = records[id][primary_key];

      // put field data into their correct models
      for (field in fields) {
        var field_name = field.classify();
        // array to put what we will eventually store in the model
        var field_column_values = [];
        var field_column_ids = [];

        // go through each delta
        jQuery.each(records[id][field], function(delta) {
          field_column_values[delta] = []; // create delta array

          // grab the columns that we are suppose to store from what was sent
          for (column in fields[field]['columns']) {
            field_column_values[delta][column] = records[id][field][delta][column];
          }

          // build guid
          var guid = fields[field]['entity_type']
                 + '.' + fields[field]['bundle']
                 + '.' + records[id][primary_key]
                 + '.' + delta;

          // build an array of all the guids for this field
          field_column_ids.push(guid);

          // add extra entity columns
          field_column_values[delta].Delta = delta;
          field_column_values[delta].EntityName = fields[field]['entity_type'];
          field_column_values[delta].Bundle = fields[field]['bundle'];
          field_column_values[delta].EntityID = entity_id;
          field_column_values[delta].guid = guid;

        });

        // take the values we just collected and save them to the model
        if (fields_info[field]['cardinality'] === "1") {
          records[id][field_name] = field_column_ids.toString();

          record = field_column_values.pop();
          if (typeof(record) != 'undefined')
            record_ids = store.loadRecord(LemonadeStand[field_name], record, field_column_ids.pop());
        }
        else {
          console.log('TODO: submit multi value field');
          record_ids = store.loadRecords(LemonadeStand[field_name], field_column_values, field_column_ids);
        }
 
        // remove the original  non classify field from results
        delete records[id][field];
    }
   });


    return records;
  },

});
