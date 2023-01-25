import styles from "./style.module.scss";

export type ControlNode<L extends never | keyof T, T> =
  | {
      type: "hr";
    }
  | {
      type: "br";
    }
  | {
      type: "button";
      content: string;

      onClick: (v: T) => void;

      bootstrap: boolean;
    }
  | {
      type: "num";
      htmlFor: L;
      label: string;

      onChange: (value: number, v: T) => T[L];
    }
  | {
      type: "range";
      htmlFor: L;
      label: string;

      min: number;
      max: number;
      onChange: (value: number, v: T) => T[L];
    };

export const id = <T>(v: T): T => v;

export const hr = <T>(): ControlNode<never, T> => ({
  type: "hr",
});
export const br = <T>(): ControlNode<never, T> => ({
  type: "br",
});

export const range = <L extends keyof T, T>(
  htmlFor: L,
  onChange: (value: number, v: T) => T[L],
  min: number,
  max: number,
  label = String(htmlFor)
): ControlNode<L, T> => ({
  type: "range",
  htmlFor,
  label,
  min,
  max,
  onChange,
});

export const percent = <L extends keyof T, T>(
  htmlFor: L,
  onChange: (value: number, v: T) => T[L],
  label = String(htmlFor)
): ControlNode<L, T> => ({
  type: "range",
  htmlFor,
  label,
  min: 0,
  max: 100,
  onChange: (v, r) => onChange(v / 100, r),
});

export const num = <L extends keyof T, T>(
  htmlFor: L,
  onChange: (value: number, v: T) => T[L],
  label = String(htmlFor)
): ControlNode<L, T> => ({
  type: "num",
  label,
  htmlFor,
  onChange,
});

export const button = <T>(
  onClick: (data: T) => void,
  content: string,
  bootstrap = false
): ControlNode<never, T> => ({
  type: "button",
  onClick,
  content,
  bootstrap,
});

type MapT<T> = { [key in keyof T]: ControlNode<key, T> }[keyof T];

export const buildControls = <T extends Record<string, unknown>>(
  init: T,
  inp: MapT<T>[]
): T => {
  const baseEl = document.createElement("div");

  baseEl.classList.add(styles.controls);

  for (const el of inp) {
    if (el.type == "num" || el.type == "range") {
      const container = document.createElement("div");
      const e = document.createElement("label");

      e.htmlFor = String(el.htmlFor);

      e.appendChild(document.createTextNode(el.label));
      container.appendChild(e);
      baseEl.append(container);
    }

    switch (el.type) {
      case "hr": {
        baseEl.appendChild(document.createElement("br"));
        baseEl.appendChild(document.createElement("br"));
        baseEl.appendChild(document.createElement("hr"));
        baseEl.appendChild(document.createElement("br"));
        break;
      }
      case "br": {
        baseEl.appendChild(document.createElement("br"));
        break;
      }
      case "num": {
        const e = document.createElement("input");
        e.type = "number";
        e.value = String(init[el.htmlFor]);
        e.onchange = (v) => {
          init[el.htmlFor] = el.onChange(
            parseFloat((v.currentTarget as HTMLInputElement).value),
            init
          );
        };
        baseEl.appendChild(e);
        break;
      }
      case "range": {
        const e = document.createElement("input");
        e.type = "range";
        e.min = String(el.min);
        e.max = String(el.max);
        e.value = String(init[el.htmlFor]);
        e.onchange = (v) => {
          init[el.htmlFor] = el.onChange(
            parseFloat((v.currentTarget as HTMLInputElement).value),
            init
          );
        };
        baseEl.appendChild(e);
        break;
      }
      case "button": {
        const e = document.createElement("button");
        e.appendChild(document.createTextNode(el.content));
        e.onclick = () => el.onClick(init);

        baseEl.appendChild(e);

        if (el.bootstrap) el.onClick(init);
        break;
      }
    }
  }

  document.body.appendChild(baseEl);

  return init;
};
