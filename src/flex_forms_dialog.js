// FlexForms Javascript Dialog class.
// (c) 2020 Warren Galyen. All Rights Reserved.

(function () {
    if (!window.hasOwnProperty('FlexForms') || !window.FlexForms.hasOwnProperty('Designer')) {
        console.error('[FlexForms.Dialog] Error:  FlexForms and FlexForms.Designer must be loaded before FlexForms.Dialog.');
        return;
    }

    if (window.FlexForms.hasOwnProperty('Dialog')) return;

    var EscapeHTML = window.FlexForms.EscapeHTML;
    var FormatStr = window.FlexForms.FormatStr;
    var CreateNode = window.FlexForms.CreateNode;
    var DebounceAttributes = window.FlexForms.DebounceAttributes;
    var Translate = window.FlexForms.Translate;

    var DialogInternal = function (parentElem, options) {
        if (!(this instanceof DialogInternal)) return new DialogInternal(parentElem, options);

        var triggers = {};
        var $this = this;

        var defaults = {
            modal: true,
            backgroundCloses: false,
            move: true,
            resize: true,

            title: '',
            content: {},
            errors: {},
            request: {},

            onPosition: null,
            onSubmit: null,
            onClose: null,
            onDestroy: null,

            langMap: {}
        };

        $this.settings = Object.assign({}, defaults, options);

        Object.assign(window.FlexForms.settings.langMap, $this.settings.langMap);

        // Internal functions.
        var DispatchEvent = function (eventName, params) {
            if (!triggers[eventName]) return;
            triggers[eventName].forEach(function (callback) {
                if (Array.isArray(params)) callback.apply($this, params);
                else callback.call($this, params);
            });
        };

        // Public DOM-style functions.
        $this.addEventListener = function (eventName, callback) {
            if (!triggers[eventName]) triggers[eventName] = [];
            for (var x in triggers[eventName]) {
                if (triggers[eventName][x] === callback) return;
            }
            triggers[eventName].push(callback);
        };

        $this.removeEventListener = function (eventName, callback) {
            if (!triggers[eventName]) return;
            for (var x in triggers[eventName]) {
                if (triggers[eventName][x] === callback) {
                    triggers[eventName].splice(x, 1);
                    return;
                }
            }
        };

        $this.hasEventListener = function (eventName) {
            return (triggers[eventName] && triggers[eventName].length);
        };

        // Register settings callbacks.
        if ($this.settings.onposition) $this.addEventListener('position', $this.settings.onposition);
        if ($this.settings.onsubmit) $this.addEventListener('submit', $this.settings.onsubmit);
        if ($this.settings.onclose) $this.addEventListener('close', $this.settings.onclose);
        if ($this.settings.ondestroy) $this.addEventListener('destroy', $this.settings.ondestroy);

        var elems = {
            mainWrap: CreateNode('div', ['ff_dialogwrap'], { tabIndex: 0 }, { position: 'fixed', left: '-9999px' }),
            resizer: CreateNode('div', ['ff_dialog_resizer']),
            measureEmSize: CreateNode('div', ['ff_dialog_measure_em_size']),
            innerWrap: CreateNode('div', ['ff_dialog_innerwrap']),

            titleWrap: CreateNode('div', ['ff_dialog_titlewrap']),
            title: CreateNode('div', ['ff_dialog_title']),
            closeButton: CreateNode('button', ['ff_dialog_close'], { title: Translate('Close') }),

            overlay: CreateNode('div', ['ff_dialog_overlay']),

            formWrap: null
        };

        elems.title.innerHTML = EscapeHTML(Translate($this.settings.title));

        elems.titleWrap.appendChild(elems.title);
        if (!this.settings.onClose || $this.settings.backgroundCloses) {
            elems.titleWrap.appendChild(elems.closeButton);
        }
        elems.innerWrap.appendChild(elems.titleWrap);

        if ($this.settings.resize) {
            elems.mainWrap.appendChild(elems.resizer);
        }
        elems.mainWrap.appendChild(elems.measureEmSize);
        elems.mainWrap.appendChild(elems.innerWrap);

        // Handle submit buttons.
        var SubmitHandler = function (e) {
            if (!e.isTrusted) return;
            e.preventDefault();
            var formVars = FlexForms.GetFormVars(elems.formNode, e);
            DispatchEvent('submit', [formVars, elems.formNode, e]);
        };

        // Regenerate and append the form.
        $this.UpdateContent = function () {
            if (elems.formWrap) {
                elems.formWrap.parentNode.removeChild(elems.formWrap);
            }
            elems.formWrap = FlexForms.Generate(elems.innerWrap, $this.settings.content, $this.settings.errors, $this.settings.request);
            elems.formNode = elems.formWrap.querySelector('form');

            elems.formNode.addEventListener('submit', SubmitHandler);
        };

        if ($this.settings.modal) {
            parentElem.appendChild(elems.overlay);
        }
        parentElem.appendChild(elems.mainWrap);

        $this.UpdateContent();

        // Set up focusing rules.
        var lastActiveElem = document.activeElement;
        var hasFocus = false;

        var MainWrapMouseBlurHandler = function (e) {
            if (!e.isTrusted) return;

            var node = e.target;
            while (node && node !== elems.mainWrap) node = node.parentNode;

            if (node === elems.mainWrap) {
                elems.mainWrap.classList.add('ff_dialog_focused');
            } else {
                hasFocus = false;
                if ($this.settings.modal) {
                    elems.mainWrap.focus();
                } else {
                    elems.mainWrap.classList.remove('ff_dialog_focused');
                    if (hasFocus && $this.settings.backgroundCloses) {
                        lastActiveElem = e.target;
                        $this.Close();
                    }
                }
            }
        };

        window.addEventListener('mousedown', MainWrapMouseBlurHandler, true);

        // Trigger window blur visual appearance changes.
        var MainWrapWindowBlurHandler = function (e) {
            if (e.target === window || e.target === document) {
                elems.mainWrap.classList.remove('ff_dialog_focused');
            }
        };

        window.addEventListener('blur', MainWrapWindowBlurHandler, true);

        var MainWrapFocusHandler = function (e) {
            // Handle window-level focus events specially. There will be another focus event if actually focused.
            if (!$this.settings.modal && (e.target === window || e.target === document)) {
                var node = document.activeElement;
                while (node && node !== elems.mainWrap) node = node.parentNode;

                if (node === elems.mainWrap) {
                    elems.mainWrap.classList.add('ff_dialog_focused');
                }
                return;
            }

            var node = e.target;
            while (node && node !== elems.mainWrap) node = node.parentNode;

            if (node === elems.mainWrap) {
                elems.mainWrap.classList.add('ff_dialog_focused');

                // Move this dialog to the top of the stack.
                if (!hasFocus) {
                    window.removeEventListener('focus', MainWrapFocusHandler, true);
                    lastActiveElem.focus();
                    parentElem.appendChild(elems.mainWrap);
                    elems.mainWrap.focus();
                    window.addEventListener('focus', MainWrapFocusHandler, true);
                }
                hasFocus = true;
            } else if ($this.settings.modal) {
                elems.mainWrap.focus();
            } else {
                elems.mainWrap.classList.remove('ff_dialog_focused');
                hasFocus = false;
            }
        };

        window.addEventListener('focus', MainWrapFocusHandler, true);

        // Some internal tracking variables to control dialog position and size.
        var manualSize = false, manualMove = false;
        var screenWidth, screenHeight, currDialogStyle, dialogWidth, dialogHeight;

        // Adjust the dialog and recalculate size information.
        $this.UpdateSizes = function () {
            elems.mainWrap.classList.remove('ff_dialogwrap_small');

            if (elems.mainWrap.offsetWidth / elems.measureEmSize.offsetWidth < 27) {
                elems.mainWrap.classList.add('ff_dialogwrap_small');
            }

            screenWidth = (document.documentElement.clientWidth || document.body.clientWidth || window.innerWidth);
            screenHeight = (document.documentElement.clientHeight || document.body.clientHeight || window.innerHeight);

            if (!manualSize) elems.mainWrap.style.height = null;

            currDialogStyle = elems.mainWrap.currentStyle || window.getComputedStyle(elems.mainWrap);
            dialogWidth = elems.mainWrap.offsetWidth + parseFloat(currDialogStyle.marginLeft) + parseFloat(currDialogStyle.marginRight);
            dialogHeight = elems.mainWrap.offsetHeight + parseFloat(currDialogStyle.marginTop) + parseFloat(currDialogStyle.marginBottom);

            if (!manualSize && dialogHeight >= screenHeight) {
                elems.mainWrap.style.height = (screenHeight - parseFloat(currDialogStyle.marginTop) - parseFloat(currDialogStyle.marginBottom) - 2) + 'px';

                dialogHeight = screenHeight;
            }
        };

        // Snaps the dialog so it fits on the screen.
        $this.SnapToScreen = function () {
            var currLeft = elems.mainWrap.offsetLeft - parseFloat(currDialogStyle.marginLeft);
            var currTop = elems.mainWrap.offsetTop - parseFloat(currDialogStyle.marginTop);

            elems.mainWrap.style.left = '0px';
            elems.mainWrap.style.top = '0px';

            $this.UpdateSizes();

            if (currLeft < 0) currLeft = 0;
            if (currTop < 0) currTop = 0;
            if (currLeft + dialogWidth >= screenWidth) currLeft = screenWidth - dialogWidth;
            if (currTop + dialogHeight >= screenHeight) currTop = screenHeight - dialogHeight;

            elems.mainWrap.style.left = currLeft + 'px';
            elems.mainWrap.style.top = currTop + 'px';

            DispatchEvent('position', elems.mainWrap);
        };

        // Move the dialog to the center of the screen unless it has been manually moved.
        $this.CenterDialog = function () {
            if (manualMove) {
                $this.SnapToScreen();
            } else {
                $this.UpdateSizes();

                elems.mainWrap.style.left = ((screenWidth / 2) - (dialogWidth / 2)) + 'px';
                elems.mainWrap.style.top = ((screenHeight / 2) - (dialogHeight / 2)) + 'px';

                DispatchEvent('position', elems.mainWrap);
            }
        };

        // Set up an offsetWidth/offsetHeight attribute watcher that calls CenterDialog().
        var dialogResizeWatch = new DebounceAttributes({
            watchers: [
                { elem: elems.mainWrap, attr: 'offsetWidth', val: -1 },
                { elem: elems.mainWrap, attr: 'offsetHeight', val: -1 }
            ],
            interval: 50,
            stopSame: 5,
            callback: $this.CenterDialog,
            intervalCallback: $this.CenterDialog
        });

        window.addEventListener('resize', dialogResizeWatch.Start, true);

        var LoadedHandler = function () {
            $this.CenterDialog();
            elems.mainWrap.classList.add('ff_dialog_focused');

            // Bypass the hasfocus checks in MainWrapFocusHandler.
            hasFocus = true;

            var node = document.activeElement;
            while (node && node !== elems.mainWrap) {
                node = node.parentNode;
            }

            if (node !== elems.mainWrap) {
                elems.mainWrap.focus();
            }
        };

        window.FlexForms.addEventListener('done', LoadedHandler);

        window.FlexForms.LoadCSS('formdialogcss', window.FlexForms.settings.supportUrl + '/flex_forms_dialog.css');

        // Manual move.
        var moveAnchorPos;
        var MoveDialogDragHandler = function (e) {
            if (!e.isTrusted) return;

            // Prevent content selections.
            e.preventDefault();

            var newAnchorPos;
            var rect = elems.title.getBoundingClientRect();

            if (e.type === 'touchstart') {
                newAnchorPos = {
                    x: e.touches[0].clientX - rect.left,
                    y: e.touches[0].clientY - rect.top
                };
            } else {
                newAnchorPos = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };
            }

            var newLeft = elems.mainWrap.offsetLeft - parseFloat(currDialogStyle.marginLeft) + newAnchorPos.x - moveAnchorPos.x;
            var newTop = elems.mainWrap.offsetTop - parseFloat(currDialogStyle.marginTop) + newAnchorPos.y - moveAnchorPos.y;

            if (newLeft < 0) newLeft = 0;
            if (newTop < 0) newTop = 0;
            if (newLeft + dialogWidth >= screenWidth) newLeft = screenWidth - dialogWidth;
            if (newTop + dialogHeight >= screenHeight) newTop = screenHeight - dialogHeight;

            elems.mainWrap.style.left = newLeft + 'px';
            elems.mainWrap.style.top = newTop + 'px';

            manualMove = true;

            DispatchEvent('position', elems.mainWrap);
        };

        var MoveDialogEndHandler = function (e) {
            if (e && !e.isTrusted) return;

            moveAnchorPos = null;

            window.removeEventListener('touchmove', MoveDialogDragHandler, true);
            window.removeEventListener('touchend', MoveDialogEndHandler, true);
            window.removeEventListener('mousemove', MoveDialogDragHandler, true);
            window.removeEventListener('mouseup', MoveDialogEndHandler, true);
            window.removeEventListener('blur', MoveDialogEndHandler, true);
        };

        var StartMoveDialogHandler = function (e) {
            if (!e.isTrusted) return;

            // Disallow scrolling on touch and block drag-and-drop.
            e.preventDefault();

            $this.CenterDialog();

            var rect = elems.title.getBoundingClientRect();

            if (e.type === 'touchstart') {
                moveAnchorPos = {
                    x: e.touches[0].clientX - rect.left,
                    y: e.touches[0].clientY - rect.top
                };

                window.addEventListener('touchmove', MoveDialogDragHandler, true);
                window.addEventListener('touchend', MoveDialogEndHandler, true);
            } else {
                moveAnchorPos = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };

                window.addEventListener('mousemove', MoveDialogDragHandler, true);
                window.addEventListener('mouseup', MoveDialogEndHandler, true);
            }

            window.addEventListener('blur', MoveDialogEndHandler, true);
        };

        elems.title.addEventListener('mousedown', StartMoveDialogHandler);
        elems.title.addEventListener('touchstart', StartMoveDialogHandler);

        // Manual resize.
        var resizeClass, resizeLocation, resizeAnchorPos;
        var UpdateResizeHoverClass = function (e) {
            if (!e.isTrusted || resizeAnchorPos) return;

            var rect = elems.mainWrap.getBoundingClientRect();
            var currPos, newResizeClass;

            if (e.type === 'touchstart') {
                currPos = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY
                };
            } else {
                currPos = {
                    x: e.clientX,
                    y: e.clientY
                };
            }

            if (currPos.y < rect.top + elems.measureEmSize.offsetWidth) {
                if (currPos.x < rect.left + elems.measureEmSize.offsetWidth) {
                    newResizeClass = 'ff_dialog_resize_nwse';
                    resizeLocation = 1;
                } else if (currPos.x >= rect.right - elems.measureEmSize.offsetWidth) {
                    newResizeClass = 'ff_dialog_resize_nesw';
                    resizeLocation = 3;
                } else {
                    newResizeClass = 'ff_dialog_resize_ns';
                    resizeLocation = 2;
                }
            } else if (currPos.y >= rect.bottom - elems.measureEmSize.offsetWidth) {
                if (currPos.x < rect.left + elems.measureEmSize.offsetWidth) {
                    newResizeClass = 'ff_dialog_resize_nesw';
                    resizeLocation = 6;
                } else if (currPos.x >= rect.right - elems.measureEmSize.offsetWidth) {
                    newResizeClass = 'ff_dialog_resize_nwse';
                    resizeLocation = 8;
                } else {
                    newResizeClass = 'ff_dialog_resize_ns';
                    resizeLocation = 7;
                }
            } else {
                if (currPos.x < rect.left) {
                    newResizeClass = 'ff_dialog_resize_ew';
                    resizeLocation = 4;
                } else {
                    newResizeClass = 'ff_dialog_resize_ew';
                    resizeLocation = 5;
                }
            }

            if (newResizeClass !== resizeClass) {
                elems.resizer.className = 'ff_dialog_resizer ' + newResizeClass;

                resizeClass = newResizeClass;
            }
        };

        elems.resizer.addEventListener('mousemove', UpdateResizeHoverClass);

        var ResizeDialogDragHandler = function (e) {
            if (!e.isTrusted) return;

            // Prevent content selections.
            e.preventDefault();

            var newAnchorPos;
            var rect = elems.resizer.getBoundingClientRect();

            if (e.type === 'touchstart') {
                newAnchorPos = {
                    x: e.touches[0].clientX - rect.left,
                    y: e.touches[0].clientY - rect.top
                };
            } else {
                newAnchorPos = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };
            }

            var newLeft = elems.mainWrap.offsetLeft - parseFloat(currDialogStyle.marginLeft);
            var newTop = elems.mainWrap.offsetTop - parseFloat(currDialogStyle.marginTop);
            var newWidth = elems.mainWrap.offsetWidth;
            var newHeight = elems.mainWrap.offsetHeight;
            var diffX = newAnchorPos.x - resizeAnchorPos.x;
            var diffY = newAnchorPos.y - resizeAnchorPos.y;

            // 1 2 3
            // 4   5
            // 6 7 8
            if (resizeLocation === 1 | resizeLocation === 4 || resizeLocation === 6) {
                if (newWidth - diffX >= parseFloat(currDialogStyle.maxWidth)) diffX = newWidth - parseFloat(currDialogStyle.maxWidth);
                else if (newLeft + diffX < 0) diffX = -newLeft;
                else if (newWidth - diffX < parseFloat(currDialogStyle.minWidth)) diffX = newWidth - parseFloat(currDialogStyle.minWidth);

                newLeft += diffX;
                newWidth -= diffX;
            }

            if (resizeLocation === 3 || resizeLocation === 5 || resizeLocation === 8) {
                if (resizeAnchorPos.width + diffX >= parseFloat(currDialogStyle.maxWidth)) diffX = parseFloat(currDialogStyle.maxWidth) - resizeAnchorPos.width;
                else if (newLeft + resizeAnchorPos.width + parseFloat(currDialogStyle.marginLeft) + parseFloat(currDialogStyle.marginRight) + diffX >= screenwidth) diffX = screenwidth - newleft - resizeAnchorPos.width - parseFloat(currDialogStyle.marginLeft) - parseFloat(currDialogStyle.marginRight);
                else if (resizeAnchorPos.width + diffX < parseFloat(currDialogStyle.minWidth)) diffX = parseFloat(currDialogStyle.minWidth) - resizeAnchorPos.width;

                newWidth = resizeAnchorPos.width + diffX;
            }

            if (resizeLocation === 1 || resizeLocation === 2 || resizeLocation === 3) {
                if (newHeight - diffY >= parseFloat(currDialogStyle.maxHeight)) diffY = newHeight - parseFloat(currDialogStyle.maxHeight);
                else if (newTop + diffY < 0) diffY = -newTop;
                else if (newHeight - diffY < parseFloat(currDialogStyle.minHeight)) diffY = newHeight - parseFloat(currDialogStyle.minHeight);

                newTop += diffY;
                newHeight -= diffY;
            }

            if (resizeLocation === 6 || resizeLocation === 7 || resizeLocation === 8) {
                if (resizeAnchorPos.height + diffY >= parseFloat(currDialogStyle.maxHeight)) diffX = parseFloat(currDialogStyle.maxHeight) - resizeAnchorPos.height;
                else if (newTop + resizeAnchorPos.height + parseFloat(currDialogStyle.marginTop) + parseFloat(currDialogStyle.marginBottom) + diffY >= screenheight) diffY = screenheight - newTop - resizeAnchorPos.height - parseFloat(currDialogStyle.marginTop) - parseFloat(currDialogStyle.marginBottom);
                else if (resizeAnchorPos.height + diffY < parseFloat(currDialogStyle.minHeight)) diffY = parseFloat(currDialogStyle.minHeight) - resizeAnchorPos.height;

                newHeight = resizeAnchorPos.height + diffY;
            }

            elems.mainWrap.style.left = newLeft + 'px';
            elems.mainWrap.style.top = newTop + 'px';
            elems.mainWrap.style.width = newWidth + 'px';
            elems.mainWrap.style.height = newHeight + 'px';

            manualMove = true;
            manualSize = true;

            DispatchEvent('position', elems.mainWrap);
        };

        var ResizeDialogEndHandler = function (e) {
            if (e && !e.isTrusted) return;

            resizeAnchorPos = null;

            document.body.classList.remove(resizeClass);

            window.removeEventListener('touchmove', ResizeDialogDragHandler, true);
            window.removeEventListener('touchend', ResizeDialogEndHandler, true);
            window.removeEventListener('mousemove', ResizeDialogDragHandler, true);
            window.removeEventListener('mouseup', ResizeDialogEndHandler, true);
            window.removeEventListener('blur', ResizeDialogEndHandler, true);

            $this.SnapToScreen();
        };

        var StartResizeDialogHandler = function (e) {
            if (!e.isTrusted) return;

            // Disallow scrolling on touch and block drag-and-drop.
            e.preventDefault();

            $this.CenterDialog();

            UpdateResizeHoverClass(e);

            document.body.classList.add(resizeClass);

            var rect = elems.resizer.getBoundingClientRect();

            if (e.type === 'touchstart') {
                resizeAnchorPos = {
                    x: e.touches[0].clientX - rect.left,
                    y: e.touches[0].clientY - rect.top
                };

                window.addEventListener('touchmove', ResizeDialogDragHandler, true);
                window.addEventListener('touchend', ResizeDialogEndHandler, true);
            } else {
                resizeAnchorPos = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };

                window.addEventListener('mousemove', ResizeDialogDragHandler, true);
                window.addEventListener('mouseup', ResizeDialogEndHandler, true);
            }

            resizeAnchorPos.width = elems.mainWrap.offsetWidth;
            resizeAnchorPos.height = elems.mainWrap.offsetHeight;

            window.addEventListener('blur', ResizeDialogEndHandler, true);
        };

        elems.resizer.addEventListener('touchstart', StartResizeDialogHandler);
        elems.resizer.addEventListener('mousedown', StartResizeDialogHandler);

        // Call close callbacks for the dialog.
        $this.Close = function (e) {
            if (e && !e.isTrusted) return;

            DispatchEvent('close', lastActiveElem);
        };

        elems.closeButton.addEventListener('click', $this.Close);

        var MainKeyHandler = function (e) {
            if (e.keyCode == 27) $this.Close(e);
        };

        elems.mainWrap.addEventListener('keydown', MainKeyHandler);

        // Destroy this instance.
        $this.Destroy = function () {
            DispatchEvent('destroy');

            triggers = {};

            window.removeEventListener('mousedown', MainWrapMouseBlurHandler, true);
            window.removeEventListener('blur', MainWrapWindowBlurHandler, true);
            window.removeEventListener('focus', MainWrapFocusHandler, true);
            window.removeEventListener('resize', dialogResizeWatch.Start, true);

            dialogResizeWatch.Destroy();

            window.FlexForms.removeEventListener('done', LoadedHandler);

            MoveDialogEndHandler();

            elems.title.removeEventListener('mousedown', StartMoveDialogHandler);
            elems.title.removeEventListener('touchstart', StartMoveDialogHandler);

            ResizeDialogEndHandler();

            elems.resizer.removeEventListener('touchstart', StartResizeDialogHandler);
            elems.resizer.removeEventListener('mousedown', StartResizeDialogHandler);

            elems.formNode.removeEventListener('submit', SubmitHandler);

            elems.closeButton.removeEventListener('click', $this.Close);

            elems.mainWrap.removeEventListener('keydown', MainKeyHandler);

            for (var node in elems) {
                if (elems[node].parentNode) elems[node].parentNode.removeChild(elems[node]);
            }

            currDialogStyle = null;

            // Remaining cleanup.
            elems = null;
            lastActiveElem = null;

            $this.settings = Object.assign({}, defaults);

            $this = null;
            parentElem = null;
            options = null;
        };
    };

    window.FlexForms.Dialog = DialogInternal;
})();
