import type { MDXK, MDXLoaderProps, MDXProps } from "cmmdx/mdx.d";
import type { FC, ReactNode } from "react";
import { createElement } from "react";

//?expo

export const asList: FC<MDXProps<MDXK>>[] = [
  //?list
];

export default function MDXLoader<K extends MDXK = MDXK>(
  props: MDXLoaderProps<K>
): ReactNode {
  const { content, ...restProps } = props;

  return content.map((c) =>
    // @ts-ignore
    createElement(c, {
      key: c.name,
      ...restProps,
    })
  );
}

