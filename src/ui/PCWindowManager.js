// PCWindowManager.js
// Lightweight OS-style window system for Phaser 3.
// - Multiple windows
// - Focus/bring-to-front
// - Drag by title bar
// - Close button
// - Text content OR progress bar content
export default class PCWindowManager {
  constructor(scene, opts) {
    opts = opts || {};
    this.scene = scene;

    this.baseDepth = (opts.baseDepth !== undefined) ? opts.baseDepth : 12000;
    this.nextZ = this.baseDepth;

    this.windows = new Map(); // id -> window object
    this.order = [];          // id list in z-order
    this._id = 0;

    // optional: bounds for window placement
    if (typeof opts.bounds === "function") {
      this.bounds = opts.bounds;
    } else {
      this.bounds = () => ({
        x: 80,
        y: 90,
        w: scene.scale.width - 160,
        h: scene.scale.height - 160
      });
    }
  }

  destroyAll() {
    for (const id of [...this.order]) this.closeWindow(id);
    this.windows.clear();
    this.order.length = 0;
  }

  // ---------- public helpers ----------
  createTextWindow(cfg) {
    cfg = cfg || {};
    cfg.contentType = "text";
    return this.createWindow(cfg);
  }

  createProgressWindow(cfg) {
    cfg = cfg || {};
    cfg.contentType = "progress";
    return this.createWindow(cfg);
  }

  createDialogWindow(cfg) {
  cfg = cfg || {};
  cfg.contentType = "dialog";
  return this.createWindow(cfg);
}

createErrorWindow(cfg) {
  cfg = cfg || {};
  cfg.contentType = "dialog";
  cfg.variant = cfg.variant || "error"; // error | warn | info
  cfg.title = cfg.title || "ERROR";
  return this.createWindow(cfg);
}

  createWindow(cfg) {
    cfg = cfg || {};
    const scene = this.scene;
    const id = (cfg.id !== undefined) ? cfg.id : `win_${++this._id}`;

    // Prevent duplicates by id
    if (this.windows.has(id)) {
      this.focusWindow(id);
      return this.windows.get(id);
    }

    const title = (cfg.title !== undefined) ? cfg.title : "WINDOW";
    const pad = (cfg.pad !== undefined) ? cfg.pad : 14;

    const b = this.bounds();
    const w = (cfg.w !== undefined) ? cfg.w : 720;
    const h = (cfg.h !== undefined) ? cfg.h : 420;

    const x = (cfg.x !== undefined) ? cfg.x : Phaser.Math.Clamp(
      (scene.scale.width - w) / 2 + Phaser.Math.Between(-40, 40),
      b.x,
      b.x + b.w - w
    );

    const y = (cfg.y !== undefined) ? cfg.y : Phaser.Math.Clamp(
      (scene.scale.height - h) / 2 + Phaser.Math.Between(-30, 30),
      b.y,
      b.y + b.h - h
    );

    // --- container root ---
    const root = scene.add.container(x, y);
    root.setDepth(this._allocDepth());

    // --- background ---
    const bg = scene.add.rectangle(0, 0, w, h, 0x0b0f14, 0.92)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x2a3b52, 1);

    // --- titlebar ---
    const titleH = 42;
    const titleBar = scene.add.rectangle(0, 0, w, titleH, 0x101a24, 0.98)
      .setOrigin(0, 0);

    const titleText = scene.add.text(pad, 10, title, {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#dfe7ff"
    });

    // --- close button ---
    const closeBtn = scene.add.text(w - 34, 8, "✕", {
      fontFamily: "monospace",
      fontSize: "22px",
      color: "#ffffff"
    }).setInteractive({ useHandCursor: true });

    // --- content area ---
    const contentX = pad;
    const contentY = titleH + pad;
    const contentW = w - pad * 2;
    const contentH = h - titleH - pad * 2;

    // content container (so text/controls are easy)
    const content = scene.add.container(contentX, contentY);

