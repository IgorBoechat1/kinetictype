declare module 'three-bmfont-text' {
  import * as THREE from 'three';

  interface Font {
    common: {
      lineHeight: number;
    };
    pages: string[];
    chars: {
      id: number;
      x: number;
      y: number;
      width: number;
      height: number;
      xoffset: number;
      yoffset: number;
      xadvance: number;
      page: number;
      chnl: number;
    }[];
  }

  interface CreateGeometryOptions {
    font: Font;
    text: string;
  }

  function createGeometry(options: CreateGeometryOptions): THREE.BufferGeometry;

  export = createGeometry;
}

 {
  import * as THREE from 'three';

  interface MSDFShaderOptions extends THREE.ShaderMaterialParameters {
    map: THREE.Texture;
    side: THREE.Side;
    transparent: boolean;
    negate: boolean;
    color: number;
  }

  function MSDFShader(options: MSDFShaderOptions): THREE.RawShaderMaterial;

  export = MSDFShader;
}