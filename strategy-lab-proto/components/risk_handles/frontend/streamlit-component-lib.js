/**
 * Minimal Streamlit component bridge (no React).
 * Protocol compatible with streamlit.components.v1.declare_component.
 */
(function (root) {
  const API_VERSION = 1;
  const RENDER_EVENT = "streamlit:render";

  class StreamlitAPI {
    constructor() {
      this.RENDER_EVENT = RENDER_EVENT;
      this.events = document.createElement("div");
      this._ready = false;
      window.addEventListener("message", (event) => {
        const data = event.data;
        if (!data) return;
        // Streamlit may wrap as {type, args} or with isStreamlitMessage
        const type = data.type;
        if (type !== RENDER_EVENT && type !== "streamlit:componentRender") return;
        const args = data.args || (data.detail && data.detail.args) || {};
        const detail = { args, disabled: !!data.disabled };
        this.events.dispatchEvent(new CustomEvent(RENDER_EVENT, { detail }));
      });
    }

    setComponentReady() {
      if (this._ready) return;
      this._ready = true;
      this._post({ type: "streamlit:componentReady", apiVersion: API_VERSION });
    }

    setFrameHeight(height) {
      this._post({ type: "streamlit:setFrameHeight", height: height || 0 });
    }

    setComponentValue(value) {
      this._post({
        type: "streamlit:setComponentValue",
        value: value,
        dataType: "json",
      });
    }

    _post(msg) {
      // Streamlit requires isStreamlitMessage: true on every envelope
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ isStreamlitMessage: true, ...msg }, "*");
      }
    }

    events = null;
  }

  // recreate with proper events
  const api = new StreamlitAPI();
  root.Streamlit = api;
})(window);
