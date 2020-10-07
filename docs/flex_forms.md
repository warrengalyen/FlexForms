FlexForms Class:
================

FlexForms is a powerful HTML forms generator/builder class to output HTML forms from Javascript using a natural JSON-style arrays approach.

This class also self-includes an auto-merged FlexForms.Designer class.

Example usage:

```html
<script type="text/javascript" src="flexforms/flex_forms.js"></script>

<script type="text/javascript">
(function() {
	var options = {
		fields: [
			'startrow',
			{
				title: 'First Name',
				width: '19em',
				type: 'text',
				name: 'first_name',
				default: 'Joe'
			},
			{
				title: 'Last Name',
				width: '18em',
				type: 'text',
				name: 'last_name',
				default: 'Smith'
			},
			'endrow',
			{
				title: 'Test Multiselect',
				width: '38em',
				type: 'select',
				multiple: true,
				name: 'test_select',
				options: [
					{ name: 'Test 1', value: 'Test 1' },
					{ name: 'Test 2', value: 'Test 2' },
					{ name: 'Test 3', value: 'Test 3' },
				],
				default: { 'Test 1': true, 'Test 3': true }
			}
		],
		submit: ['OK', 'Cancel'],
		submitname: 'test_submit'
	};

	var formWrap = FlexForms.Generate(document.body, options);
	var formNode = formwrap.querySelector('form');

	var SubmitHandler = function(e) {
		if (!e.isTrusted)  return;

		e.preventDefault();

		var formVars = FlexForms.GetFormVars(formNode, e);

console.log(formVars);
	};

	formNode.addEventListener('submit', SubmitHandler);
})();
</script>
```

FlexForms.addEventListener(eventName, callback)
-----------------------------------------------

Category:  Events

Parameters:

* eventName - A string containing a name of a FlexForms event to listen to.
* callback - A function to call when the event fires.

Returns:  Nothing.

This function presents a familiar function for registering for custom events emitted by FlexForms.

Known events:

* done - Requested CSS and Javascript items have been loaded.

FlexForms.removeEventListener(eventName, callback)
--------------------------------------------------

Category:  Events

Parameters:

* eventName - A string containing a name of a FlexForms event to stop listening to.
* callback - A function containing a registered callback to remove.

Returns:  Nothing.

This function presents a familiar function for unregistering from custom events emitted by FlexForms.

FlexForms.hasEventListener(eventName)
-------------------------------------

Category:  Events

Parameters:

* eventName - A string containing a name of a FlexForms event to check.

Returns:  A boolean of true if there are event listeners for the specified event, false otherwise.

This function checks for the existence of an event and whether or not there are any listeners registered for the event.

FlexForms.modules
-----------------

Category:  Modules

This object is for internal use by FlexForms modules for tracking information.

FlexForms.SetVersion(newVer)
----------------------------

Category:  Versioning

Parameters:

* newVer - A string containing the version to append to CSS/JS requests.

Returns:  Nothing.

This function sets the version to use for requests when loading CSS and JS.  Used mostly for cache busting.

FlexForms.GetVersion()
----------------------

Category:  Versioning

Parameters:  None.

Returns:  A string containing the last set version.

This function returns the last set version string.

FlexForms.RegisterCSSOutput(info)
---------------------------------

Category:  CSS Loader

Parameters:

* info - An object containing key/value pairs to merge into cssoutput.

Returns:  Nothing.

This function sets the internal cssoutput variable to indicate that certain CSS files have been already loaded so the class won't attempt to load them again.

FlexForms.LoadCSS(name, url, cssMedia)
--------------------------------------

Category:  CSS Loader

Parameters:

* name - A string containing a unique name for the CSS file to load.
* url - A string containing a URL to the CSS file to load.
* cssMedia - A string containing the media attribute to assign (default is null).

Returns:  A DOM node containing the link tag.

This function registers and loads a CSS file via URL.

FlexForms.AddCSS(name, css, cssMedia)
-------------------------------------

Category:  CSS Loader

Parameters:

* name - A string containing a unique name for the CSS rules to add to the page.
* css - A string containing the CSS rules to add to the page.
* cssMedia - A string containing the media attribute to assign (default is null).

Returns:  A DOM node containing the style tag.

This function directly registers a number of CSS rules.

FlexForms.AddJSQueueItem(name, info)
------------------------------------

Category:  Javascript Loader

Parameters:

* name - A string containing a unique name for the JS file/script to load/add to the page.
* info - An object containing information about the JS file/script to load/add to the page.

Returns:  Nothing.

This function queues up a Javascript item to load when ProcessJSQueue() is called later.  Supports dependency handling.

FlexForms.GetObjectFromPath(path)
---------------------------------

Category:  Miscellaneous

Parameters:

* path - A string containing a dot-notation path to an object from the window.

Returns:  An object if it exists, undefined otherwise.

This function is used by ProcessJSQueue() to determine if an object already exists.  If it exists, nothing is done, otherwise the JS is loaded.

FlexForms.ProcessJSQueue()
--------------------------

Category:  Javascript Loader

Parameters:  None.

Returns:  Nothing.

This function processes the Javascript queue for the next item(s) to load based on dependency resolution.

FlexForms.Init()
----------------

Category:  Initialization

Parameters:  None.

Returns:  Nothing.

This internal function does not need to be called.  It's mostly used for AJAX initialization with FlexForms modules within FlexForms for PHP (very rare).

