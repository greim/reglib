(function($){

	describe('reglib.js', function () {
		describe('selector constructor', function () {
			var badSels = ['foo[','foo < bar','foo - bar','foo/bar','foo..bar',
			'foo# bar','foo.','a >> b','a +~ b','a ,, b','a,',',a','a+','b,>a',
			'b@foo=bar','b@foo="bar\'','b@foo=\'bar"','b@foo="bar\\"','',
			'div+b~="bar"'];
			for (var i=0; i<badSels.length; i++) {
				it('should throw error on "'+badSels[i]+'"', function() {
					try{
						var s = new $.Selector(badSels[i]);
						expect(false).toEqual(true);
					} catch(ex) {
						expect(true).toEqual(true);
					}
				});
			}
		});

		describe('selector matching', function () {
			var selectors = {
			'em':{html:'<em></em>'},
			'div.c':{html:'<div class="c"></div>'},
			'div.c1.c2':{html:'<div class="c1 c2"></div>'},
			'div#i':{html:'<div id="i"></div>'},
			'#i':{html:'<span id="i"></div>'},
			'.c':{html:'<span class="c"></div>'},
			'div#i.c':{html:'<div id="i" class="c"></div>'},
			'div@title.c':{html:'<div id="i" class="c" title="foo"></div>'},
			'div@title="foo"':{html:'<div id="i" class="c" title="foo"></div>'},
			"div@title='foo'":{html:'<div id="i" class="c" title="foo"></div>'},
			"div@title = 'foo'":{html:'<div id="i" class="c" title="foo"></div>'},
			"div@title= 'foo'":{html:'<div id="i" class="c" title="foo"></div>'},
			"div@title ='foo'":{html:'<div id="i" class="c" title="foo"></div>'},
			"div.c@title^='foo'":{html:'<div id="i" class="c" title="food"></div>'},
			"div.c@title*='foo'":{html:'<div id="i" class="c" title="sfoos"></div>'},
			"div.c@title$='foo'":{html:'<div id="i" class="c" title="dfoo"></div>'},
			".c@title~='foo'":{html:'<div id="i" class="c" title="bar foo baz"></div>'},
			".c@title|='en'":{html:'<div id="i" class="c" title="en-us"></div>'},
			".c@title~='foo'@title~='bar'":{html:'<div id="i" class="c" title="foo bar baz"></div>'},
			'div.c div.c':{html:'<div class="c"><div><div class="c"></div></div></div>',getter:function(el){return el.getElementsByTagName('div')[1];}},
			'div.c > div.c':{html:'<div class="c"><div class="c"></div></div>',getter:function(el){return el.getElementsByTagName('div')[0];}},
			'div.c + div.c':{html:'<div><div class="c"></div><div class="c"></div></div>',getter:function(el){return el.getElementsByTagName('div')[1];}},
			'div.c ~ div.c':{html:'<div><div class="c"></div><span></span><div class="c"></div></div>',getter:function(el){return el.getElementsByTagName('div')[1];}},
			'div.c *':{html:'<div class="c"><em></em></div>',getter:function(el){return el.getElementsByTagName('em')[0];}},
			'div.c1 , div.c2 , div.c3':{html:'<div class="c1"></div>'},
			'div.c1, div.c2, div.c3':{html:'<div class="c2"></div>'},
			'div.c1,div.c2,div.c3':{html:'<div class="c3"></div>'},
			'div@title':{html:'<div title=""></div>'},
			'div@class*="foo"':{html:'<div class="xfoox"></div>'},
			'div@id^="foo"':{html:'<div id="footer"></div>'},
			'label@for="foo"':{html:'<label for="foo">x</label>'},
			'div.c1 + div.c2 > div.c3 + div.c4 span.c5@title="foo"':{html:'<div><div class="c1"></div><div class="c2"><div class="c3"></div><div class="c4"><em><span class="c5" title="foo"></span></em></div></div></div>',getter:function(el){return el.getElementsByTagName('span')[0];}},
			'div.c #i':{html:'<div class="c"><em><span id="i"></span></em></div>',getter:function(el){return el.getElementsByTagName('span')[0];}},
			'div#i .c':{html:'<div id="i"><em><span class="c"></span></em></div>',getter:function(el){return el.getElementsByTagName('span')[0];}},
			'div.c @title':{html:'<div class="c"><em title=""></em></div>',getter:function(el){return el.getElementsByTagName('em')[0];}},
			'div@title      .c':{html:'<div title="foo"><a class="c d"></a></div>',getter:function(el){return el.getElementsByTagName('a')[0];}},
			'div#i @title':{html:'<div id="i"><a title="foo"><a></div>',getter:function(el){return el.getElementsByTagName('a')[0];}},
			'div@title      #i':{html:'<div title="foo"><strong id="i"></strong></div>',getter:function(el){return el.getElementsByTagName('strong')[0];}},
			'a.c@href="foo.html"':{html:'<a class="c" href="foo.html">sdf</a>'}
			};

			for (var sel in selectors) {
				(function(selector){
					it ('should correctly match "'+selector+'"', function(){
						var s = new $.Selector(selector);
						var wrap = document.createElement('div');
						wrap.innerHTML = selectors[selector].html;
						var elToTest = selectors[selector].getter ? selectors[selector].getter(wrap.firstChild) : wrap.firstChild;
						expect(!!s.match(elToTest)).toEqual(true);
					});
				})(sel);
			}
		});

		describe('selector matching results', function () {
			it('should return an array of elements upon successful match', function(){
				var s = new $.Selector('div.foo + span#bar > em');
				var wrap = document.createElement('div');
				wrap.innerHTML = '<div class="foo">sadf</div> <span id="bar"><em>sdfs</em> sadf</span>';
				var elToTest = wrap.getElementsByTagName('em')[0];
				var results = s.match(elToTest);
				expect(results).toBeTruthy();
				expect(results instanceof Array).toEqual(true);
				expect(results.length).toEqual(3);
				expect(results[0].nodeName.toLowerCase()).toEqual('div');
				expect(results[0].className).toEqual('foo');
				expect(results[1].nodeName.toLowerCase()).toEqual('span');
				expect(results[1].id).toEqual('bar');
				expect(results[2].nodeName.toLowerCase()).toEqual('em');
			});
			it('should return null upon unsuccessful match', function(){
				var s = new $.Selector('div.foo + span#bar > em');
				var wrap = document.createElement('div');
				wrap.innerHTML = '<div class="foo">sadf</div> <span id="bar"><span>sdfs</span> sadf</span>';
				var elToTest = wrap.getElementsByTagName('span')[0];
				var results = s.match(elToTest);
				expect(results).toBeFalsy();
				expect(results).toBeNull();
			});
			it('should not throw an error if element being matched is null or undefined', function(){
				var s = new $.Selector('div');
				var results = s.match(null);
				expect(results).toBeFalsy();
				expect(results).toBeNull();
				var results = s.match(undefined);
				expect(results).toBeFalsy();
				expect(results).toBeNull();
				var results = s.match();
				expect(results).toBeFalsy();
				expect(results).toBeNull();
			});
		});
	});
})(REGLIB);

