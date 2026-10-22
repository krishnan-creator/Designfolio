const fs = require('fs');
const path = require('path');

const seedContent = {
  version: 1,
  lastUpdated: new Date().toISOString(),
  publishedAt: new Date().toISOString(),
  settings: {
    siteTitle: 'C. Bala Krishnan — CBK Designfolio | Creative Director & Visual Artist',
    brandName: 'CBK',
    wordmark: 'DESIGNFOLIO',
    headerTag: 'DBL // V3 ARCHIVE',
    localTimeEnabled: true,
    defaultTheme: 'dark',
    accentColor: '#FF3038',
    resumeUrl: 'C-Bala-Krishnan-Resume.pdf',
    social: {
      linkedin: 'https://www.linkedin.com/in/c-bala-krishnan/',
      whatsapp: 'https://wa.me/919491681703',
      email: 'meet2krishnan@gmail.com'
    },
    seo: {
      description: 'Creative Director & Visual Artist specializing in diffusion pipelines, generative AI visual development, and cinematic production.',
      keywords: 'Generative AI, Creative Direction, Visual Development, AI Filmmaking, ComfyUI, DNEG'
    }
  },
  sections: [
    {
      id: 'sec-hero',
      type: 'hero',
      name: '01 // Hero & Identity',
      order: 1,
      visible: true,
      config: {
        canvasSequence: true,
        scrollDownWidget: true,
        particleText: true
      },
      content: {
        headline: 'CHITHAMBARAM BALA KRISHNAN PILLAI',
        quote: 'Turning Ideas into Visuals',
        quoteBracket: '//',
        stickyNote: {
          visible: true,
          badge: 'GEN AI CREATIVE PRODUCER',
          image: 'Gen ai.png',
          paperImage: 'sticky-note-clean.png',
          pinImage: 'push-pin-clean.png'
        },
        resumeButtonLabel: 'DOWNLOAD MY RESUME',
        scrollDownLabel: 'SCROLL DOWN',
        scrollDownSub: 'EXPLORE ARCHIVE'
      }
    },
    {
      id: 'sec-ticker',
      type: 'ticker',
      name: '02 // Skills Ticker',
      order: 2,
      visible: true,
      config: {
        speed: 36,
        direction: 'left-to-right',
        separator: '·'
      },
      content: {
        items: [
          'VISUAL DEVELOPMENT',
          'GENERATIVE AI',
          'CREATIVE DIRECTION',
          'PIPELINE INTEGRATION',
          'GRAPHIC DESIGN',
          'AI MOTION DESIGN'
        ]
      }
    },
    {
      id: 'sec-numbers',
      type: 'metrics',
      name: '03 // By the Numbers',
      order: 3,
      visible: true,
      config: {
        columns: 4,
        animatedCount: true
      },
      content: {
        metaLabel: '02 / BY THE NUMBERS · SCALE / OUTPUT / CINEMA',
        title: 'BY THE NUMBERS',
        subtitle: 'Quantitative evidence of generative AI workflows, high-velocity creative direction, and cinematic pipeline outputs.',
        items: [
          {
            id: 'metric-1',
            category: 'PRODUCTION VOLUME',
            value: '25K',
            suffix: '+',
            label: 'AI IMAGES',
            description: 'AI-generated visual production across creative and cinematic projects.',
            featured: false,
            visible: true
          },
          {
            id: 'metric-2',
            category: 'CINEMATIC MOTION',
            value: '150',
            suffix: '+',
            label: 'AI VIDEOS',
            description: 'AI-assisted cinematic motion and video production.',
            featured: false,
            visible: true
          },
          {
            id: 'metric-3',
            category: 'COMMERCIAL & IP',
            value: '50',
            suffix: '+',
            label: 'PROJECTS',
            description: 'Creative, commercial, and cinematic projects.',
            featured: false,
            visible: true
          },
          {
            id: 'metric-4',
            category: 'VISUAL SYSTEMS',
            value: '10K',
            suffix: '+',
            label: 'DESIGN ASSETS',
            description: 'Visual and design assets created for varied production needs.',
            featured: false,
            visible: true
          },
          {
            id: 'metric-5',
            category: 'GENAI PIPELINES',
            value: '15',
            suffix: '+',
            label: 'AI WORKFLOWS',
            description: 'Creative AI workflows developed, adapted, or integrated.',
            featured: false,
            visible: true
          },
          {
            id: 'metric-6',
            category: 'LOOK-DEV & VFX',
            value: '50',
            suffix: '+',
            label: 'FILM SHOTS',
            description: 'Cinematic shots and visual-development work.',
            featured: false,
            visible: true
          },
          {
            id: 'metric-7',
            category: 'CLIENT ENGAGEMENT',
            value: '140',
            suffix: '+',
            label: 'CLIENTS',
            description: 'Client-facing creative work across projects and campaigns.',
            featured: false,
            visible: true
          },
          {
            id: 'metric-8',
            category: 'SOLO CINEMATIC IP',
            value: '02',
            suffix: '',
            label: 'ORIGINAL CINEMATIC CHAPTERS',
            description: 'Independently developed an original story concept across two chapters, from character sheets and environment development to prop design, prompts, and supporting visual development for cinema.',
            featured: true,
            visible: true
          }
        ]
      }
    },
    {
      id: 'sec-beyond-frame',
      type: 'beyond-the-frame',
      name: '04 // Beyond the Frame',
      order: 4,
      visible: true,
      config: {
        aspectRatio: '4:1',
        bannerWidth: 1584,
        bannerHeight: 396
      },
      content: {
        metaLabel: 'BEYOND THE FRAME // 5 CINEMATIC ENTRIES',
        title: 'BEYOND THE FRAME',
        wordmark: 'BEYOND THE FRAME ✦ BEYOND THE FRAME ✦ BEYOND THE FRAME ✦ BEYOND THE FRAME ✦',
        description: 'Visual explorations, cinematic look-development, character studies and worldbuilding.',
        entries: [
          {
            id: 'btf-01',
            title: 'MYTHIC WORLDS',
            category: 'CONCEPT & LORE // 01',
            desc: 'Original mythological world development and synthetic epic atmosphere.',
            image: 'Ramayana.png',
            position: 'center 40%',
            visible: true
          },
          {
            id: 'btf-02',
            title: 'CINEMATIC LOOK-DEV',
            category: 'STUDIO PIPELINE // 02',
            desc: 'Visual exploration for cinematic environments, lighting and atmospheric composition.',
            image: 'dune-dneg.jpg',
            position: 'center 48%',
            visible: true
          },
          {
            id: 'btf-03',
            title: 'CHARACTER STUDIES',
            category: 'IDENTITY & HERO // 03',
            desc: 'High-fidelity character and visual identity exploration across digital humans.',
            image: 'VeerBhadra.png',
            position: 'center 26%',
            visible: true
          },
          {
            id: 'btf-04',
            title: 'ENVIRONMENT DESIGN',
            category: 'WORLD BUILDING // 04',
            desc: 'Atmosphere, planetary scale and environment composition for feature film narratives.',
            image: 'media_1791962972986.png',
            position: 'center center',
            visible: true
          },
          {
            id: 'btf-05',
            title: 'AI FILMMAKING',
            category: 'GENERATIVE FLOWS // 05',
            desc: 'Generative image-to-video creative workflows and multi-shot synthetic film pipelines.',
            image: 'media_1791977571390.png',
            position: 'center 36%',
            visible: true
          }
        ]
      }
    },
    {
      id: 'sec-selected-works',
      type: 'selected-works',
      name: '05 // Selected Works',
      order: 5,
      visible: true,
      config: {
        initialVisibleCount: 2
      },
      content: {
        metaLabel: '03 / SELECTED WORKS · CINEMATIC PRODUCTION ARCHIVE',
        title: 'SELECTED WORKS',
        subtitle: 'Feature film look-dev, mythic worldbuilding, and studio AI pipelines. Showing initial preview pair — expand for complete landscape archive and portrait reels.',
        landscapeProjects: [
          {
            id: 'proj-ramayana',
            title: "NAMIT MALHOTRA'S RAMAYANA",
            subtitle: "Feature Cinema // DNEG Generative AI Pipeline",
            summary: "Feature Film AI Production & Large-Scale VFX Pipeline Look-Dev",
            description: "Contributed to production-grade Generative AI workflows and high-fidelity identity preservation at DNEG. Developed ComfyUI-based systems and Metaphysic performance transfer across film shots, enabling seamless studio compositing and shot validation in Nuke.",
            image: 'Ramayana.png',
            badge: '[◈] FEATURE CINEMA // 2026',
            tags: ['DNEG', '·', 'VFX PIPELINE'],
            visible: true
          },
          {
            id: 'proj-dune',
            title: "DUNE: PART THREE",
            subtitle: "Cinematic Worldbuilding & Volumetric Look-Dev",
            summary: "Cinematic Worldbuilding, Volumetric Look-Dev & Digital Humans",
            description: "Studio visual development and atmospheric look-dev for high-concept sci-fi environments. Scaled DGX infrastructure and diffusion pipelines to produce cinematic environment extensions, lighting studies, and production-ready character assets.",
            image: 'dune-dneg.jpg',
            badge: '[◈] FEATURE CINEMA // 2026',
            tags: ['DNEG', '·', 'HOLLYWOOD VFX'],
            visible: true
          },
          {
            id: 'proj-veerabhadra',
            title: "VEERABHADRA: THE AWAKENING",
            subtitle: "Original Mythic Action IP Concept Art & Trailer Pipelines",
            summary: "Original Mythic Action IP Concept Art & Multi-Shot Trailer Pipelines",
            description: "End-to-end creative direction, mythic character design, weapons, and atmospheric environment architecture. Architected multi-model synthetic media workflows that accelerated trailer sequence iteration by 40% while preserving aesthetic coherence.",
            image: 'VeerBhadra.png',
            badge: '[◈] INDEPENDENT IP // 2025',
            tags: ['IMPROMP2LABS', '·', 'ORIGINAL IP'],
            visible: true
          },
          {
            id: 'proj-odyssey',
            title: "THE ODYSSEY: FACIAL RECONSTRUCTION",
            subtitle: "High-Fidelity Performance Transfer & Neural Doubles",
            summary: "High-Fidelity Performance Transfer & Neural Face Replacement",
            description: "Specialized facial reconstruction pipelines utilizing MetaFace and Metaphysic technologies. Supported identity-preserving digital doubles, lip sync accuracy, and Nuke validation for demanding feature film production shots.",
            image: 'ramayana-output.jpg',
            badge: '[◈] FEATURE CINEMA // 2026',
            tags: ['DNEG', '·', 'DIGITAL DOUBLES'],
            visible: true
          },
          {
            id: 'proj-porsche',
            title: "PORSCHE & AUTOMOTIVE VISUALS",
            subtitle: "Commercial Campaign Direction & Synthetic Media Pipelines",
            summary: "High-End Commercial Campaign Direction & Synthetic Media Pipelines",
            description: "Directed cinematic short-form campaigns for global enterprise brands at Impromp2Labs including NFL, Porsche, and INDmoney. Built automated GenAI pipelines for rapid video iteration, reducing turnaround times by 35%.",
            image: 'landscape-05.jpg',
            badge: '[◈] COMMERCIAL // 2025',
            tags: ['IMPROMP2LABS', '·', 'BRAND FILM'],
            visible: true
          },
          {
            id: 'proj-motu',
            title: "MASTERS OF THE UNIVERSE",
            subtitle: "Creature Design, Armor Texturing & Studio Shot Integration",
            summary: "Creature Design, Armor Texturing & Studio Shot Integration",
            description: "Exploratory generative concept art and cinematic asset synthesis for studio film production. Integrated custom LoRA models and prompt architectures directly into VFX art department review pipelines.",
            image: 'landscape-06.jpg',
            badge: '[◈] FEATURE CINEMA // 2026',
            tags: ['DNEG', '·', 'CREATURE VFX'],
            visible: true
          }
        ],
        portraitReels: [
          {
            id: 'reel-01',
            title: "SYNTHETIC HUMAN",
            subtitle: "Neural character generation & skin-tone fidelity",
            summary: "Neural character generation & skin-tone fidelity",
            description: "Micro-expression transfer and realistic skin subsurface scattering studies using custom diffusion checkpoints.",
            image: 'portrait-01.png',
            badge: '[◈] 9:16 REEL // 01',
            tags: ['PORTRAIT', '·', 'DIGITAL HUMAN'],
            visible: true
          },
          {
            id: 'reel-02',
            title: "NEON DRIFT",
            subtitle: "Dynamic lighting, particle rain & anamorphic lensing",
            summary: "Dynamic lighting & anamorphic lensing",
            description: "Cinematic vertical lighting studies and atmospheric particulate simulation for short-form mobile storytelling.",
            image: 'portrait-02.png',
            badge: '[◈] 9:16 REEL // 02',
            tags: ['PORTRAIT', '·', 'CINEMATOGRAPHY'],
            visible: true
          },
          {
            id: 'reel-03',
            title: "MYTHIC WARRIOR",
            subtitle: "Fluid cloth motion & real-time generative camera paths",
            summary: "Fluid cloth motion & generative camera paths",
            description: "Physics-informed motion transfer and multi-model cinematic choreography for hero action character sequences.",
            image: 'portrait-03.jpg',
            badge: '[◈] 9:16 REEL // 03',
            tags: ['PORTRAIT', '·', 'ACTION IP'],
            visible: true
          }
        ]
      }
    },
    {
      id: 'sec-visual-orbit',
      type: 'visual-orbit',
      name: '06 // Visual Orbit',
      order: 6,
      visible: true,
      config: {
        fit: 0.82,
        minRadius: 520,
        maxVerticalRotationDeg: 6,
        segments: 24,
        dragDampening: 0.85
      },
      content: {
        metaLabel: '04 / VISUAL ORBIT · SPATIAL CURATED CREATIVE UNIVERSE',
        title: 'VISUAL ORBIT',
        subtitle: 'Interactive 3D dome gallery showcasing cinematic characters, mythic environments, and generative visual explorations.',
        hint: 'DRAG TO ROTATE ORBIT · CLICK TILE TO ENLARGE',
        disciplines: [
          'Generative AI',
          'Creative Direction',
          'Visual Development',
          'AI Filmmaking',
          'AI Motion Design',
          'World Building',
          'Character Development',
          'Environment Design',
          'AI Creative Workflows'
        ],
        tiles: [
          { id: 'orbit-1', image: 'Ramayana.png', title: 'Namit Malhotra\'s Ramayana', category: 'Generative AI' },
          { id: 'orbit-2', image: 'VeerBhadra.png', title: 'Veerabhadra', category: 'Character Development' },
          { id: 'orbit-3', image: 'dune-dneg.jpg', title: 'Dune: Part Three', category: 'World Building' },
          { id: 'orbit-4', image: 'portrait-01.png', title: 'High Fashion & Digital Human', category: 'Creative Direction' }
        ]
      }
    },
    {
      id: 'sec-expertise',
      type: 'my-expertise',
      name: '07 // My Expertise',
      order: 7,
      visible: true,
      config: {},
      content: {
        metaLabel: '03 / MY EXPERTISE · PRODUCTION RECORD & LEADERSHIP',
        title: 'MY EXPERTISE',
        subtitle: 'Chronological timeline of studio VFX pipelines, generative AI direction, and visual production leadership.',
        companies: [
          {
            id: 'exp-dneg',
            name: 'DNEG',
            role: 'Lead Gen AI Artist & VFX Art Director',
            dates: 'NOV 2025 – PRESENT',
            location: 'Bengaluru · Hybrid',
            intro: 'Architecting studio GenAI pipelines and identity transfer for international feature films:',
            bullets: [
              'Scaled diffusion and LoRA training across DGX cluster infrastructure, delivering consistent character identity across 50+ film shots.',
              'Engineered end-to-end generative workflows in ComfyUI, bridging synthetic assets into VFX compositing with Nuke validation.',
              'Directed facial performance transfer, synthetic look-dev, and environmental extension pipelines across major feature film productions.'
            ],
            skills: ['Diffusion Pipelines', 'Identity Preservation', 'VFX Art Direction', 'LoRA Training', 'Facial Performance', 'ComfyUI Architecture'],
            tools: ['ComfyUI', 'Nuke', 'Houdini', 'PyTorch', 'Photoshop', 'DGX Cluster'],
            mediaSlots: [
              { image: 'dune-dneg.jpg', title: 'DUNE: PART THREE', meta: 'Volumetric & Environment Look-Dev', badge: '[◈] 01 / FEATURE FILM LOOK-DEV' },
              { image: 'Ramayana.png', title: 'RAMAYANA FEATURE CINEMA', meta: 'Synthetic Identity Preservation', badge: '[◈] 02 / HIGH-FIDELITY IDENTITY' },
              { image: 'media_1791962972986.png', title: 'STUDIO DIFFUSION PIPELINES', meta: 'Multi-Model VFX Integration', badge: '[◈] 03 / VFX INTEGRATION' }
            ],
            visible: true
          },
          {
            id: 'exp-impromp2labs',
            name: 'IMPROMP2LABS',
            role: 'Creative Director',
            dates: 'NOV 2024 – PRESENT',
            location: 'Remote · Global',
            intro: 'Leading end-to-end creative direction, IP development, and AI video campaigns for global brands:',
            bullets: [
              'Directed original cinematic IP projects from worldbuilding and character development to multi-shot trailer pipelines.',
              'Spearheaded short-form cinematic campaigns for global enterprise clients including NFL, Porsche, and INDmoney.',
              'Integrated generative video models and sound synthesis pipelines, accelerating creative turnaround times by 40%.'
            ],
            skills: ['Creative Direction', 'Original IP Worldbuilding', 'Commercial Film Direction', 'AI Video Pipelines', 'Synthetic Sound Design'],
            tools: ['Runway Gen-3', 'Luma Dream Machine', 'Kling AI', 'Midjourney', 'ElevenLabs', 'Premiere Pro'],
            mediaSlots: [
              { image: 'VeerBhadra.png', title: 'ORIGINAL CINEMATIC IP', meta: 'Character & World Persistence', badge: '[◈] 01 / ORIGINAL CINEMATIC IP' },
              { image: 'media_1791977571390.png', title: 'MULTI-SHOT PIPELINES', meta: 'Diffusion & Video Model Integration', badge: '[◈] 02 / MULTI-SHOT PIPELINES' }
            ],
            visible: true
          },
          {
            id: 'exp-cyberedge',
            name: 'CYBEREDGE',
            role: 'AI Design Engineer',
            dates: 'NOV 2024 – NOV 2025',
            location: 'Hyderabad · Hybrid',
            intro: 'AI-assisted visual production and large-scale creative campaigns:',
            bullets: [
              'Engineered generative workflows for high-volume visual variation, composition, and layout exploration.',
              'Directed virtual camera staging, lighting setups, and visual look-dev across commercial campaigns.',
              'Implemented post-production pipelines bridging raw generative outputs into client-ready deliverables.'
            ],
            skills: ['AI Design', 'Art Direction', 'Camera & Lighting', 'Visual Development', 'Post-Production'],
            tools: ['Midjourney', 'Stable Diffusion', 'Photoshop', 'Premiere Pro'],
            mediaSlots: [],
            visible: true
          },
          {
            id: 'exp-premasai',
            name: 'PREMA SAI DESIGNERS',
            role: 'Graphic Designer',
            dates: 'AUG 2018 – OCT 2024',
            location: 'Hyderabad · Onsite',
            intro: 'Graphic design, brand systems, and marketing creative production:',
            bullets: [
              'Designed comprehensive brand systems, identity guidelines, and visual communication frameworks.',
              'Led high-volume marketing collateral and digital creative production across campaigns.',
              'Explored AI-assisted workflow experimentation to accelerate ideation and asset generation.'
            ],
            skills: ['Graphic Design', 'Visual Communication', 'Branding', 'Creative Production'],
            tools: ['Photoshop', 'Illustrator', 'InDesign', 'CorelDRAW'],
            mediaSlots: [],
            visible: true
          }
        ]
      }
    },
    {
      id: 'sec-core',
      type: 'the-core',
      name: '08 // The Core',
      order: 8,
      visible: true,
      config: {},
      content: {
        metaLabel: '05 / THE CORE · PROFILE & CAREER SKILL MAP',
        title: 'THE CORE',
        subtitle: 'Interactive 3D lanyard profile, technical arsenal, and the journey behind the practice.',
        idCard: {
          frontImage: 'ID Front(6).png',
          backImage: 'ID Back(1).png',
          strapImage: 'ID tag(1).png',
          dragInstructionText: 'TAP & DRAG THE ID'
        },
        foundations: [
          { id: 'f-comfyui', name: 'ComfyUI', logo: 'logo-comfyui.png', desc: 'Node-Based Diffusion' },
          { id: 'f-antigravity', name: 'Antigravity', logo: 'logo-antigravity.png', desc: 'Agentic Workflows' },
          { id: 'f-qwen', name: 'Qwen', logo: 'logo-qwen.png', desc: 'Multimodal Reasoning' },
          { id: 'f-higgsfield', name: 'Higgsfield', logo: 'logo-higgsfield.png', desc: 'Cinematic Motion' },
          { id: 'f-elevenlabs', name: 'ElevenLabs', logo: 'logo-elevenlabs.png', desc: 'Voice & Sound Design' }
        ],
        creativeSkills: [
          {
            id: 'cs-ci',
            title: 'Creative Intelligence',
            count: '04',
            capabilities: ['Visual Direction', 'World Building', 'Concept Design', 'Narrative Architecture']
          },
          {
            id: 'cs-vd',
            title: 'Visual Development',
            count: '04',
            capabilities: ['Film Look-Dev', 'Character Studies', 'Environment Art', 'Color & Lighting']
          },
          {
            id: 'cs-cp',
            title: 'Cinematic Preproduction',
            count: '04',
            capabilities: ['Storyboard Synthesis', 'Style Bible Creation', 'Camera Choreography', 'Moodboards']
          },
          {
            id: 'cs-am',
            title: 'AI Filmmaking & Motion',
            count: '04',
            capabilities: ['Diffusion Video', 'Motion Control', 'Lip Sync & Performance', 'Camera Motion Paths']
          },
          {
            id: 'cs-pe',
            title: 'Production & Pipeline Engineering',
            count: '04',
            capabilities: ['Custom LoRA Training', 'ComfyUI Graph Workflows', 'VFX Studio Handoff', 'Asset Standardization']
          }
        ],
        careerStages: [
          { id: 's-artist', step: '01', label: 'ARTIST', sub: 'Traditional & Digital Art', desc: 'Foundations in composition, human anatomy, color theory and digital painting.' },
          { id: 's-designer', step: '02', label: 'DESIGNER', sub: 'Graphic & Visual Systems', desc: 'Crafting brand identity systems, typography hierarchies and visual communication.' },
          { id: 's-ux', step: '03', label: 'UX DESIGNER', sub: 'Interaction & Product Strategy', desc: 'Information architecture, user flows, cognitive ergonomics and design systems.' },
          { id: 's-engineer', step: '04', label: 'DESIGN ENGINEER', sub: 'Interactive Frontend & Visual R&D', desc: 'Bridging design and code with high-performance WebGL, CSS engines and creative prototyping.' },
          { id: 's-ai-artist', step: '05', label: 'AI ARTIST', sub: 'Diffusion Pipelines & Film Look-Dev', desc: 'Expanded visual production through generative tools and repeatable creative workflows.' },
          { id: 's-director', step: '06', label: 'CREATIVE DIRECTOR', sub: 'Synthetic Film Pipelines & Leadership', desc: 'Connects art direction, generative AI and cinematic production into one creative vision.' }
        ]
      },
      // HOBBIES AS STRICT NESTED CHILD SUBSECTION OF THE CORE PER REQUIREMENT PART G
      children: [
        {
          id: 'sub-hobbies',
          type: 'hobbies',
          name: 'Personal Archive // Hobbies',
          order: 1,
          visible: true,
          content: {
            metaLabel: 'HOBBIES // 06 · PERSONAL ARCHIVE',
            title: 'HOBBIES',
            subtitle: 'Beyond the pipeline — the things I create and play.',
            cards: [
              {
                id: 'hobby-arts',
                categoryNumber: '01 //',
                title: 'ARTS',
                badgeText: '01 — ARCHIVE',
                statusText: 'ARCHIVE',
                image: 'landscape-01.jpg',
                alt: 'Arts — Personal visual archive',
                visible: true
              },
              {
                id: 'hobby-games',
                categoryNumber: '02 //',
                title: 'GAMES',
                badgeText: '02 — ARCHIVE',
                statusText: 'ARCHIVE',
                image: 'landscape-05.jpg',
                alt: 'Games — Interactive play & design',
                visible: true
              }
            ]
          }
        }
      ]
    },
    {
      id: 'sec-cta',
      type: 'cta',
      name: '09 // Let\'s Connect',
      order: 9,
      visible: true,
      config: {
        sphereEmbed: true
      },
      content: {
        eyebrow: 'LET’S CONNECT',
        headlineLine1: 'THAT’S HOW I SEE THE WORLD.',
        headlineLine2: 'WHAT’S YOUR PERSPECTIVE?',
        accentSlash: '//',
        statement: 'Thanks for exploring my work. If something here resonates with you, I’d love to connect, exchange ideas, and explore what comes next.',
        primaryButton: {
          label: "LET'S CONNECT",
          url: 'https://mail.google.com/mail/?view=cm&fs=1&to=meet2krishnan%40gmail.com&su=Let%27s%20Build%20Something%20Together',
          target: '_blank'
        },
        whatsappButton: {
          label: 'WHATSAPP',
          url: 'https://wa.me/919491681703'
        },
        linkedinButton: {
          label: 'LINKEDIN',
          url: 'https://www.linkedin.com/in/c-bala-krishnan/'
        }
      }
    }
  ]
};

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(path.join(dataDir, 'content.json'), JSON.stringify(seedContent, null, 2), 'utf8');
fs.writeFileSync(path.join(dataDir, 'content-draft.json'), JSON.stringify(seedContent, null, 2), 'utf8');
fs.writeFileSync(path.join(dataDir, 'content.backup.json'), JSON.stringify(seedContent, null, 2), 'utf8');

console.log('Successfully created authoritative seed content in data/content.json');