    // optional: content background
    const contentBg = scene.add.rectangle(0, 0, contentW, contentH, 0x0a121a, 0.65)
      .setOrigin(0, 0);

    content.add(contentBg);

    // text content
let textObj = null;

// progress content
let progress = null;

// dialog content
let dialog = null;

if (cfg.contentType === "text") {
  const text = Array.isArray(cfg.lines) ? cfg.lines.join("\n") : (cfg.text || "");
  textObj = scene.add.text(12, 10, text, {
    fontFamily: "monospace",
    fontSize: "16px",
    color: "#e6f0ff",
    lineSpacing: 6,
    wordWrap: { width: contentW - 24 }
  });
  content.add(textObj);
}

if (cfg.contentType === "progress") {
  const labelText = (cfg.label !== undefined) ? cfg.label : "Working...";

  const label = scene.add.text(12, 10, labelText, {
    fontFamily: "monospace",
    fontSize: "16px",
    color: "#e6f0ff"
  });

  const barY = 52;
  const barBg = scene.add.rectangle(12, barY, contentW - 24, 18, 0x0f1a24, 1)
    .setOrigin(0, 0)
    .setStrokeStyle(1, 0x2a3b52, 1);

  const barFill = scene.add.rectangle(12, barY, 0, 18, 0x8fb4ff, 1)
    .setOrigin(0, 0);

  const pct = scene.add.text(12, 80, "0%", {
    fontFamily: "monospace",
    fontSize: "14px",
    color: "#cfe1ff"
  });

  progress = { label, barBg, barFill, pct, value: 0, w: (contentW - 24) };
  content.add([label, barBg, barFill, pct]);
}

if (cfg.contentType === "dialog") {
  const variant = cfg.variant || "error"; // error | warn | info
  const msg = Array.isArray(cfg.message) ? cfg.message.join("\n") : (cfg.message || cfg.text || "");

  // icon block color
  const iconColor =
    variant === "warn" ? 0xffcc66 :
    variant === "info" ? 0x8fb4ff :
    0xff6677;

  const iconBox = scene.add.rectangle(12, 12, 42, 42, iconColor, 0.18)
    .setOrigin(0, 0)
    .setStrokeStyle(1, iconColor, 0.65);

  const iconText = scene.add.text(26, 18,
    variant === "warn" ? "!" : variant === "info" ? "i" : "X",
    { fontFamily: "monospace", fontSize: "28px", color: "#e6f0ff" }
  );

  const body = scene.add.text(66, 12, msg, {
    fontFamily: "monospace",
    fontSize: "16px",
    color: "#e6f0ff",
    lineSpacing: 6,
    wordWrap: { width: contentW - 78 }
  });

  // buttons
  const buttons = Array.isArray(cfg.buttons) ? cfg.buttons : [{ label: "OK", action: "close" }];
  const btnY = contentH - 52;
  const btnPad = 12;
  const btnW = 120;
  const btnH = 34;

  const btnObjs = [];

  // Right-align buttons like a real OS
  let totalW = buttons.length * btnW + (buttons.length - 1) * 12;
  let startX = contentW - totalW - btnPad;

  buttons.forEach((b, i) => {
    const bx = startX + i * (btnW + 12);

    const r = scene.add.rectangle(bx, btnY, btnW, btnH, 0x101a24, 0.98)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x2a3b52, 1)
      .setInteractive();

    const t = scene.add.text(bx + 18, btnY + 7, b.label || "OK", {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#dfe7ff"
    });

    r.on("pointerdown", () => {
      if (typeof b.onClick === "function") {
        try { b.onClick(); } catch (e) { console.warn("dialog onClick error:", e); }
      }
      if (b.action === "close" || b.action == null) {
        this.closeWindow(id);
      }
    });

    btnObjs.push(r, t);
  });

  content.add([iconBox, iconText, body, ...btnObjs]);

