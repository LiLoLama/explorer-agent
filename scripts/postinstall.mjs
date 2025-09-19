/* eslint-env node */

import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const componentsConfigPath = join(process.cwd(), 'components.json');

if (!existsSync(componentsConfigPath)) {
  const config = {
    $schema: 'https://ui.shadcn.com/schema.json',
    style: 'default',
    rsc: true,
    tailwind: {
      config: 'tailwind.config.ts',
      css: 'app/globals.css',
      baseColor: 'slate',
      cssVariables: true,
    },
    aliases: {
      components: '@/components',
      utils: '@/lib/utils',
    },
  };

  writeFileSync(componentsConfigPath, `${JSON.stringify(config, null, 2)}\n`);
  console.info('Initialized shadcn/ui configuration.');
} else {
  console.info('shadcn/ui configuration already present.');
}
