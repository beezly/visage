var TokenSearch = new Class({
    Implements: [ Options, Events ],
    initialize: function(element, dataSource) {
        this.tokenWrapper = $(element);
        this.tokens       = [];
        this.newToken();
    },
    activeToken: function() {
        return this.tokens.getLast();
    },
    activeTokenInput: function() {
        return this.tokens.getLast().getElement('input.token');
    },
    newToken: function() {
        token        = new Element("div",   { 'class': 'token' }),
        tokenInput   = new Element("input", { 'class': 'token', 'autocomplete': 'off' });

        token.grab(tokenInput);
        this.tokens.include(token)

        this.tokenWrapper.grab(token);
        tokenInput.focus();

        tokenInput.addEvent('keyup', function(e) {
            var reservedKeys = [ "down", "up", "enter",
                                 "pageup", "pagedown", "esc", "backspace" ];
            if (reservedKeys.contains(e.key)) { return };

            var input     = e.target,
                data      = this.data,
                query     = input.get('value'),
                resultSet = data.filter(function(item) { return item.test(query, 'i') }),
                results   = this.tokenWrapper.getNext('ul.selected');

            this.results = results;

            /* autocomplete */
            results.empty();
            resultSet.each(function(host, index) {
                var result = new Element('li', { 'html': host, 'class': 'result' });
                if (index == 0) { result.addClass('active') };
                results.grab(result);
            });
            if (results.length > 1) {
                var all = new Element('li', {'html': '&uarr; all of the above', 'class': 'result all'});
            }
            results.grab(all);
        }.bind(this));

        tokenInput.addEvent('blur', function(e) {
                var tokenInput = this.activeTokenInput().get('value');

                /* Only delete the previous token if the active TokenInput is empty */
                if (tokenInput.length > 0) {
                    e.stop();
                    this.select();
                }
        }.bind(this));

        /* autocomplete menu navigation */
        tokenInput.addEvent('keyup', function(e) {
            switch(e.key) {
                case "down":
                    this.moveDown();
                    break;
                case "up":
                    this.moveUp();
                    break;
                case "enter":
                    this.select();
                    break;
                case "pageup":
                    this.moveUp('top');
                    break;
                case "pagedown":
                    this.moveDown('bottom');
                    break;
                case "esc":
                    this.hideResults();
                    break;
                case "backspace":
                    this.destroyPreviousToken();
                    break;
                default:
                    console.log(e.key);
            }

        }.bind(this));
    },
    destroyPreviousToken: function() {
        var tokenInput = this.activeTokenInput().get('html');

        /* Only delete the previous token if the active TokenInput is empty */
        if (tokenInput.length == 0) {
            var token = this.tokens[this.tokens.length - 2];
            if (token) {
                this.tokens.erase(token);
                token.destroy()
            };
        }
    },
    hideResults: function() {
        var results = this.tokenWrapper.getNext('ul.selected');
        results.empty();
    },
    select: function() {
        var selected   = this.tokenWrapper.getNext('ul.selected').getElement('li.active'),
            results    = this.tokenWrapper.getNext('ul.selected'),
            token      = this.activeToken(),
            tokenInput = this.activeTokenInput(),
            text       = selected.get('html');

        if (selected.hasClass('all')) {
            var token = this.activeToken();
            /*
            results.getElements('li.result').each(function() {
                    this.newToken()
                    this.
                    token.destroy();
            }, this);
            */
        } else {
            tokenInput.destroy();
            token.set('html', text);
            token.addClass('finalized');
        }

        // IDEA: do selected.destroy() to remove just the entry?
        results.empty();

        this.newToken();
    },
    moveDown: function(position) {
        var active   = this.tokenWrapper.getNext('ul.selected').getElement('li.active'),
            selected = this.tokenWrapper.getNext('ul.selected');

        if (position == "bottom") {
            down = selected.getLast('li.result');
        } else {
            down = active.getNext('li.result');
        }

        if (down) {
            active.toggleClass('active');
            down.toggleClass('active');
        }
    },
    moveUp: function(position) {
        var active   = this.tokenWrapper.getNext('ul.selected').getElement('li.active'),
            selected = this.tokenWrapper.getNext('ul.selected');

        if (position == "top") {
            up = selected.getFirst('li.result');
        } else {
            up = active.getPrevious('li.result');
        }

        if (up) {
            active.toggleClass('active');
            up.toggleClass('active');
        }
    },
});

var ChartBuilder = new Class({
    Implements: [ Options, Events ],
    initialize: function(element) {
        this.builder      = $(element);
        this.hostSearch   = this.builder.getElement("input#host-search");
        this.metricSearch = this.builder.getElement("input#metric-search");
        this.cacheHosts();

        this.setupHostSearch();
    },
    setupHostSearch: function() {
        var search = this.builder.getElement("div#hosts div.tokenWrapper"),
            data   = this.hosts;
        this.tokenSearch = new TokenSearch(search, data);

        /* events */
        this.metricSearch.addEvent('blur', function(e) {
            var input    = e.target,
                query    = input.get('value');
                selected = this.builder.getElement('div#hosts ul.selected');

            if (query.test("^\s*$")) {
                selected.empty();
            }
        }.bind(this));

    },
    /*
    setupMetricSearch: function() {
        this.metricSearch.addEvent('focus', function(e) {
            var results = this.results;
            this.cacheMetrics(results)
        }.bind(this));

        this.metricSearch.addEvent('blur', function(e) {
            var input    = e.target,
                query    = input.get('value');
                selected = $$('div#metrics ul.selected')[0];

            if (query.test("^\s*$")) {
                selected.empty();
            }
        }.bind(this));

        this.metricSearch.addEvent('keyup', function(e) {
            var input    = e.target,
                metrics  = this.metrics,
                query    = input.get('value');
                results  = metrics.filter(function(metric) { return metric.test(query, 'i') }),
                selected = $$('div#metrics ul.selected')[0];

            this.results = results;

            selected.empty();
            results.each(function(metric) {
                var result = new Element('li', { 'html': metric });
                selected.grab(result);
            });

        }.bind(this));
    },
    */
    cacheHosts: function() {
        var request = new Request.JSONP({
            url:    "/data",
            method: "get",
            onComplete: function(json) {
                this.tokenSearch.data = json.hosts;
            }.bind(this)
        }).send();

        return
    },
    cacheMetrics: function(hosts) {
        var url     = "/data/" + hosts.join(',');
        var request = new Request.JSONP({
            url:    url,
            method: "get",
            onComplete: function(json) {
                this.metrics = json.metrics;
            }.bind(this)
        }).send();

        return
    }
});

window.addEvent('domready', function() {

    new ChartBuilder('chart-builder');

});
