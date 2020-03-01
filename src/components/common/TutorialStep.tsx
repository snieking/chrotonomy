import React from "react";
import { COLOR_CHROMIA_DARK } from "../../theme";

export const step = (selector: string, html: JSX.Element) => {
  return {
    selector,
    content: () => (
      <div style={{ color: COLOR_CHROMIA_DARK }}>
        {html}
      </div>
    )
  }
};