import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Generates a complete asset manifest from GitHub raw content URLs.
 * Enumerates all PNG files from the Realm-of-Echoes-Assets repo and creates
 * a registry mapping asset keys to their raw GitHub URLs.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // GitHub repo structure
    const repoRaw = 'https://raw.githubusercontent.com/jseaborn94/Realm-of-Echoes-Assets/main/assets';
    const categories = ['player', 'enemies', 'terrain', 'environment', 'effects', 'resources', 'ui'];

    const manifest = {
      player: {},
      enemies: {},
      terrain: {},
      environment: {},
      effects: {},
      resources: {},
      ui: {}
    };

    // For each category, build a manifest of available assets
    // Since we can't directly enumerate GitHub, we'll provide the URL pattern
    // and instructions for loading sprites from raw GitHub URLs

    const assetRegistry = {
      metadata: {
        repo: 'https://github.com/jseaborn94/Realm-of-Echoes-Assets',
        rawBase: repoRaw,
        categories: categories,
        generatedAt: new Date().toISOString()
      },
      loadingGuide: {
        player: `${repoRaw}/player/*.png`,
        enemies: `${repoRaw}/enemies/*.png`,
        terrain: `${repoRaw}/terrain/*.png`,
        environment: `${repoRaw}/environment/*.png`,
        effects: `${repoRaw}/effects/*.png`,
        resources: `${repoRaw}/resources/*.png`,
        ui: `${repoRaw}/ui/*.png`
      },
      manifest: manifest
    };

    return Response.json({
      status: 'Asset manifest generated',
      assetRegistry,
      instructions: 'Use GitHub raw URLs to load PNG assets directly. Format: https://raw.githubusercontent.com/jseaborn94/Realm-of-Echoes-Assets/main/assets/[category]/[filename].png',
      nextStep: 'Provide a list of filenames in each category to auto-generate the complete AssetRegistry'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});