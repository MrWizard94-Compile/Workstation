import { CreateMLCEngine, MLCEngine, InitProgressReport, hasModelInCache, deleteModelAllInfoInCache, prebuiltAppConfig } from '@mlc-ai/web-llm';

let engine: MLCEngine | null = null;

export function getCustomModels(): string[] {
  try {
    const stored = localStorage.getItem('custom_models');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

export function addCustomModel(modelId: string) {
  const models = getCustomModels();
  if (!models.includes(modelId)) {
    models.push(modelId);
    localStorage.setItem('custom_models', JSON.stringify(models));
  }
}

export function removeCustomModel(modelId: string) {
  const models = getCustomModels();
  const updated = models.filter(m => m !== modelId);
  localStorage.setItem('custom_models', JSON.stringify(updated));
}

export function getAvailableModels() {
  const baseModels = prebuiltAppConfig.model_list.map(m => m.model_id);
  const customModels = getCustomModels();
  return Array.from(new Set([...customModels, ...baseModels]));
}

export async function pullModel(modelId: string, onProgress?: (report: InitProgressReport) => void) {
  const customModels = getCustomModels();
  let appConfig = prebuiltAppConfig;

  if (customModels.includes(modelId) && !prebuiltAppConfig.model_list.find(m => m.model_id === modelId)) {
    appConfig = {
      ...prebuiltAppConfig,
      model_list: [
        ...prebuiltAppConfig.model_list,
        {
          model: modelId,
          model_id: modelId,
          model_lib: modelId + "-webgl"
        } as any
      ]
    };
  }

  const tempEngine = await CreateMLCEngine(
    modelId,
    {
      initProgressCallback: onProgress,
      appConfig
    },
    { context_window_size: 8192 } as any
  );
  await tempEngine.unload();
}

export async function initEngine(
  modelId: string,
  onProgress?: (report: InitProgressReport) => void
) {
  if (engine) {
    await engine.unload();
  }

  const customModels = getCustomModels();
  let appConfig = prebuiltAppConfig;

  if (customModels.includes(modelId) && !prebuiltAppConfig.model_list.find(m => m.model_id === modelId)) {
    // It's a custom model. Add it to app config.
    appConfig = {
      ...prebuiltAppConfig,
      model_list: [
        ...prebuiltAppConfig.model_list,
        {
          model: modelId,
          model_id: modelId,
          model_lib: modelId + "-webgl" // fallback or generic
        } as any
      ]
    };
  }

  engine = await CreateMLCEngine(
    modelId,
    {
      initProgressCallback: onProgress,
      appConfig
    },
    { context_window_size: 8192 } as any
  );

  return engine;
}

export function getEngine() {
  return engine;
}

export async function checkModelCached(modelId: string) {
  try {
    return await hasModelInCache(modelId);
  } catch (e) {
    return false;
  }
}

export async function deleteModelCache(modelId: string) {
  try {
    await deleteModelAllInfoInCache(modelId);
  } catch (e) {
    console.error(e);
  }
}
