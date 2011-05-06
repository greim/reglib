/*
reglib version 2.0
stripped down, souped up event delegation
Copyright 2010
Released under MIT license
http://github.com/greim/reglib
*/

window.REGLIB = (function(){

var $ = {};
var docEl = document.documentElement;

// #############################################################################
// #### SELECTORS ##############################################################
// #############################################################################

var Selector = $.Selector = (function(){

	// PRIVATE STUFF ###########################################################

	function matchIt(el, tagSpec) {

		// check existence
		if (!el || el.nodeType !== 1) { return false; }

		// check tag name
		if (el.nodeName.toLowerCase() !== tagSpec.tagName && tagSpec.tagName !== '*') {
			return false;
		}

		// check class names
		if (tagSpec.classNames) {
			 for (var i=0; i<tagSpec.classNames.length; i++) {
				if (!hcn(el, tagSpec.classNames[i])) {
					return false;
				}
			}
		}

		// check id
		if (tagSpec.id && el.id !== tagSpec.id) { return false; }

		// check other attributes
		if (tagSpec.attributes) {
			for (var i=0; i<tagSpec.attributes.length; i++) {
				var attSpec = tagSpec.attributes[i];

				// check existence of attribute
				if (el.hasAttribute !== undefined) {
					if (!el.hasAttribute(attSpec.name)) { return false; }
					var att = el.getAttribute(attSpec.name);
				}else{
					var att = el.getAttribute(attSpec.name,2);//ie6/7 returns fully resolved href but ,2 fixes that
					if(attSpec.name==='class'){att=el.className;}//todo:remove this line
					else if(attSpec.name==='for'){att=el.htmlFor;}//todo:and this one
					if(!att){return false;}
				}

				// check contents of attribute
				if (attSpec.value) {
					if (attSpec.matchType==='^='){ // begins with
						if (att.indexOf(attSpec.value)!==0){return false;}
					} else if (attSpec.matchType==='*='){ // contains
						if (att.indexOf(attSpec.value)===-1){return false;}
					} else if (attSpec.matchType==='$='){ // ends with
						var indOf = att.indexOf(attSpec.value);
						if (indOf===-1||indOf!==att.length-attSpec.value.length){return false;}
					} else if (attSpec.matchType==='='){ // equals
						if (att!==attSpec.value){return false;}
					} else if (attSpec.valuePatt){ // regexp test
						if (!attSpec.valuePatt.test(att)){return false;}
					}else{
						if(!attSpec.matchType){throw new Error("did not find a matchType");}
						else{throw new Error(attSpec.matchType+" is an invalid matchType");}
					}
				}
			}
		}
		return true;
	}

	// precompiled patterns
	var exp = {
		leadSpace:  /^\s+/,
		tagName:    /^([a-z_][a-z0-9_-]*)/i,
		wildCard:   /^\*([^=]|$)/,
		className:  /^(\.([a-z0-9_-]+))/i,
		id:         /^(#([a-z0-9_-]+))/i,
		att:        /^(@([a-z0-9_-]+))/i,
		matchType:  /(^\^=)|(^\$=)|(^\*=)|(^~=)|(^\|=)|(^=)/,
		spaceQuote: new RegExp("^\\s+['\"]")
	};

	function last(arr) { return arr[arr.length-1]; }

	// SELECTOR OBJECT #########################################################

	// constructor is passed a selector
	var S = function(selString) {
		this.selectors = [];
		var tagSpecs = [];
		var count = 0;
		var origSel = selString;
		var lastTag = false;
		while (selString.length>0) {

			// prevent infinite loop scenario
			if (count++ > 1000) { throw new Error("failed parsing '"+origSel+"' stuck at '"+selString+"'"); }

			// chop off leading space
			var leadSpaceChopped = false;
			if (exp.leadSpace.test(selString)) {
				selString=selString.replace(exp.leadSpace,'');
				leadSpaceChopped = true;
			}

			// find tag name
			var tagNameMatch = exp.tagName.exec(selString);
			if (tagNameMatch) {
				if (tagSpecs.length > 0 && last(tagSpecs).name==='tag') { tagSpecs.push({name:'descendant'}); }
				tagSpecs.push({name:'tag',tagName:tagNameMatch[1].toLowerCase()});
				selString=selString.substring(tagNameMatch[1].length);
				tagNameMatch=null;
				continue;
			}
			// wildcard selector
			if (exp.wildCard.test(selString)) {
				if (tagSpecs.length > 0 && last(tagSpecs).name==='tag') { tagSpecs.push({name:'descendant'}); }
				tagSpecs.push({name:'tag',tagName:'*'});
				selString = selString.substring(1);
				continue;
			}
			var classMatch = exp.className.exec(selString);
			var idMatch = exp.id.exec(selString);
			var attMatch = exp.att.exec(selString);
			if (classMatch || idMatch || attMatch) {
				// declare descendant if necessary
				if (leadSpaceChopped && tagSpecs.length>0 && last(tagSpecs).name==='tag') { tagSpecs.push({name:'descendant'}); }
				// create a tag wildcard * if necessary
				if (tagSpecs.length===0 || last(tagSpecs).name!=='tag') { tagSpecs.push({name:'tag',tagName:'*'}); }
				lastTag = last(tagSpecs);
				// find class name, like .entry
				if (classMatch) {
					if (!lastTag.classNames) {
						lastTag.classNames = [classMatch[2]];
					} else {
						lastTag.classNames.push(classMatch[2]);
					}
					selString=selString.substring(classMatch[1].length);
					classMatch=null;
					continue;
				}
				// find id, like #content
				if (idMatch) {
					lastTag.id=idMatch[2];
					selString=selString.substring(idMatch[1].length);
					idMatch=null;
					continue;
				}
				// find attribute selector, like @src
				if (attMatch) {
					if (!lastTag.attributes) {
						lastTag.attributes = [{name:attMatch[2]}];
					} else {
						lastTag.attributes.push({name:attMatch[2]});
					}
					selString=selString.substring(attMatch[1].length);
					attMatch=null;
					continue;
				}
			}
			// find attribute value specifier
			var mTypeMatch=exp.matchType.exec(selString);
			if (mTypeMatch) {
				// this will determine how the matching is done
				// (lastTag should still be hanging around)
				if(lastTag && lastTag.attributes && !lastTag.attributes[lastTag.attributes.length-1].value){

					var lastAttribute = lastTag.attributes[lastTag.attributes.length-1];
					lastAttribute.matchType = mTypeMatch[0];

					selString=selString.substring(lastAttribute.matchType.length);
					if(selString.charAt(0)!=='"'&&selString.charAt(0)!=="'"){
						if(exp.spaceQuote.test(selString)){selString=selString.replace(exp.leadSpace,'');}
						else{throw new Error(origSel+" is invalid, single or double quotes required around attribute values");}
					}
					// it is enclosed in quotes, end is closing quote
					var q=selString.charAt(0);
					var lastQInd=selString.indexOf(q,1);
					if(lastQInd===-1){throw new Error(origSel+" is invalid, missing closing quote");}
					while(selString.charAt(lastQInd-1)==='\\'){
						lastQInd=selString.indexOf(q,lastQInd+1);
						if(lastQInd===-1){throw new Error(origSel+" is invalid, missing closing quote");}
					}
					lastAttribute.value=selString.substring(1,lastQInd);
					if      ('~=' === lastAttribute.matchType) { lastAttribute.valuePatt = new RegExp("(^|\\s)"+lastAttribute.value+"($|\\s)"); }
					else if ('|=' === lastAttribute.matchType) { lastAttribute.valuePatt = new RegExp("^"+lastAttribute.value+"($|\\-)"); }
					selString=selString.substring(lastAttribute.value.length+2);// +2 for the quotes
					continue;
				} else {
					throw new Error(origSel+" is invalid, "+mTypeMatch[0]+" appeared without preceding attribute identifier");
				}
				mTypeMatch=null;
			}
			// find child selector
			if (selString.charAt(0) === '>') {
				tagSpecs.push({name:'child'});
				selString=selString.substring(1);
				continue;
			}
			// find next sibling selector
			if (selString.charAt(0) === '+') {
				tagSpecs.push({name:'nextSib'});
				selString=selString.substring(1);
				continue;
			}
			// find after sibling selector
			if (selString.charAt(0) === '~') {
				tagSpecs.push({name:'followingSib'});
				selString=selString.substring(1);
				continue;
			}
			// find the comma separator
			if (selString.charAt(0) === ',') {
				this.selectors.push(tagSpecs);
				tagSpecs = [];
				selString = selString.substring(1);
				continue;
			}
		}
		this.selectors.push(tagSpecs);
		this.selectorString=origSel;
		// do some structural validation
		for (var a=0;a<this.selectors.length;a++){
			var tagSpecs = this.selectors[a];
			if (tagSpecs.length===0) { throw new Error("illegal structure: '"+origSel+"' contains an empty set"); }
			if (tagSpecs[0].name!=='tag') { throw new Error("illegal structure: '"+origSel+"' contains a dangling relation"); }
			if (last(tagSpecs).name!=='tag') { throw new Error("illegal structure: '"+origSel+"' contains a dangling relation"); }
			for(var b=1;b<tagSpecs.length;b++){
				if(tagSpecs[b].name!=='tag'&&tagSpecs[b-1].name!=='tag'){ throw new Error("illegal structure: '"+origSel+"' contains doubled up relations"); }
			}
		}
	};

	// test an element against this selector
	// return an array of matched elements, or false
	var tempMatches = [];
	S.prototype.match = function(el) {
		if (el && el.nodeType === 1) {
			commas:for (var a=0;a<this.selectors.length;a++) { // for each comma-separated selector
				tempMatches.length = 0;
				var tempEl = el;
				var tagSpecs = this.selectors[a];
				for (var b=tagSpecs.length-1; b>=0; b--) { // loop backwards through the selectors
					var tagSpec = tagSpecs[b];
					if (tagSpec.name === 'tag') {
						if (!matchIt(tempEl, tagSpec)) {
							// these relational selectors require more extensive searching
							if (tempEl && b < tagSpecs.length-1 && tagSpecs[b+1].name==='descendant') { tempEl=tempEl.parentNode; b++; continue; }
							else if (tempEl && b < tagSpecs.length-1 && tagSpecs[b+1].name==='followingSib') { tempEl=tempEl.previousSibling; b++; continue; }
							else { continue commas; } // fail this one
						} else {
							tempMatches.unshift(tempEl);
						}
					}
					else if (tagSpec.name === 'nextSib') { tempEl = prev(tempEl); }
					else if (tagSpec.name === 'followingSib') { tempEl = prev(tempEl); }
					else if (tagSpec.name === 'child') { tempEl = tempEl.parentNode; }
					else if (tagSpec.name === 'descendant') { tempEl = tempEl.parentNode; }
				}
				return tempMatches.slice();
			}
		}
		return null;
	};

	// EXPORT ##################################################################

	return S;

})();

// #############################################################################
// #### HELPERS ################################################################
// #############################################################################

// CONTAINS METHOD FOR NODES
if (window.Node && Node.prototype && !Node.prototype.contains) {
	Node.prototype.contains = function (arg) {
		try{return !!(this.compareDocumentPosition(arg) & 16);}
		catch(ex){return false;}
	}
}

// TEST FOR CLASS NAME
var clPatts={};// cache compiled classname regexps
function hcn(element, cName) {
	if (!clPatts[cName]) { clPatts[cName] = new RegExp("(^|\\s)"+cName+"($|\\s)"); }
	return element.className && clPatts[cName].test(element.className);
}

// GET PREVIOUS ELEMENT
function prev(el) {
	var prev = el.previousSibling;
	while(prev && prev.nodeType!=1){prev=prev.previousSibling;}
	return prev;
}

// #############################################################################
// #### EVENTS #################################################################
// #############################################################################

function normalizeEvent(e) {
	if (!e) { e = window.event; }
	if (!e.target) {
		if (e.srcElement) { e.target = e.srcElement; }
	}
	if (e.target.nodeType === 3) {
		e.target = e.target.parentNode; // safari hack
	}
	if (!e.relatedTarget) {
		if ('mouseover' === e.type) { e.relatedTarget = e.fromElement; }
		if ('mouseout' === e.type) { e.relatedTarget = e.toElement; }
	}
	if (e.preventDefault === undefined) {
		e.preventDefault = function() { this.returnValue=false; };
	}
	if (e.stopPropagation === undefined) {
		e.stopPropagation = function() { e.cancelBubble=true; };
	}
	if (e.metaKey === undefined && e.ctrlKey !== undefined) {
		e.metaKey = e.ctrlKey;
	}
	return e;
}

// event registry
var memEvents = {};
var aMemInd = 0;
function rememberEvent(elmt,evt,handle,cptr,cleanable){
	var memInd = aMemInd++;
	memEvents[memInd+""] = {
		element:   elmt,
		event:     evt,
		handler:   handle,
		capture:   !!cptr,
		cleanable: !!cleanable
	};
	return memInd;
}

// event remover
var removeEvent = $.removeEvent = function(memInd) {
	var key = memInd+"";
	var eo = memEvents[key];
	if (eo) {
		var el=eo.element;
		if(el.removeEventListener) {
			el.removeEventListener(eo.event, eo.handler, eo.capture);
			delete memEvents[key];
			return true;
		} else if(el.detachEvent) {
			el.detachEvent('on'+eo.event, eo.handler);
			delete memEvents[key];
			return true;
		}
	}
	return false;
}

// if "all" is true, it nukes all events
// otherwise only those created with "cleanable" flag
function cleanup(all){
	for (var key in memEvents) {
		if (!memEvents.hasOwnProperty(key)) { continue; }
		if (all || (memEvents[key].cleanable && !docEl.contains(memEvents[key].element))) {
			removeEvent(key);
		}
	}
}

//periodically clean up all cleanable events
window.setInterval(function(){cleanup(false);},10000);

// generic event adder, plus memory leak prevention
// returns an int mem that you can use to later remove that event removeEvent(mem)
// cptr defaults false
var addEvent = $.addEvent = function(elmt, evt, hdlr, cptr, cleanable) {
	if(elmt.addEventListener){
		var whdlr = function(e) { hdlr.call(elmt, normalizeEvent(e)); };
		elmt.addEventListener(evt, whdlr, cptr);
		return rememberEvent(elmt, evt, whdlr, cptr, cleanable);
	} else if (elmt.attachEvent) {
		var whdlr = function() { hdlr.call(elmt, normalizeEvent()); };
		elmt.attachEvent("on"+evt, whdlr);
		return rememberEvent(elmt, evt, whdlr, cptr, cleanable);
	}
}

// try to reduce memory leaks in ie
addEvent(window,'unload',function(){cleanup(true);});

// #############################################################################
// #### EVENT DELEGATION #######################################################
// #############################################################################

var clickHandlers = {};
var mDownHandlers = {};
var mUpHandlers = {};
var dblClickHandlers = {};
var mEnterHandlers = {};
var mLeaveHandlers = {};
var focusHandlers = {};
var blurHandlers = {};
var keyDownHandlers = {};
var keyPressHandlers = {};
var keyUpHandlers = {};
var submitHandlers = {};
var resetHandlers = {};
var changeHandlers = {};
var selectHandlers = {};

// register a handler function (from which reglib gets its name)
function register(selStr, handlerFunc, handlers, hoverFlag) {
	if (!handlerFunc) { return; }
	if(!handlers.hasOwnProperty(selStr)) {handlers[selStr]=[];}
	var selHandler = {
		selector:new Selector(selStr),
		handle:handlerFunc,
		hoverFlag:hoverFlag
	};
	handlers[selStr].push(selHandler);
}
$.delegate = function(eNames){
	var args = [];
	for (var i=1; i<arguments.length; i++){
		args.push(arguments[i]);
	}
	eNames = eNames.split(/\s+/g);
	for (var i=0; i<eNames.length; i++){
		try { $[eNames[i]].apply($,args); }
		catch(err){}
	}
};
$.click = function(selStr, func){
	register(selStr, func, clickHandlers, false);
};
$.doubleClick = function(selStr, func){
	register(selStr, func, dblClickHandlers, false);
};
$.mousedown = function(selStr, func){
	register(selStr, func, mDownHandlers, false);
};
$.mouseup = function(selStr, func){
	register(selStr, func, mUpHandlers, false);
};
$.mouseenter = function(selStr, func){
	register(selStr, func, mEnterHandlers, true);
};
$.mouseleave = function(selStr, func){
	register(selStr, func, mLeaveHandlers, true);
};
$.focus = function(selStr, func){
	register(selStr, func, focusHandlers, false);
};
$.blur = function(selStr, func){
	register(selStr, func, blurHandlers, false);
};
$.keydown = function(selStr, func){
	register(selStr, func, keyDownHandlers, false);
};
$.keypress = function(selStr, func){
	register(selStr, func, keyPressHandlers, false);
};
$.keyup = function(selStr, func){
	register(selStr, func, keyUpHandlers, false);
};
$.submit = function(selStr, func) {
	register(selStr, func, submitHandlers, false);
};
$.reset = function(selStr, func) {
	register(selStr, func, resetHandlers, false);
};
$.change = function(selStr, func) {
	register(selStr, func, changeHandlers, false);
};
$.select = function(selStr, func) {
	register(selStr, func, selectHandlers, false);
};

//convenience methods
$.hover = function(selStr, enterFunc, leaveFunc){
	register(selStr, enterFunc, mEnterHandlers, true);
	register(selStr, leaveFunc, mLeaveHandlers, true);
};
$.esc = function(selStr, func){
	register(selStr, function(e){
		if (e.keyCode === 27) {
			func.apply(this, arguments);
		}
	}, keyDownHandlers, false);
};
$.arrow = function(selStr, up, right, down, left){
	register(selStr, function(e){
		if (e.keyCode === 38) {
			up.apply(this, arguments);
		} else if (e.keyCode === 39) {
			right.apply(this, arguments);
		} else if (e.keyCode === 40) {
			down.apply(this, arguments);
		} else if (e.keyCode === 37) {
			left.apply(this, arguments);
		}
	}, keyDownHandlers, false);
};
$.up = function(selStr, func){
	register(selStr, function(e){
		if (e.keyCode === 38) { func.apply(this, arguments); }
	}, keyDownHandlers, false);
};
$.right = function(selStr, func){
	register(selStr, function(e){
		if (e.keyCode === 39) { func.apply(this, arguments); }
	}, keyDownHandlers, false);
};
$.down = function(selStr, func){
	register(selStr, function(e){
		if (e.keyCode === 40) { func.apply(this, arguments); }
	}, keyDownHandlers, false);
};
$.left = function(selStr, func){
	register(selStr, function(e){
		if (e.keyCode === 37) { func.apply(this, arguments); }
	}, keyDownHandlers, false);
};
$.enter = function(selStr, func){
	register(selStr, function(e){
		if (e.keyCode === 13) { func.apply(this, arguments); }
	}, keyPressHandlers, false);
};

// workaround for IE's lack of support for bubbling on form events
// set delegation directly on the element in question by co-opting
// the focus event which is guaranteed (?) to happen first
if (document.all && !window.opera) {
	function ieSubmitDelegate(e) {
		delegate(submitHandlers,e);
		e.stopPropagation();
	}
	function ieResetDelegate(e) {
		delegate(resetHandlers,e);
		e.stopPropagation();
	}
	function ieChangeDelegate(e) {
		delegate(changeHandlers,e);
		e.stopPropagation();
	}
	function ieSelectDelegate(e) {
		delegate(selectHandlers,e);
		e.stopPropagation();
	}
	focus('form',function(){
		removeEvent(this._submit_prep);
		this._submit_prep=addEvent(this,'submit',ieSubmitDelegate,false,true);
		removeEvent(this._reset_prep);
		this._reset_prep=addEvent(this,'reset',ieResetDelegate,false,true);
	},function(){
		removeEvent(this._submit_prep);
		removeEvent(this._reset_prep);
	});
	focus('select,input,textarea',function(){
		removeEvent(this._change_prep);
		this._change_prep=addEvent(this,'change',ieChangeDelegate,false,true);
	},function(){
		removeEvent(this._change_prep);
	});
	focus('input,textarea',function(){
		removeEvent(this._select_prep);
		this._select_prep=addEvent(this,'select',ieSelectDelegate,false,true);
	},function(){
		removeEvent(this._select_prep);
	});
}

function delegate(selectionHandlers, event) {
	if (selectionHandlers) {
		var execList = [];
		var targ = event.target;
		for (var sel in selectionHandlers) {
			if(!selectionHandlers.hasOwnProperty(sel)) { continue; }
			for(var a=0; a<selectionHandlers[sel].length; a++) {
				var selHandler=selectionHandlers[sel][a];
				var maxDepth = 1000;
				var el = targ;
				for (var b=-1; b<maxDepth && el && el.nodeType == 1; b++, el=el.parentNode) {
					var matches = selHandler.selector.match(el);
					if (matches) {
						// replicate *enter/leave
						if (event.type === 'mouseover' || event.type === 'mouseout') {
							var relTarg = event.relatedTarget;
							if (relTarg && (el.contains(relTarg) || el === relTarg)) {
								break;
							}
						} else if (event.type === 'focus') {
							if (el.contains(event.fromElement) || el === event.fromElement) {
								break;
							}
						} else if (event.type === 'blur') {
							if (el.contains(event.toElement) || el === event.toElement) {
								break;
							}
						}
						execList.push({"handle":selHandler.handle,"element":el,'matches':matches});
						break;
					}
				}
			}
		}
		for (var i=0; i<execList.length; i++) {
			var exec = execList[i];
			var args = exec.matches;
			args.unshift(event);
			var retVal=exec.handle.apply(exec.element, args);
			// if they return false from the handler, cancel default
			if(retVal !== undefined && !retVal) {
				event.preventDefault();
			}
		}
	}
}

var focusEventType = 'focus';
var blurEventType = 'blur';

if(typeof document.onactivate == 'object'){
	var focusEventType = 'activate';
	var blurEventType = 'deactivate';
}

// faux focus event detection to support focus enter/leave behavior
(function(){
	var activeEl = null, prevActiveEl = null;
	addEvent(docEl,blurEventType, function(e){ activeEl = null; },true);
	addEvent(docEl,focusEventType, function(e){ activeEl = e.target; },true);
	(function(){
		if (prevActiveEl !== activeEl) {
			if (prevActiveEl) {
				delegate(blurHandlers, normalizeEvent({
					target:prevActiveEl,
					type:'blur',
					toElement:activeEl
				}));
			}
			if (activeEl) {
				delegate(focusHandlers, normalizeEvent({
					target:activeEl,
					type:'focus',
					fromElement:prevActiveEl
				}));
			}
			prevActiveEl = activeEl;
		}
		window.setTimeout(arguments.callee, 20);
	})();
})();

// attach the events
addEvent(docEl,'click',        function(e){delegate(clickHandlers,   e);});
addEvent(docEl,'mousedown',    function(e){delegate(mDownHandlers,   e);});
addEvent(docEl,'mouseup',      function(e){delegate(mUpHandlers,     e);});
addEvent(docEl,'dblclick',     function(e){delegate(dblClickHandlers,e);});
addEvent(docEl,'keydown',      function(e){delegate(keyDownHandlers, e);});
addEvent(docEl,'keypress',     function(e){delegate(keyPressHandlers,e);});
addEvent(docEl,'keyup',        function(e){delegate(keyUpHandlers,   e);});
addEvent(docEl,'mouseover',    function(e){delegate(mEnterHandlers,   e);});
addEvent(docEl,'mouseout',     function(e){delegate(mLeaveHandlers,    e);});
addEvent(docEl,'submit',       function(e){delegate(submitHandlers,  e);});
addEvent(docEl,'reset',        function(e){delegate(resetHandlers,   e);});
addEvent(docEl,'change',       function(e){delegate(changeHandlers,  e);});
addEvent(docEl,'select',       function(e){delegate(selectHandlers,  e);});

// #############################################################################
// #### AND... DONE. ###########################################################
// #############################################################################

return $;

})();

