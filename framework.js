class FWBlockSchemas {
	static get ACTIVITY() {
		return {
			class: "fw-activity", type: "div", childs: {
				container: { type: "div", class: "container" }
			}
		};
	}
	static get ACTIVITY_AB() {
		return {
			type: "div", class: "fw-topbar", childs: {
				container: {
					type: "div", class: "container", childs: {
						z_home: { type: "div", class: "zone-home" },
						z_left: { type: "div", class: "zone-left" },
						z_title: { type: "div", class: "zone-title" },
						z_right: { type: "div", class: "zone-left" }
					}
				}
			}
		};
	}
}

class Utils {
	static inflate(data) {
		var block = document.createElement(data.type);
		if (data.class) block.className = data.class;
		if (data.id) block.id = data.id;
		if (data.inner) block.innerHTML = data.inner;
		if (data.height) block.style.height = data.height;
		if (data.color) block.style.color = data.color;

		if (data.childs) for (var a in data.childs)
			block[a] = block.appendChild(Utils.inflate(data.childs[a]));

		// Block-view hook
		block.IS_VIEW = true;
		block.getBlock = function() {return this;}
		block.appendView = function(v) {
			if(!v.IS_VIEW) Log.w("HTMLInflatorView", "Not a view!");
			this.appendChild(v.getBlock());
			return this;
		}

		return block;
	}
	static timer(time) {
		return new Promise(function (resolve) {
			setTimeout(function () {
				resolve();
			}, time);
		});
	}
}

class Screen {
	static get MODE_ROOT() { return 1; }
	static get MODE_DEFAULT() { return 0; }
	static get FADE_DURATION() { return 350; }

	constructor(data) {
		this._activity_mode = 0;
		this._refresh_timer = false;
		this._bundle = data;
		this._activity_root = Utils.inflate(FWBlockSchemas.ACTIVITY);
		this._activity_ab_root = Utils.inflate(FWBlockSchemas.ACTIVITY_AB);
		this._activity_root.container.appendChild(this._activity_ab_root);

		// Init action bar properties
		this._ab_title = "";
		this._ab_left = [];
		this._ab_right = [];
		this._ab_fixed = false;
	}

	// Action bar methods
	addLeftIcon(item) {
		this._ab_left[this._ab_left.length] = item;
		this.rebuildActionbar();
	}

	addRightIcon(item) {
		this._ab_right[this._ab_right.length] = item;
		this.rebuildActionbar();
	}

	setHomeAction(item) {
		let b = item.inflate();
		this._activity_ab_root.container.z_home.innerHTML = "";
		this._activity_ab_root.container.z_home.appendChild(b);
	}

	setHomeAsUpAction() {
		let c = this;
		this.setHomeAction(new MenuItem("Back", "arrow_back", function () {
			c.finish();
		}));
	}

	setTitle(title) {
		this._ab_title = title;
		this.rebuildActionbar();
	}

	rebuildActionbar() {
		let root = this._activity_ab_root;
		this._ab_fixed ? root.classList.add("ab-fixed") : root.classList.remove("ab-fixed");

		// title
		root.container.z_title.innerHTML = this._ab_title;

		// Leftframe
		root.container.z_left.innerHTML = "";
		for (var a in this._ab_left)
			root.container.z_left.appendChild(this._ab_left[a].inflate());

		// Rightframe
		root.container.z_right.innerHTML = "";
		for (var a in this._ab_right)
			root.container.z_right.appendChild(this._ab_right[a].inflate());
	}

	setFixed(v) {
		this._ab_fixed = v;
		this.rebuildActionbar();
	}

	addStyle(style) {
		this._activity_root.classList.add("activity-style-" + style);
	}

	doAutoUpdate(timer) {
		let c = this;
		c._refresh_timer = setInterval(function () {
			c.onUpdate();
		}, timer);
	}

