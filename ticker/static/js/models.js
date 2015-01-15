'use strict';

define(function(require) {
    var Backbone = require('backbone');

    var Quote = Backbone.Model.extend({
        defaults: function() {
            return {
                symbol: '',
                price: 0
            };
        }
    });

    var QuoteList = Backbone.Collection.extend({
        model: Quote
    });

    return {
        Quote: Quote,
        QuoteList: QuoteList
    }
});
