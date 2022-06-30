import * as fs from 'node:fs'

import { createFilter } from '@rollup/pluginutils'
import { transformWithEsbuild } from 'vite'

import type { FilterPattern } from '@rollup/pluginutils'
import type { Config } from '@svgr/core'
import type { EsbuildTransformOptions, Plugin } from 'vite'

export interface ViteSvgrOptions {
  /**
   * Export React component as default. Notice that it will overrides
   * the default behavior of Vite, which exports the URL as default
   *
   * @default false
   */
  exportAsDefault?: boolean
  svgrOptions?: Config
  esbuildOptions?: EsbuildTransformOptions
  exclude?: FilterPattern
  include?: FilterPattern
}

export default function viteSvgr({
  exportAsDefault,
  svgrOptions,
  esbuildOptions,
  include = '**/*.svg',
  exclude,
}: ViteSvgrOptions = {}): Plugin {
  const filter = createFilter(include, exclude)
  return {
    name: 'vite-plugin-svgr',
    async transform(code, id) {
      if (filter(id)) {
        const { transform } = await import('@svgr/core')
        const svgCode = await fs.promises.readFile(id, 'utf8')

        const componentCode = await transform(svgCode, svgrOptions, {
          filePath: id,
          caller: {
            previousExport: exportAsDefault ? null : code,
          },
        })

        const res = await transformWithEsbuild(componentCode, id, {
          loader: 'jsx',
          ...esbuildOptions,
        })

        return {
          code: res.code,
          map: null, // TODO:
        }
      }
    },
  }
}
