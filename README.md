# FlexForms
==============

FlexForms is a powerful HTML forms generator/builder Javascript class to output HTML forms using JSON-style arrays.
FlexForms.Dialog adds a moveable, resizeable, modal dialog to FlexForms.

Features
--------

* Simplifies HTML forms and eliminates error-prone, hand-crafted HTML form code for 99% of all use-cases.
* Supports per-field custom HTML output for the remaining 1% of use-cases.
* Automatic dependency chains for both external and inline CSS and Javascript.
* Per-field error message support.
* Hightly extensible.
* AJAX-ready.
* FlexForms.Dialog for clean, easy presentation of in-page forms and data processing.

Getting Started
---------------

The most common use-case is to use the FlexForms.Dialog class to generate and display a form in a dialog like this:

```html
<script type="text/javascript" src="src/flex_forms.js"></script>
<script type="text/javascript" src="src/flex_forms_dialog.js"></script>

<script type="text/javascript">
(function() {
	var options = {
		title: 'Dialog Title',
		content: {
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
		},
		onsubmit: function(formVars, formNode, e) {
console.log(formVars);
			this.Destroy();
		},
		onClose: function() {
console.log('Close');
			this.Destroy();
		}
	};
	var dlg = FlexForms.Dialog(document.body, options);
})();
</script>
```

Documentation
-------------

* [FlexForms and FlexForms.Designer](docs/flex_forms.md) - Example usage of using FlexForms by itself plus documentation.
* [FlexForms.Dialog](docs/flex_forms_dialog.md) - Detailed documentation of various FlexForms.Dialog options.
