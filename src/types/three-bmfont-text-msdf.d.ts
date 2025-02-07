declare module 'three-bmfont-text/shaders/msdf' {
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