  dialog = { variant, body, buttons: btnObjs, iconBox, iconText };
}

    // Build structure
    root.add([bg, titleBar, titleText, closeBtn, content]);

    // interactions: focus on pointerdown anywhere
    bg.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
    titleBar.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, titleH), Phaser.Geom.Rectangle.Contains);

    const win = {
      id,
      root,
      bg,
      titleBar,
      titleText,
      closeBtn,
      content,
      contentBg,
      textObj,
      progress,
      dialog,
      w,
      h,
      titleH,
      onClose: (cfg.onClose !== undefined) ? cfg.onClose : null,
      isClosed: false
    };

    // close button
    closeBtn.on("pointerdown", () => {
      this.closeWindow(id);
    });

    // focus on click
    bg.on("pointerdown", () => this.focusWindow(id));
    titleBar.on("pointerdown", () => this.focusWindow(id));

    // drag by titlebar
    this._enableDrag(win);

    // clamp inside bounds (initial)
    this._clampToBounds(win);

    // add to tracking
    this.windows.set(id, win);
    this.order.push(id);

    // bring to front immediately
    this.focusWindow(id);

    return win;
  }

  closeWindow(id) {
    const win = this.windows.get(id);
    if (!win || win.isClosed) return;

    win.isClosed = true;

    // callback before destroy
    try { if (win.onClose) win.onClose(win); } catch (e) { console.warn("win onClose error:", e); }

    // destroy
    try { win.root.destroy(true); } catch (e) {}
    this.windows.delete(id);

    const idx = this.order.indexOf(id);
    if (idx >= 0) this.order.splice(idx, 1);
  }

  focusWindow(id) {
    const win = this.windows.get(id);
    if (!win || win.isClosed) return;

    // bring to top
    win.root.setDepth(this._allocDepth());

    const idx = this.order.indexOf(id);
    if (idx >= 0) {
      this.order.splice(idx, 1);
      this.order.push(id);
    }
  }

  setText(id, linesOrText) {
    const win = this.windows.get(id);
    if (!win || !win.textObj) return;

    const text = Array.isArray(linesOrText) ? linesOrText.join("\n") : String(linesOrText);
    win.textObj.setText(text);
  }

  setProgress(id, value01, pctLabel) {
    const win = this.windows.get(id);
    if (!win || !win.progress) return;

    const v = Phaser.Math.Clamp(value01, 0, 1);
    win.progress.value = v;

    const px = Math.floor(v * win.progress.w);

    // Rectangle width update:
    // Phaser rectangles use .width as a property, but some builds behave better with setSize.
    // We'll update both safely.
    win.progress.barFill.width = px;
    if (win.progress.barFill.setSize) win.progress.barFill.setSize(px, 18);

    const pct = (pctLabel !== undefined) ? pctLabel : `${Math.floor(v * 100)}%`;
    win.progress.pct.setText(pct);
  }

  // ---------- internals ----------
  _allocDepth() {
    this.nextZ += 1;
    return this.nextZ;
  }

  _enableDrag(win) {
    const scene = this.scene;
    const dragState = { dragging: false, ox: 0, oy: 0 };

    win.titleBar.on("pointerdown", (p) => {
      dragState.dragging = true;
      dragState.ox = p.x - win.root.x;
      dragState.oy = p.y - win.root.y;
    });

    // stop drag when pointer up anywhere
    scene.input.on("pointerup", () => { dragState.dragging = false; });

    // move
    scene.input.on("pointermove", (p) => {
      if (!scene || !scene.sys || !scene.sys.isActive()) return;
      if (!dragState.dragging) return;

      win.root.x = p.x - dragState.ox;
      win.root.y = p.y - dragState.oy;

      this._clampToBounds(win);
    });
  }

  _clampToBounds(win) {
    const b = this.bounds();
    win.root.x = Phaser.Math.Clamp(win.root.x, b.x, b.x + b.w - win.w);
    win.root.y = Phaser.Math.Clamp(win.root.y, b.y, b.y + b.h - win.h);
  }
}
