'use client'

import * as React from 'react'
import {
  Copy,
  Check,
  RotateCw,
  Download,
  FileText,
  Sliders,
  Code2,
  Sparkles,
  AlignLeft,
  List,
  Heading,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/* Vocabulary Banks for Different Flavors (Each with 20+ Headings & 100+ Words)*/
/* -------------------------------------------------------------------------- */

const VOCABULARIES = {
  english: {
    label: 'Pure Modern English',
    words: [
      'experience', 'discover', 'journey', 'knowledge', 'community', 'inspire', 'learning',
      'explore', 'growth', 'perspective', 'understanding', 'connection', 'curiosity', 'harmony',
      'momentum', 'opportunity', 'clarity', 'resilience', 'insight', 'creativity', 'purpose',
      'reflection', 'achievement', 'balance', 'mindful', 'ambition', 'patience', 'focus',
      'meaningful', 'collaboration', 'landscape', 'horizon', 'tradition', 'elegance', 'nuance',
      'conversation', 'heritage', 'observation', 'atmosphere', 'direction', 'pathway', 'passion',
      'integrity', 'empathy', 'vibrant', 'brilliant', 'seamless', 'authentic', 'delightful',
      'remarkable', 'sustainable', 'thoughtful', 'transform', 'celebrate', 'cultivate', 'flourish',
      'illuminate', 'reconnect', 'appreciate', 'strengthen', 'navigate', 'embrace', 'flourishing',
    ],
    headings: [
      'The Evolution of Modern Human Communication',
      'Exploring the Boundaries of Knowledge and Discovery',
      'Understanding the Everyday Impact of Global Innovation',
      'A Journey Through Urban Landscapes and Modern Culture',
      'Unlocking the Secrets of Sustainable Daily Habits',
      'The Balance Between Ambition and Mindful Living',
      'How Curiosity Shapes Lifelong Learning and Growth',
      'The Art of Constructive Collaboration in Everyday Life',
      'Discovering Unexpected Perspectives in Common Situations',
      'Building Resilient Communities Through Shared Purpose',
      'The Subtle Nuances of Decision Making Under Pressure',
      'Navigating the Complexities of Contemporary Society',
      'The Power of Patience in Long-Term Achievement',
      'Rediscovering the Value of Focus in a Distracted World',
      'Embracing Change as a Catalyst for Personal Renewal',
      'The Silent Architecture of Daily Routines',
      'Cultivating Meaningful Connections Across Distances',
      'The Interplay Between Intuition and Logical Analysis',
      'Preserving Cultural Heritage in a Rapidly Evolving Era',
      'Reflections on Progress, Reflection, and Personal Growth',
      'The Quiet Confidence of Continuous Improvement',
      'Designing Purposeful Spaces for Creativity and Work',
    ],
  },
  lorem: {
    label: 'Classic Latin (Lorem Ipsum)',
    words: [
      'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do',
      'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim',
      'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip',
      'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
      'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat',
      'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum',
      'sapiente', 'delectus', 'reiciendis', 'voluptatibus', 'maiores', 'alias', 'consequatur', 'aut',
      'perferendis', 'doloribus', 'asperiores', 'repellat', 'facilis', 'expedita', 'distinctio',
    ],
    headings: [
      'De Finibus Bonorum et Malorum',
      'Sed Ut Perspiciatis Unde Omnis Iste',
      'Nemo Enim Ipsam Voluptatem Quia',
      'Neque Porro Quisquam Est Qui Dolorem',
      'Ut Enim Ad Minima Veniam Nostrum',
      'Quis Autem Vel Eum Iure Reprehenderit',
      'At Vero Eos Et Accusamus Et Iusto',
      'Dignissimos Ducimus Qui Blanditiis Praesentium',
      'Voluptatum Deleniti Atque Corrupti Quos',
      'Dolores Et Quas Molestias Excepturi Sint',
      'Occaecati Cupiditate Non Provident Similique',
      'Temporibus Autem Quibusdam Et Aut Officiis',
      'Debitis Aut Rerum Necessitatibus Saepe Eveniet',
      'Itaque Earum Rerum Hic Tenetur A Sapiente',
      'Nam Libero Tempore Cum Soluta Nobis Est',
      'Eligendi Optio Cumque Nihil Impedit Quo Minus',
      'Omnis Dolor Repellendus Temporibus Autem',
      'Quibusdam Et Aut Officiis Debitis',
      'Necessitatibus Saepe Eveniet Ut Et Voluptates',
      'Repudiandae Sint Et Molestiae Non Recusandae',
      'Tempora Incidunt Ut Labore Et Dolore Magnam',
      'Inventore Veritatis Et Quasi Architecto Beatae',
    ],
  },
  tech: {
    label: 'Cloud, AI & Tech Startup',
    words: [
      'microservices', 'kubernetes', 'cloud-native', 'neural', 'network', 'latency', 'distributed',
      'scalability', 'throughput', 'serverless', 'graphql', 'container', 'docker', 'webassembly',
      'pipeline', 'deployment', 'continuous', 'integration', 'zero-trust', 'architecture', 'telemetry',
      'observability', 'cache', 'redis', 'asynchronous', 'concurrency', 'event-driven', 'kafka',
      'resilience', 'sharding', 'protocol', 'payload', 'deterministic', 'cryptographic', 'hash',
      'immutable', 'infrastructure', 'runtime', 'virtualization', 'benchmark', 'optimization',
      'inference', 'vector-index', 'embeddings', 'federated', 'declarative', 'orchestration',
      'fault-tolerant', 'sandboxing', 'edge-compute', 'bandwidth', 'load-balancer', 'websocket',
    ],
    headings: [
      'Architecting Zero-Trust Distributed Systems at Scale',
      'Real-Time Event Streams with WebAssembly Pipelines',
      'Demystifying Autonomous Cloud-Native Topologies',
      'High-Throughput Concurrency in Modern Asynchronous Engines',
      'Resilient Microservice Infrastructure via Continuous Telemetry',
      'Optimizing Edge Computing Latency in Global Mesh Networks',
      'Deterministic State Management Across Serverless Functions',
      'Leveraging Deep Neural Ensembles for Predictive Inferences',
      'Eliminating Cold Starts with Lightweight Container Sandboxes',
      'Declarative Infrastructure as Code for Multi-Region Deployments',
      'Decentralized Consensus and Immutable Ledger Protocols',
      'Automating Continuous Delivery with Observability Gates',
      'Query Optimization and Partition Sharding in Distributed Databases',
      'Dynamic Load Shedding Strategies During Peak Traffic Spikes',
      'Cryptographic Key Rotation and Hardware Security Modules',
      'Scalable GraphQL Gateways and Federated Schema Composition',
      'Event-Driven Sagas for Distributed Transaction Consistency',
      'Zero-Downtime Database Migrations in High-Availability Clusters',
      'Profiling Memory Allocation and Garbage Collection in Production',
      'Benchmarking Vector Database Retrieval for LLM Augmented Workflows',
      'Fault-Tolerant Actor Models in Modern Distributed Runtimes',
      'Automated Canary Analysis for Resilient Kubernetes Rollouts',
    ],
  },
  corporate: {
    label: 'Corporate Strategy & Business',
    words: [
      'synergy', 'bandwidth', 'deliverables', 'stakeholders', 'leverage', 'actionable', 'insights',
      'core', 'competencies', 'scalable', 'paradigms', 'touchpoint', 'streamline', 'ecosystem',
      'holistic', 'alignment', 'milestones', 'value-add', 'deep-dive', 'roadmap', 'framework',
      'pivot', 'disruption', 'frictionless', 'omnichannel', 'kpi', 'metrics', 'benchmarking',
      'low-hanging', 'fruit', 'best-practices', 'thought-leadership', 'proactive', 'reinvent',
      'governance', 'sustainability', 'equity', 'turnaround', 'transformation', 'capitalization',
      'market-fit', 'value-proposition', 'bottom-line', 'synergistic', 'empowerment', 'enablement',
    ],
    headings: [
      'Maximizing Cross-Functional Synergy and Bandwidth',
      'Holistic Paradigms for Omnichannel Market Disruption',
      'Strategic Milestones for Stakeholder Value-Add',
      'Frictionless Roadmaps: Accelerating Q4 Deliverables',
      'Reinventing Scalable Core Competency Ecosystems',
      'Leveraging Actionable Insights for Sustainable ROI Growth',
      'Optimizing Value Streams Across Agile Organizational Units',
      'Driving Customer-Centric Transformations in Enterprise Markets',
      'Cultivating Strategic Partnerships to Expand Global Footprints',
      'Streamlining Operational Efficiencies Through Process Automation',
      'Navigating Market Volatility with Proactive Risk Mitigation',
      'Fostering Culture of Thought Leadership and Continuous Innovation',
      'Unlocking Untapped Market Potential Through Vertical Integration',
      'Establishing Clear Performance Indicators for Cross-Functional Units',
      'Iterative Go-To-Market Strategies for High-Impact Product Launches',
      'Optimizing Supply Chain Bandwidth Through Predictive Modeling',
      'Strengthening Brand Equity Across Diverse Demographics',
      'Resource Allocation Frameworks for High-Growth Initiatives',
      'Enhancing Operational Agility in Dynamic Business Environments',
      'Sustainable Long-Term Governance and ESG Accountability',
      'Capital Allocation Matrices for Disruptive Innovation Portfolios',
      'Building Cross-Departmental Cohesion in Hybrid Workplaces',
    ],
  },
  creative: {
    label: 'Literature & Narrative Fiction',
    words: [
      'whisper', 'labyrinth', 'constellation', 'melancholy', 'starlight', 'forgotten', 'silhouette',
      'horizon', 'solitary', 'cathedral', 'moonlight', 'shadows', 'tapestry', 'echo', 'wanderer',
      'quicksilver', 'enchanted', 'twilight', 'chronicle', 'alchemist', 'amber', 'emerald',
      'fragile', 'illuminate', 'celestial', 'serenade', 'odyssey', 'reverie', 'breeze', 'autumn',
      'cobblestone', 'mirage', 'ethereal', 'gossamer', 'infinite', 'passage', 'luminous',
      'solitude', 'phantasm', 'sanctuary', 'voyage', 'cascading', 'nocturnal', 'radiance',
    ],
    headings: [
      'Whispers in the Ancient Whispering Woods',
      'The Labyrinth of Forgotten Echoes and Shadows',
      'Beyond the Horizon of the Glimmering Sea',
      'The Clockwork Artisan and the Secret of Time',
      'Chronicles of the Wandering Cartographer',
      'The Solitary Lighthouse on the Storm-Swept Cliffs',
      'Echoes from the Ruins of the Silent Citadel',
      'The Alchemist\'s Last Theorem of Celestial Light',
      'Beneath the Canopy of Emerald Constellations',
      'The Tapestry of Starlight and Forgotten Dreams',
      'A Journey Through the Valley of Whispering Stones',
      'The Midnight Library of Undiscovered Stories',
      'The Song of the Northern Wind Across the Steppes',
      'Secrets Carved in the Foundations of the Old City',
      'The Glassmaker\'s Daughter and the Mirror of Truth',
      'Shadows Lengthen Across the Sunken Empire',
      'The Melancholy of the Autumn Carousel',
      'Footsteps Along the Cobblestones of Memory',
      'The Lost Constellation of the Sea Sovereign',
      'Dawn Breaks Over the Silver Mountain Range',
      'The Solitary Astronomer and the Wandering Comet',
      'Letters Written in the Margins of Twilight',
    ],
  },
  scientific: {
    label: 'Science & Academic Research',
    words: [
      'empirical', 'hypothesis', 'spectroscopy', 'thermodynamics', 'catalysis', 'proteomics',
      'metabolic', 'biomarker', 'quantum', 'superconductor', 'topological', 'kinetic', 'stochastic',
      'perturbation', 'macromolecular', 'pathway', 'autophagy', 'lensing', 'chromatography',
      'receptors', 'in-vitro', 'asymptotic', 'equilibrium', 'fluorescence', 'diffraction',
      'paleoclimatic', 'sequestration', 'correlation', 'variance', 'significance', 'cohort',
      'polymerase', 'crystallography', 'homeostasis', 'electrochemical', 'nanoscale', 'membrane',
    ],
    headings: [
      'Empirical Methodologies in Quantum Thermodynamics',
      'Neurobiological Correlates of Cognitive Flexibility',
      'Comparative Analysis of Genome Sequencing Algorithms',
      'Kinetic Modeling of Enzymatic Catalysis Under Pressure',
      'Stochastic Perturbations in High-Energy Particle Collisions',
      'Spectroscopic Characterization of Novel Superconductors',
      'Cellular Autophagy Pathways in Metabolic Regulation',
      'Atmospheric Circulation Anomalies in Oceanic Basins',
      'Topological Invariants in Condensed Matter Systems',
      'Quantitative Proteomics and Biomarker Identification',
      'Nonlinear Dynamics of Complex Biological Networks',
      'Gravitational Lensing Simulations of Distant Galaxies',
      'Electrochemical Mechanisms in High-Density Batteries',
      'Statistical Inference Models for Epidemiological Cohorts',
      'Photonic Metamaterials and Light-Matter Interactions',
      'Paleoclimatic Evidence of Terrestrial Carbon Sequestration',
      'Cryogenic Electron Microscopy of Macromolecular Complexes',
      'Computational Fluid Dynamics of Laminar Boundary Layers',
      'Epigenetic Modifications Influencing Neural Plasticity',
      'Quantum Entanglement Verification in Fiber Networks',
      'Thermodynamic Efficiency Limits in Photovoltaic Cells',
      'Characterization of Ion Channels in Cellular Membranes',
    ],
  },
  cyberpunk: {
    label: 'Cyberpunk & Sci-Fi',
    words: [
      'neon', 'cyberdeck', 'matrix', 'quantum', 'mainframe', 'subgrid', 'neural-link', 'glitch',
      'augmented', 'synthetic', 'cortex', 'cyberspace', 'datastream', 'firewall', 'encrypt',
      'protocol', 'night-city', 'holographic', 'nanotech', 'biometric', 'terminal', 'overclock',
      'darknet', 'transistor', 'cybernetic', 'phantom', 'grid-runner', 'hyperdrive', 'circuit',
      'cryo-chamber', 'megacorp', 'black-market', 'surveillance', 'subterranean', 'countermeasure',
    ],
    headings: [
      'Bypassing Quantum Mainframe Firewalls in the Subgrid',
      'Neural-Link Synchrony Across Neon Datastreams',
      'Holographic Substrates and Augmented Cyberdecks',
      'Infiltration of Synthetic Cortex Micro-Circuits',
      'Ghost Protocols in the Darknet Matrix',
      'Overclocking Biometric Implants in Night-City',
      'The Black-Market Nanotech Smugglers of Sector 9',
      'Decrypted Transmissions from the Orbital Colony',
      'Synthetic Consciousness Awakening in the Core',
      'Rogue ICE Countermeasures in Encrypted Subnetworks',
      'Glitch Cartography: Mapping the Undernet Fringe',
      'Chromed Alleyways Beneath the Acid Rain Skyline',
      'Autonomous Surveillance Drones in the High-Rise Sector',
      'The Cryo-Chamber Awakening of Subject 77',
      'Plasma Reactor Instability in Lower Megastructure',
      'Bionic Prosthetics Calibration and Neural Feedback',
      'Terminal Injections and Memory Overwrite Routines',
      'The Subterranean Resistance of the Wireheads',
      'Hacking the Corporate Megacorp Central Spire',
      'Signals Lost in the Radio-Static Void',
      'Zero-Day Exploits in the Orbital Satellite Grid',
      'The Digital Consciousness Archive of Sector Zero',
    ],
  },
  culinary: {
    label: 'Culinary Arts & Gastronomy',
    words: [
      'fermentation', 'emulsion', 'reduction', 'caramelization', 'truffle', 'botanical', 'artisan',
      'sourdough', 'umami', 'sous-vide', 'terroir', 'infusion', 'velvet', 'heritage', 'cacao',
      'confit', 'heirloom', 'smokiness', 'glaze', 'custard', 'pastry', 'acidity', 'vinaigrette',
      'charred', 'simmering', 'aromatic', 'deconstructed', 'poached', 'braised', 'savory',
    ],
    headings: [
      'The Art of Slow Fermentation in Artisan Sourdough',
      'Mastering Velvet Emulsions and Classical Reductions',
      'Exploring Heritage Heirlooms and Foraged Botanicals',
      'The Chemistry of Caramelization in Modern Gastronomy',
      'Infusing Wild Truffles and Aged Smoked Balsamic',
      'Precision Sous-Vide Techniques for Delicate Seafood',
      'Harmonizing Acidity and Umami in Contemporary Broths',
      'The Ritual of Single-Origin Cacao Tempering',
      'Crispy Confit and Botanical Herb Pairings',
      'Seasonal Tasting Menus: From Orchard to Hearth',
      'The Alchemy of Handcrafted Aged Cheese Curing',
      'Decanting and Terroir: The Symphony of Vintage Wines',
      'Charred Wood-Fired Crusts and Fermented Glazes',
      'Silky Custards and Infused Floral Essences',
      'Deconstructed Pastries and Molecular Gastronomy',
      'The Heritage of Hand-Pulled Wheat Noodles',
      'Citrus Zests, Bitter Herbs, and Aperitif Crafting',
      'Dry-Aging Techniques for Prime Heritage Cuts',
      'Infusing Smoked Sea Salts and Peppercorn Blends',
      'Elevating Rustic Farmhouse Recipes with Modern Nuance',
      'Botanical Infusions and Cold-Pressed Herbal Oils',
      'The Sensory Architecture of Fine Dining Plating',
    ],
  },
}

type FlavorType = keyof typeof VOCABULARIES
type ContentType = 'paragraphs' | 'headings' | 'subheadings' | 'bullets' | 'article'
type OutputFormat = 'plain' | 'html' | 'markdown' | 'json'

export function RandomTextView() {
  const [flavor, setFlavor] = React.useState<FlavorType>('english')
  const [contentType, setContentType] = React.useState<ContentType>('paragraphs')
  const [format, setFormat] = React.useState<OutputFormat>('plain')
  const [count, setCount] = React.useState(3)
  const [startWithLorem, setStartWithLorem] = React.useState(true)
  const [seed, setSeed] = React.useState(1)
  const [copied, setCopied] = React.useState(false)

  // Pseudo-random sentence generator with varied grammatical structures
  const generateSentence = React.useCallback(
    (vocab: string[], minWords = 9, maxWords = 18) => {
      const len = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords
      const words: string[] = []
      for (let i = 0; i < len; i++) {
        const w = vocab[Math.floor(Math.random() * vocab.length)]
        words.push(w)
      }
      const raw = words.join(' ')
      return raw.charAt(0).toUpperCase() + raw.slice(1) + '.'
    },
    []
  )

  // Generate complete text based on configuration
  const generatedText = React.useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _s = seed // trigger recalculation
    const bank = VOCABULARIES[flavor]

    if (contentType === 'headings') {
      const headingsList: string[] = []
      for (let i = 0; i < count; i++) {
        const template = bank.headings[i % bank.headings.length]
        headingsList.push(template)
      }

      if (format === 'html') {
        return headingsList.map((h) => `<h2>${h}</h2>`).join('\n')
      }
      if (format === 'markdown') {
        return headingsList.map((h) => `## ${h}`).join('\n')
      }
      if (format === 'json') {
        return JSON.stringify(headingsList, null, 2)
      }
      return headingsList.join('\n\n')
    }

    if (contentType === 'subheadings') {
      const subheadingsList: string[] = []
      for (let i = 0; i < count; i++) {
        const sentence = generateSentence(bank.words, 4, 8).replace(/\.$/, '')
        subheadingsList.push(sentence)
      }

      if (format === 'html') {
        return subheadingsList.map((s) => `<h3>${s}</h3>`).join('\n')
      }
      if (format === 'markdown') {
        return subheadingsList.map((s) => `### ${s}`).join('\n')
      }
      if (format === 'json') {
        return JSON.stringify(subheadingsList, null, 2)
      }
      return subheadingsList.join('\n\n')
    }

    if (contentType === 'bullets') {
      const itemsList: string[] = []
      for (let i = 0; i < count; i++) {
        itemsList.push(generateSentence(bank.words, 6, 14))
      }

      if (format === 'html') {
        return `<ul>\n${itemsList.map((item) => `  <li>${item}</li>`).join('\n')}\n</ul>`
      }
      if (format === 'markdown') {
        return itemsList.map((item) => `* ${item}`).join('\n')
      }
      if (format === 'json') {
        return JSON.stringify(itemsList, null, 2)
      }
      return itemsList.map((item) => `• ${item}`).join('\n')
    }

    if (contentType === 'article') {
      const title = bank.headings[0]
      const subhead = generateSentence(bank.words, 6, 10).replace(/\.$/, '')
      const p1 = Array.from({ length: 4 }, () => generateSentence(bank.words, 10, 18)).join(' ')
      const h2_1 = bank.headings[1] || 'Core Perspectives'
      const p2 = Array.from({ length: 4 }, () => generateSentence(bank.words, 10, 18)).join(' ')
      const bullet1 = generateSentence(bank.words, 6, 12)
      const bullet2 = generateSentence(bank.words, 6, 12)
      const bullet3 = generateSentence(bank.words, 6, 12)
      const conclusion = Array.from({ length: 3 }, () => generateSentence(bank.words, 10, 16)).join(' ')

      if (format === 'html') {
        return `<h1>${title}</h1>\n<p class="lead"><em>${subhead}</em></p>\n\n<p>${p1}</p>\n\n<h2>${h2_1}</h2>\n<p>${p2}</p>\n\n<ul>\n  <li>${bullet1}</li>\n  <li>${bullet2}</li>\n  <li>${bullet3}</li>\n</ul>\n\n<p>${conclusion}</p>`
      }
      if (format === 'markdown') {
        return `# ${title}\n*${subhead}*\n\n${p1}\n\n## ${h2_1}\n${p2}\n\n* ${bullet1}\n* ${bullet2}\n* ${bullet3}\n\n${conclusion}`
      }
      if (format === 'json') {
        return JSON.stringify(
          {
            title,
            subheading: subhead,
            introduction: p1,
            section: { title: h2_1, content: p2, points: [bullet1, bullet2, bullet3] },
            conclusion,
          },
          null,
          2
        )
      }
      return `${title}\n${subhead}\n\n${p1}\n\n${h2_1}\n${p2}\n\n• ${bullet1}\n• ${bullet2}\n• ${bullet3}\n\n${conclusion}`
    }

    // Default: Paragraphs
    const paragraphsList: string[] = []
    for (let p = 0; p < count; p++) {
      const sentenceCount = 4 + Math.floor(Math.random() * 3)
      const sentences: string[] = []

      for (let s = 0; s < sentenceCount; s++) {
        if (p === 0 && s === 0 && startWithLorem && flavor === 'lorem') {
          sentences.push('Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.')
        } else {
          sentences.push(generateSentence(bank.words, 9, 18))
        }
      }
      paragraphsList.push(sentences.join(' '))
    }

    if (format === 'html') {
      return paragraphsList.map((p) => `<p>${p}</p>`).join('\n\n')
    }
    if (format === 'markdown') {
      return paragraphsList.join('\n\n')
    }
    if (format === 'json') {
      return JSON.stringify(paragraphsList, null, 2)
    }
    return paragraphsList.join('\n\n')
  }, [flavor, contentType, format, count, startWithLorem, seed, generateSentence])

  const wordCount = React.useMemo(() => {
    return generatedText.trim() ? generatedText.trim().split(/\s+/).length : 0
  }, [generatedText])

  const charCount = generatedText.length
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedText)
    setCopied(true)
    toast.success('Text copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const ext = format === 'html' ? 'html' : format === 'markdown' ? 'md' : format === 'json' ? 'json' : 'txt'
    const mime = format === 'html' ? 'text/html' : format === 'json' ? 'application/json' : 'text/plain'
    const blob = new Blob([generatedText], { type: `${mime};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `generated-dummy-text.${ext}`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Downloaded as .${ext}`)
  }

  return (
    <div className="space-y-6">
      {/* Configuration Studio Controls */}
      <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-6 glass-card shadow-2xs space-y-5">
        {/* Content Type Selector */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
            1. Content Type
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'paragraphs', label: 'Paragraphs', icon: AlignLeft },
              { id: 'headings', label: 'Headings (H1/H2)', icon: Heading },
              { id: 'subheadings', label: 'Subheadings', icon: Heading },
              { id: 'bullets', label: 'Bullet List', icon: List },
              { id: 'article', label: 'Full Article', icon: FileText },
            ].map((item) => {
              const Icon = item.icon
              const active = contentType === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setContentType(item.id as ContentType)}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all active-push cursor-pointer',
                    active
                      ? 'border-primary bg-primary text-primary-foreground shadow-2xs font-bold'
                      : 'border-border/70 bg-card hover:border-primary/40 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Flavor / Vocabulary Style & Format */}
        <div className="space-y-4 pt-1">
          {/* Flavor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                2. Vocabulary Style ({Object.keys(VOCABULARIES).length} Rich Styles Available)
              </Label>
              <span className="text-[11px] text-muted-foreground font-mono">20+ Headings Each</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(VOCABULARIES).map(([key, f]) => {
                const active = flavor === key
                return (
                  <button
                    key={key}
                    onClick={() => setFlavor(key as FlavorType)}
                    className={cn(
                      'rounded-xl px-3 py-2 text-xs font-mono font-medium transition-all active-push cursor-pointer border text-left flex flex-col gap-0.5',
                      active
                        ? 'bg-foreground text-background border-foreground shadow-xs font-bold'
                        : 'bg-card text-muted-foreground hover:text-foreground hover:border-primary/40 border-border/70'
                    )}
                  >
                    <span className="truncate">{f.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Export Format */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
              3. Output Format
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'plain', label: 'Plain Text' },
                { id: 'html', label: 'HTML Markup' },
                { id: 'markdown', label: 'Markdown' },
                { id: 'json', label: 'JSON Data' },
              ].map((fmt) => {
                const active = format === fmt.id
                return (
                  <button
                    key={fmt.id}
                    onClick={() => setFormat(fmt.id as OutputFormat)}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 text-xs font-mono font-semibold transition-all active-push cursor-pointer',
                      active
                        ? 'bg-primary text-primary-foreground shadow-2xs font-bold'
                        : 'bg-secondary/80 text-secondary-foreground hover:bg-secondary border border-border/60'
                    )}
                  >
                    {fmt.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Sliders & Checkbox options */}
        {contentType !== 'article' && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/50 pt-4">
            <div className="flex items-center gap-4 flex-1 max-w-sm">
              <Label className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                Quantity: <span className="font-bold text-foreground font-mono">{count} {contentType}</span>
              </Label>
              <Slider
                value={[count]}
                min={1}
                max={20}
                step={1}
                onValueChange={(v) => setCount(v[0])}
                className="flex-1"
              />
            </div>

            {flavor === 'lorem' && contentType === 'paragraphs' && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={startWithLorem}
                  onCheckedChange={setStartWithLorem}
                  id="start-lorem"
                />
                <Label htmlFor="start-lorem" className="text-xs font-medium cursor-pointer text-muted-foreground">
                  Start with &ldquo;Lorem ipsum dolor sit amet...&rdquo;
                </Label>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Output Studio Container */}
      <div className="rounded-2xl border border-border/80 bg-card/85 p-5 sm:p-6 glass-card shadow-xs space-y-4">
        {/* Output Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3.5">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <Code2 className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-foreground font-mono">
              Live Generated Output · {VOCABULARIES[flavor].label}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSeed((s) => s + 1)}
              className="h-8 rounded-xl px-3 text-xs gap-1.5 active-push cursor-pointer border-border/80"
              title="Shuffle new variations"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>Regenerate</span>
            </Button>

            <Button
              size="sm"
              onClick={handleCopy}
              className="h-8 rounded-xl px-3 text-xs gap-1.5 active-push cursor-pointer bg-primary text-primary-foreground shadow-2xs font-semibold"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-8 rounded-xl px-3 text-xs gap-1.5 active-push cursor-pointer border-border/80"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </Button>
          </div>
        </div>

        {/* Output Text Viewport */}
        <textarea
          readOnly
          value={generatedText}
          className="min-h-[260px] w-full resize-y rounded-xl border border-border/60 bg-background/50 p-4 font-mono text-sm leading-relaxed outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
        />

        {/* Stats Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground font-mono pt-1">
          <div className="flex items-center gap-3">
            <span>Words: <strong className="text-foreground">{wordCount}</strong></span>
            <span>·</span>
            <span>Characters: <strong className="text-foreground">{charCount}</strong></span>
            <span>·</span>
            <span>Reading Time: <strong className="text-foreground">~{readingTime} min</strong></span>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            ✓ 100% In-Browser Generator
          </span>
        </div>
      </div>
    </div>
  )
}
