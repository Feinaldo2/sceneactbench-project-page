import { withBase } from '../data/assetPath';

type ModelViewerConstructor = CustomElementConstructor & {
  dracoDecoderLocation?: string;
  modelCacheSize?: number;
};

let initialization: Promise<void> | null = null;

function configureModelViewer() {
  const constructor = customElements.get('model-viewer') as ModelViewerConstructor | undefined;
  if (!constructor) return;
  constructor.dracoDecoderLocation = withBase('assets/draco/');
  constructor.modelCacheSize = 12;
}

export function ensureModelViewer() {
  if (customElements.get('model-viewer')) {
    configureModelViewer();
    return Promise.resolve();
  }
  if (!initialization) {
    const modelViewerGlobal = globalThis as typeof globalThis & {
      ModelViewerElement?: { dracoDecoderLocation?: string };
    };
    modelViewerGlobal.ModelViewerElement = {
      ...modelViewerGlobal.ModelViewerElement,
      dracoDecoderLocation: withBase('assets/draco/'),
    };
    initialization = import('@google/model-viewer').then(() => {
      configureModelViewer();
    });
  }
  return initialization;
}
