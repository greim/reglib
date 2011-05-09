# Reglib

Reglib is a lightweight, standalone event delegation library, specializing in *root-level event delegation*. Reglib depends on no other libraries.

## What is Root-Level Event Delegation?

Event delegation is the technique of handling all events at an ancestor DOM node, rather than binding multiple events directly to elements. This is possible because most events propagate, or "bubble," up the DOM tree toward the root of the document.

### Traditional Event Handling

    <div>
     |
     +--<a class="foo"> <-- handler bound here, listens for clicks
     |
     +--<a class="foo"> <-- handler bound here, listens for clicks
     |
     `--<a class="foo"> <-- handler bound here, listens for clicks

### Event Delegation

    <div> <-- meta-handler bound here, listens for clicks originating from a.foo
     |
     +--<a class="foo">
     |
     +--<a class="foo">
     |
     `--<a class="foo">

### Root-Level Event Delegation

    <html> <-- meta-handler bound here, listens for clicks originating from
     |         elements matching an entry in table of selectors
     `--<body>
         |
         `--<div>
             |
             +--<a class="foo">
             |
             +--<a class="foo">
             |
             `--<a class="foo">

*Root-level* event delegation is when the handler is bound to the ultimate
ancestor node—the root—effectively giving it visibility to all events on the
page, over the lifetime of the page. This has a number of benefits:

 * Avoids the CPU spike of querying and wiring up lots of events at load time.
 * Avoids the need to reattach events when parts of the DOM are added or overwritten.
 * Avoids the FOUC (flash of un-behaviored content) before the page load/ready event fires, when events haven't been wired up yet.
 * Avoids the memory footprint of adding the same event to potentially thousands of elements.

For perspective, reglib events will be unaffected by the following bit of code:

    document.body.innerHTML += '';

## Reglib Feature Hilights

### Simple, Declarative API

    REGLIB.click('a.popup', function(e){
        window.open(this.href);
        return false;
    });

The above statement acts as a declaration that remains in effect for the
lifetime of the page, even if popup links are continually being added and
removed, just as this:

    a.popup {
        color:green;
    }

...remains in effect for the lifetime of the page even if popup links are
continually being added and removed.

### Selector/Argument Correspondence

Items in your selector correspond to arguments passed to your handler function.
This is a natural way to initialize useful variables:

    REGLIB.click('div.foo > span.bar + a@href', function(event, fooDiv, barSpan, link){
        // event is always the first argument passed
        // pattern matches are passed to the handler function as arguments
        // actual matched element is always last argument passed
        // alternatively, actual matched element can be referenced as 'this'
    });

### Handle events on parents

These work:

    REGLIB.focus('div.foo', function(){...});
    REGLIB.submit('div.bar', function(){...});

As long as `div.foo` contains a focusable element, or `div.bar` contains a form, these events handlers will work, however to operate on the focusable element or form, you'll need to reference the event target.

### Mouse Enter/Leave and Focus Enter/Leave Behavior

Reglib fires mouseover, mouseout, focus and blur handlers only at times that are
interesting and useful to your program. For example, if you handle mouseover
events on <code>"div#foo"</code>, reglib assumes you don't want to also handle
mouseover events for every descendant of <code>"div#foo"</code>. Likewise with
mouseout, focus and blur.

## Documentation/How-to

Most reglib methods follow this pattern:

    REGLIB.<event>(<selector>, <callback>);

### event

The name of the method corresponds to the type of event being handled. Most reglib events methods map directly to native browser event types. Some, however, are convenience methods, such as `up` and `down`, which handle keyboard up and down arrow key events.

### selector

Unlike many libraries, the selector string does NOT cause a set of matching elements to be returned. Rather, this selector acts as a filter, or a pattern match, against the event targets as they bubble up the DOM, selecting only those that need to be handled.

Reglib selector syntax differs from standard CSS selectors in one significant way. Whereas CSS selectors look like this:

    a[href]
    a[href=foo]

Reglib selectors look like this:

    a@href
    a@href="foo"

...where quotation marks are mandatory.

Reglib selectors don't support as wide an array of features as jQuery selectors. Reglib selectors support class and id selection via `.` and `#`, and also these operators: `+ ~ >` Within attributes, reglib supports these matching operators: `= != ^= $= ~=`

Pseudo classes like `:first-child` or `:focus` are not supported at this time, but may be in a future release.

### callback

The callback function is executed when the event fires. The first argument passed to the callback is always the event object.

Subsequent arguments are always one or more DOM elements. The identity and amount of these elements depends on the contents of the DOM selector. For example if the DOM selector is `"div > span + a"`, then the next three arguments will be div, span, and anchor elements, repsectively.

If the selector is a comma-separated list of selectors, the element parameters will correspond to the first matched selector. For this reason, using named parameters in conjunction with comma-separated selectors is discouraged.

Alternatively, the `this` variable within the callback function always refers to the matched element. For example given the above selector, `this` would refer to the anchor element.

Finally, returning `false` from the callback function will prevent the default behavior form occuring. Unlike jQuery, returning `false` necessarily does not and cannot stop the event from propagating, since with root-level event delegation, event handling happens after propagation has already finished.

### Core events

    REGLIB.click(selector, callback)
    REGLIB.doubleclick(selector, callback)
    REGLIB.mousedown(selector, callback)
    REGLIB.mouseup(selector, callback)
    REGLIB.mouseenter(selector, callback) // only fires when mouse first enters element
    REGLIB.mouseleave(selector, callback) // only fires when mouse finally leaves element
    REGLIB.focus(selector, callback) // only fires when focus first enters element
    REGLIB.blur(selector, callback) // only fires when focus finally leaves element
    REGLIB.keydown(selector, callback)
    REGLIB.keypress(selector, callback)
    REGLIB.keyup(selector, callback)
    REGLIB.submit(selector, callback)
    REGLIB.reset(selector, callback)
    REGLIB.change(selector, callback)
    REGLIB.select(selector, callback)

### Convenience events

    REGLIB.hover(selector, enterCallback, leaveCallback)
    REGLIB.esc(selector, callback)
    REGLIB.up(selector, callback)
    REGLIB.right(selector, callback)
    REGLIB.down(selector, callback)
    REGLIB.left(selector, callback)
    REGLIB.enter(selector, callback)

### Generic delegate method for handling multiple events

    // events = space-separated list of any events listed above
    REGLIB.delegate(events, selector, callback)

This can simplify certain coding tasks. For example:

    REGLIB.delegate('focus mouseenter', 'form a.help', function(){...});

...as opposed to:

    function showHelp(){...}
    REGLIB.focus('form a.help', showHelp);
    REGLIB.mouseenter('form a.help', showHelp);

## Version 2.0 versus 1.0

Reglib has been around for a while, however version 2.0 is a major compatibility break from 1.0. Since JQuery and other libraries already provide a great set of general-purpose tools, reglib 2.0 has been stripped down and only does event delegation.

Reglib version 1.0 remains available here: http://code.google.com/p/reglib/

