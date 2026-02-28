import React, { useRef, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface BookProps {
  frontTexture: THREE.Texture | null;
  spineTexture: THREE.Texture | null;
  thickness: number;
  rotation: [number, number, number];
}

type BookPreset = 'thin' | 'medium' | 'thick';

const PRESET_CONFIG: Record<BookPreset, { thickness: number; rotation: [number, number, number] }> = {
  thin: {
    thickness: 0.08,
    rotation: [
      THREE.MathUtils.degToRad(-8),
      THREE.MathUtils.degToRad(20),
      THREE.MathUtils.degToRad(-2),
    ],
  },
  medium: {
    thickness: 0.18,
    rotation: [
      THREE.MathUtils.degToRad(-10),
      THREE.MathUtils.degToRad(25),
      THREE.MathUtils.degToRad(-3),
    ],
  },
  thick: {
    thickness: 0.3,
    rotation: [
      THREE.MathUtils.degToRad(-12),
      THREE.MathUtils.degToRad(30),
      THREE.MathUtils.degToRad(-4),
    ],
  },
};

function Book3DFixed({ frontTexture, spineTexture, thickness, rotation }: BookProps) {
  const width = 1;    // ширина фронта (X)
  const height = 1.6; // высота (Y)

  const materials: THREE.MeshStandardMaterial[] = [];

  // Порядок граней: 0 right, 1 left, 2 top, 3 bottom, 4 front, 5 back
  for (let i = 0; i < 6; i++) {
    let mat: THREE.MeshStandardMaterial;

    if (i === 4 && frontTexture) {
      // фронтальная сторона (обложка)
      mat = new THREE.MeshStandardMaterial({ map: frontTexture });
    } else if (i === 1 && spineTexture) {
      // левая грань = корешок
      mat = new THREE.MeshStandardMaterial({ map: spineTexture });
    } else {
      // остальные — просто цвет
      mat = new THREE.MeshStandardMaterial({ color: '#0f172a' });
    }

    materials.push(mat);
  }

  return (
    <mesh
      castShadow
      receiveShadow
      rotation={rotation}
      position={[0, 0, 0]}
    >
      <boxGeometry args={[width, height, thickness]} />
      {materials.map((m, i) => (
        <meshStandardMaterial key={i} attach={`material-${i}`} {...m} />
      ))}
    </mesh>
  );
}

function App() {
  const [frontTexture, setFrontTexture] = useState<THREE.Texture | null>(null);
  const [spineTexture, setSpineTexture] = useState<THREE.Texture | null>(null);
  const [preset, setPreset] = useState<BookPreset>('medium');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFileToTexture = useCallback(
    (file: File, callback: (tex: THREE.Texture) => void) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const texture = new THREE.Texture(img);
          texture.needsUpdate = true;
          texture.colorSpace = THREE.SRGBColorSpace;
          callback(texture);
        };
        if (typeof reader.result === 'string') {
          img.src = reader.result;
        }
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFileToTexture(file, (tex) => setFrontTexture(tex));
  };

  const handleSpineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFileToTexture(file, (tex) => setSpineTexture(tex));
  };

  const downloadImage = (format: 'png' | 'jpeg') => {
    if (!canvasRef.current || !frontTexture) return;

    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    const quality = format === 'jpeg' ? 0.95 : undefined;

    const dataUrl = canvasRef.current.toDataURL(mime, quality as any);
    const link = document.createElement('a');
    link.download = format === 'png' ? 'book-3d-cover.png' : 'book-3d-cover.jpg';
    link.href = dataUrl;
    link.click();
  };

  const config = PRESET_CONFIG[preset];

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#e5e7eb', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '16px 24px', borderBottom: '1px solid #111827' }}>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>3D обложка книги (личный генератор)</h1>
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
          Загрузите лицевую обложку и корешок → выберите толщину книги → скачайте PNG или JPEG.
        </p>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'row', padding: '16px', gap: '16px' }}>
        {/* Левая панель управления */}
        <div style={{ width: '300px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ padding: '12px', borderRadius: '8px', background: '#020617', border: '1px solid #111827' }}>
            <h2 style={{ fontSize: '14px', margin: '0 0 8px' }}>1. Лицевая обложка</h2>
            <input type="file" accept="image/*" onChange={handleFrontChange} />
            <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
              Вертикальное изображение (JPG/PNG), как готовая обложка книги.
            </p>
          </div>

          <div style={{ padding: '12px', borderRadius: '8px', background: '#020617', border: '1px solid #111827' }}>
            <h2 style={{ fontSize: '14px', margin: '0 0 8px' }}>2. Корешок</h2>
            <input type="file" accept="image/*" onChange={handleSpineChange} />
            <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
              Узкое вертикальное изображение для корешка (можно однотонный фон с текстом).
            </p>
          </div>

          <div style={{ padding: '12px', borderRadius: '8px', background: '#020617', border: '1px solid #111827' }}>
            <h2 style={{ fontSize: '14px', margin: '0 0 8px' }}>3. Толщина книги</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="radio"
                  name="preset"
                  value="thin"
                  checked={preset === 'thin'}
                  onChange={() => setPreset('thin')}
                />
                Тонкая
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="radio"
                  name="preset"
                  value="medium"
                  checked={preset === 'medium'}
                  onChange={() => setPreset('medium')}
                />
                Средняя
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="radio"
                  name="preset"
                  value="thick"
                  checked={preset === 'thick'}
                  onChange={() => setPreset('thick')}
                />
                Толстая
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            <button
              onClick={() => downloadImage('png')}
              disabled={!frontTexture}
              style={{
                padding: '10px 16px',
                borderRadius: '9999px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: frontTexture ? 'pointer' : 'not-allowed',
                background: frontTexture ? '#22c55e' : '#374151',
                color: '#0b1120'
              }}
            >
              Скачать PNG
            </button>
            <button
              onClick={() => downloadImage('jpeg')}
              disabled={!frontTexture}
              style={{
                padding: '10px 16px',
                borderRadius: '9999px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: frontTexture ? 'pointer' : 'not-allowed',
                background: frontTexture ? '#fbbf24' : '#374151',
                color: '#0b1120'
              }}
            >
              Скачать JPEG
            </button>
          </div>
        </div>

        {/* Правая часть — 3D рендер */}
        <div style={{ flex: 1, minHeight: '400px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #111827' }}>
          <Canvas
            shadows
            camera={{ position: [3, 2, 4], fov: 35 }}
            gl={{ preserveDrawingBuffer: true }}
            ref={canvasRef as any}
          >
            <color attach="background" args={['#020617']} />
            <ambientLight intensity={0.5} />
            <directionalLight
              position={[5, 8, 4]}
              intensity={1.6}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
            <Book3DFixed
              frontTexture={frontTexture}
              spineTexture={spineTexture}
              thickness={config.thickness}
              rotation={config.rotation}
            />
            {/* Камеру не даём крутить */}
            <OrbitControls enabled={false} />
          </Canvas>
        </div>
      </main>
    </div>
  );
}

export default App;