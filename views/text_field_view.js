// ==========================================================================
// Project:   Drupal.TextFieldView
// Copyright: @2011 My Company, Inc.
// ==========================================================================
/*globals Drupal */

/** @class

  (Document Your View Here)

  @extends SC.View
*/
Drupal.TextFieldView = SC.TextFieldView.extend(
/** @scope Drupal.TextFieldView.prototype */ {

  setFieldValue: function(newValue) {
    if (SC.none(newValue)) newValue = '' ;
    else newValue = newValue.get('value');
    var input = this.$input();
    
    // Don't needlessly set the element if it already has the value, because
    // doing so moves the cursor to the end in some browsers.
    if (input.val() !== newValue) {
      input.val(newValue);
    }
    return this ;
  },
  
  getFieldValue: function() {
    var fieldValue = this.$input().val();
    var value = this.get('value');
    value.set('value',fieldValue);
  },

});
