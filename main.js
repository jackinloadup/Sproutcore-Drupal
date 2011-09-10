// ==========================================================================
// Project:   Drupal
// Copyright: ©2010 Wile Design, Inc.
// ==========================================================================
/*globals Drupal */

// This is the function that will start your app running.  The default
// implementation will load any fixtures you have created then instantiate
// your controllers and awake the elements on your page.
//
// As you develop your application you will probably want to override this.
// See comments for some pointers on what to do next.
//
Drupal.main = function main() {

} ;

Drupal._urlFor = function(recordType, id) {
  var type = '';

  // try to get entity url
  if (type = Drupal.entityController.getUrl(recordType))

  if (type === '') {
    // recordType = Drupal.User
    switch (recordType) {
      case 'entity': type = '/entity'; break;
      case Drupal.User: type = '/user'; break;
      default:
        console.log('Unknown record type: ' + recordType);
        return NO;
    }
  }

  if (id !== undefined) type += '/' + id;

  // SETUP: change your apps name
  return Drupal._base_url + type + '.json'; 
};

function main() { Drupal.main(); }

