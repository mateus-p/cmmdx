import React from "react";

export type MDXK = keyof JSX.IntrinsicElements | React.FC<any> | undefined;

export type Elements<K extends MDXK> = K extends keyof JSX.IntrinsicElements
  ? { [key: string]: any } & JSX.IntrinsicElements[K]
  : { [key: string]: any };

export type MDXProps<K extends MDXK = undefined> = {
  components?: Record<string, React.FC<any>>;
  wrapper?: K;
} & Elements<K>;

export type MDXLoaderProps<K extends MDXK> = MDXProps<K> & {
  content: React.FC<MDXProps<K>>[];
};