FlexForms.EscapeHTML(text)
--------------------------

Category:  Strings

Parameters:

* text - A string to sanitize for safe insertion into HTML.

Returns:  A HTML-safe string.

This function escapes input content for insertion into HTML.

FlexForms.CreateNode(tag, classes, attrs, styles)
-------------------------------------------------

Category:  Miscellaneous exports

Parameters:

* tag - A string containing the tag to use for the new DOM node.
* classes - An optional string or array of strings containing classes to assign to the new DOM node.
* attrs - An optional object of key-value pairs to assign to attributes of the new DOM node.
* styles - An optional object of key-value pairs to assign to styles of the new DOM node.

Returns:  A newly created, detached DOM node.

This function creates a new DOM node with classes, attributes, and styles.  Can be useful for building some custom tools.

FlexForms.DebounceAttributes
----------------------------

Category:  Miscellaneous exports

FlexForms.settings
------------------

Category:  Settings

The `settings` object contains the settings for the instance.  Changing the settings after creating the instance will have little to no effect and changing them is not recommended.  The settings are made public mostly so that tools can set up and trigger appropriate callbacks.

FlexForms.Translate(str)
------------------------

Category:  Internationalization

Parameters:

* str - A string to translate using `FlexForms.settings.langmap`.

Returns:  A replacement string, if available.

This function is called whenever an internal string will be displayed to a user to find a replacement string in the language map object.

FlexForms.FormatStr(format, ...)
--------------------------------

Category:  Internationalization

Parameters:

* format - A string containing matching placeholders for `{0}`, `{1}`, etc. for the rest of the parameters

Returns:  A formatted string with placeholders replaced with values from the other input parameters.

This function is usually used in conjunction with Translate() to perform more complex multilingual string transformations that require multiple parameters to create.

FlexForms.Designer.addEventListener(eventName, callback)
--------------------------------------------------------

Category:  Events

Parameters:

* eventName - A string containing a name of a FlexForms.Designer event to listen to.
* callback - A function to call when the event fires.

Returns:  Nothing.

This function presents a familiar function for registering for custom events emitted by FlexForms.Designer.

Used mostly by FlexForms modules to extend the class.

Known events:

* init - Dispatched during state initialization.  Lets modules modify the options and state.
* cleanup - Dispatched during state cleanup.  Lets modules process other field types and close out dangling HTML tags.
* finalize - Dispatched during state finalization.  Lets modules finalize other field types.
* field_string - Dispatched when handling field strings (e.g. 'endaccordion').  Lets modules process strings.
* field_type - Dispatched when handling custom fields.  Lets modules process custom field types.
* table_row - Dispatched when handling table rows.  Lets modules process a table row.

FlexForms.Designer.removeEventListener(eventName, callback)
-----------------------------------------------------------

Category:  Events

Parameters:

* eventName - A string containing a name of a FlexForms.Designer event to stop listening to.
* callback - A function containing a registered callback to remove.

Returns:  Nothing.

This function presents a familiar function for unregistering from custom events emitted by FlexForms.Designer.

FlexForms.Designer.hasEventListener(eventName)
----------------------------------------------

Category:  Events

Parameters:

* eventName - A string containing a name of a FlexForms.Designer event to check.

Returns:  A boolean of true if there are event listeners for the specified event, false otherwise.

This function checks for the existence of an event and whether or not there are any listeners registered for the event.

FlexForms.OutputFormCSS()
-------------------------

Category:  CSS Output

Parameters:  None.

Returns:  Nothing.

This function loads 'flex_forms.css'.  It is automatically called by Generate().

FlexForms.CreateMessage(type, message)
--------------------------------------

Category:  Messages

Parameters:

* type - A string containing one of 'info', 'warning', 'error'.
* message - A HTML string containing a message to include in a wrapper DOM node.

Returns:  A DOM node to attach to the DOM containing the message in a div wrapper.

This function generates a set of DOM nodes for the purpose of displaying a translated message to the user and returns it.

FlexForms.GetFormVars(formElem, e)
----------------------------------

Category:  Forms

Parameters:

* formElem - A DOM node to the form element to retrieve variables for.
* e - A submit event object to select the submit button for the returned object.

Returns:  An object containing the submitted form elements.

This function creates a Javascript object from submitted form elements for client-side use (e.g. validation).

FlexForms.Generate(parentElem, options, errors, request)
--------------------------------------------------------

Category:  Forms

Parameters:

* parentElem - A DOM node to attach the generated form to.
* options - An object containing options that defines the content to display.
* errors - An object containing key/value pairs of error messages to display with fields (Default is null).
* request - An object containing key/value pairs of simulated request data (Default is null).

Returns:  A DOM node containing the form wrapper.

This function takes in an input options object and optional error mapping and request objects and generates a HTML form and returns it.

FlexForms.GetSelectValues(data)
-------------------------------

Category:  Forms

Parameters:

* data - An array of values.

Returns:  The array of values made into an object containing keys mapped to true.

This function takes in an input array of values and prepares them for use as values for a "select" key in a field.  The direct use of this function is no longer considered to be best practice since FlexForms supports a "default" key-value pair for each field.  Less code equates to fewer problems.

FlexForms.IsEmptyObject(obj)
----------------------------

Category:  Miscellaneous

Parameters:

* obj - An object to check to see if it is empty.

Returns:  A boolean of true if the object does not have any properties, false otherwise.

This function returns whether or not the object is empty.
