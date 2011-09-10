// ==========================================================================
// Project:   Drupal.entityController
// Copyright: @2011 My Company, Inc.
// ==========================================================================
/*globals Drupal */

/** @class

  (Document Your Controller Here)

  @extends SC.Object
*/
Drupal.entityController = SC.ObjectController.create(
/** @scope Drupal.entityController.prototype */ {

  loadInfo: function() {
    var request = SC.Request.getUrl(Drupal._urlFor('entity'));

    request.set('isJSON', YES);
    request.notify(this,this._loadInfoResult);
    request.send();

  },

  _loadInfoResult: function(result) {
    if(result.status == 200) {
      this.set('content', result.get('body'));
    } else {
	SC.AlertPane.error({
	  message: "Could not load entities",
	  description: "You broke something. Think real hard about what you did. Now fix it.",
	  caption: "Fix it and try, try again."
	});
    }

    this.generateModels();

    Drupal._app.loadData();
  },

  generateModels: function() {
    // lets build the field modals then the entity modals
    this.buildFields();

    // build out entities and bundles
    this.buildInstances();
  },

  buildInstances: function() {
   // get each entity
    for (entity in this.content['instances']) {
      // get each bundle
      for ( bundle in this.content['instances'][entity]['bundles']) {
        this.buildBundle(entity, bundle);
      }
    }
  },

  buildBundle: function(entity, bundle) {
    // figure out the name
    var name = entity;
    // ammend bundle name to entity if different
    if (entity !== bundle) name += '_' + bundle;
    // clean the name
    name = name.classify();

    // intitate the bundle model
    Drupal._app[name] = SC.Record.extend({});

    // hack to return the correct class name
    // there must be a better way to do this?
    // https://frozencanuck.wordpress.com/2010/08/18/lebowski-framework-failing-in-internet-explorer/#more-1496
    Drupal._app[name]._object_className = 'Drupal._app.' + name;

    // fields are always objects... we dont want any of this array crap!
    if (!this.content['instances'][entity]['bundles'][bundle].isSCArray) {
 
      // entity resource doesn't currently pull in this info
      Drupal._app[name].prototype['primaryKey'] = this.content['instances'][entity]['schema_fields_sql']['base table']['primary key'][0];

      // add fields from the base table
      for (field in this.content['instances'][entity]['schema_fields_sql']['base table']['fields']) {
        // get the column information about this field
        column = this.content['instances'][entity]['schema_fields_sql']['base table']['fields'][field];

        // clean the name
        field = field.classify();
        
        Drupal._app[name].prototype[field] = this.buildFieldColumn(column);
      }

      // add Field API fields to the bundle
      for (field in this.content['instances'][entity]['bundles'][bundle]['fields']) {
        // try to make sure this "field" is really a field..
        if(!this.content['instances'][entity]['bundles'][bundle]['fields'][field].bundle) continue;

        var field_clean = field.classify();
        var field_info = this.content['fields'][field];
        var cardinality = parseInt(field_info['cardinality']);
        if (cardinality === 1) {
          // create a toOne field relation
          Drupal._app[name].prototype[field_clean] = SC.Record.toOne(
            'Drupal._app.' + field_clean,
            { inverse: 'guid',
              isMaster: YES,
            }
          );
        }
        else {
          // create a toMany field relation
          Drupal._app[name].prototype[field_clean] = SC.Record.toMany(
            'Drupal._app.' + field_clean,
            { inverse: 'guid',
              isMaster: YES,
            }
          );
        }
      }
    }
  },

  buildFields: function() {
    var _this = this; // hack to keep scope within jQuery.each
    
    fields = this.content['fields'];
    jQuery.each(fields, function(field_name, field_data) {
      // make name camel case
      var field_name_clean = field_name.classify();

      // initiate field model
      Drupal._app[field_name_clean] = SC.Record.extend({});

      // hack see above
      Drupal._app[field_name_clean]._object_className = 'Drupal._app.' + field_name_clean;

      jQuery.each(field_data['columns'], function(column, column_data) {

        // make name camel case
        var column_clean = column.classify();

        // add new column onto field
        Drupal._app[field_name_clean].prototype[column_clean] = _this.buildFieldColumn(column_data, column);
      });

      // add field need to assosiate content back to the entity
      Drupal._app[field_name_clean].prototype['EntityName'] = _this.buildFieldColumn({type: 'varchar'});
      Drupal._app[field_name_clean].prototype['Bundle'] = _this.buildFieldColumn({type: 'varchar'});
      Drupal._app[field_name_clean].prototype['EntityID'] = _this.buildFieldColumn({type: 'int'});
      Drupal._app[field_name_clean].prototype['Delta'] = _this.buildFieldColumn({type: 'int'});
      Drupal._app[field_name_clean].prototype['guid'] = _this.buildFieldColumn({type: 'varchar'});

      // add primary key
      Drupal._app[field_name_clean].prototype['primaryKey'] = 'guid';
    });

  },

  buildFieldColumn: function(column, key) {
    var options = []; // create array to store options

    // set key for field if we have it
    if(key !== undefined) options.key = key;

    if (column['not null'] != undefined) options['isRequired'] = 'YES';
    if (column['default'] != undefined) options['defaultValue'] = column['default'];

    switch(column.type) {
      case 'varchar':
        return SC.Record.attr(String,options);
      case 'serial':
      case 'int':
        return SC.Record.attr(Number,options);
    }
  },

  fieldInfoInstances: function(entity_type, bundle_name) {
    if (entity_type && bundle_name) {
      instance_fields =this.content['instances'][entity_type]['bundles'][bundle_name]['fields'];
      for (field in instance_fields) {
        // merge global field data into instace field
        jQuery.extend(instance_fields[field],this.content['fields'][field]);
      }
      return instance_fields;
    }
    else if (entity_type) {
      console.log('Impliment this');
    }
    else {
      console.log('Impliment this');
    }
  },

  entityGetInfo: function(entity_type) {
    if(entity_type === undefined)
      return this.content['instances'];
    else
      return this.content['instances'][entity_type];
  },
}) ;
