import type { MDXK, MDXLoaderProps, MDXProps } from "./index.d";
import type { FC } from "react";
import React, { createElement } from "react";

//?expo

export const asList: FC<MDXProps<MDXK>>[] = [
  //?list
];

export default function MDXLoader<K extends MDXK = MDXK>(
  props: MDXLoaderProps<K>
): React.ReactNode {
  const { content, ...restProps } = props;

  return content.map((c) =>
    // @ts-ignore
    createElement(c, {
      key: c.name,
      ...restProps,
    })
  );
}

