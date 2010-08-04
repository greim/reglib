# Reglib

Reglib is a lightweight, standalone event delegation library, specializing in
*root-level event delegation*. Reglib is fully independent of other libraries
and can be used alongside them without problems.

## What is Root-Level Event Delegation?

Event delegation is the technique of delegating the job of event handling to a
single meta-handler attached to an ancestor DOM node, rather than attaching
multiple versions of the same handler to a bunch of similar elements.

*Root-level* event delegation is when this meta-handler is attached the the
ultimate ancestor node—the root—effectively giving it visibility to all events
on the page, over the lifetime of the page. This has a number of benefits:

 * Avoids the CPU spike associated with querying and wiring up lots of events at load time.
 * Avoids the need to re-query and re-wire when large swaths of DOM are replaced by ajax output or innerHTML.
 * Avoids "dead time" before the page load event fires, when events haven't been wired up yet.
 * Avoids the memory footprint of having separate versions of the same handler attached to lots of elements.

## Reglib Feature Hilights

### RegExp-Like Selectors

Reglib's DOM selectors behave less like SQL queries and more like regular
expressions. In other words, instead of using a selector to search and return a
list of elements, a selector pattern-matches against an element you pass to it.
It functions similar to JavaScript's <code>String.match()</code> method. If
there's no match it returns null, but if there's a match it returns an array:

    var selector = new REGLIB.Selector('div.foo > span.bar + a@href');
    var match = selector.match(someElement);
    if (match) {
        // match === [<div class="foo"/>, <span class="bar"/>, <a href="..."/>]
    }

### Matching Elements are Passed as Args to Your Handler

You're free to use selectors in the way described above, however reglib takes
full advantage of this functionality in its event delegation API, providing a
natural way to initialize useful variables:

    REGLIB.click('div.foo > span.bar + a@href', function(event, fooDiv, barSpan, link){
        // event is always the first argument passed
        // pattern matches are passed to the handler function as arguments
        // actual matched element is always last argument passed
        // alternatively, actual matched element can be referenced as 'this'
    });

### MouseEnter/MouseLeave and FocusEnter/FocusLeave

Reglib fires mouseover, mouseout, focus and blur handlers only at times that are
interesting and useful to your program. For example, if you handle mouseover
events on <code>"div#foo"</code>, reglib assumes you don't also want to handle
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

