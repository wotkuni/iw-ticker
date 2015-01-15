import json
import os
import time
import threading
import urllib2

import cherrypy

from ws4py.server.cherrypyserver import WebSocketPlugin, WebSocketTool
from ws4py.websocket import WebSocket

current_dir = os.path.dirname(os.path.abspath(__file__))
default_symbols = ['AAPL', 'MSFT', 'GOOG']
port = int(os.environ.get('PORT', '5000'))


class QuoteDataSource(object):
    def __init__(self):
        self.symbols = default_symbols
        self.data_url = 'http://finance.yahoo.com/webservice/v1/symbols/%s/quote?format=json'

    def _get_url(self):
        return self.data_url % ','.join(self.symbols)

    def add_symbol(self, symbol):
        self.symbols.append(symbol)

    def get_quotes(self):
        return_data = []

        f = urllib2.urlopen(self._get_url())
        quote_data = json.load(f)

        quotes = quote_data['list']['resources']

        for quote in quotes:
            quote = quote['resource']['fields']

            data = {
                'symbol': quote['symbol'],
                'price': quote['price']
            }

            return_data.append(data)

        f.close()

        return return_data


class QuoteServer(threading.Thread):
    def __init__(self):
        threading.Thread.__init__(self)
        self.websocket = None
        self.running = False
        self.data_source = QuoteDataSource()

    def run(self):
        cherrypy.log("ticker started")
        self.running = True

        while self.running:
            time.sleep(2)

            if self.websocket:
                quotes = self.data_source.get_quotes()
                if not self.websocket.terminated:
                    self.websocket.send(json.dumps(quotes))
                    cherrypy.log("tick sent")
                else:
                    cherrypy.engine.restart()
                    cherrypy.log("websocket terminated")

        self.websocket = None
        cherrypy.log("ticker stopped")

    def stop(self):
        cherrypy.log("stopping ticker")
        self.running = False


class CherryHandler(object):
    def __init__(self, server):
        self.server = server

    @cherrypy.expose
    def index(self):
        index_file = os.path.join(current_dir, 'index.html')
        return file(index_file)

    @cherrypy.expose
    def ws(self):
        self.server.websocket = cherrypy.request.ws_handler


class Ticker(object):
    def __init__(self):
        cherrypy.config.update({'server.socket_port': port})
        WebSocketPlugin(cherrypy.engine).subscribe()
        cherrypy.tools.websocket = WebSocketTool()

        static_dir = os.path.join(current_dir, 'static')

        self.config = {
            '/ws': {
                'tools.websocket.on': True,
                'tools.websocket.handler_cls': WebSocket
            },
            '/static': {
                'tools.staticdir.on': True,
                'tools.staticdir.dir': static_dir
            }
        }

        self.server = QuoteServer()

        cherrypy.engine.subscribe('start', self.server.start)
        cherrypy.engine.subscribe('stop', self.server.stop)

    def start(self):
        handler = CherryHandler(self.server)
        cherrypy.quickstart(handler, '/', self.config)

if __name__ == '__main__':
    ticker = Ticker()
    ticker.start()