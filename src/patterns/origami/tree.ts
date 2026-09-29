export interface Folder {
  name: string
  children?: Folder[]
  kind?: 'folder' | 'file'
}

const files = (...names: string[]): Folder[] => names.map((name) => ({ name, kind: 'file' }))

export const TREE: Folder = {
  name: 'Home',
  children: [
    {
      name: 'Workspace',
      children: [
        {
          name: 'Projects',
          children: [
            {
              name: 'Atlas',
              children: [
                {
                  name: 'Design',
                  children: [
                    {
                      name: 'Components',
                      children: [
                        {
                          name: 'Button',
                          children: [
                            { name: 'Variants', children: files('Primary.fig', 'Ghost.fig', 'Danger.fig', 'Icon only.fig') },
                            { name: 'States', children: files('Hover.fig', 'Pressed.fig', 'Loading.fig') },
                            ...files('Anatomy.pdf'),
                          ],
                        },
                        { name: 'Card', children: files('Card.fig') },
                        { name: 'Dialog', children: files('Dialog.fig', 'Sheet.fig') },
                      ],
                    },
                    { name: 'Illustrations', children: files('Empty states.fig') },
                  ],
                },
                { name: 'Engineering', children: files('RFC-012.md') },
                { name: 'Research', children: files('Interviews.md') },
              ],
            },
            { name: 'Beacon', children: files('Brief.md') },
            { name: 'Compass', children: files('Roadmap.md') },
          ],
        },
        { name: 'Archive', children: files('2024.zip') },
      ],
    },
    { name: 'Shared with me', children: files('Offsite plan.md') },
  ],
}

export const START_PATH = ['Home', 'Workspace', 'Projects', 'Atlas', 'Design', 'Components', 'Button', 'Variants']

export function nodeAt(path: string[]): Folder {
  let node = TREE
  for (const name of path.slice(1)) node = node.children!.find((c) => c.name === name)!
  return node
}
