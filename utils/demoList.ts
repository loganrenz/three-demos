export type DemoDescriptor = {
  slug: string
  title: string
  description: string
  category: '3d-world' | 'simulation' | 'puzzle' | 'taxonomy'
  tags?: string[]
  accent?: string
}

export const demoList: DemoDescriptor[] = [
  {
    slug: 'basic-scene',
    title: 'Basic Scene',
    description: 'A simple Three.js scene with a rotating cube',
    category: '3d-world',
    tags: ['three.js', 'foundations'],
    accent: 'emerald'
  },
  {
    slug: 'hydrogen-city',
    title: 'Hydrogen City Pulse Map',
    description: 'A living 3D city powered by invisible hydrogen rivers',
    category: 'simulation',
    tags: ['energy', 'post-processing'],
    accent: 'cyan'
  },
  {
    slug: 'forest-weather',
    title: 'Procedural Forest with Dynamic Weather',
    description: 'A procedurally generated forest with wind animation, rain, fog, and falling leaves',
    category: 'simulation',
    tags: ['procedural', 'weather'],
    accent: 'lime'
  },
  {
    slug: 'lexi-stack',
    title: 'LexiStack Word Tower',
    description: 'A rising grid word game that mixes Boggle with falling blocks',
    category: 'puzzle',
    tags: ['game', 'wordplay'],
    accent: 'violet'
  },
  {
    slug: 'amazon-taxonomy',
    title: 'Amazon Taxonomy Investigator',
    description: 'Trace and audit category paths without losing your place in the hierarchy',
    category: 'taxonomy',
    tags: ['navigation', 'merchandising'],
    accent: 'amber'
  }
]