	appendView(view) {
		if(!view.IS_VIEW) return false;
		this._activity_root.container.appendChild(view.getBlock());
	}

	setMode(mode) { this._activity_mode = mode; }

	// Activity config
	getRootBlock() {
		return this._activity_root.container;
	}

	// Events
	onCreate(bundle) {
		Log.w(Activity.TAG, "onCreate is not overriden!");
	}
	onUpdate() { }
	onFinish() {
		// Always allow
		return true;
	}

	// Actions
	finish() {
		let context = this, il = new InputLock();
		if (this.onFinish()) {
			// Finish allowed. Breaking...
			clearInterval(context._refresh_timer);
			context._activity_root.style.transition = "left " + (Screen.FADE_DURATION / 1000) + "s";
			il.enable();
			Utils.timer(50).then(function () {
				context._activity_root.style.left = "100%";
				return Utils.timer(500);
			}).then(function () {
				il.disable();
				context._activity_root.remove();
			});
		}
	}

	start() {
		let context = this, il = new InputLock;
		this.onCreate(this._bundle);
		this.onUpdate();
		il.enable();
		document.body.appendChild(this._activity_root);
		Utils.timer(50).then(function () {
			context._activity_root.style.transition = "left " + (Screen.FADE_DURATION / 1000) + "s";
			if (context._activity_mode == Screen.MODE_ROOT)
				return Utils.timer(0);
			return Utils.timer(50);
		}).then(function () {
			context._activity_root.style.left = "0px";
			if (context._activity_mode == Screen.MODE_ROOT)
				return Utils.timer(0);
			return Utils.timer(Screen.FADE_DURATION);
		}).then(function () {
			il.disable();
			context._activity_root.style.transition = "";
		});
	}
}

class InputLock {
	constructor() {
		this.blk = Utils.inflate({ type: "div", class: "fw-inputlock" });
	}

	enable() { document.body.appendChild(this.blk); }
	disable() { this.blk.remove(); }
}


class Log {
	static get journal() {
		if (!this._journal) this._journal = "";
		return this._journal;
	}

	static set journal(v) {
		if (!this._journal) this._journal = "";
		this._journal += v;
	}

	static d(tag, data) {
		Log.journal += "<div>[" + tag + "] " + data + "</div>";
		//		if(!AppConfig.enableDebug) return;
		console.log("[" + tag + "]", data);
	}

	static i(tag, data) {
		Log.journal += "<div style='color:#00a'>[" + tag + "] " + data + "</div>";
		console.info("[" + tag + "]", data);
	}

	static w(tag, data) {
		Log.journal += "<div style='color:#aa0'>[" + tag + "] " + data + "</div>";
		console.warn("[" + tag + "]", data);
	}

	static e(tag, data) {
		Log.journal += "<div style='color:#f00'>[" + tag + "] " + data + "</div>";
		console.error("[" + tag + "]", data);
	}
}

class MenuItem {
	constructor(title, icon, click) {
		this.title = title;
		this.icon = icon;
		this.click = click;
	}

	inflate() {
		let i = (new IconView(this.icon)).getBlock();
		let b = document.createElement("a");
		b.className = "ab-btn";
		b.appendChild(i);
		b.title = this.title;
		b.onclick = this.click;
		return b;
	}
}

class IconView {
	get IS_VIEW() { return true; }

	constructor(icon) {
		this.iconName = icon;
	}

	getBlock() {
		let i = document.createElement("i");
		i.className = "material-icons";
		i.innerHTML = this.iconName;
		return i;
	}
}

class ModalWindow {
	constructor() {
		this.blk = Utils.inflate({type: "div", class: "fw-dialog", childs: {
            container: {type: "div", class: "container"}
        }});
	}

	appendView(v) {
		if(!v.IS_VIEW) return Log.w("ModalWindow", "not a view!");
		this.blk.container.appendChild(v.getBlock());
	}

