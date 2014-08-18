$(function() {
    Backbone.sync = function() {
        var host = document.location.hostname;

        if(host.indexOf('localhost') > -1) {
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

            _.each(data, function(quoteData) {
                var symbol = quoteData.symbol;
                var quote = Quotes.findWhere({ symbol: symbol});
                var newQuote = false;

                // new quote, create it
                if(!quote) {
                    newQuote = true;
                    quote = new Quote({
                        symbol: symbol
                    });
                }

                // set price, updates existing quote
                quote.set({
                    'price': quoteData.price
                });

                // add new quote to the collection
                if(newQuote) {
                    Quotes.push(quote);
                }
            });

        };
    };

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

    var Quotes = new QuoteList;

    var QuoteView = Backbone.View.extend({
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

            var newprice = this.model.get('price');
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

    var AppView = Backbone.View.extend({
        el: $('#main'),

        initialize: function() {
            this.listenTo(Quotes, 'add', this.onAddQuote);

            Quotes.fetch();
        },

        onAddQuote: function(quote) {
            var view = new QuoteView({model: quote});
            this.$("#quotes-body").append(view.render().el);
        }
    });

    var App = new AppView;
});


