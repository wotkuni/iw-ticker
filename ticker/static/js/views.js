'use strict';

define(function(require) {

    var Backbone = require('backbone');
    var $ = require('jquery');
    var _ = require('underscore');

    var QuoteView =  Backbone.View.extend({
        tagName: 'tr',

        template: _.template($('#quote-template').html()),

        initialize: function() {
            this.listenTo(this.model, 'change', this.onModelChange);
        },

        onModelChange: function() {
            this.render();
        },

        render: function() {
            var upArrow = '&uarr;';
            var downArrow = '&darr;';
            var previous = this.model.previousAttributes();

            this.$el.html(this.template());
            this.$el.find('.symbol').html(this.model.get('symbol'));

            var newprice = parseFloat(this.model.get('price')).toFixed(4);
            var oldprice = previous.price;
            var priceArrow = '&nbsp;';

            // check new prices against previous prices
            // set the arrow accordingly
            if(oldprice) {
                priceArrow = newprice > oldprice ? upArrow : downArrow;
            }

            this.$el.find('.price').html(newprice + priceArrow);

            return this;
        }
    });

    return {
        QuoteView: QuoteView
    }
});