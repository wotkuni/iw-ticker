'use strict';

define(function(require) {

    var Backbone = require('backbone');
    var $ = require('jquery');
    var models = require('models');
    var views = require('views');

    var QuoteView = views.QuoteView;

    var AppView = Backbone.View.extend({
        el: $('#main'),

        initialize: function() {
            var me = this;

            Backbone.sync = function () {
                var host = document.location.hostname;
                var port = 5000;

                if (host.indexOf('localhost') > -1) {
                    host += ':' + port
                }

                var wsUrl = 'ws://' + host + '/ws';

                var ws = new WebSocket(wsUrl);

                ws.onopen = function () {
                    console.log('socket open');
                };

                ws.onerror = function (error) {
                    console.log('socket error: ' + error);
                };

                ws.onmessage = function (message) {
                    var data = JSON.parse(message.data);

                    _.each(data, function (quoteData) {
                        var symbol = quoteData.symbol;
                        var quote = me.quotes.findWhere({symbol: symbol});
                        var newQuote = false;

                        // new quote, create it
                        if (!quote) {
                            newQuote = true;
                            quote = new models.Quote({
                                symbol: symbol
                            });
                        }

                        // set price, updates existing quote
                        quote.set({
                            'price': quoteData.price
                        });

                        // add new quote to the collection
                        if (newQuote) {
                            me.quotes.push(quote);
                        }
                    });

                };
            };

            this.quotes = new models.QuoteList();

            this.listenTo(this.quotes, 'add', this.onAddQuote);

            this.quotes.fetch();
        },

        onAddQuote: function(quote) {
            var view = new QuoteView({model: quote});
            this.$("#quotes-body").append(view.render().el);
        }
    });

    return AppView;

});