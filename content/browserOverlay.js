/**
 * Copyright 2013 Rp (www.meetrp.com)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *       http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/**
 * faroo search namespace
 */
if ('undefined' == typeof(FS)) {
	var FS = {};
};


/**
 * Basic logging framework.
 *
 * This works perfectly with (at least) Firebug 1.12.3.
 * To enter into debug mode, set _debug to 'true'
 * Be warned that this could lead to overloading of your Firebug Console.
 */
FS.Logging = {
	_debug: true,			// false to disable ALL logs
	
	debug: function(msg) {
		if (!FS.Logging._debug)
			return;

		// prepare the current time stamp in human readable format
		var d = new Date();
		var ts = d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate() +
				' ' + d.getHours() + ':' + d.getMinutes() + ':' +
				d.getSeconds() + ':' + d.getMilliseconds();

		// use firebug's console for logging
		Firebug.Console.log(ts + ' [FS-LOG] ' + msg);
	}
};


/**
 * Common utility framework
 *
 * Contains all the useful & common functions like JSON handling,
 * cursor position tracking, escaping HTML strings, etc...
 */
FS.Utils = {
	_debug: true,			// false to disable logs from Utils class
	
	log: function log(msg) {
		if (!FS.Utils._debug)
			return;

		var callerFn = arguments.callee.caller.toString();
		var callerName = (callerFn.substring(callerFn.indexOf("function") + 9, callerFn.indexOf("(")) || "anoynmous").toString();
		FS.Logging.debug('Utils.' + callerName + ': ' + msg);
	},

	/**
	 * Wrapper to parse a JSON object. This wrapper can be extended
	 * to support older versions of FF where the default JSON class
	 * is _not_ available.
	 */
	fromJSON: function fromJSON(object){
		return JSON.parse(object);
	},
	
	/**
	 * ======= UNUSED FUNCTIONS ======
	 * 	Note -
	 * 		Kept for future use, if the search API format or requirement
	 * 		changes at a later date.

	toJSON: function toJSON(obj) {
		return FS.Utils.safeJSON(
			FS.Utils._toJSON( obj )
		);
	},

	_toJSON: function _toJSON(data){
		return JSON.stringify(data);
	},
    
	safeJSON: function safeJSON(json) {
		if( typeof(json) !== "string" )
			json = FS.Utils._toJSON( json );

		return json.replace(
			/[^\w\d\s\.,:_\-\{\}\"\'\[\]\+\\\/\?\$\(\)\=]/g,
			function (chr){
				//to hex
				chr = chr.charCodeAt(0).toString(16);
				//pad with zero if needed
				return "\\u" + ( '000' + chr ).slice(-4);
			}
		);
	},

	 * ======= (End of) UNUSED FUNCTIONS ======
	 **/
    
	/**
	 * Calculate the current position of the mouse pointer
	 */
	cursorPosition: function cursorPosition(evt, doc) {
		evt = evt || window.event;

		var position = {
			x: 0,
			y: 0
		};

		if (evt.pageX || evt.pageY) {
			position.x = evt.pageX;
			position.y = evt.pageY;
		} else {
			position.x = evt.clientX + 
				(doc.docElement.scrollLeft || doc.body.scrollLeft) - 
				doc.docElement.clientLeft;
			position.y = evt.clientY + 
				(doc.docElement.scrollTop || doc.body.scrollTop) - 
				doc.docElement.clientTop;
		}

		return position;
	},


	/**
	 * Encode a given string and makes it portable.
	 */
	escapeHTML: function escapeHTML(str) {
		FS.Utils.log(str);
		return str.replace(/[&"<>]/g, function (m) "&" +
							({ "&": "amp", '"': "quot",
								"<": "lt", ">": "gt" })[m] + ";");
	}

};


/**
 * Framework to display the tooltip
 *
 * Also embeds a given text (or predetermined text like error messages) into 
 * a HRML formatted ready-to-use string. Confused? Read the code :)
 */
FS.Tooltip = {
	_debug: true,			// false to disable Tooltip related logs
	doc: null,				// DOM root node for extracting HTML page
	node: null,				// tool tip span HTML node
	timeout: null,
	display_time: 2000,		// 2000 milliseconds = 2 seconds

	log: function log(msg) {
		if (!FS.Tooltip._debug)
			return;

		var callerFn = arguments.callee.caller.toString();
		var callerName = (callerFn.substring(callerFn.indexOf("function") + 9, callerFn.indexOf("(")) || "anoynmous").toString();
		FS.Logging.debug('Tooltip.' + callerName + ': ' + msg);
	},


	/**
	 * Initialize the tooltip with a well defined <span> tag.
	 * More importantly, register for 'mouseover' and 'moustout' events.
	 */
	init: function init(doc) {
		FS.Tooltip.doc = doc;

		FS.Tooltip.node = doc.createElement('span');
		FS.Tooltip.node.id = 'faroosearch_tooltip';
		FS.Tooltip.node.style.display = 'none';
		FS.Tooltip.node.style.position = 'absolute';
		FS.Tooltip.node.style.overflow = 'hidden';
		FS.Tooltip.node.style.maxWidth = '400px';
		FS.Tooltip.node.style.backgroundColor = '#fefefe';
		FS.Tooltip.node.style.border = '1px solid #aaa';
		FS.Tooltip.node.style.padding = '4px 8px';
		FS.Tooltip.node.style.fontSize = '11px';
		FS.Tooltip.node.style.letterSpacing = '0px';
		FS.Tooltip.node.style.color = '#000';
		FS.Tooltip.node.style.zIndex = '5000';
		FS.Tooltip.node.style.lineHeight = '120%';
		FS.Tooltip.node.style.textAlign = 'left';
		FS.Tooltip.node.style.textAlign = 'Avenir, helvetica, sans-serif';

		try {
			if (typeof(doc.body.style.MozBorderRadius) !== 'undefined')
				FS.Tooltip.node.style.MozBorderRadius = '5px';
			else if (typeof(doc.body.style.borderRadius) !== 'undefined')
				FS.Tooltip.node.style.borderRadius = '5px';
		} catch (e) {
			FS.Tooltip.log('MozBorderRadius not supported.');
		}

		FS.Tooltip.doc.body.appendChild(FS.Tooltip.node);
		FS.Tooltip.node.addEventListener('mouseover', FS.Tooltip.show, false);
		FS.Tooltip.node.addEventListener('mouseout', FS.Tooltip.hide, false);
	},


	/**
	 * The function called when 'mouseover' event is detected.
	 * The input is the parentNode of the current hash URL in the
	 * document hierarchy.
	 */
	show: function show(anchor) {
		FS.Tooltip.log('anchor: ' + anchor);
		try { FS.Tooltip.log('anchor.href: ' + anchor.href); }
		catch(e) { FS.Tooltip.log(e); }

		// if document is valid then
		if (typeof(anchor.href) !== 'undefined') {
			FS.Tooltip.doc = anchor.ownerDocument;
			FS.Tooltip.node = FS.Tooltip.doc.getElementById('faroosearch_tooltip');
		}
		
		/**
		 * clear the timeout so the tooltip stays on as long as the mouse
		 * pointer stays on top of the tooltip
		 */
		clearTimeout(FS.Tooltip.timeout);
	},


	/**
	 * The function called when 'mouseout' event is detected.
	 * Reset the timerout so that the tooltip stays just long enough
	 & and vanishes.
	 */
	hide: function hide() {
		clearTimeout(FS.Tooltip.timeout);
		FS.Tooltip.timeout = setTimeout(function() {
				FS.Tooltip.node.style.display = 'none';
			}, FS.Tooltip.display_time);
	},


	/**
	 * This is the main display of the tooltip function.
	 * Calculates the cursor position, sets the innerHTMl to
	 * the input, which should be (obviously) an HTML formatted
	 * string.
	 */
	toggle: function toggle(text, evt) {
		FS.Tooltip.log('event: ' + evt);
		FS.Tooltip.node.innerHTML = text;
		
		if (typeof(evt) !== 'undefined') {
			FS.Tooltip.log('event.target: ' + evt.target);
			FS.Tooltip.show(evt.target.parentNode);
			FS.Tooltip.show(evt.target);
			FS.Tooltip.node.style.display = 'inline';

			var pos = (evt) ?
						FS.Utils.cursorPosition(evt, FS.Tooltip.doc) :
						FS.Utils.cursorPosition(null, FS.Tooltip.doc);
			FS.Tooltip.node.style.top = (pos.y + 15) + 'px';
			FS.Tooltip.node.style.left = (pos.x) + 'px';
		}
	},


	/**
	 * Separator in between lines.
	 * Broke it into a very small function for a future
	 * flexibility of introducing anything other than <br>
	 * perhaps even a <hr> or anything.
	 */
	seperator: function seperator() {
		var result = '<br>';
		return result;
	},


	/**
	 * HTML response to no search results from Faroo
	 */
	noData: function noData() {
		var result =
			'<strong style="font-size: 16px; display: block;' +
					' text-align: left;' + 
					' color: rgb(139, 0, 0); padding-bottom: 6px;">' +
				'No Search-Result Found!!' +
			'</strong>';

		return result;
	},


	/**
	 * HTML response to add whodunnit statement
	 */
	signature: function signature() {
		var result =
			'<strong style="font-size: 12px; display: block;' +
					' text-align: right;' + 
					' color: rgb(99, 187, 233); padding-bottom: 6px;">' +
				'Search results provided by Faroo Search' +
			'</strong>';

		return result;
	},

	
	/**
	 * HTML response to add search term
	 */
	searchterm: function searchterm(hashkey) {
		var result =
			'<strong style="font-size: 12px; display: block;' +
					' text-align: center;' + 
					' color: rgb(99, 187, 233); padding-bottom: 6px;">' +
				'---- ' + hashkey + '---- ' +
			'</strong>';
		result += '<hr>';

		return result;
	},


	/**
	 * HTML response to an invalid FarooSearch API Key
	 */
	invalidAPIKey: function invalidAPIKey() {
		var apiUrl = 'http://www.faroo.com/hp/api/api.html#key';
		var result =
			'<strong style="font-size: 12px; display: block;' +
					' text-align: left;' + 
					' color: rgb(99, 187, 233); padding-bottom: 6px;">' +
				'Invalid API Key! <br> Please register for an API key at' +
					'<a href=' + FS.Utils.escapeHTML(apiUrl) + ' target\"_blank\">' +
						'FAROO - Free Search API </a>' +
			'</strong>';

		return result;
	},


	/**
	 * Generate the actual HTML response string with all the necessary
	 * information.
	 */
	generate: function generate(domain, title, url) {
		var result = 
			'<span style="display: block; padding-bottom: 2px;">' +
				'<font color="blue" size="2">' +
					'<a href=' + FS.Utils.escapeHTML(url) + ' target=\"_blank\">' +
							title + '</a>' +
				'</font>' + 
				'&nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;' +
				'<font color="#848484" size="2">' +
					domain +
				'</font>' +
			'</span>';

		return result;
	}
};


/**
 * Cache framework
 *
 * Need I explain? :)
 * Obviously to reduce the # of API calls, I store the HASH key with
 * the tooltip in the cache.
 */
FS.Cache = {
	_debug: true,			// false to disable cache logs
	store: {},				// lookup table for the cache entry

	log: function log(msg) {
		if (!FS.Cache._debug)
			return;

		var callerFn = arguments.callee.caller.toString();
		var callerName = (callerFn.substring(callerFn.indexOf("function") + 9, callerFn.indexOf("(")) || "anoynmous").toString();
		FS.Logging.debug('Cache.' + callerName + ': ' + msg);
	},


	set: function set(key, value) {
		FS.Cache.log(key + ' = ' + value);
		FS.Cache.store[escape(key)] = value;
	},


	get: function get(key) {
		var value = FS.Cache.store[escape(key)];
		if (typeof(value) !== 'undefined') {
			FS.Cache.log(key + ' = ' + value);
			return value;
		}

		FS.Cache.log(key);
		return false;
	}
};


/**
 * AJAX Framework
 *
 * Just a wrapper to send HTTP requests & to get the response.
 */
FS.AJAX = {
    _debug: true,			// false to disable any AJAX logs
	
	log: function log(msg) {
		if (!FS.AJAX._debug)
			return;

		var callerFn = arguments.callee.caller.toString();
		var callerName = (callerFn.substring(callerFn.indexOf("function") + 9, callerFn.indexOf("(")) || "anoynmous").toString();
		FS.Logging.debug('AJAX.' + callerName + ': ' + msg);
	},


	/**
	 * Create an HTTP request, open the given URL and upon 'completion'
	 * based on the response (200 or not) call the 'onSuccess' or 'onError'
	 * callback functions as provided by the caller
	 */
	request: function request(options) {
		if (typeof(options.method) === 'undefined')
			options.method = 'GET';

		var req = new XMLHttpRequest();
		req.open(options.method, options.url, true);
        
		//Send the proper header information along with the request
		req.setRequestHeader("Content-type", "application/json");

		req.onreadystatechange = function(aEvt) {
			if (req.readyState == 4) {		// 4 -> Done!
				FS.AJAX.log('received response for ' +
					options.url + ' STATUS ' + req.status);
				if (req.status == 200) {
					if (typeof(options.onSuccess) !== 'undefined')
						options.onSuccess(req.responseText);
				} else {
					if (typeof(options.onError) !== 'undefined')
						options.onError(req.status, req.statusText);
				}
			}
		}

		FS.AJAX.log(options.method + ' ' + options.url);
		req.send();
	}
};


/**
 * Wrapper framework to get the Faroosearch APIs.
 */
FS.API = {
	_debug: true,					// false to disable API logs
	uri: 'http://www.faroo.com/',	// base uri for faroosearch
	key: '',						// placeholder for the API key
	src: 'news',					// Source of the search is 'news'
									// Other options are: 'web', 'topics',
									// 'trends', 'suggest'
	len: 5,							// number of search results requested

	log: function log(msg) {
		if (!FS.API._debug)
			return;

		var callerFn = arguments.callee.caller.toString();
		var callerName = (callerFn.substring(callerFn.indexOf("function") + 9, callerFn.indexOf("(")) || "anoynmous").toString();
		FS.Logging.debug('API.' + callerName + ': ' + msg);
	},


	/**
	 * The key is set in the options tab of the extension in the 
	 * Add-ons manager of Firefox.
	 */
	init: function init(key) {
		FS.API.key = key;
		FS.API.log('Key: ' + FS.API.key);
	},


	/**
	 * Piece together the search URI that needs to be called.
	 * Currently it is this:
	 *		http://www.faroo.com/api?q=<query-string>&start=<number>&length=<number>&l=<lang>&src=<news/web/blog>&f=<fmt>&key=<developer-key>
	 *
	 * Check their current implementation here: http://www.faroo.com/hp/api/api.html
	 */
	searchurl: function searchurl(hash) {
		//FS.API.log('hash: ' + hash);
		var query = 'api?q=' + hash;
		query += '&start=1&length=' + FS.API.len + '&l=en';
		query += '&src=' + FS.API.src;
		query += '&i=false&f=json&key=';
		query += FS.API.key;
		FS.API.log('URL: ' + FS.API.uri + query);

		return FS.API.uri + query;
	}
};


/**
 * Queue framework
 *
 * This is required to know if a request for the same HASH key
 * had already been generated. If so then do not send the request
 * again. Optimization to reduce the # of API calls.
 */
FS.Queue = {
	queue: {},						// truth value table for queued requests

	set: function set(key) {
		if (typeof(FS.Queue.queue[escape(key)]) === 'undefined') {
			FS.Queue.queue[escape(key)] = true;
			return true;
		}

		return false;
	},

	unset: function unset(key) {
		FS.Queue.queue[escape(key)] = false;
	}
};


/**
 * 'THE' Core :)
 *
 * Contains the entire logic of retreiving the URLs, from that the HASH,
 * then to retreive the search results, etc...
 */
FS.Core = {
	_debug: true,					// false to disable Core logs
	cur_url: null,					// link being hovered over
	doc: null,						// DOM root node for extracting HTML page
	periodic_update_time: 2000,		// 2000 milliseconds = 2 secs
	loading_img_src: 'http://click-taxi.com/images/ajax-loader-timer.gif',

	log: function log(msg) {
		if (!FS.Core._debug)
			return;

		var callerFn = arguments.callee.caller.toString();
		var callerName = (callerFn.substring(callerFn.indexOf("function") + 9, callerFn.indexOf("(")) || "anoynmous").toString();
		FS.Logging.debug('Core.' + callerName + ': ' + msg);
	},


	/**
	 * The DOMContentLoaded event is fired when the document has been completely loaded
	 * and parsed, without waiting for stylesheets, images, and subframes to finish loading.
	 */
	init: function init() {
		// grab the content of the browser
		var appcontent = document.getElementById("appcontent");
		if (appcontent) {
			// get notified when the page is done loading
			appcontent.addEventListener("DOMContentLoaded", FS.Core.onPageLoad, true);
		}
	},


	/**
	 * Handle only twitter page.
	 */
	onPageLoad: function onPageLoad(aEvent) {
		var doc = aEvent.originalTarget;	// the document that triggered 'onload' event
		if (doc.location.host != 'twitter.com') {
			return;
		}
		FS.Core.log("opening " + doc.location.href);

		// store the document for future purpose
		FS.Core.doc = doc;

		// Retreive the API key from the preference/options section of the add-on.
		var key = Components.classes["@mozilla.org/preferences-service;1"]
						.getService(Components.interfaces.nsIPrefBranch)
						.getCharPref('faroosearch.symbol');
		FS.Core.log('Key: ' + key);

		// If not key is available then ignore tracking this page.
		if (key.length) {
			FS.Core.key = key;
			FS.Core.log(FS.Core.key);

			FS.API.init(FS.Core.key);	// initialize the faroo search API class with your private key
			FS.Tooltip.init(doc);		// initialize the tooltip class
			FS.Core.modifyLinks(doc);	// modify all the links on the page
		} else {
			alert('No Faroo Search API key found! So not tracking this page!');
		}
	},


	/**
	 * Modify every link on this page to register for a 'mouseover'
	 * and 'mouseout' events.
	 */
	modifyLinks: function modifyLinks(doc) {
		doc = doc || FS.Core.doc;
		var hashs = FS.Core.extractLinks(doc);
		try {
			for (var i = 0; i < hashs.snapshotLength; i++) {
				anchor = hashs.snapshotItem(i);

				// mark the link so that future search ignores this
				anchor.setAttribute('faroosearch', 'true');

				// Pick only 'Hash' links from twitter page
				if (FS.Core.checkLink(anchor)) {
					// add event listener for every link
					FS.Core.processLink(anchor);
				}
			}
		} catch(e) {
			FS.Core.log('ERROR ' + e);
		}

		/**
		 * periodically modify the links on the page, as twitter is a 
		 * dynamic page & newer links are available every few mins
		 */
		setTimeout(
			function() {
				FS.Core.modifyLinks( doc );
			},
			FS.Core.periodic_update_time);
	},


	/**
	 * Extract all the newer links, i.e., the links that have not been
	 * modified earlier. All unmodified links are the ones without any
	 * attribute set on it.
	 */
	extractLinks: function extractLinks(doc) {
		doc = doc || FS.Core.doc;
		return doc.evaluate('//a[@href][not(@faroosearch)]',		// XPath expression string
							doc,									// where to search
							null,									// namespace resolver
							XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,	// snapshot of all matching element
																	// in the order in which it appears
							null);									// reference to result variable
	},


	/**
	 * Verify the link is from twitter and has the word 'hash' embedded
	 * somewhere in the URL
	 */
	checkLink: function checkLink(anchor) {
		//FS.Core.log(anchor.href);
		if (anchor.href.indexOf('src\=hash') == -1)
			return false;

		var domain = FS.Core.getDomain(anchor.href);
		if (!domain)
			return false;

		if (domain != 'twitter.com')
			return false;

		return true;
	},


	/**
	 * Get the TLD of the URL.
	 */
	getDomain: function getDomain(url) {
		var domain = url.match(/^https:\/\/(?:(?:www\.)?(?:[^\.]+\.(notlong\.com|qlnk\.net|ni\.to|lu\.to|zzang\.kr)|([^\.]+\.[^\/]+)))/i);
		if (domain) {
			domain = domain[1] || domain[2] || false;
			var d = domain.split('.');
			switch(d.length) {
				case 2: return (d[0] + '.' + d[1]); break;
				case 3: return (d[1] + '.' + d[2]); break;
				case 4: return (d[2] + '.' + d[3]); break;
				case 5: return (d[3] + '.' + d[4]); break;
			}
		}
		return false;
	},


	/**
	 * add event listener for 'mouseover' & 'mouseout' events
	 */
	processLink: function processLink(anchor) {
		FS.Core.log('====> processed ' + anchor.href);
		anchor.addEventListener('mouseover', FS.Core.mouseOver, false);
		anchor.addEventListener('mouseout', FS.Core.mouseOut, false);
	},


	/**
	 * Extract the hash from the url, prepare the tooltip,
	 * and show the tooltip
	 */
	mouseOver: function mouseOver(evt) {
		/**
		 * If the source-code was:
		 * 		<a href=..> ~ </a>
		 * then a 'evt.target.href' would have worked. But, twitter
		 * had changed their stuff to:
		 * 		<a href=..> <b> ~ </b> </a>
		 * so I had to change that to: evt.target.parentNode.href
		 */
		var url = evt.target.parentNode.href;
		if (typeof(url) !== 'undefined') {
			var hash = FS.Core.extractHash(url);
			FS.Core.log('mouseOver ' + hash);
			FS.Tooltip.show(evt.target.parentNode);
			FS.Core.getHashNews(hash, evt);			// get news links on hash
		}
	},


	/**
	 * Hide the tooltip
	 */
	mouseOut: function mouseOut(evt) {
		/**
		 * If the source-code was:
		 * 		<a href=..> ~ </a>
		 * then a 'evt.target.href' would have worked. But, twitter
		 * had changed their stuff to:
		 * 		<a href=..> <b> ~ </b> </a>
		 * so I had to change that to: evt.target.parentNode.href
		 */
		var url = evt.target.parentNode.href;
		if (typeof(url) !== 'undefined') {
			var hash = FS.Core.extractHash(url);
			FS.Core.log('mouseout ' + hash);
		}
		FS.Tooltip.hide();
	},


	/**
	 * substring extract of hash from the url
	 */
	extractHash: function extractHash(url) {
		/**
		 * Currently the link is in this format:
		 *		https://twitter.com/search?q=%23<HASHKEY>&src=hash
		 */
		var prefix = 'https://twitter.com/search?q=%23';
		var hash_with_extra = url.substring(prefix.length);
		var hash = hash_with_extra.substring(hash_with_extra.length - 9, 0);
		return hash;
	},


	/**
	 * If the 'already prepared' tooltip is available in cache then 
	 * show it (using toggle); if not, then request for a faroo search
	 * result
	 */
	getHashNews: function getHashNews(hash, evt) {
		FS.Core.log('Hash: ' + hash);

		var link = FS.Cache.get(hash);
		FS.Core.log('link: ' + link);
		if (link !== false) {
			if (typeof(evt) !== 'undefined')
				FS.Tooltip.toggle(link, evt);
			return;
		}

		if (typeof(evt) !== 'undefined')
			FS.Tooltip.toggle('<img style="vertical-align: middle;" src="' +
				FS.Core.loading_img_src + '" alt="" />&nbsp;&nbsp;Retreiving', evt);

		if (FS.Queue.set(hash)) {
			FS.Core.log('Queueing: ' + hash);
			FS.Core.requestHashNews(hash);
		}
	},


	/**
	 * Do the search for the given hash using AJAX calls & display the result
	 */
	requestHashNews: function requestHashNews(hash) {
		FS.Core.log('Hash: ' + hash);

		FS.AJAX.request( {
			url: FS.API.searchurl(hash),
			onError: function onError(status, statusText) {
				FS.Core.log('Error on news URL: ' + status + ' ' + statusText);
				FS.Core.log('Status type' + typeof(status));
				if (status == 401) {
					var popup = FS.Tooltip.invalidAPIKey();
					FS.Core.log('Invalid API Key!');
					FS.Cache.set(hash, popup);				// set the cache with this tooltip
					FS.Tooltip.toggle(FS.Cache.get(hash));	// show the tooltip.
				}
			},
			onSuccess: function onSuccess(responseText) {
				FS.Core.log('received: ' + responseText);
				var data = null;
				try {
					data = FS.Utils.fromJSON(responseText);
				} catch (e) {
					FS.Core.log("Error in converting to JSON!");
					FS.Core.log(e);
					return;
				}

				if (data) {
					try {
						if (typeof(data.results) !== 'undefined') {
							var results = data.results;
							var len = results.length;
							FS.Core.log('length: ' + len.toString());

							var popup = '';
							if (len > 0) {
								var title;
								var domain;
								var url;
								for (var i = 0; i < len; i++) {
									if (typeof(results[i].title) !== 'undefined') {
										/**
										 * Current structure of th response is:
										 * 		json { "results" : [
										 *					{"title": "..", "domain": "..", "url": "..", ...},
										 *					{"title": "..", "domain": "..", "url": "..", ...},
										 *					... ],
										 *				"count" : .., "length": .., ... }
										 *
										 * For further details check: http://www.faroo.com/hp/api/api.html
										 */
										title = results[i]['title'];
										domain = results[i]['domain'];
										url = results[i]['url'];
										FS.Core.log(domain + ' ---> ' + title);
										popup = popup + FS.Tooltip.generate(domain, title, url);
										if ((i + 1) != len)
											popup = popup + FS.Tooltip.seperator();
									}
								}
							} else {
								// Faroo search did not result in any data
								popup = FS.Tooltip.noData();
							}

							popup = FS.Tooltip.searchterm(hash) + popup + FS.Tooltip.signature();
							FS.Cache.set(hash, popup);					// set the cache with this tooltip
							FS.Tooltip.toggle(FS.Cache.get(hash));		// show the tooltip.
						}
					} catch (e) {
						FS.Core.log("Invalid JSON!");
						FS.Core.log(e);
						return;
					}
				}
			}
		} );
	}
};


/**
 * Listen to the 'load' event! Simple, yeah? :)
 */
window.addEventListener("load", FS.Core.init, false);