	show() {
		var blk = this.blk;
		document.body.appendChild(blk);
        Utils.timer(50).then(function(){
            blk.style.opacity = 1;
		});
	}

	hide() {
        let blk = this.blk;

        blk.style.opacity = 0;
        Utils.timer(450).then(function(){
            blk.remove();
		});
	}
}

class TextView {
	get IS_VIEW() { return true; }

	constructor(style, value) {
		this.blk = Utils.inflate({ type: "div", inner: value, class: "fw-textview-style-" + style });
	}

	getBlock() {
		return this.blk;
	}
}

class Button {
	get IS_VIEW() { return true; }
	getDefaultStyle() {
		return "style-flat";
	}

	constructor() {
		this.mBlock = Utils.inflate({ type: "button", class: "fw-button " + this.getDefaultStyle() });
	}

	getBlock() {
		return this.mBlock;
	}

	setText(value) {
		this.mBlock.innerHTML = value;
		return this;
	}

	setOnClickListener(fnc) {
		this.mBlock.onclick = fnc;
		return this;
	}

	setStyle(style) {
		this.mBlock.className = "fw-button " + style;
		return this;
	}
}

class TextInputView {
	get IS_VIEW() { return true; }
    constructor() {
        this.block = Utils.inflate({type: "div", class: "fw-listitem textedit", childs: {
            titlebx: {type: "div", class: "item-title"},
            editor: {type: "input", class: "input"}
        }});
    }

	makeReadonly() {
		this.block.editor.setAttribute("readonly", "true");
        this.block.classList.add("readonly");
        return this;
    }
    
	unmakeReadonly() {
		this.block.editor.setAttribute("readonly", "false");
		this.block.classList.remove("readonly");
        return this;
    }

	setHolder(s) {
        this.block.editor.placeholder = s;
        return this;
    }

    getBlock() {return this.block;}

    toString() {
        return this.block.editor.value;
    }

    fromString(value) {
        this.block.editor.value = value;
        return this;
    }

    setTitle(title) {
        this.block.titlebx.innerHTML = title;
        return this;
    }

    remove() {
        this.block.remove();
    }
}

class RowView {
	get IS_VIEW() { return true; }
	constructor() {
		this._title = "";
		this._icon = "";
		this._subtitle = "";
		this._click = "";
	}

	setTitle(title) {
		this._title = title;
		return this;
	}

	setSummary(title) {
		this._subtitle = title;
		return this;
	}

	setIcon(icon) {
		this._icon = icon;
		return this;
	}

	setOnClickListener(c) {
		this._click = c;
		return this;
	}

	getBlock() {
		let b = Utils.inflate({ type: "div", class: "fw-listitem normal" });
		b.innerHTML = this._title;
		b.onclick = this._click;
		return b;
	}
}

class Dialog {
	constructor() {
		this.buttons = [];
		this.views = [];
		this.title = "";
		this.message = "";
	}

	setTitle(t) {
		this.title = t;
		return this;
	}

	setMessage(m) {
		this.message = m;
		return this;
	}

	addButton(b) {
		if(!b.IS_VIEW) return false;
		this.buttons[this.buttons.length] = b;
		return this;
	}

	appendView(v) {
		if(!v.IS_VIEW) return false;
		this.views[this.views.length] = v;
		return this;
	}

	show() {
		if(this.shown) return Log.w("FWDialog", "Dialog can't be shown repeatedly! Create new instance of class and then show it!");
		var m = new ModalWindow();

		if(this.title) 
			m.appendView(Utils.inflate({type: "header", class: "title", inner: this.title}));

		if(this.message)
			m.appendView(Utils.inflate({type: "div", class: "message", inner: this.message}));

		var btns = Utils.inflate({type: "div"});
		for(var a in this.buttons) btns.appendChild(this.buttons[a].getBlock());
		m.appendView(btns);
		
		this.shown = true;
		this.modal = m;

		m.show();
		return this;
	}

	hide() {
		this.modal.hide();
	}
}
