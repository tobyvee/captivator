import { BLANK as BLANK_TEMPLATE, Template } from "./design-schema";

// Placeholder images the customer replaces with their own. PNG data URLs, because the
// schema only allows jpg/jpeg/webp under /templates/.
// A light dashed ring, 240×240 (shown at 72px for size "sm").
export const PLACEHOLDER_LOGO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAADwCAQAAACUXCEZAAAFnElEQVR42u2dW27rMAxEvTQujTvL0u4FWgStG78kyxI5OpjfFkh4zCFFyu3yb0HKIgQARgDOJPsQgJPB88Ofee3IvyQHXAWrr2DVAL722wAeiPUapKnwZgXsNzDdAZzQwHMCvmOz/qFXob17JsxqgOsbpdIGLQnmrLWlDdT7j1V4zJkB9z7U7PuGAbjULv203Rn1qfaLgwG4NIxxH740R6xowctyJt3CjEUXwc0wdFhjBnAR3O+6lmfsQpNVBNeTzYwMwLpwOQcXnCxdMswDH9lYEynNLBr67aIAdmGbHDrxivD1tWvu4BJE/9l/d21zAdaXjWwlCb94HhP6cXlsKoBd7ypbozz2/IBN9bZiszxODdh0r6M2yuPUGezaN46bRCYxYM9zb2mYVSdusnyKKfOk2ySbYkM0LWDDmpUBg1caMHilARuVN96G7andJ3jvRdGi1mDwtkoSiwl4AW8jD2yEmJBG3jcZgNURA1gcsQMYxABO3mw5gFXXiQ2aLUIpjviOiQChJ+LOgJ1rODmarfvPFhh6Ie4G2LhKN6Cf7mjRbHx7V+KuxyRnKai88DfwagOm+koDdqqvMmDsWRww9iwNGHuWBow9iwN27FndorHnaCNMawt44Upsxvk0wcq8JTYAT79CJFziOUy4xHOYYOVus05zmFCJ5zChEs9hAiWewwRKPIcJk0IOew1gY62gcB4+fz4IZOocbnDSQiFyuBAwL6eI7JXO85cFYWyTrhpVkr8yutGAo7yAabCkAWPQ4oAxaHHAGLQ0YAxaHDAGLQ4Yg5YGjEFPAxiDFh90YNA5Vw9+dV2IJBaHhEZtcfjHewmMzuIQwJOYtAN4oipMYBSrMIDnqcKEBcAoc5tFWMTbLMIi3mYRFPFp1jrBCZFcm8WicBrAzk0OxT4awIqANydZAJbUySQTARgBGI0HzCEJwAjACMAIwAjACMAIwABGQpMsJLkRJiQARgBGAEYARgBGAAYwgAGMsurj4hUhATACMIqhw1dXfvjzZoMkYF5dEQfMRljwkARg1VbrEDAvrwjpsMVGqoBpsyQB00eLA6bNAjDKDJg2ayLAVGFJwLRZ4oCpwtMApgpLAqYKywN2sjfxovACYCSzKASw1oIQwPIGvdkcExwtg3YAT2XQABY3aACLGzSAxQ0awOIGDWBxgwawuEFfAcziMEf+vq4tG7aeDcKYNn+PALM4TN9gHQN2bnckymEvB2zkcCLIVg6YHJbQTYdHmQH/brTIYUnA5LA4YHJYHjA5LA6YHJYHzHlYHDA5LA+YHBYHzF4p2oKwOWADbrj9UVPAKN7+1wGsac+F3RBBy7nedyxa2Z4LOiLCJmzPABa3ZwCL2zOAxe0ZwPnwFm8D7hoHs+me1bdinni/KoCgX/W1foBZIfYHXOWWQ+oCqkBcGeVh1oEKo730Bmwg1ln4g3hKwOtKTD8tCJhmSx4wiOUBr/tpEAsCNhBrA749L0W/yl1IwBXXOdFuNxMS8MF/DUDFzWpIwAujjmYTBYsJGLXoYBrPBAmvNF4Ai+MFcKTK+8jChiBHwfvQgKjfnQR67CNrfmz+1wsvQ8z9+f2jken7ZUC8FZVHva33s4pV/43Lw/EY0SuSx2/EHSIxpqUgj5OtC2sQk8dSgLesmjwWAzxjHttcgLfyWBmuj/9+o6c4MwwipwP8++vPMGWeEvC3gc2wIRqMmD6zdc19xTor0H8Kw40NOM8hahttkFN+/F2LJ8jlV9wRTpaQxcYceD6XJSNiYw78+XK1LCPDaKerv5APX+zOdB9yz0/xftxYNnTM5T5YBf5ERc5T5vGhxb7UBmr6xUjOYcL1Bs0/VN7aAbgzZisAXALp7DcdwJGPWPWAvdLyATwA73V7T41VF/C7UfIqwPUNGoAHAl9rsiUmW1wAIwCjsPoPgN7utKWPuvcAAAAASUVORK5CYII=";

