# Reglib

Reglib is a lightweight, standalone event delegation library, specializing in
*root-level event delegation*. Reglib is fully independent of other libraries
and can be used alongside them without problems.

## What is Root-Level Event Delegation?

Event delegation is the technique of delegating the job of event handling to a
single meta-handler attached to an ancestor DOM node, rather than attaching
multiple instances of the same handler directly to elements. This is possible
because most events propagate, or "bubble," up the ancestor hierarchy toward the
root of the document.

### Traditional Event Handling

    <div>
     |
     +--<a> <-- handler attached here
     |
     +--<a> <-- handler attached here
     |
     +--<a> <-- handler attached here

### Event Delegation

    <div> <-- meta-handler attached here
     |
     +--<a>
     |
     +--<a>
     |
     +--<a>

### Root-Level Event Delegation

    <html> <-- meta-handler attached here
     |
     +--<body>
         |
         +--<div>
             |
             +--<a>
             |
             +--<a>
             |
             +--<a>

*Root-level* event delegation is when this meta-handler is attached the the
ultimate ancestor node—the root—effectively giving it visibility to all events
on the page, over the lifetime of the page. This has a number of benefits:

 * Avoids the CPU spike associated with querying and wiring up lots of events at load time.
 * Avoids the need to re-query and re-wire when large swaths of DOM are replaced by ajax output or innerHTML.
 * Avoids "dead time" before the page load event fires, when events haven't been wired up yet.
 * Avoids the memory footprint of having separate versions of the same handler attached to lots of elements.

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

### Matching Elements are Passed as Args to Your Handler

Items in your selector correspond to arguments passed to your handler function.
This is a natural way to initialize useful variables:

    REGLIB.click('div.foo > span.bar + a@href', function(event, fooDiv, barSpan, link){
        // event is always the first argument passed
        // pattern matches are passed to the handler function as arguments
        // actual matched element is always last argument passed
        // alternatively, actual matched element can be referenced as 'this'
    });

### Mouse Enter/Leave and Focus Enter/Leave Behavior

Reglib fires mouseover, mouseout, focus and blur handlers only at times that are
interesting and useful to your program. For example, if you handle mouseover
events on <code>"div#foo"</code>, reglib assumes you don't want to also handle
mouseover events for every child of <code>"div#foo"</code>. Likewise with
mouseout, focus and blur.

## Version 2.0

Reglib is currently in its 2.0 incarnation. Since JQuery and other libraries
already provide a great set of general-purpose tools, reglib 2.0 has been
distilled down from being a general-purpose library to only focusing on event
delegation. Reglib is intended to run alongside and play well with other
libraries.

## Version 1.0

Version 1.0 is still available here: http://code.google.com/p/reglib/

