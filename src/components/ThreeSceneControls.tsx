'use client';
import React, { useEffect } from 'react';
import { GUI } from 'lil-gui';

interface ThreeSceneControlsProps {
  text: string;
  setText: (text: string) => void;
  targetRotation: number;
  setTargetRotation: (rotation: number) => void;
  targetRotationOnPointerDown: number;
  setTargetRotationOnPointerDown: (rotation: number) => void;
  pointerX: number;
  setPointerX: (x: number) => void;
  pointerXOnPointerDown: number;
  setPointerXOnPointerDown: (x: number) => void;
  windowHalfX: number;
}

const ThreeSceneControls: React.FC<ThreeSceneControlsProps> = ({
  text,
  setText,
  targetRotation,
  setTargetRotation,
  targetRotationOnPointerDown,
  setTargetRotationOnPointerDown,
  pointerX,
  setPointerX,
  pointerXOnPointerDown,
  setPointerXOnPointerDown,
  windowHalfX,
}) => {
  let firstLetter = true; // Flag to check if the first letter is typed

  useEffect(() => {
    const params = {
      changeColor: () => {
        // Implement color change logic
      },
      changeFont: () => {
        // Implement font change logic
      },
      changeWeight: () => {
        // Implement weight change logic
      },
      changeBevel: () => {
        // Implement bevel change logic
      },
    };

    const gui = new GUI();
    gui.add(params, 'changeColor').name('change color');
    gui.add(params, 'changeFont').name('change font');
    gui.add(params, 'changeWeight').name('change weight');
    gui.add(params, 'changeBevel').name('change bevel');
    gui.open();

    document.addEventListener('keypress', onDocumentKeyPress);
    document.addEventListener('keydown', onDocumentKeyDown);

    return () => {
      gui.destroy();
      document.removeEventListener('keypress', onDocumentKeyPress);
      document.removeEventListener('keydown', onDocumentKeyDown);
    };
  }, []);

  const onDocumentKeyDown = (event: KeyboardEvent) => {
    if (firstLetter) {
      firstLetter = false;
      setText('');
    }

    const keyCode = event.keyCode;
    if (keyCode === 8) {
      event.preventDefault();
      setText(text.substring(0, text.length - 1));
      return false;
    }
  };

  const onDocumentKeyPress = (event: KeyboardEvent) => {
    const keyCode = event.which;
    if (keyCode === 8) {
      event.preventDefault();
    } else {
      const ch = String.fromCharCode(keyCode);
      setText(text + ch);
    }
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.isPrimary === false) return;
    setPointerXOnPointerDown(event.clientX - windowHalfX);
    setTargetRotationOnPointerDown(targetRotation);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.isPrimary === false) return;
    setPointerX(event.clientX - windowHalfX);
    setTargetRotation(targetRotationOnPointerDown + (pointerX - pointerXOnPointerDown) * 0.02);
  };

  const onPointerUp = (event: PointerEvent) => {
    if (event.isPrimary === false) return;
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
  };

  return null;
};

export default ThreeSceneControls;