// A white rounded tile, 336×128.
export const PLACEHOLDER_SPONSOR =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAVAAAACACAQAAAD3qPnJAAACIklEQVR42u3bwW2jUBiF0dcFDbgNqqENGqAB10E1NEADNIDuCKGRM4ntySKyfynneOnd1See8JNb2pNPnzFzlmzZAz9pz5Ylc8b0zxp89MUlU1Yr8hJrply+H2iXq814uWu67wQ6ZLMVb7Fl+F+gnp28+zn6JNDZPrzd/ChQeVIuUYc7pQ/626sRVDJ8DLTz5k65N/ruFqjjnaLH/HlrBBVdzkAnS1DSdAbqzp2a1iPQ3g6U1beMVqCs0f0Rlc0tixUoa2l+oqewrfkzB4XtzQZUJlAECgJFoCBQECgCBYEiUBAoCBSBgkARKAgUBIpAQaAIFAQKAkWgIFAEagIECgJFoCBQECgCBYEiUBAoCBSBgkARKAgUBIpAQaAIFAQKAkWgIFAECgIFgSJQECgIFIGCQBEoCBQEikBBoAgUBAoCRaAgUAQKAgWBIlAQKAIFgYJAESgIFASKQEGgCBQECgJFoCBQBAoCBYEiUBAovzLQ3QiUtbdsVqCsrWWxAmUtLbMVKGtuGa1AWWNLbwXK6ltaVjtQ0pp2BDpZgpKmM9CLJSjpcgbacrUF5VyPNs9AOz/XU8yW7hZoy2ARShnOMv8G6pin3PH+b6DulKhivlX5MVCJUizPz4E66ClzuN8P9Hhd8kbPu97ch889fg30+NHJc5R3PDu7rzXeC/S8XZrc0fMia6bj1uje51Gg56fPmDlLNn8M4Yft2bJkzpj+WYN/APU+bTSQeDiXAAAAAElFTkSuQmCC";

// Parsed at module load, so a broken template fails on import (and so the test run).
export const BLANK: Template = Template.parse(BLANK_TEMPLATE);

export const SPONSOR: Template = Template.parse({
  id: "sponsor",
  name: "Sponsor",
  description:
    "Your logo, a bold headline and a sponsor thank-you over an event photo. Collects name and email.",
  design: {
    version: 2,
    background: {
      type: "image",
      src: "/templates/sponsor.jpg",
      fit: "fill",
      zoom: 1,
      focus: { x: 50, y: 50 },
      backdrop: "#0B1220",
      overlay: { from: "#1E293B", to: "#080C18", opacity: 0.7 },
    },
    blocks: [
      { id: "sponsor-logo", kind: "image", src: PLACEHOLDER_LOGO, alt: "Your logo", size: "sm" },
      {
        id: "sponsor-heading",
        kind: "text",
        text: "FREE WIFI",
        role: "heading",
        colour: "#C6F432",
        size: 36,
      },
      {
        id: "sponsor-subheading",
        kind: "text",
        text: "Proudly sponsored by",
        role: "subheading",
        colour: "#FFFFFF",
        size: 15,
      },
      {
        id: "sponsor-sponsor-logo",
        kind: "image",
        src: PLACEHOLDER_SPONSOR,
        alt: "Sponsor logo",
        size: "sm",
      },
    ],
    form: {
      fields: ["name", "email"],
      inputBg: "#FFFFFF",
      inputText: "#111111",
      terms: {
        mode: "checkbox",
        label: "I agree to the",
        linkText: "terms of use",
        body: "[Paste your terms of use here.]\n\n[For example: who provides the WiFi, what guests may not do on it, and how their details are handled.]",
        textColour: "#FFFFFF",
        version: 1,
      },
      button: { label: "CONNECT", bg: "#F97316", fg: "#111111", variant: "solid" },
    },
  },
});

// Picker order. Photo hero and Minimal go before Blank (T-018).
export const TEMPLATES: Template[] = [SPONSOR, BLANK];

// Photographer credits for bundled template photos, shown on the picker cards and in the
// README. Template backgrounds carry no `credit` (see T-002-template-photos-and-credits).
export const TEMPLATE_CREDITS: Record<string, { name: string; profileUrl: string }> = {
  sponsor: {
    name: "Marcel Strauß",
    profileUrl: "https://unsplash.com/@martzzl?utm_source=captivator&utm_medium=referral",
  },
};
