const pricingPlans = {
  starter: {
    id: "starter",
    name: "Starter",
    description: "Perfect for trying out 3D bust generation",
    price: {
      monthly: 9.99,
      yearly: 99.99, // 2 months free
    },
    credits: {
      monthly: 50,
      yearly: 600,
    },
    features: {
      maxProjects: 25,
      highQualityGeneration: false,
      customMaterials: false,
      prioritySupport: false,
      exportFormats: ["obj"],
      customization: "basic",
    },
    limits: {
      monthlyGenerations: 50,
      maxModelComplexity: "medium",
      supportLevel: "email",
    },
    popular: false,
  },

  pro: {
    id: "pro",
    name: "Pro",
    description: "For creators and small businesses",
    price: {
      monthly: 24.99,
      yearly: 249.99, // 2 months free
    },
    credits: {
      monthly: 150,
      yearly: 1800,
    },
    features: {
      maxProjects: 100,
      highQualityGeneration: true,
      customMaterials: true,
      prioritySupport: false,
      exportFormats: ["obj", "stl", "ply"],
      customization: "advanced",
    },
    limits: {
      monthlyGenerations: 150,
      maxModelComplexity: "high",
      supportLevel: "priority_email",
    },
    popular: true, // Most popular plan
  },

  premium: {
    id: "premium",
    name: "Premium",
    description: "For professionals and agencies",
    price: {
      monthly: 49.99,
      yearly: 499.99, // 2 months free
    },
    credits: {
      monthly: 400,
      yearly: 4800,
    },
    features: {
      maxProjects: 500,
      highQualityGeneration: true,
      customMaterials: true,
      prioritySupport: true,
      exportFormats: ["obj", "stl", "ply", "gltf"],
      customization: "professional",
    },
    limits: {
      monthlyGenerations: 400,
      maxModelComplexity: "ultra",
      supportLevel: "priority_chat",
    },
    popular: false,
  },

  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    description: "For large teams and organizations",
    price: {
      monthly: 99.99,
      yearly: 999.99, // 2 months free
    },
    credits: {
      monthly: 1000,
      yearly: 12000,
    },
    features: {
      maxProjects: -1, // Unlimited
      highQualityGeneration: true,
      customMaterials: true,
      prioritySupport: true,
      exportFormats: ["obj", "stl", "ply", "gltf", "fbx"],
      customization: "enterprise",
    },
    limits: {
      monthlyGenerations: 1000,
      maxModelComplexity: "ultra",
      supportLevel: "dedicated_support",
    },
    popular: false,
  },
};

// Credit costs for different operations
const creditCosts = {
  generation: {
    low: 1, // Low quality generation
    medium: 2, // Medium quality generation
    high: 3, // High quality generation
    ultra: 5, // Ultra quality generation
  },

  customization: {
    basic: 0, // Free basic customizations
    advanced: 1, // Advanced materials/effects
  },

  export: {
    obj: 0, // Free OBJ export
    stl: 1, // STL export costs 1 credit
    ply: 1, // PLY export costs 1 credit
    gltf: 2, // GLTF export costs 2 credits
    fbx: 3, // FBX export costs 3 credits
  },
};

module.exports = {
  pricingPlans,
  creditCosts,
};
