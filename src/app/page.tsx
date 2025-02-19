'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import 'tailwindcss/tailwind.css';
import Welcome from '../components/WelcomeScreen';
import { Slider, FormControl, InputLabel, MenuItem, Select, OutlinedInput, SelectChangeEvent, Stack, IconButton, TextField, Button } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import { Theme, useTheme } from '@mui/material/styles';

const Scene = dynamic(() => import('../components/Scene'), { ssr: false });

const fontOptions = ['Playfair', 'Monigue', 'Cocogoose', 'Bodoni', 'AfterShok', 'DinerFat', 'db', 'FancyPants', 'Batuphat', 'Barrio', 'Seaside'] as const;
const textureOptions = ['Mirror', 'Glass', 'Lines', 'Fragment', 'Random', 'Standard', 'Poser', 'Pavoi', 'Loco'] as const;

type FontOption = typeof fontOptions[number];
type TextureOption = typeof textureOptions[number];

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

function getStyles(name: string, selectedName: string, theme: Theme) {
  return {
    fontWeight: selectedName === name
      ? theme.typography.fontWeightMedium
      : theme.typography.fontWeightRegular,
  };
}

export default function Home() {
  const [showApp, setShowApp] = useState(false);
  const [selectedAnimation, setSelectedAnimation] = useState<'textMesh' | 'triangleMesh' | 'pointCloud'>('textMesh');

  const [text, setText] = useState('TYPE');
  const [color, setColor] = useState(new THREE.Color('#FFFFFF'));
  const [displacementIntensity, setDisplacementIntensity] = useState(1);
  const [scalingIntensity, setScalingIntensity] = useState(1);
  const [rotationIntensity, setRotationIntensity] = useState(1);
  const [waveIntensity, setWaveIntensity] = useState(1);
  const [fragmentationIntensity, setFragmentationIntensity] = useState(1);
  const [isMicActive, setIsMicActive] = useState(false);
  const [font, setFont] = useState<FontOption>('Bodoni');
  const [texture, setTexture] = useState<TextureOption>('Mirror');

  const theme = useTheme();

  const handleFontChange = (event: SelectChangeEvent<FontOption>) => {
    setFont(event.target.value as FontOption);
  };

  const handleTextureChange = (event: SelectChangeEvent<TextureOption>) => {
    setTexture(event.target.value as TextureOption);
  };

  const handleAnimationChange = (animation: 'textMesh' | 'triangleMesh' | 'pointCloud') => {
    setSelectedAnimation(animation);
  };

  return (
    <section className="flex flex-col items-center justify-center min-h-screen bg-black text-white font-primary p-4 sm:p-8">
      <div className="flex flex-col items-center justify-center w-full">
        <h3 className="text-12 sm:text-12 font-bold mb-2 font-primary text-center">by Igor Boechat</h3>
        <h1 className="text-4xl sm:text-8xl font-bold mb-2 font-primary border-3 border-white text-center">Kinetic Text App</h1>
        <div className="flex flex-col sm:flex-row gap-4 mb-4 w-full">
          <FormControl sx={{ m: 1, width: '100%', sm: { width: 300 } }}>
            <InputLabel id="font-select-label" sx={{ color: 'white' }}>Choose Font</InputLabel>
            <Select
              labelId="font-select-label"
              id="font-select"
              value={font}
              onChange={handleFontChange}
              input={<OutlinedInput label="Choose Font" />}
              MenuProps={MenuProps}
              sx={{
                '& .MuiInputBase-root': {
                  color: 'white',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'white',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'white',
                },
                '& .MuiSvgIcon-root': {
                  color: 'white',
                },
              }}
              renderValue={(selected) => selected}
            >
              {fontOptions.map((fontOption) => (
                <MenuItem
                  key={fontOption}
                  value={fontOption}
                  style={getStyles(fontOption, font, theme)}
                >
                  {fontOption}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ m: 1, width: '100%', sm: { width: 300 } }}>
            <InputLabel id="texture-select-label" sx={{ color: 'white' }}>Choose Texture</InputLabel>
            <Select
              labelId="texture-select-label"
              id="texture-select"
              value={texture}
              onChange={handleTextureChange}
              input={<OutlinedInput label="Choose Texture" />}
              MenuProps={MenuProps}
              sx={{
                '& .MuiInputBase-root': {
                  color: 'white',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'white',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'white',
                },
                '& .MuiSvgIcon-root': {
                  color: 'white',
                },
              }}
              renderValue={(selected) => selected}
            >
              {textureOptions.map((textureOption) => (
                <MenuItem
                  key={textureOption}
                  value={textureOption}
                  style={getStyles(textureOption, texture, theme)}
                >
                  {textureOption}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <TextField
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="TYPE"
          variant="outlined"
          fullWidth
          sx={{
            input: { color: 'white' },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'white',
              },
              '&:hover fieldset': {
                borderColor: 'white',
              },
            },
            '& .MuiInputLabel-root': {
              color: 'white',
            },
          }}
        />
      </div>

      <div className="flex flex-col w-full h-full mt-4">
        <div className="flex flex-col sm:flex-row gap-4 p-4">
          {[
            { label: 'Displacement Intensity', value: displacementIntensity, setter: setDisplacementIntensity },
            { label: 'Scaling Intensity', value: scalingIntensity, setter: setScalingIntensity },
            { label: 'Rotation Intensity', value: rotationIntensity, setter: setRotationIntensity },
            { label: 'Wave Intensity', value: waveIntensity, setter: setWaveIntensity },
            { label: 'Fragmentation Intensity', value: fragmentationIntensity, setter: setFragmentationIntensity },
          ].map(({ label, value, setter }) => (
            <div key={label} className="w-full sm:w-1/5">
              <label className="block text-gray-400">{label}:</label>
              <Slider
                value={value}
                min={0}
                max={10}
                step={0.1}
                onChange={(e: Event, newValue: number | number[]) => setter(newValue as number)}
                aria-label={label}
                valueLabelDisplay="auto"
                sx={{ color: 'white' }}
              />
            </div>
          ))}
        </div>
        <div className="relative w-full flex-grow">
          <Scene
            text={text}
            color={color}
            displacementIntensity={displacementIntensity}
            scalingIntensity={scalingIntensity}
            rotationIntensity={rotationIntensity}
            waveIntensity={waveIntensity}
            fragmentationIntensity={fragmentationIntensity}
            isMicActive={isMicActive}
            font={font}
            texture={texture}
            showTextMesh={selectedAnimation === 'textMesh'}
            showTriangleMesh={selectedAnimation === 'triangleMesh'}
            showPointCloud={selectedAnimation === 'pointCloud'}
          />
        </div>
      </div>

      {/* Microphone Button */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4 bg-black p-2 rounded-xl border border-white z-20">
        <Stack spacing={2} direction="row">
          <IconButton
            onClick={() => setIsMicActive(!isMicActive)}
            className={`w-12 h-12 flex items-center justify-center rounded-lg border ${
              isMicActive ? 'bg-white text-black' : 'bg-black text-white'
            } hover:bg-white hover:text-black transition-colors`}
          >
            <MicIcon sx={{ color: 'white' }} />
          </IconButton>
          <Button
            onClick={() => handleAnimationChange('textMesh')}
            variant="contained"
            color={selectedAnimation === 'textMesh' ? 'primary' : 'default'}
          >
            Text Mesh
          </Button>
          <Button
            onClick={() => handleAnimationChange('triangleMesh')}
            variant="contained"
            color={selectedAnimation === 'triangleMesh' ? 'primary' : 'default'}
          >
            Triangle Mesh
          </Button>
          <Button
            onClick={() => handleAnimationChange('pointCloud')}
            variant="contained"
            color={selectedAnimation === 'pointCloud' ? 'primary' : 'default'}
          >
            Point Cloud
          </Button>
        </Stack>
      </div>
    </section>
  );
}